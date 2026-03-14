import pg from "pg";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
      if (parseFloat(item.quantity) === 0) status = "Out of Stock";
      else if (parseFloat(item.quantity) <= (item.minimum_stock || 10))
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

app.post("/api/inventory", async (req, res) => {
  const { item_name, category, unit, quantity, minimum_stock } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO inventory (item_name, category, unit, quantity, minimum_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name, category, unit, quantity, minimum_stock || 10],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PURCHASE ORDER ENDPOINTS
// ==========================================

app.get("/api/purchase-orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM purchase_order ORDER BY created_at DESC",
    );
    res.json(
      result.rows.map((po) => ({
        id: po.po_id,
        poNo: po.po_number,
        customer: po.customer_name,
        company: po.company, // Added
        address: po.address, // Added
        email: po.email, // Added
        contact: po.contact, // Added
        totalPrice: po.total_price,
        status: po.status,
        date: po.created_at,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Server error fetching orders" });
  }
});
app.get("/api/purchase-orders/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM item_order WHERE po_id = $1",
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch PO items error:", err.message);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
});

// ==========================================
// 3. RAW MATERIALS & LEFTOVERS
// ==========================================

app.get("/api/raw-materials", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM raw_materials ORDER BY rm_id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Added this route to fix the 404 error
app.post("/api/raw-materials", async (req, res) => {
  const { material_name, category, unit, stock, min_stock } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO raw_materials (material_name, category, unit, stock, min_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [material_name, category, unit, stock || 0, min_stock || 10],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST Raw Material Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leftovers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM material_leftovers WHERE quantity > 0 ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ==========================================
// 4. JOB ORDER SYSTEM
// ==========================================

app.get("/api/job-orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM job_order ORDER BY jo_id DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job orders" });
  }
});

app.get("/api/job-orders/:id/materials", async (req, res) => {
  try {
    const { id } = req.params;
    // Added used_stock and source_type to the SELECT statement
    const result = await pool.query(
      "SELECT rm_id, material_name, category, unit, used_stock, source_type FROM job_materials WHERE jo_id = $1",
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch JO materials error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/job-orders", async (req, res) => {
  const { item_name, handle_by, status, quantity_produced, materials } =
    req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const joResult = await client.query(
      "INSERT INTO job_order (item_name, handle_by, status, quantity_produced) VALUES ($1, $2, $3, $4) RETURNING jo_id",
      [item_name, handle_by, status, quantity_produced || 0],
    );
    const newJoId = joResult.rows[0].jo_id;

    if (materials) {
      for (const mat of materials) {
        const table =
          mat.source_type === "Leftover"
            ? "material_leftovers"
            : "raw_materials";
        const idCol = mat.source_type === "Leftover" ? "leftover_id" : "rm_id";
        const qtyCol = mat.source_type === "Leftover" ? "quantity" : "stock";

        const updateRes = await client.query(
          `UPDATE ${table} SET ${qtyCol} = ${qtyCol} - $1 WHERE ${idCol} = $2 AND ${qtyCol} >= $1`,
          [mat.used_stock, mat.id],
        );
        if (updateRes.rowCount === 0)
          throw new Error(`Stock error for ${mat.material_name}`);

        await client.query(
          `INSERT INTO job_materials (jo_id, rm_id, material_name, category, unit, used_stock, source_type) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            newJoId,
            mat.id,
            mat.material_name,
            mat.category,
            mat.unit,
            mat.used_stock,
            mat.source_type,
          ],
        );
      }
    }
    await client.query("COMMIT");
    res.status(201).json({ success: true, jo_id: newJoId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post("/api/job-orders/:id/complete", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { remarks, leftovers } = req.body;

    await client.query("BEGIN");

    await client.query(
      "UPDATE job_order SET status = 'Completed' WHERE jo_id = $1",
      [id],
    );

    if (leftovers && leftovers.length > 0) {
      for (const item of leftovers) {
        await client.query(
          `INSERT INTO material_leftovers 
           (jo_id, rm_id, material_name, category, unit, quantity, type, remarks) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id,
            item.rm_id,
            item.material_name,
            item.category,
            item.unit,
            item.leftover_qty,
            "Scrap",
            remarks,
          ],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Job Order finalized and leftovers recorded." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Completion error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete("/api/job-orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM job_order WHERE jo_id = $1", [
      id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "JO not found" });
    res.json({ message: "Job order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
