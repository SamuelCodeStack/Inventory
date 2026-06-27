import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import pgSession from "connect-pg-simple";
import bcrypt from "bcrypt";
import cron from "node-cron";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer } from "http";
import { Server } from "socket.io";

const upload = multer({ dest: "C:/Users/Samuel/Desktop/Backup/temp/" });

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
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

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ==========================================
// SESSION CONFIGURATION
// ==========================================
const PostgresStore = pgSession(session);

app.use(
  session({
    store: new PostgresStore({ pool: pool }),
    secret: process.env.SESSION_SECRET || "kimwin_secret_key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

const cleanId = (id) => {
  if (typeof id === "string") return id.split(":")[0];
  return id;
};

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
        email: user.email,
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
    if (err) return res.status(500).json({ error: "Could not log out" });
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
// INVENTORY ENDPOINTS
// ==========================================

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, 
        (SELECT old_quantity FROM inventory_ledger l 
         WHERE l.item_id = i.item_id 
         ORDER BY recorded_at DESC LIMIT 1) as prev_qty,
        (SELECT ir.remarks FROM inventory_remarks ir 
         WHERE ir.item_id = i.item_id 
         ORDER BY ir.created_at DESC LIMIT 1) as remarks,
        (SELECT ir.created_at FROM inventory_remarks ir 
         WHERE ir.item_id = i.item_id 
         ORDER BY ir.created_at DESC LIMIT 1) as remarks_created_at,
        (SELECT ir.added_by FROM inventory_remarks ir 
         WHERE ir.item_id = i.item_id 
         ORDER BY ir.created_at DESC LIMIT 1) as remarks_added_by
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
      brand: item.brand || "",
      supplier: item.supplier || "",
      status:
        item.quantity === 0
          ? "Out of Stock"
          : item.quantity <= (item.minimum_stock || 10)
            ? "Low Stock"
            : "In Stock",
      date: item.created_at,
      lastUpdated: item.updated_at,
      remarks: item.remarks || "",
      remarks_created_at: item.remarks_created_at || null,
      remarks_added_by: item.remarks_added_by || null,
    }));
    res.json(mappedData);
  } catch (err) {
    console.error("Fetch inventory error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.post("/api/inventory/bulk-add", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      let brandName = item.brand || "";
      if (item.brand_id) {
        const brandRes = await client.query(
          "SELECT brand_name FROM brand WHERE brand_id = $1",
          [item.brand_id],
        );
        brandName = brandRes.rows[0]?.brand_name || "";
      }

      let supplierName = item.supplier || "";
      if (item.supplier_id) {
        const supplierRes = await client.query(
          "SELECT supplier_name FROM supplier WHERE supplier_id = $1",
          [item.supplier_id],
        );
        supplierName = supplierRes.rows[0]?.supplier_name || "";
      }

      const result = await client.query(
        `INSERT INTO inventory 
          (item_name, category, brand, supplier, unit, quantity, price, minimum_stock, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE) 
          RETURNING item_id`,
        [
          item.name,
          item.category,
          brandName,
          supplierName,
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
    console.error("Bulk add error:", err);
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
      const newQty = Math.floor(item.quantity);
      const adjustment = item.adjustment;

      const currentRes = await client.query(
        "SELECT item_name, quantity FROM inventory WHERE item_id = $1",
        [id],
      );

      if (currentRes.rows.length > 0) {
        const itemName = currentRes.rows[0].item_name;
        const oldQty = Math.floor(currentRes.rows[0].quantity);

        if (oldQty !== newQty) {
          await client.query(
            `INSERT INTO inventory_ledger (item_id, old_quantity, new_quantity, change_amount)
             VALUES ($1, $2, $3, $4)`,
            [id, oldQty, newQty, newQty - oldQty],
          );

          await client.query(
            `UPDATE inventory SET quantity = $1, updated_at = now() WHERE item_id = $2`,
            [newQty, id],
          );

          let logMessage = `Update Quantity ${itemName} ${oldQty} to ${newQty}`;

          if (adjustment && adjustment !== "") {
            const adjValue = parseInt(adjustment);
            if (adjValue > 0) {
              logMessage = `Stock In: ${itemName} ${oldQty} + ${adjValue} = ${newQty}`;
              await client.query(
                `DELETE FROM inventory_remarks WHERE item_id = $1`,
                [id],
              );
              // Emit remarks cleared
              io.emit("remarks_updated", {
                itemId: parseInt(id),
                remarks: "",
                remarks_added_by: null,
                remarks_created_at: null,
              });
            } else if (adjValue < 0) {
              logMessage = `Stock Out: ${itemName} ${oldQty} - ${Math.abs(adjValue)} = ${newQty}`;
            }
          } else {
            if (newQty > oldQty) {
              await client.query(
                `DELETE FROM inventory_remarks WHERE item_id = $1`,
                [id],
              );
              io.emit("remarks_updated", {
                itemId: parseInt(id),
                remarks: "",
                remarks_added_by: null,
                remarks_created_at: null,
              });
            }
          }

          await logActivity(req, "UPDATE", "inventory", id, logMessage);
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

// ==========================================
// INVENTORY LEDGER ENDPOINT
// ==========================================

app.get("/api/inventory/ledger", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        l.printinv_id, l.item_id, l.old_quantity, l.new_quantity,
        l.change_amount, l.recorded_at, i.item_name, i.category, i.unit, i.price
       FROM inventory_ledger l
       JOIN inventory i ON l.item_id = i.item_id
       ORDER BY l.recorded_at DESC`,
    );
    const mappedData = result.rows.map((row) => ({
      id: row.printinv_id,
      itemId: row.item_id,
      name: row.item_name || "Unnamed",
      category: row.category || "General",
      uom: row.unit || "pcs",
      price: row.price || 0,
      previousQuantity: row.old_quantity,
      quantity: row.new_quantity,
      adjustment: row.change_amount,
      transactionDate: row.recorded_at,
    }));
    res.json(mappedData);
  } catch (err) {
    console.error("Fetch ledger error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.patch("/api/inventory/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const {
    name,
    category,
    uom,
    quantity,
    price,
    minStock,
    brand_id,
    supplier_id,
  } = req.body;

  try {
    const oldData = await pool.query(
      "SELECT quantity FROM inventory WHERE item_id = $1",
      [id],
    );
    const oldQty = oldData.rows[0]?.quantity || 0;

    if (oldQty !== quantity) {
      await pool.query(
        `INSERT INTO inventory_ledger (item_id, old_quantity, new_quantity, change_amount) VALUES ($1, $2, $3, $4)`,
        [id, oldQty, quantity, quantity - oldQty],
      );
    }

    let brandName = req.body.brand || "";
    if (brand_id) {
      const brandRes = await pool.query(
        "SELECT brand_name FROM brand WHERE brand_id = $1",
        [brand_id],
      );
      brandName = brandRes.rows[0]?.brand_name || "";
    }

    let supplierName = req.body.supplier || "";
    if (supplier_id) {
      const supplierRes = await pool.query(
        "SELECT supplier_name FROM supplier WHERE supplier_id = $1",
        [supplier_id],
      );
      supplierName = supplierRes.rows[0]?.supplier_name || "";
    }

    await pool.query(
      `UPDATE inventory SET 
        item_name=$1, category=$2, unit=$3, quantity=$4, price=$5, minimum_stock=$6,
        brand=$7, supplier=$8,
        updated_at = CASE WHEN quantity != $4 THEN now() ELSE updated_at END
        WHERE item_id=$9`,
      [
        name,
        category,
        uom,
        quantity,
        price,
        minStock,
        brandName,
        supplierName,
        id,
      ],
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
    console.error("Update inventory error:", err);
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
    console.error("Delete inventory error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================================
// INVENTORY REMARKS ENDPOINTS
// ==========================================

app.post("/api/inventory/:id/remarks", async (req, res) => {
  const id = cleanId(req.params.id);
  const { remarks } = req.body;

  if (!remarks || !remarks.trim()) {
    return res.status(400).json({ error: "Remarks cannot be empty" });
  }

  try {
    const itemInfo = await pool.query(
      "SELECT item_name FROM inventory WHERE item_id = $1",
      [id],
    );
    if (itemInfo.rows.length === 0)
      return res.status(404).json({ error: "Item not found" });
    const itemName = itemInfo.rows[0].item_name;
    const addedBy =
      req.session?.user?.username || req.session?.user?.name || "Unknown";

    await pool.query("DELETE FROM inventory_remarks WHERE item_id = $1", [id]);

    const result = await pool.query(
      `INSERT INTO inventory_remarks (item_id, remarks, added_by, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
      [id, remarks.trim(), addedBy],
    );

    io.emit("remarks_updated", {
      itemId: parseInt(id),
      remarks: remarks.trim(),
      remarks_added_by: addedBy,
      remarks_created_at: result.rows[0].created_at,
    });

    await logActivity(
      req,
      "INSERT",
      "inventory_remarks",
      id,
      `Added remark for item: ${itemName} by ${addedBy}`,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Save remark error:", err);
    res.status(500).json({ error: "Failed to save remark" });
  }
});

app.get("/api/inventory/:id/remarks", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const result = await pool.query(
      `SELECT * FROM inventory_remarks WHERE item_id = $1 ORDER BY created_at DESC`,
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch remarks error:", err);
    res.status(500).json({ error: "Failed to fetch remarks" });
  }
});

app.delete("/api/inventory/:id/remarks", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const info = await pool.query(
      "SELECT item_name FROM inventory WHERE item_id = $1",
      [id],
    );
    if (info.rows.length === 0)
      return res.status(404).json({ error: "Item not found" });
    const itemName = info.rows[0].item_name;

    await pool.query("DELETE FROM inventory_remarks WHERE item_id = $1", [id]);

    io.emit("remarks_updated", {
      itemId: parseInt(id),
      remarks: "",
      remarks_added_by: null,
      remarks_created_at: null,
    });

    await logActivity(
      req,
      "DELETE",
      "inventory_remarks",
      id,
      `Cleared remark for item: ${itemName}`,
    );
    res.json({ message: "Remark cleared successfully" });
  } catch (err) {
    console.error("Delete inventory remark error:", err);
    res.status(500).json({ error: "Failed to clear remark" });
  }
});

// ==========================================
// RAW MATERIALS ENDPOINTS
// ==========================================

app.get("/api/raw-materials", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        (SELECT old_qty_value FROM raw_materials_ledger l 
         WHERE l.material_id = r.material_id 
         ORDER BY recorded_at DESC LIMIT 1) as prev_qty,
        (SELECT rmr.remarks FROM raw_materials_remarks rmr
         WHERE rmr.material_id = r.material_id
         ORDER BY rmr.created_at DESC LIMIT 1) as latest_remark,
        (SELECT rmr.added_by FROM raw_materials_remarks rmr
         WHERE rmr.material_id = r.material_id
         ORDER BY rmr.created_at DESC LIMIT 1) as remarks_added_by,
        (SELECT rmr.created_at FROM raw_materials_remarks rmr
         WHERE rmr.material_id = r.material_id
         ORDER BY rmr.created_at DESC LIMIT 1) as remarks_created_at
       FROM raw_materials r ORDER BY r.material_id DESC`,
    );
    const mappedData = result.rows.map((m) => ({
      material_id: m.material_id,
      material_name: m.material_name ?? "",
      category: m.category ?? "",
      unit: m.unit ?? "",
      qty_: parseFloat(m.quantity) || 0,
      previousQty:
        m.prev_qty !== null && m.prev_qty !== undefined
          ? parseFloat(m.prev_qty)
          : parseFloat(m.quantity) || 0,
      minimum_stock: parseFloat(m.minimum_stock) || 0,
      remarks: m.latest_remark || "",
      remarks_added_by: m.remarks_added_by || "",
      remarks_created_at: m.remarks_created_at || null,
      createdAt: m.created_at,
      updated_at: m.updated_at,
    }));
    res.json(mappedData);
  } catch (err) {
    console.error("Raw materials fetch error:", err);
    res.status(500).json({ error: "Raw materials fetch failed" });
  }
});

app.post("/api/raw-materials", async (req, res) => {
  const { material_name, category, unit, qty_, minimum_stock } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO raw_materials (material_name, category, unit, quantity, minimum_stock) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        material_name,
        category,
        unit,
        parseFloat(qty_) || 0,
        parseFloat(minimum_stock) || 0,
      ],
    );
    await logActivity(
      req,
      "INSERT",
      "raw_materials",
      result.rows[0].material_id,
      `Added raw material: ${material_name}`,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/raw-materials/bulk-add", async (req, res) => {
  const { items } = req.body;
  try {
    const results = [];
    for (const item of items) {
      const result = await pool.query(
        `INSERT INTO raw_materials (material_name, category, unit, quantity, minimum_stock) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          item.material_name,
          item.category,
          item.unit,
          parseFloat(item.qty_) || 0,
          parseFloat(item.minimum_stock) || 0,
        ],
      );
      await logActivity(
        req,
        "INSERT",
        "raw_materials",
        result.rows[0].material_id,
        `Bulk added material: ${item.material_name}`,
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

app.patch("/api/raw-materials/bulk", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      const cleanedItemId = cleanId(item.material_id);

      const currentRes = await client.query(
        "SELECT material_name, quantity FROM raw_materials WHERE material_id = $1",
        [cleanedItemId],
      );

      if (currentRes.rows.length > 0) {
        const materialName = currentRes.rows[0].material_name;
        const oldQty = Math.floor(currentRes.rows[0].quantity);
        const newQty = Math.floor(item.qty_);

        if (oldQty !== newQty) {
          let actionType = "UPDATE";
          let description = `Update Quantity ${materialName} ${oldQty} to ${newQty}`;

          if (item.adjustment && parseInt(item.adjustment) !== 0) {
            const adj = parseInt(item.adjustment);
            actionType = adj > 0 ? "STOCK IN" : "STOCK OUT";
            description = `${adj > 0 ? "Stock In" : "Stock Out"}: ${materialName} ${oldQty} ${adj > 0 ? "+" : "-"} ${Math.abs(adj)} = ${newQty}`;
          }

          await client.query(
            `INSERT INTO raw_materials_ledger (material_id, old_qty_value, new_qty_value, change_amount)
             VALUES ($1, $2, $3, $4)`,
            [cleanedItemId, oldQty, newQty, newQty - oldQty],
          );

          await client.query(
            "UPDATE raw_materials SET quantity = $1, updated_at = now() WHERE material_id = $2",
            [newQty, cleanedItemId],
          );

          if (newQty > oldQty) {
            await client.query(
              "DELETE FROM raw_materials_remarks WHERE material_id = $1",
              [cleanedItemId],
            );
            io.emit("raw_remarks_updated", {
              materialId: parseInt(cleanedItemId),
              remarks: "",
              remarks_added_by: null,
              remarks_created_at: null,
            });
          }

          await logActivity(
            req,
            actionType,
            "raw_materials",
            cleanedItemId,
            description,
          );
        }
      }
    }
    await client.query("COMMIT");
    res.json({ message: "Bulk update successful" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk update error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// RAW MATERIALS LEDGER ENDPOINT
// ==========================================

app.get("/api/raw-materials/ledger", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.ledger_id, l.material_id, l.old_qty_value, l.new_qty_value,
        l.change_amount, l.recorded_at, r.material_name, r.category, r.unit
       FROM raw_materials_ledger l
       JOIN raw_materials r ON l.material_id = r.material_id
       ORDER BY l.recorded_at DESC`,
    );
    const mappedData = result.rows.map((row) => ({
      id: row.ledger_id,
      material_id: row.material_id,
      material_name: row.material_name || "Unnamed",
      category: row.category || "General",
      unit: row.unit || "",
      old_qty: row.old_qty_value,
      new_qty: row.new_qty_value,
      adjustment: row.change_amount,
      transactionDate: row.recorded_at,
    }));
    res.json(mappedData);
  } catch (err) {
    console.error("Fetch raw materials ledger error:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

app.put("/api/raw-materials/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const { material_name, category, unit, qty_, minimum_stock } = req.body;
  try {
    const currentRes = await pool.query(
      "SELECT quantity FROM raw_materials WHERE material_id = $1",
      [id],
    );
    const oldQty = parseFloat(currentRes.rows[0]?.quantity || 0);
    const newQty = parseFloat(qty_);

    if (oldQty !== newQty) {
      await pool.query(
        `INSERT INTO raw_materials_ledger (material_id, old_qty_value, new_qty_value, change_amount)
         VALUES ($1, $2, $3, $4)`,
        [id, oldQty, newQty, newQty - oldQty],
      );

      if (newQty > oldQty) {
        await pool.query(
          "DELETE FROM raw_materials_remarks WHERE material_id = $1",
          [id],
        );
        io.emit("raw_remarks_updated", {
          materialId: parseInt(id),
          remarks: "",
          remarks_added_by: null,
          remarks_created_at: null,
        });
      }
    }

    await pool.query(
      `UPDATE raw_materials SET 
        material_name=$1, category=$2, unit=$3, quantity=$4, minimum_stock=$5,
        updated_at = CASE WHEN quantity != $4 THEN now() ELSE updated_at END
       WHERE material_id=$6`,
      [material_name, category, unit, newQty, minimum_stock, id],
    );
    await logActivity(
      req,
      "UPDATE",
      "raw_materials",
      id,
      `Updated raw material: ${material_name}`,
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
// RAW MATERIALS REMARKS ENDPOINTS
// ==========================================

app.post("/api/raw-materials/:id/remarks", async (req, res) => {
  const id = cleanId(req.params.id);
  const { remarks } = req.body;

  if (!remarks || !remarks.trim()) {
    return res.status(400).json({ error: "Remarks cannot be empty" });
  }

  try {
    const matInfo = await pool.query(
      "SELECT material_name FROM raw_materials WHERE material_id = $1",
      [id],
    );
    if (matInfo.rows.length === 0)
      return res.status(404).json({ error: "Material not found" });
    const materialName = matInfo.rows[0].material_name;
    const addedBy =
      req.session?.user?.username || req.session?.user?.name || "Unknown";

    await pool.query(
      "DELETE FROM raw_materials_remarks WHERE material_id = $1",
      [id],
    );

    const result = await pool.query(
      `INSERT INTO raw_materials_remarks (material_id, remarks, added_by, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
      [id, remarks.trim(), addedBy],
    );

    io.emit("raw_remarks_updated", {
      materialId: parseInt(id),
      remarks: remarks.trim(),
      remarks_added_by: addedBy,
      remarks_created_at: result.rows[0].created_at,
    });

    await logActivity(
      req,
      "INSERT",
      "raw_materials_remarks",
      id,
      `Added remark for material: ${materialName} by ${addedBy}`,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Save raw material remark error:", err);
    res.status(500).json({ error: "Failed to save remark" });
  }
});

app.get("/api/raw-materials/:id/remarks", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const result = await pool.query(
      `SELECT * FROM raw_materials_remarks WHERE material_id = $1 ORDER BY created_at DESC`,
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch raw material remarks error:", err);
    res.status(500).json({ error: "Failed to fetch remarks" });
  }
});

app.delete("/api/raw-materials/:id/remarks", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    const info = await pool.query(
      "SELECT material_name FROM raw_materials WHERE material_id = $1",
      [id],
    );
    if (info.rows.length === 0)
      return res.status(404).json({ error: "Material not found" });
    const materialName = info.rows[0].material_name;

    await pool.query(
      "DELETE FROM raw_materials_remarks WHERE material_id = $1",
      [id],
    );

    io.emit("raw_remarks_updated", {
      materialId: parseInt(id),
      remarks: "",
      remarks_added_by: null,
      remarks_created_at: null,
    });

    await logActivity(
      req,
      "DELETE",
      "raw_materials_remarks",
      id,
      `Cleared remark for material: ${materialName}`,
    );
    res.json({ message: "Remark cleared successfully" });
  } catch (err) {
    console.error("Delete raw material remark error:", err);
    res.status(500).json({ error: "Failed to clear remark" });
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
    const userRes = await pool.query(
      "SELECT full_name FROM users WHERE user_id = $1",
      [id],
    );
    const targetName = userRes.rows[0]?.full_name || "Unknown User";
    const roles = {
      1: "Admin",
      2: "Office",
      3: "Production",
      4: "Viewer",
      5: "Viewer Admin",
      6: "Trading",
    };
    const roleName = roles[user_level] || user_level;

    await pool.query("UPDATE users SET user_level = $1 WHERE user_id = $2", [
      user_level,
      id,
    ]);

    // ✅ NEW — notify the affected user's browser(s) in real time
    io.emit("role_changed", {
      userId: parseInt(id),
      newRole: user_level,
      roleName,
    });

    await logActivity(
      req,
      "UPDATE",
      "users",
      id,
      `Changed ${targetName}'s user level to ${roleName}`,
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

    // ✅ NEW
    io.emit("user_deleted", { userId: parseInt(id) });

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
// 6. BACKUP & EXPORT ENDPOINTS
// ==========================================

app.post("/api/backup/export", async (req, res) => {
  const backupDir =
    req.body.destinationPath || "C:/Users/Samuel/Desktop/Backup";

  try {
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  } catch (dirErr) {
    console.error("❌ Failed to create directory:", dirErr.message);
  }

  const inventoryPath = `${backupDir.replace(/\\/g, "/")}/Inventory.csv`;
  const rawMaterialsPath = `${backupDir.replace(/\\/g, "/")}/raw_materials.csv`;

  const client = await pool.connect();
  try {
    await client.query("SET datestyle = 'ISO, MDY';");
    await client.query(
      `COPY (SELECT * FROM inventory) TO '${inventoryPath}' WITH CSV HEADER;`,
    );
    await client.query(
      `COPY (SELECT * FROM raw_materials) TO '${rawMaterialsPath}' WITH CSV HEADER;`,
    );
    await logActivity(
      req,
      "EXPORT",
      "system",
      null,
      `Exported database backups manually to Desktop/Backup`,
    );
    res.status(200).json({
      message: "Database system backups exported successfully!",
      paths: { inventory: inventoryPath, rawMaterials: rawMaterialsPath },
    });
  } catch (err) {
    console.error("❌ BACKUP EXPORT SYSTEM FAILURE:", err.message);
    if (err.code === "42501") {
      return res.status(403).json({
        error: "Database system permission denied.",
        message:
          "The PostgreSQL windows service user account does not have authorization to write files to your Desktop workspace directory directly.",
      });
    }
    res.status(500).json({
      error: "Export processing sequence failed.",
      message: err.message,
    });
  } finally {
    client.release();
  }
});

app.post(
  "/api/backup/import",
  upload.single("backupFile"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Upload failed",
        message: "No payload backup file provided.",
      });
    }

    const targetTable = req.body.targetTable;
    const uploadedFilePath = req.file.path.replace(/\\/g, "/");

    if (!targetTable || !["inventory", "raw_materials"].includes(targetTable)) {
      if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({
        error: "Invalid Target",
        message:
          "Please specify a valid destination table ('inventory' or 'raw_materials').",
      });
    }

    const client = await pool.connect();
    try {
      const fileContent = fs.readFileSync(uploadedFilePath, "utf8");
      const firstLine = fileContent.split(/\r?\n/)[0];
      if (!firstLine)
        throw new Error(
          "The uploaded file structure header row evaluation failed.",
        );

      const headers = firstLine
        .replace(/\r/g, "")
        .split(",")
        .map((h) => h.trim().toLowerCase());
      const finalColumns = headers.map((column) => {
        if (targetTable === "inventory") {
          if (column === "raw_material_id") return "material_id";
          if (column === "material_id") return "raw_material_id";
        }
        return column;
      });

      const schemaRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [targetTable],
      );
      const validColumns = new Set(schemaRes.rows.map((r) => r.column_name));
      const unknownColumns = finalColumns.filter((c) => !validColumns.has(c));

      if (unknownColumns.length > 0) {
        if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        return res.status(400).json({
          error: "Column mismatch",
          message: `The uploaded CSV has column(s) that don't exist on "${targetTable}": ${unknownColumns.join(", ")}. Valid columns are: ${[...validColumns].join(", ")}.`,
        });
      }

      const targetColumns = `(${finalColumns.join(", ")})`;
      await client.query("SET datestyle = 'ISO, MDY';");
      await client.query("BEGIN");
      await client.query(`TRUNCATE TABLE ${targetTable} CASCADE;`);
      await client.query(
        `COPY ${targetTable} ${targetColumns} FROM '${uploadedFilePath}' WITH (FORMAT csv, HEADER true);`,
      );
      await client.query("COMMIT");

      if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      await logActivity(
        req,
        "IMPORT",
        "system",
        null,
        `Restored ${targetTable} file datasets via control panel dashboard upload.`,
      );
      res.status(200).json({
        message: `Successfully synchronized system data table properties directly into ${targetTable}!`,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      console.error("❌ IMPORT PARSER ERROR:", err.message);
      res
        .status(400)
        .json({ error: "Data parser failed", message: err.message });
    } finally {
      client.release();
    }
  },
);

// ==========================================
// 7. SUPPLIER ENDPOINTS
// ==========================================

app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT supplier_id, supplier_name, address, contact_no, other_details FROM supplier ORDER BY supplier_id DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch suppliers error:", err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

app.get("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT supplier_id, supplier_name, address, contact_no, other_details FROM supplier WHERE supplier_id = $1`,
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Supplier not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch supplier error:", err);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

app.post("/api/suppliers", async (req, res) => {
  const { supplier_name, address, contact_no, other_details } = req.body;
  if (!supplier_name || !supplier_name.trim())
    return res.status(400).json({ error: "Supplier name is required" });
  try {
    const result = await pool.query(
      `INSERT INTO supplier (supplier_name, address, contact_no, other_details) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        supplier_name.trim(),
        address?.trim() || null,
        contact_no?.trim() || null,
        other_details?.trim() || null,
      ],
    );
    await logActivity(
      req,
      "INSERT",
      "supplier",
      result.rows[0].supplier_id,
      `Added new supplier: ${supplier_name.trim()}`,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create supplier error:", err);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const { supplier_name, address, contact_no, other_details } = req.body;
  if (!supplier_name || !supplier_name.trim())
    return res.status(400).json({ error: "Supplier name is required" });
  try {
    const existing = await pool.query(
      "SELECT supplier_name FROM supplier WHERE supplier_id = $1",
      [id],
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Supplier not found" });
    const result = await pool.query(
      `UPDATE supplier SET supplier_name=$1, address=$2, contact_no=$3, other_details=$4 WHERE supplier_id=$5 RETURNING *`,
      [
        supplier_name.trim(),
        address?.trim() || null,
        contact_no?.trim() || null,
        other_details?.trim() || null,
        id,
      ],
    );
    await logActivity(
      req,
      "UPDATE",
      "supplier",
      id,
      `Updated supplier: ${supplier_name.trim()}`,
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update supplier error:", err);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const info = await pool.query(
      "SELECT supplier_name FROM supplier WHERE supplier_id = $1",
      [id],
    );
    if (info.rows.length === 0)
      return res.status(404).json({ error: "Supplier not found" });
    const supplierName = info.rows[0].supplier_name;
    await pool.query("DELETE FROM supplier WHERE supplier_id = $1", [id]);
    await logActivity(
      req,
      "DELETE",
      "supplier",
      id,
      `Deleted supplier: ${supplierName}`,
    );
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error("Delete supplier error:", err);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

// ==========================================
// 8. BRAND ENDPOINTS
// ==========================================

app.get("/api/brands", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT brand_id, brand_name, brand_color FROM brand ORDER BY brand_id DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch brands error:", err);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

app.get("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT brand_id, brand_name, brand_color FROM brand WHERE brand_id = $1`,
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Brand not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch brand error:", err);
    res.status(500).json({ error: "Failed to fetch brand" });
  }
});

app.post("/api/brands", async (req, res) => {
  const { brand_name, brand_color } = req.body;
  if (!brand_name || !brand_name.trim())
    return res.status(400).json({ error: "Brand name is required" });
  if (brand_name.trim().length > 40)
    return res
      .status(400)
      .json({ error: "Brand name must be 40 characters or less" });
  const color =
    brand_color && /^#[0-9A-Fa-f]{6}$/.test(brand_color)
      ? brand_color
      : "#1565c0";
  try {
    const result = await pool.query(
      `INSERT INTO brand (brand_name, brand_color) VALUES ($1, $2) RETURNING *`,
      [brand_name.trim(), color],
    );
    await logActivity(
      req,
      "INSERT",
      "brand",
      result.rows[0].brand_id,
      `Added new brand: ${brand_name.trim()}`,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create brand error:", err);
    res.status(500).json({ error: "Failed to create brand" });
  }
});

app.put("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  const { brand_name, brand_color } = req.body;
  if (!brand_name || !brand_name.trim())
    return res.status(400).json({ error: "Brand name is required" });
  if (brand_name.trim().length > 40)
    return res
      .status(400)
      .json({ error: "Brand name must be 40 characters or less" });
  const color =
    brand_color && /^#[0-9A-Fa-f]{6}$/.test(brand_color)
      ? brand_color
      : "#1565c0";
  try {
    const existing = await pool.query(
      "SELECT brand_name FROM brand WHERE brand_id = $1",
      [id],
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Brand not found" });
    const result = await pool.query(
      `UPDATE brand SET brand_name=$1, brand_color=$2 WHERE brand_id=$3 RETURNING *`,
      [brand_name.trim(), color, id],
    );
    await logActivity(
      req,
      "UPDATE",
      "brand",
      id,
      `Updated brand: ${brand_name.trim()}`,
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update brand error:", err);
    res.status(500).json({ error: "Failed to update brand" });
  }
});

app.delete("/api/brands/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const info = await pool.query(
      "SELECT brand_name FROM brand WHERE brand_id = $1",
      [id],
    );
    if (info.rows.length === 0)
      return res.status(404).json({ error: "Brand not found" });
    const brandName = info.rows[0].brand_name;
    await pool.query("DELETE FROM brand WHERE brand_id = $1", [id]);
    await logActivity(
      req,
      "DELETE",
      "brand",
      id,
      `Deleted brand: ${brandName}`,
    );
    res.json({ message: "Brand deleted successfully" });
  } catch (err) {
    console.error("Delete brand error:", err);
    res.status(500).json({ error: "Failed to delete brand" });
  }
});

// ==========================================
// AUTOMATIC LOG CLEANUP
// ==========================================
cron.schedule("0 * * * *", async () => {
  console.log("--- Starting Scheduled Log Cleanup ---");
  try {
    const result = await pool.query(
      "DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '5 days'",
    );
    const timestamp = new Date().toLocaleTimeString();
    console.log("-----------------------------------------");
    console.log(`[${timestamp}] ✨ Cleanup Status: SUCCESS`);
    console.log(`🗑️  Logs Deleted: ${result.rowCount}`);
    console.log(`📅  Removed logs older than 5 days`);
    console.log("-----------------------------------------");
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
// PROFILE UPDATE ENDPOINT
// ==========================================
app.patch("/api/auth/profile", async (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Not authenticated" });

  const { fullName, email, newPassword, verifyPassword } = req.body;
  const userId = req.session.user.id;

  try {
    const userRes = await pool.query(
      "SELECT full_name, email, password_hash, user_level FROM users WHERE user_id = $1",
      [userId],
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const currentUser = userRes.rows[0];
    const isMatch = await bcrypt.compare(
      verifyPassword,
      currentUser.password_hash,
    );
    if (!isMatch)
      return res.status(401).json({ error: "Incorrect current password." });

    let descriptions = [];
    if (fullName !== currentUser.full_name)
      descriptions.push(
        `name from "${currentUser.full_name}" to "${fullName}"`,
      );
    if (email !== currentUser.email)
      descriptions.push(`email from "${currentUser.email}" to "${email}"`);
    if (newPassword) descriptions.push("password");

    let query, params;
    if (newPassword && newPassword.trim() !== "") {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      query = `UPDATE users SET full_name=$1, email=$2, password_hash=$3 WHERE user_id=$4 RETURNING user_id, full_name, email, user_level`;
      params = [fullName, email, hashedPassword, userId];
    } else {
      query = `UPDATE users SET full_name=$1, email=$2 WHERE user_id=$3 RETURNING user_id, full_name, email, user_level`;
      params = [fullName, email, userId];
    }

    const result = await pool.query(query, params);
    const updatedUser = result.rows[0];

    req.session.user = {
      id: updatedUser.user_id,
      name: updatedUser.full_name,
      email: updatedUser.email,
      user_level: updatedUser.user_level,
    };

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
    if (err.code === "23505")
      return res.status(400).json({ error: "Email is already in use." });
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
      "SELECT * FROM users WHERE email=$1 AND reset_otp=$2 AND otp_expiry > NOW()",
      [email, otp],
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Invalid or expired OTP." });
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
      "UPDATE users SET password_hash=$1, reset_otp=NULL, otp_expiry=NULL WHERE email=$2 AND reset_otp=$3 AND otp_expiry > NOW() RETURNING user_id",
      [hashedPassword, email, otp],
    );
    if (result.rowCount === 0)
      return res
        .status(400)
        .json({ error: "Reset failed. OTP may have expired." });
    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
});

// ← httpServer.listen instead of app.listen
httpServer.listen(port, "0.0.0.0", () =>
  console.log(`Server running on http://192.168.1.2:${port}`),
);
