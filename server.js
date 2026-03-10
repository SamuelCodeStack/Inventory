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

// GET: Fetch all inventory items
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM inventory ORDER BY item_id ASC",
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
    console.error("!!! BACKEND ERROR !!!", err.message);
    // Return empty array so frontend .filter() doesn't break
    res.status(500).json([]);
  }
});

// POST: Add a new item
app.post("/api/inventory", async (req, res) => {
  // Destructure the names exactly as sent from React
  const { item_name, category, unit, quantity, minimum_stock } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO inventory (item_name, category, unit, quantity, minimum_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name, category, unit, quantity, minimum_stock || 10],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT: Full update (Required for the Edit Modal)
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
    console.error("PUT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Update only the quantity (inline table edit)
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
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

// DELETE: Remove item
app.delete("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM inventory WHERE item_id = $1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
