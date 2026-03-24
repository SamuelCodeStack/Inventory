import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Helper to clean IDs (Handles cases like "16:1")
const cleanId = (id) => {
  if (typeof id === "string") return id.split(":")[0];
  return id;
};

// ==========================================
// 1. INVENTORY ENDPOINTS
// ==========================================

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT *, created_at FROM inventory ORDER BY item_id DESC",
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
      await client.query(
        "INSERT INTO inventory (item_name, category, unit, quantity, minimum_stock, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)",
        [
          item.name,
          item.category,
          item.uom,
          item.quantity || 0,
          item.minStock || 10,
        ],
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
      await client.query(
        "UPDATE inventory SET quantity = $1 WHERE item_id = $2",
        [item.quantity, cleanId(item.id)],
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
      "UPDATE inventory SET item_name=$1, category=$2, unit=$3, quantity=$4, minimum_stock=$5 WHERE item_id=$6",
      [name, category, uom, quantity, minStock, id],
    );
    res.json({ message: "Item updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    await pool.query("DELETE FROM inventory WHERE item_id = $1", [id]);
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
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// CRITICAL: This route must exist for ViewPOModal to work
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
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
