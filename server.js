import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session"; // Added
import pgSession from "connect-pg-simple"; // Added
import bcrypt from "bcrypt"; // Added
import cron from "node-cron";

dotenv.config();

const app = express();
const port = 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.105:5173", // Computer A's IP
    ],
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
        role: user.role,
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
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

// ==========================================
// FORGOT PASSWORD ENDPOINT
// ==========================================

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    // 1. Check if the user exists in the database
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      // Security Tip: Even if user doesn't exist, we usually return 200
      // to prevent "email enumeration" (hackers checking who has an account)
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent." });
    }

    // 2. TODO: Generate a reset token and send an actual email here
    console.log(`Password reset requested for: ${email}`);

    res.json({ message: "Reset link sent to your email!" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// ==========================================
// 1. INVENTORY ENDPOINTS
// ==========================================

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT *, created_at, updated_at FROM inventory ORDER BY item_id DESC",
    );
    const mappedData = result.rows.map((item) => ({
      id: item.item_id,
      name: item.item_name || "Unnamed",
      category: item.category || "General",
      uom: item.unit || "pcs",
      quantity: item.quantity || 0,
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
        "INSERT INTO inventory (item_name, category, unit, quantity, minimum_stock, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) RETURNING item_id",
        [
          item.name,
          item.category,
          item.uom,
          item.quantity || 0,
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
      await client.query(
        `UPDATE inventory SET 
         quantity = $1, 
         updated_at = CASE WHEN quantity != $1 THEN now() ELSE updated_at END 
         WHERE item_id = $2`,
        [item.quantity, id],
      );
      await logActivity(
        req,
        "UPDATE",
        "inventory",
        id,
        `Bulk updated quantity to ${item.quantity}`,
      );
    }
    await client.query("COMMIT");
    res.json({ message: "Quantities updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Bulk update failed" });
  } finally {
    client.release();
  }
});

app.patch("/api/inventory/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const { name, category, uom, quantity, minStock } = req.body;
  try {
    await pool.query(
      `UPDATE inventory SET 
       item_name=$1, category=$2, unit=$3, quantity=$4, minimum_stock=$5, 
       updated_at = CASE WHEN quantity != $4 THEN now() ELSE updated_at END
       WHERE item_id=$6`,
      [name, category, uom, quantity, minStock, id],
    );
    await logActivity(
      req,
      "UPDATE",
      "inventory",
      id,
      `Updated item details for: ${name}`,
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
      "SELECT *, updated_at FROM raw_materials ORDER BY material_id DESC",
    );
    const mappedData = result.rows.map((m) => ({
      id: m.material_id,
      name: m.material_name,
      category: m.category,
      baseValue: parseFloat(m.base_value),
      baseUnit: m.base_unit,
      qtyValue: parseFloat(m.qty_value),
      qtyUnit: m.qty_unit,
      minStockThreshold: parseFloat(m.min_stock_threshold),
      minStockTarget: m.min_stock_target,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
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
    baseValue,
    baseUnit,
    qtyValue,
    qtyUnit,
    minStockThreshold,
    minStockTarget,
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO raw_materials 
      (material_name, category, base_value, base_unit, qty_value, qty_unit, min_stock_threshold, min_stock_target) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name,
        category,
        baseValue,
        baseUnit,
        qtyValue,
        qtyUnit,
        minStockThreshold,
        minStockTarget,
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

app.put("/api/raw-materials/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const {
    name,
    category,
    baseValue,
    baseUnit,
    qtyValue,
    qtyUnit,
    minStockThreshold,
    minStockTarget,
  } = req.body;
  try {
    await pool.query(
      `UPDATE raw_materials SET 
      material_name=$1, category=$2, base_value=$3, base_unit=$4, 
      qty_value=$5, qty_unit=$6, min_stock_threshold=$7, min_stock_target=$8,
      updated_at = CASE 
        WHEN base_value != $3 OR qty_value != $5 THEN now() 
        ELSE updated_at 
      END
      WHERE material_id=$9`,
      [
        name,
        category,
        baseValue,
        baseUnit,
        qtyValue,
        qtyUnit,
        minStockThreshold,
        minStockTarget,
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
      "SELECT user_id, full_name, email, role FROM users ORDER BY user_id ASC",
    );
    res.json(
      result.rows.map((user) => ({
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.patch("/api/users/:id/role", async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  try {
    await pool.query("UPDATE users SET role = $1 WHERE user_id = $2", [
      role,
      id,
    ]);
    await logActivity(
      req,
      "UPDATE",
      "users",
      id,
      `Changed user role to ${role}`,
    );
    res.json({ message: "Role updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
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

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on http://192.168.1.105:${port}`),
);
