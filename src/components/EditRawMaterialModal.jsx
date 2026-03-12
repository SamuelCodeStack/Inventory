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

const categories = ["Plastic", "Injection", "Paper", "Metals", "Trading"];
const units = ["Pieces", "Bundle", "Boxes", "kg", "L"];

export default function EditRawMaterialModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
  itemData, // This is the row object passed from RawMaterials.jsx
}) {
  const [formData, setFormData] = useState({
    material_name: "",
    category: "Plastic",
    unit: "Pieces",
    min_stock: 10,
  });

  // Sync modal state with the selected item when it opens
  useEffect(() => {
    if (itemData) {
      setFormData({
        material_name: itemData.material_name || "",
        category: itemData.category || "Plastic",
        unit: itemData.unit || "Pieces",
        min_stock: itemData.min_stock || 0,
      });
    }
  }, [itemData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "min_stock" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.material_name) return alert("Material name is required");

    try {
      const response = await fetch(
        `http://localhost:3000/api/raw-materials/${itemData.rm_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            stock: itemData.stock, // Keep existing stock level during detail edit
          }),
        },
      );

      if (response.ok) {
        onSaveSuccess();
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
      bgcolor: mode === "light" ? "#fff" : "rgba(255, 255, 255, 0.05)",
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
          Edit Raw Material
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
              label="Material Name"
              name="material_name"
              value={formData.material_name}
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
            <TextField
              fullWidth
              type="number"
              label="Minimum Stock Level (Alert Threshold)"
              name="min_stock"
              value={formData.min_stock}
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
          sx={{ fontWeight: "bold", px: 3 }}
        >
          Update Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
