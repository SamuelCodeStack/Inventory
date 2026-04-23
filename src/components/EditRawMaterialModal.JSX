import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  IconButton,
  Typography,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const BASE_UNITS = ["KG", "ML", "L", "M", "CM", "GRAMS"];
const PACKAGING_OPTIONS = [
  "Sacks",
  "Bottles",
  "Rolls",
  "Pcs",
  "Drums",
  "Boxes",
  "Gallon",
  "Bundle",
  "Pail",
];

// --- CATEGORY OPTIONS ---
const CATEGORIES = ["Paper", "Plastic", "Injection", "Trading"];

export default function EditRawMaterialModal({
  open,
  handleClose,
  itemData,
  onSaveSuccess,
  mode,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Paper",
    measurementValue: "",
    measurementUnit: "KG",
    packaging: "Sacks",
    minStock: "",
  });

  // Sync state when itemData changes
  useEffect(() => {
    if (itemData) {
      setFormData({
        name: itemData.name || "",
        category: itemData.category || "Paper",
        measurementValue: itemData.measurementValue || 0,
        measurementUnit: itemData.measurementUnit || "KG",
        packaging: itemData.packaging || "Sacks",
        minStock: itemData.minStock || 0,
      });
    }
  }, [itemData]);

  // --- LOGIC: CHECK IF ANYTHING CHANGED ---
  const isUnchanged =
    itemData &&
    formData.name === (itemData.name || "") &&
    formData.category === (itemData.category || "Paper") &&
    formData.measurementValue === (itemData.measurementValue || 0) &&
    formData.measurementUnit === (itemData.measurementUnit || "KG") &&
    formData.packaging === (itemData.packaging || "Sacks") &&
    formData.minStock === (itemData.minStock || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "measurementValue" || name === "minStock"
          ? parseFloat(value) || 0
          : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        // `http://localhost:3000/api/raw-materials/${itemData.id}`,
        `${import.meta.env.VITE_API_URL}/raw-materials/${itemData.id}`,
        {
          method: "PUT",
          credentials: "include", // Required to send session cookies for activity logs
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            measurementValue: formData.measurementValue,
            measurementUnit: formData.measurementUnit,
            packaging: formData.packaging,
            minStock: formData.minStock,
            // Keeping current quantity unchanged during standard edit
            quantity: itemData.quantity,
          }),
        },
      );

      if (response.ok) {
        onSaveSuccess();
        handleClose();
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Edit Raw Material Details
        </Typography>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Material Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              size="small"
            />
          </Grid>

          {/* --- UPDATED CATEGORY DROPDOWN --- */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              size="small"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Measurement Specs */}
          <Grid item xs={7}>
            <TextField
              fullWidth
              type="number"
              label="Measurement Value"
              name="measurementValue"
              value={formData.measurementValue}
              onChange={handleChange}
              size="small"
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              select
              fullWidth
              label="Unit"
              name="measurementUnit"
              value={formData.measurementUnit}
              onChange={handleChange}
              size="small"
            >
              {BASE_UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Packaging Type */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Packaging Type"
              name="packaging"
              value={formData.packaging}
              onChange={handleChange}
              size="small"
            >
              {PACKAGING_OPTIONS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Alert Logic */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Low Stock Alert Threshold"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUnchanged || !formData.name} // --- DISABLED IF NO CHANGES ---
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Update Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}
