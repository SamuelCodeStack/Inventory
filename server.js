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

// GET: Fetch all inventory items
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
    console.error("INVENTORY FETCH ERROR:", err.message);
    res.status(500).json([]);
  }
});

// POST: Add new inventory item
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

// PUT: Full update inventory
app.put("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const { item_name, category, unit, quantity, minimum_stock } = req.body;
  try {
    await pool.query(
      "UPDATE inventory SET item_name = $1, category = $2, unit = $3, quantity = $4, minimum_stock = $5 WHERE item_id = $6",
      [item_name, category, unit, quantity, minimum_stock, id],
    );
    res.json({ message: "Update successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove inventory item
app.delete("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM inventory WHERE item_id = $1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================================
// 2. PURCHASE ORDER ENDPOINTS
// ==========================================

// GET: Fetch all Purchase Orders for the Dashboard
app.get("/api/purchase-orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM purchase_order ORDER BY created_at DESC",
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
      date: po.created_at,
    }));

    res.json(mappedData);
  } catch (err) {
    console.error("FETCH PO ERROR:", err.message);
    res.status(500).json({ error: "Server error fetching orders" });
  }
});

// POST: Create PO and link items in item_order (TRANSACTION)
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
    items,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insert into main purchase_order table
    const poResult = await client.query(
      `INSERT INTO purchase_order 
        (po_number, customer_name, email, contact, company, address, total_price, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING po_id`,
      [
        po_number,
        customer_name,
        email,
        contact,
        company,
        address,
        total_price,
        status,
      ],
    );

    const newPoId = poResult.rows[0].po_id;

    // 2. Insert selected items into item_order table
    const itemInsertQuery = `
      INSERT INTO item_order (po_id, po_number, item_id, item_name, category, unit, quantity, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

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

    // SPECIFIC CHECK FOR DUPLICATE PO NUMBER (Postgres error code 23505)
    if (err.code === "23505") {
      console.error("DUPLICATE PO ATTEMPTED:", po_number);
      return res.status(409).json({
        error: `The PO Number "${po_number}" is already taken. Please use a unique number.`,
      });
    }

    console.error("PO CREATION TRANSACTION ERROR:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error during PO creation." });
  } finally {
    client.release();
  }
});

// GET: Fetch individual items for a specific PO (FIXED to include item_id)
app.get("/api/purchase-orders/:id/items", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      // Added item_id to the SELECT statement
      "SELECT item_id, item_name as name, category, unit, quantity, price FROM item_order WHERE po_id = $1",
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH PO ITEMS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch order items" });
  }
});

app.put("/api/purchase-orders/:id", async (req, res) => {
  const poId = req.params.id;
  const {
    customer_name,
    company,
    email,
    contact,
    address,
    status,
    total_price,
    items,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get the po_number from the main table (required for item_order)
    const poRefResult = await client.query(
      "SELECT po_number FROM purchase_order WHERE po_id = $1",
      [poId],
    );

    if (poRefResult.rows.length === 0) throw new Error("PO not found");
    const po_number = poRefResult.rows[0].po_number;

    // 2. Update the main PO record
    await client.query(
      `UPDATE purchase_order 
       SET customer_name=$1, company=$2, email=$3, contact=$4, address=$5, status=$6, total_price=$7 
       WHERE po_id=$8`,
      [
        customer_name,
        company,
        email,
        contact,
        address,
        status,
        total_price,
        poId,
      ],
    );

    // 3. Clear old items
    await client.query("DELETE FROM item_order WHERE po_id = $1", [poId]);

    // 4. Re-insert items with full schema compliance
    if (items && items.length > 0) {
      const itemQuery = `
        INSERT INTO item_order (po_id, po_number, item_id, item_name, category, unit, quantity, price) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

      for (const item of items) {
        await client.query(itemQuery, [
          poId,
          po_number,
          item.id,
          item.name,
          item.category || "General",
          item.unit || "pcs",
          item.qty,
          item.price,
        ]);
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "PO updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. NEW: PATCH ENDPOINTS FOR QUANTITY
// ==========================================

// BULK PATCH: Update multiple quantities at once
app.patch("/api/inventory/bulk", async (req, res) => {
  const { items } = req.body; // Expects an array of { id, quantity }
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
    res.json({ message: "Bulk update successful" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("BULK UPDATE ERROR:", err.message);
    res.status(500).json({ error: "Failed to update items" });
  } finally {
    client.release();
  }
});

// SINGLE PATCH: Update a single item's quantity
app.patch("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    await pool.query("UPDATE inventory SET quantity = $1 WHERE item_id = $2", [
      quantity,
      id,
    ]);
    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error("PATCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. RAW MATERIALS & LEFTOVERS
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
// 5. JOB ORDER SYSTEM
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
