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
  FormControlLabel,
  Checkbox,
  Paper,
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
    hasMeasurement: false,
    measurementValue: "",
    measurementUnit: "KG",
    packaging: "Sacks",
    minStock: "",
  });

  // Sync state when itemData changes
  useEffect(() => {
    if (itemData) {
      const hasMeas = !!(itemData.measurementValue || itemData.measurementUnit);
      setFormData({
        name: itemData.name || "",
        category: itemData.category || "Paper",
        hasMeasurement: hasMeas,
        measurementValue: itemData.measurementValue || "",
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
    formData.hasMeasurement ===
      !!(itemData.measurementValue || itemData.measurementUnit) &&
    (!formData.hasMeasurement ||
      formData.measurementValue === (itemData.measurementValue || 0)) &&
    (!formData.hasMeasurement ||
      formData.measurementUnit === (itemData.measurementUnit || "KG")) &&
    formData.packaging === (itemData.packaging || "Sacks") &&
    formData.minStock === (itemData.minStock || 0);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : name === "measurementValue" || name === "minStock"
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
            measurementValue: formData.hasMeasurement
              ? formData.measurementValue
              : null,
            measurementUnit: formData.hasMeasurement
              ? formData.measurementUnit
              : null,
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
          {/* Group 1: Core Identification (Top Priority Focus) */}
          <Grid item xs={12}>
            <Paper component="div" elevation={0}>
              <TextField
                fullWidth
                label="Material Name"
                name="name"
                value={formData.name}
                inputProps={{ maxLength: 100 }}
                error={formData.name.length > 100}
                helperText={
                  formData.name.length > 100 ? "Maximum 100 characters" : ""
                }
                onChange={handleChange}
                size="small"
                autoFocus
              />
            </Paper>
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

          {/* Group 2: Material Specifications & Dimensions */}
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

          {/* Toggle Measurement Controls */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="hasMeasurement"
                  checked={formData.hasMeasurement}
                  onChange={handleChange}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Requires Measurement Specs
                </Typography>
              }
            />
          </Grid>

          {/* Measurement Specs */}
          {formData.hasMeasurement && (
            <>
              <Grid item xs={7}>
                <Paper component="div" elevation={0}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Measurement Value"
                    name="measurementValue"
                    value={formData.measurementValue}
                    onChange={handleChange}
                    size="small"
                  />
                </Paper>
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
            </>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Group 3: Stock Management Configuration */}
          {/* Alert Logic */}
          <Grid item xs={12}>
            <Paper component="div" elevation={0}>
              <TextField
                fullWidth
                type="number"
                label="Low Stock Alert Threshold"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                size="small"
              />
            </Paper>
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
          disabled={
            isUnchanged ||
            !formData.name ||
            formData.name.length > 100 ||
            formData.category.length > 15 ||
            (formData.hasMeasurement && formData.measurementUnit.length > 15) ||
            formData.packaging.length > 15
          } // --- DISABLED IF NO CHANGES ---
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Update Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}
