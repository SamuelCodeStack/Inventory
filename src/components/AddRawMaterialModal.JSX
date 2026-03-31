import React, { useState } from "react";
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

const BASE_UNITS = ["KG", "ML", "L", "METER", "CM", "GRAMS"];
const QTY_UNITS = ["Sacks", "Bottles", "Rolls", "Pcs", "Drums", "Boxes"];

// --- CATEGORY OPTIONS ---
const CATEGORIES = ["Paper", "Plastic", "Injection", "Trading"];

export default function AddRawMaterialModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Paper", // Default value
    baseValue: "",
    baseUnit: "KG",
    qtyValue: "",
    qtyUnit: "Sacks",
    minStockThreshold: "",
    minStockTarget: "base",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      // const response = await fetch("http://localhost:3000/api/raw-materials", {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            baseValue: parseFloat(formData.baseValue) || 0,
            qtyValue: parseFloat(formData.qtyValue) || 0,
            minStockThreshold: parseFloat(formData.minStockThreshold) || 0,
          }),
        },
      );

      if (response.ok) {
        onSaveSuccess();
        handleReset();
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      category: "Paper",
      baseValue: "",
      baseUnit: "KG",
      qtyValue: "",
      qtyUnit: "Sacks",
      minStockThreshold: "",
      minStockTarget: "base",
    });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleReset}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        Add New Raw Material
        <IconButton onClick={handleReset}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Basic Info */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Material Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              size="small"
              placeholder="e.g. Lubricant Oil"
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
            <Divider sx={{ my: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  textTransform: "uppercase",
                }}
              >
                Inventory Values
              </Typography>
            </Divider>
          </Grid>

          {/* Base Measurement (KG/ML/M) */}
          <Grid item xs={7}>
            <TextField
              fullWidth
              type="number"
              label="Primary Measurement"
              name="baseValue"
              value={formData.baseValue}
              onChange={handleChange}
              size="small"
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              select
              fullWidth
              label="Unit"
              name="baseUnit"
              value={formData.baseUnit}
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

          {/* Qty Measurement (Sacks/Bottles) */}
          <Grid item xs={7}>
            <TextField
              fullWidth
              type="number"
              label="Quantity / Containers"
              name="qtyValue"
              value={formData.qtyValue}
              onChange={handleChange}
              size="small"
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              select
              fullWidth
              label="Packaging"
              name="qtyUnit"
              value={formData.qtyUnit}
              onChange={handleChange}
              size="small"
            >
              {QTY_UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  textTransform: "uppercase",
                }}
              >
                Monitoring Logic
              </Typography>
            </Divider>
          </Grid>

          {/* Alert Logic */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Alert Threshold"
              name="minStockThreshold"
              value={formData.minStockThreshold}
              onChange={handleChange}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Alert Target"
              name="minStockTarget"
              value={formData.minStockTarget}
              onChange={handleChange}
              size="small"
            >
              <MenuItem value="base">By {formData.baseUnit}</MenuItem>
              <MenuItem value="qty">By {formData.qtyUnit}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleReset} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !formData.name || !formData.baseValue || !formData.minStockThreshold
          }
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Save Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}
