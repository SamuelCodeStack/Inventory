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
      // UPDATED: CASE logic added to Bulk Update
      await client.query(
        `UPDATE inventory SET 
         quantity = $1, 
         updated_at = CASE WHEN quantity != $1 THEN now() ELSE updated_at END 
         WHERE item_id = $2`,
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
    // UPDATED: CASE logic added to individual update to only update timestamp if quantity changes
    await pool.query(
      `UPDATE inventory SET 
       item_name=$1, category=$2, unit=$3, quantity=$4, minimum_stock=$5, 
       updated_at = CASE WHEN quantity != $4 THEN now() ELSE updated_at END
       WHERE item_id=$6`,
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
    res.json({ message: "Raw material updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/raw-materials/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  try {
    await pool.query("DELETE FROM raw_materials WHERE material_id = $1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
