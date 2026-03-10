import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  MenuItem,
  Grid, // Use the standard Grid
} from "@mui/material";
import { Close } from "@mui/icons-material";

const categories = ["Plastic", "Injection", "Paper", "Trading"];
const units = ["Pieces", "Bundle", "Boxes"];

export default function AddInventoryModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
}) {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Plastic",
    unit: "Pieces",
    quantity: 0,
    minimum_stock: 10,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert numbers correctly for the DB
    setFormData({
      ...formData,
      [name]:
        name === "quantity" || name === "minimum_stock"
          ? parseInt(value) || 0
          : value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.item_name) return alert("Item name is required");

    try {
      const response = await fetch("http://localhost:3000/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSaveSuccess();
        setFormData({
          item_name: "",
          category: "Plastic",
          unit: "Pieces",
          quantity: 0,
          minimum_stock: 10,
        });
      } else {
        const errorData = await response.json();
        alert("Server Error: " + errorData.error);
      }
    } catch (error) {
      alert("Network Error: Could not connect to server.");
    }
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: mode === "light" ? "#fff" : "rgba(255, 255, 255, 0.03)",
      borderRadius: 2,
    },
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Add New Item
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Item Name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              sx={fieldStyle}
            >
              {categories.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              select
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              sx={fieldStyle}
            >
              {units.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              type="number"
              label="Initial Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              type="number"
              label="Min Stock Level"
              name="minimum_stock"
              value={formData.minimum_stock}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ bgcolor: "primary.main", fontWeight: "bold" }}
        >
          Add to Inventory
        </Button>
      </DialogActions>
    </Dialog>
  );
}
