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

// ==========================================
// 1. INVENTORY ENDPOINTS
// ==========================================

app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM inventory ORDER BY item_id DESC",
    );
    const mappedData = result.rows.map((item) => {
      let status = "In Stock";
      if (item.quantity === 0) status = "Out of Stock";
      else if (item.quantity <= (item.minimum_stock || 10))
        status = "Low Stock";

      return {
        id: item.item_id,
        name: item.item_name || "Unnamed",
        category: item.category || "General",
        uom: item.unit || "pcs",
        quantity: item.quantity || 0,
        minStock: item.minimum_stock || 10,
        status: status,
      };
    });
    res.json(mappedData);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.post("/api/inventory/bulk-add", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      await client.query(
        "INSERT INTO inventory (item_name, category, unit, quantity, minimum_stock) VALUES ($1, $2, $3, $4, $5)",
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

// ==========================================
// 2. PURCHASE ORDER ENDPOINTS
// ==========================================

// GET: All POs
app.get("/api/purchase-orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM purchase_order ORDER BY po_id DESC",
    );
    const mappedData = result.rows.map((po) => ({
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
    }));
    res.json(mappedData);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// POST: Create PO with items
app.post("/api/purchase-orders", async (req, res) => {
  const {
    customer_name,
    po_number,
    email,
    contact,
    company,
    address,
    total_price,
    status,
    delivery_date,
    items,
  } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Defaulting status_date to delivery_date or NOW() on creation
    const poResult = await client.query(
      `INSERT INTO purchase_order 
      (po_number, customer_name, email, contact, company, address, total_price, status, delivery_date, status_date, remarks) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, '') RETURNING po_id`,
      [
        po_number,
        customer_name,
        email,
        contact,
        company,
        address,
        total_price,
        status,
        delivery_date,
      ],
    );

    const newPoId = poResult.rows[0].po_id;
    const itemInsertQuery = `INSERT INTO item_order (po_id, po_number, item_id, item_name, category, unit, quantity, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

    for (const item of items) {
      await client.query(itemInsertQuery, [
        newPoId,
        po_number,
        item.id,
        item.name,
        item.category,
        item.uom || item.unit,
        item.qty,
        item.price,
      ]);
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, poId: newPoId });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505")
      res.status(409).json({ error: "PO Number already exists" });
    else res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH: Updated to handle Status, Remarks, and auto-update Status Date
app.patch("/api/purchase-orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    // We update the status, the remarks, and set status_date to TODAY
    const query = `
      UPDATE purchase_order 
      SET status = $1, 
          remarks = $2, 
          status_date = CURRENT_DATE 
      WHERE po_id = $3
    `;
    await pool.query(query, [status, remarks || "", id]);
    res.json({ message: "Status and remarks updated" });
  } catch (err) {
    console.error("PATCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Items for specific PO
app.get("/api/purchase-orders/:id/items", async (req, res) => {
  const { id } = req.params;
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

// DELETE: Remove PO
app.delete("/api/purchase-orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM purchase_order WHERE po_id = $1", [id]);
    res.json({ message: "PO deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================================
// 3. BULK QUANTITY UPDATES (Inventory)
// ==========================================

app.patch("/api/inventory/bulk", async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of items) {
      await client.query(
        "UPDATE inventory SET quantity = $1 WHERE item_id = $2",
        [item.quantity, item.id],
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

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
