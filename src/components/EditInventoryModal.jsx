import React, { useState, useEffect } from "react";
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
  Grid,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const categories = ["Plastic", "Injection", "Paper", "Trading"];
const units = ["Pieces", "Bundle", "Boxes"];

export default function EditInventoryModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
  itemData,
}) {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Plastic",
    unit: "Pieces",
    minimum_stock: 10, // Fixed spelling
  });

  useEffect(() => {
    if (itemData) {
      setFormData({
        item_name: itemData.name || "",
        category: itemData.category || "Plastic",
        unit: itemData.uom || "Pieces",
        minimum_stock: itemData.minStock || 10,
      });
    }
  }, [itemData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "minimum_stock" ? parseInt(value) || 0 : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/inventory/${itemData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            quantity: itemData.quantity,
          }),
        },
      );

      if (response.ok) {
        // 1. Refresh the data in the parent component
        onSaveSuccess();

        // 2. Close this modal
        handleClose();
      } else {
        const errorData = await response.json();
        alert("Update Error: " + errorData.error);
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
          Edit Item Details
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={6}>
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
          <Grid item xs={6}>
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
          <Grid item xs={12}>
            {/* Expanded to full width since Quantity is gone */}
            <TextField
              fullWidth
              type="number"
              label="Minimum Stock Level"
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
          sx={{ fontWeight: "bold" }}
        >
          Update Item
        </Button>
      </DialogActions>
    </Dialog>
  );
}
