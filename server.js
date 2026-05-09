import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session"; // Added
import pgSession from "connect-pg-simple"; // Added
import bcrypt from "bcrypt"; // Added
import cron from "node-cron";
import nodemailer from "nodemailer"; // Added

dotenv.config();

const app = express();
const port = 3000;

// Split the string into an array, or default to an empty array if not found
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// ==========================================
// SESSION CONFIGURATION
// ==========================================
const PostgresStore = pgSession(session);

// --- UPDATED SESSION CONFIGURATION ---
app.use(
  session({
    store: new PostgresStore({ pool: pool }),
    secret: process.env.SESSION_SECRET || "kimwin_secret_key",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for sessions to work over local network IPs
    cookie: {
      secure: false, // Keep false for HTTP
      httpOnly: true,
      sameSite: "lax", // Changed from default to 'lax' to allow the cookie to be saved via IP access
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Helper to clean IDs (Handles cases like "16:1")
const cleanId = (id) => {
  if (typeof id === "string") return id.split(":")[0];
  return id;
};

// --- ACTIVITY LOG HELPER ---
const logActivity = async (
  req,
  actionType,
  tableName,
  recordId,
  description,
) => {
  try {
    const userId = req.session?.user?.id || null;
    const userName = req.session?.user?.name || "System";
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, action_type, table_name, record_id, description) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, userName, actionType, tableName, recordId, description],
    );
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
};

// ==========================================
// EMAIL CONFIGURATION
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// 0. AUTHENTICATION ENDPOINTS
// ==========================================

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3)",
      [name, email, hashedPassword],
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      req.session.user = {
        id: user.user_id,
        name: user.full_name,
        email: user.email, // ADDED: Mapping email from database to session
        user_level: user.user_level,
      };
      res.json({ message: "Logged in successfully", user: req.session.user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    // This is the critical part: it clears the session cookie from the browser
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({ message: "Logged out" });
  });
});

// ==========================================
// FORGOT PASSWORD ENDPOINT
// ==========================================

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query(
      "UPDATE users SET reset_otp = $1, otp_expiry = NOW() + INTERVAL '10 minutes' WHERE email = $2",
      [otp, email],
    );

    const mailOptions = {
      from: `"Kimwin Systems" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
      html: `<h3>Password Reset</h3><p>Your OTP is: <b>${otp}</b></p>`,
    };

    // Use a nested try-catch specifically for the mailer
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent successfully to: ${email}`);
      res.json({ message: "Reset link sent to your email!" });
    } catch (mailError) {
      console.error("❌ NODEMAILER ERROR:", mailError.message);
      res
        .status(500)
        .json({ error: "Failed to send email. Check server configuration." });
    }
  } catch (err) {
    console.error("DATABASE ERROR:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// ==========================================
// INVENTORY ENDPOINT
// ==========================================

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, 
        (SELECT old_quantity FROM inventory_ledger l 
         WHERE l.item_id = i.item_id 
         ORDER BY recorded_at DESC LIMIT 1) as prev_qty
       FROM inventory i ORDER BY i.item_id DESC`,
    );
    const mappedData = result.rows.map((item) => ({
      id: item.item_id,
      name: item.item_name || "Unnamed",
      category: item.category || "General",
      uom: item.unit || "pcs",
      quantity: item.quantity || 0,
      previousQuantity: item.prev_qty !== null ? item.prev_qty : item.quantity,
      price: item.price || 0,
      minStock: item.minimum_stock || 10,
      status:
        item.quantity === 0
          ? "Out of Stock"
          : item.quantity <= (item.minimum_stock || 10)
            ? "Low Stock"
            : "In Stock",
      date: item.created_at,
      lastUpdated: item.updated_at,
    }));
    res.json(mappedData);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.post("/api/inventory/bulk-add", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      const result = await client.query(
        "INSERT INTO inventory (item_name, category, unit, quantity, price, minimum_stock, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING item_id",
        [
          item.name,
          item.category,
          item.uom,
          item.quantity || 0,
          item.price || 0,
          item.minStock || 10,
        ],
      );
      await logActivity(
        req,
        "INSERT",
        "inventory",
        result.rows[0].item_id,
        `Added new item: ${item.name}`,
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ message: "Bulk add success" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.patch("/api/inventory/bulk", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      const id = cleanId(item.id);
      const newQty = item.quantity;
      const movementValue = item.movement_value; // Track if it came from the adjustment input

      // 1. Fetch current details to get the Name and Old Quantity
      const currentRes = await client.query(
        "SELECT item_name, quantity FROM inventory WHERE item_id = $1",
        [id],
      );

      if (currentRes.rows.length > 0) {
        const itemName = currentRes.rows[0].item_name;
        const oldQty = currentRes.rows[0].quantity;

        // 2. Only update and log if the quantity actually changed
        if (oldQty !== newQty) {
          const diff = newQty - oldQty;

          // Determine the specific action label based on which input was used
          let actionLabel = "";
          if (
            movementValue !== null &&
            movementValue !== undefined &&
            movementValue !== ""
          ) {
            actionLabel = diff > 0 ? "Stock In" : "Stock Out";
          } else {
            actionLabel = "Quantity Correction";
          }

          // RECORD TO LEDGER
          await client.query(
            `INSERT INTO inventory_ledger (item_id, old_quantity, new_quantity, change_amount)
             VALUES ($1, $2, $3, $4)`,
            [id, oldQty, newQty, diff],
          );

          await client.query(
            `UPDATE inventory SET 
             quantity = $1, 
             updated_at = now() 
             WHERE item_id = $2`,
            [newQty, id],
          );

          // 3. Log using the specific action label
          await logActivity(
            req,
            "UPDATE",
            "inventory",
            id,
            `${itemName} ${actionLabel}: ${oldQty} to ${newQty}`,
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Quantities updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Update Error:", err);
    res.status(500).json({ error: "Bulk update failed" });
  } finally {
    client.release();
  }
});

app.patch("/api/inventory/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const { name, category, uom, quantity, price, minStock } = req.body;
  try {
    // GET OLD QUANTITY FOR LEDGER
    const oldData = await pool.query(
      "SELECT quantity FROM inventory WHERE item_id = $1",
      [id],
    );
    const oldQty = oldData.rows[0]?.quantity || 0;

    if (oldQty !== quantity) {
      await pool.query(
        `INSERT INTO inventory_ledger (item_id, old_quantity, new_quantity, change_amount)
         VALUES ($1, $2, $3, $4)`,
        [id, oldQty, quantity, quantity - oldQty],
      );
    }

    await pool.query(
      `UPDATE inventory SET 
        item_name=$1, category=$2, unit=$3, quantity=$4, price=$5, minimum_stock=$6, 
        updated_at = CASE WHEN quantity != $4 THEN now() ELSE updated_at END
        WHERE item_id=$7`,
      [name, category, uom, quantity, price, minStock, id],
    );
    await logActivity(
      req,
      "UPDATE",
      "inventory",
      id,
      `${name} quantity updated: ${oldQty} to ${quantity}`,
    );
    res.json({ message: "Item updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const itemInfo = await pool.query(
      "SELECT item_name FROM inventory WHERE item_id = $1",
      [id],
    );
    const itemName = itemInfo.rows[0]?.item_name || "Unknown Item";

    await pool.query("DELETE FROM inventory WHERE item_id = $1", [id]);

    await logActivity(
      req,
      "DELETE",
      "inventory",
      id,
      `Deleted item: ${itemName}`,
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================================
// 2. PURCHASE ORDER ENDPOINTS
// ==========================================

app.get("/api/purchase-orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM purchase_order ORDER BY po_id DESC",
    );
    res.json(
      result.rows.map((po) => ({
        id: po.po_id,
        poNo: po.po_number,
        customer: po.customer_name,
        email: po.email,
        contact: po.contact,
        company: po.company,
        address: po.address,
        totalPrice: po.total_price,
        status: po.status,
        remarks: po.remarks,
        date: po.delivery_date,
        statusDate: po.status_date,
        createdAt: po.created_at,
      })),
    );
  } catch (err) {
    console.error("Fetch PO Error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.post("/api/purchase-orders", async (req, res) => {
  const {
    po_number,
    customer_name,
    email,
    contact,
    company,
    address,
    total_price,
    status,
    remarks,
    delivery_date,
    items,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const poResult = await client.query(
      `INSERT INTO purchase_order (
        po_number, customer_name, email, contact, company, 
        address, total_price, status, remarks, delivery_date, status_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_DATE) 
      RETURNING po_id`,
      [
        po_number,
        customer_name,
        email,
        contact,
        company,
        address,
        total_price,
        status || "Pending",
        remarks || "",
        delivery_date,
      ],
    );

    const newPoId = poResult.rows[0].po_id;

    const itemInsertQuery = `
      INSERT INTO item_order (
        po_id, po_number, item_id, item_name, category, unit, quantity, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    for (const item of items) {
      await client.query(itemInsertQuery, [
        newPoId,
        po_number,
        cleanId(item.id),
        item.name,
        item.category,
        item.uom || item.unit,
        item.qty || item.quantity,
        item.price,
      ]);
    }

    await logActivity(
      req,
      "INSERT",
      "purchase_order",
      newPoId,
      `Created PO #${po_number} for ${customer_name}`,
    );
    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Purchase Order created successfully", po_id: newPoId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("PO Creation Error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "PO Number already exists." });
    }
    res.status(500).json({ error: "Failed to create order." });
  } finally {
    client.release();
  }
});

app.put("/api/purchase-orders/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const {
    customer_name,
    email,
    contact,
    company,
    address,
    total_price,
    status,
    items,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE purchase_order SET 
          customer_name=$1, email=$2, contact=$3, company=$4, address=$5, 
          total_price=$6, status=$7, status_date=CURRENT_DATE 
        WHERE po_id=$8`,
      [
        customer_name,
        email,
        contact,
        company,
        address,
        total_price,
        status,
        id,
      ],
    );

    await client.query("DELETE FROM item_order WHERE po_id = $1", [id]);

    const poNumRes = await client.query(
      "SELECT po_number FROM purchase_order WHERE po_id = $1",
      [id],
    );
    const po_number = poNumRes.rows[0].po_number;

    const itemInsertQuery = `
      INSERT INTO item_order (po_id, po_number, item_id, item_name, category, unit, quantity, price) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    for (const item of items) {
      await client.query(itemInsertQuery, [
        id,
        po_number,
        cleanId(item.id),
        item.name,
        item.category,
        item.unit || item.uom,
        item.qty || item.quantity,
        item.price,
      ]);
    }

    await logActivity(
      req,
      "UPDATE",
      "purchase_order",
      id,
      `Updated details for PO #${po_number}`,
    );
    await client.query("COMMIT");
    res.json({ message: "Purchase Order updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update Error:", err);
    res.status(500).json({ error: "Failed to update order" });
  } finally {
    client.release();
  }
});

app.get("/api/purchase-orders/:id/items", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const result = await pool.query(
      "SELECT item_id, item_name as name, category, unit, quantity, price FROM item_order WHERE po_id = $1",
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.patch("/api/purchase-orders/:id/status", async (req, res) => {
  const id = cleanId(req.params.id);
  const { status, remarks } = req.body;
  try {
    await pool.query(
      "UPDATE purchase_order SET status = $1, remarks = $2, status_date = CURRENT_DATE WHERE po_id = $3",
      [status, remarks || "", id],
    );
    await logActivity(
      req,
      "FINALIZE", // Changed from "UPDATE" to "FINALIZE"
      "purchase_order",
      id,
      `Changed status to ${status}`,
    );
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. RAW MATERIALS ENDPOINTS
// ==========================================

app.get("/api/raw-materials", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        (SELECT old_qty_value FROM raw_materials_ledger l 
         WHERE l.material_id = r.material_id 
         ORDER BY recorded_at DESC LIMIT 1) as prev_qty
       FROM raw_materials r ORDER BY r.material_id DESC`,
    );
    const mappedData = result.rows.map((m) => ({
      id: m.material_id,
      name: m.material_name,
      category: m.category,
      measurementValue: parseFloat(m.measurement_value),
      measurementUnit: m.measurement_unit,
      packaging: m.packaging,
      quantity: parseFloat(m.quantity),
      previousQuantity:
        m.prev_qty !== null ? parseFloat(m.prev_qty) : parseFloat(m.quantity),
      minStock: parseFloat(m.min_stock),
      createdAt: m.created_at,
      updated_at: m.updated_at,
    }));
    res.json(mappedData);
  } catch (err) {
    res.status(500).json({ error: "Raw materials fetch failed" });
  }
});

app.post("/api/raw-materials", async (req, res) => {
  const {
    name,
    category,
    measurementValue,
    measurementUnit,
    packaging,
    quantity,
    minStock,
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO raw_materials 
        (material_name, category, measurement_value, measurement_unit, packaging, quantity, min_stock) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name,
        category,
        measurementValue,
        measurementUnit,
        packaging,
        quantity,
        minStock,
      ],
    );
    await logActivity(
      req,
      "INSERT",
      "raw_materials",
      result.rows[0].material_id,
      `Added raw material: ${name}`,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADDED BULK ADD ENDPOINT ---
app.post("/api/raw-materials/bulk-add", async (req, res) => {
  const { items } = req.body;
  try {
    const results = [];
    for (const item of items) {
      const result = await pool.query(
        `INSERT INTO raw_materials 
          (material_name, category, measurement_value, measurement_unit, packaging, quantity, min_stock) 
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          item.name,
          item.category,
          item.measurementValue,
          item.measurementUnit,
          item.packaging,
          item.quantity,
          item.minStock,
        ],
      );

      await logActivity(
        req,
        "INSERT",
        "raw_materials",
        result.rows[0].material_id,
        `Bulk added material: ${item.name}`,
      );
      results.push(result.rows[0]);
    }
    res.status(201).json({
      message: "Bulk items added successfully",
      count: results.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADDED BULK UPDATE ENDPOINT (For Edit Qty) ---
app.patch("/api/raw-materials/bulk", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      const currentRes = await client.query(
        "SELECT quantity FROM raw_materials WHERE material_id = $1",
        [item.id],
      );

      if (currentRes.rows.length > 0) {
        const oldQty = currentRes.rows[0].quantity;
        const newQty = item.quantity;

        if (oldQty !== newQty) {
          await client.query(
            `INSERT INTO raw_materials_ledger (material_id, old_qty_value, new_qty_value, change_amount)
             VALUES ($1, $2, $3, $4)`,
            [item.id, oldQty, newQty, newQty - oldQty],
          );

          await client.query(
            "UPDATE raw_materials SET quantity = $1, updated_at = now() WHERE material_id = $2",
            [newQty, item.id],
          );

          await logActivity(
            req,
            "UPDATE",
            "raw_materials",
            item.id,
            `Bulk quantity update for ID ${item.id} to ${newQty}`,
          );
        }
      }
    }
    await client.query("COMMIT");
    res.json({ message: "Bulk update successful" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put("/api/raw-materials/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const {
    name,
    category,
    measurementValue,
    measurementUnit,
    packaging,
    quantity,
    minStock,
  } = req.body;
  try {
    const currentRes = await pool.query(
      "SELECT quantity FROM raw_materials WHERE material_id = $1",
      [id],
    );
    const oldQty = currentRes.rows[0]?.quantity || 0;

    if (oldQty !== quantity) {
      await pool.query(
        `INSERT INTO raw_materials_ledger (material_id, old_qty_value, new_qty_value, change_amount)
         VALUES ($1, $2, $3, $4)`,
        [id, oldQty, quantity, quantity - oldQty],
      );
    }

    await pool.query(
      `UPDATE raw_materials SET 
        material_name=$1, category=$2, measurement_value=$3, measurement_unit=$4, 
        packaging=$5, quantity=$6, min_stock=$7,
        updated_at = CASE 
          WHEN quantity != $6 THEN now() 
          ELSE updated_at 
        END
        WHERE material_id=$8`,
      [
        name,
        category,
        measurementValue,
        measurementUnit,
        packaging,
        quantity,
        minStock,
        id,
      ],
    );
    await logActivity(
      req,
      "UPDATE",
      "raw_materials",
      id,
      `Updated raw material: ${name}`,
    );
    res.json({ message: "Raw material updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/raw-materials/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const info = await pool.query(
      "SELECT material_name FROM raw_materials WHERE material_id = $1",
      [id],
    );
    const name = info.rows[0]?.material_name || "Unknown Material";

    await pool.query("DELETE FROM raw_materials WHERE material_id = $1", [id]);

    await logActivity(
      req,
      "DELETE",
      "raw_materials",
      id,
      `Deleted raw material: ${name}`,
    );
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================================
// 4. USER MANAGEMENT ENDPOINTS
// ==========================================

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, full_name, email, user_level FROM users ORDER BY user_id ASC",
    );
    res.json(
      result.rows.map((user) => ({
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        user_level: user.user_level,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.patch("/api/users/:id/role", async (req, res) => {
  const id = req.params.id;
  const { user_level } = req.body;
  try {
    await pool.query("UPDATE users SET user_level = $1 WHERE user_id = $2", [
      user_level,
      id,
    ]);
    await logActivity(
      req,
      "UPDATE",
      "users",
      id,
      `Changed user level to ${user_level}`,
    );
    res.json({ message: "Level updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update level" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const userInfo = await pool.query(
      "SELECT full_name FROM users WHERE user_id = $1",
      [id],
    );
    const name = userInfo.rows[0]?.full_name || "Unknown User";

    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);

    await logActivity(
      req,
      "DELETE",
      "users",
      id,
      `Deleted user account: ${name}`,
    );
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ==========================================
// 5. ACTIVITY LOGS ENDPOINTS
// ==========================================

app.get("/api/logs/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Fetch logs failed" });
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Fetch logs failed" });
  }
});

// ==========================================
// AUTOMATIC LOG CLEANUP
// Runs every day at 00:00 (Midnight)
// ==========================================
cron.schedule("0 0 * * *", async () => {
  console.log("--- Starting Scheduled Log Cleanup ---");
  try {
    const result = await pool.query(
      "DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '7 days'",
    );
    console.log(
      `Cleanup complete: Deleted ${result.rowCount} logs older than 7 days.`,
    );
  } catch (err) {
    console.error("Scheduled cleanup failed:", err);
  }
});

// ==========================================
// CATCH-ALL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred on the server.",
  });
});

// ==========================================
// PROFILE UPDATE ENDPOINT (With Verification)
// ==========================================
app.patch("/api/auth/profile", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { fullName, email, newPassword, verifyPassword } = req.body;
  const userId = req.session.user.id;

  try {
    // 1. Get current user data for verification and logging
    const userRes = await pool.query(
      "SELECT full_name, email, password_hash, user_level FROM users WHERE user_id = $1",
      [userId],
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = userRes.rows[0];

    // 2. Verify current password (REQUIRED for security)
    const isMatch = await bcrypt.compare(
      verifyPassword,
      currentUser.password_hash,
    );
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    // 3. Prepare logging descriptions
    let descriptions = [];
    if (fullName !== currentUser.full_name) {
      descriptions.push(
        `name from "${currentUser.full_name}" to "${fullName}"`,
      );
    }
    if (email !== currentUser.email) {
      descriptions.push(`email from "${currentUser.email}" to "${email}"`);
    }
    if (newPassword) {
      descriptions.push("password");
    }

    let query;
    let params;

    if (newPassword && newPassword.trim() !== "") {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      query = `
        UPDATE users 
        SET full_name = $1, email = $2, password_hash = $3 
        WHERE user_id = $4 
        RETURNING user_id, full_name, email, user_level`;
      params = [fullName, email, hashedPassword, userId];
    } else {
      query = `
        UPDATE users 
        SET full_name = $1, email = $2 
        WHERE user_id = $3 
        RETURNING user_id, full_name, email, user_level`;
      params = [fullName, email, userId];
    }

    const result = await pool.query(query, params);
    const updatedUser = result.rows[0];

    // Update session
    req.session.user = {
      id: updatedUser.user_id,
      name: updatedUser.full_name,
      email: updatedUser.email,
      user_level: updatedUser.user_level,
    };

    // Log the activity
    if (descriptions.length > 0) {
      await logActivity(
        req,
        "UPDATE",
        "users",
        userId,
        `Updated ${descriptions.join(" and ")}`,
      );
    }

    req.session.save((err) => {
      if (err) return res.status(500).json({ error: "Session save failed" });
      res.json({
        message: "Profile updated successfully",
        user: req.session.user,
      });
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email is already in use." });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==========================================
// OTP VERIFICATION AND RESET
// ==========================================

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND reset_otp = $2 AND otp_expiry > NOW()",
      [email, otp],
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }
    res.json({ message: "OTP verified. Proceed to reset password." });
  } catch (err) {
    res.status(500).json({ error: "Verification failed." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE users SET password_hash = $1, reset_otp = NULL, otp_expiry = NULL WHERE email = $2 AND reset_otp = $3 AND otp_expiry > NOW() RETURNING user_id",
      [hashedPassword, email, otp],
    );
    if (result.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "Reset failed. OTP may have expired." });
    }
    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
});

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on http://192.168.1.105:${port}`),
);
