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
    name: "",
    category: "Plastic",
    uom: "Pieces",
    minStock: 10,
    price: 0,
  });

  useEffect(() => {
    if (itemData) {
      setFormData({
        name: itemData.name || "",
        category: itemData.category || "Plastic",
        uom: itemData.uom || "Pieces",
        minStock: itemData.minStock || 10,
        price: itemData.price || 0,
      });
    }
  }, [itemData]);

  // --- LOGIC: CHECK IF ANYTHING CHANGED ---
  const isUnchanged =
    itemData &&
    formData.name === (itemData.name || "") &&
    formData.category === (itemData.category || "Plastic") &&
    formData.uom === (itemData.uom || "Pieces") &&
    formData.minStock === (itemData.minStock || 10) &&
    formData.price === (itemData.price || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;
    if (name === "name") {
      updatedValue = value.slice(0, 100); // VARCHAR(100)
    } else if (name === "minStock") {
      updatedValue = Math.max(0, parseInt(value, 10) || 0); // INTEGER >= 0
    } else if (name === "price") {
      updatedValue = Math.max(0, parseFloat(value) || 0); // DECIMAL >= 0
    }

    setFormData({
      ...formData,
      [name]: updatedValue,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        // `http://localhost:3000/api/inventory/${itemData.id}`,
        `${import.meta.env.VITE_API_URL}/inventory/${itemData.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Required to send session cookies for activity logs
          body: JSON.stringify({
            ...formData,
            quantity: itemData.quantity,
          }),
        },
      );

      if (response.ok) {
        onSaveSuccess();
        handleClose();
      } else {
        alert("Update Error: Check backend console.");
      }
    } catch (error) {
      alert("Network Error: Could not connect to server.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
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
              name="name"
              value={formData.name}
              inputProps={{ maxLength: 100 }} // VARCHAR(100) limit
              onChange={handleChange}
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
              name="uom"
              value={formData.uom}
              onChange={handleChange}
            >
              {units.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Stock Level"
              name="minStock"
              value={formData.minStock}
              inputProps={{ min: 0, step: "1" }} // INTEGER limit rules
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Price"
              name="price"
              value={formData.price}
              inputProps={{ min: 0, step: "0.01" }} // DECIMAL limit rules
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUnchanged} // --- DISABLED IF NO CHANGES ---
          sx={{
            fontWeight: "bold",
            // Optional: add a visual cue that it's disabled via styling if needed
          }}
        >
          Update Item
        </Button>
      </DialogActions>
    </Dialog>
  );
}
