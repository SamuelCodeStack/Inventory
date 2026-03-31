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

const BASE_UNITS = ["KG", "ML", "L", "METER", "CM", "GRAMS"];
const QTY_UNITS = ["Sacks", "Bottles", "Rolls", "Pcs", "Drums", "Boxes"];

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
    baseValue: "",
    baseUnit: "KG",
    qtyValue: "",
    qtyUnit: "Sacks",
    minStockThreshold: "",
    minStockTarget: "base",
  });

  // Sync state when itemData changes
  useEffect(() => {
    if (itemData) {
      setFormData({
        name: itemData.name || "",
        category: itemData.category || "Paper",
        baseValue: itemData.baseValue || 0,
        baseUnit: itemData.baseUnit || "KG",
        qtyValue: itemData.qtyValue || 0,
        qtyUnit: itemData.qtyUnit || "Sacks",
        minStockThreshold: itemData.minStockThreshold || 0,
        minStockTarget: itemData.minStockTarget || "base",
      });
    }
  }, [itemData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        // `http://localhost:3000/api/raw-materials/${itemData.id}`,
        `${import.meta.env.VITE_API_URL}/raw-materials/${itemData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            baseValue: parseFloat(formData.baseValue),
            baseUnit: formData.baseUnit,
            qtyValue: parseFloat(formData.qtyValue),
            qtyUnit: formData.qtyUnit,
            minStockThreshold: parseFloat(formData.minStockThreshold),
            minStockTarget: formData.minStockTarget,
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
        Edit Raw Material
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
            <Divider sx={{ my: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  textTransform: "uppercase",
                }}
              >
                Update Stock Levels
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={7}>
            <TextField
              fullWidth
              type="number"
              label={`Current ${formData.baseUnit}`}
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

          <Grid item xs={7}>
            <TextField
              fullWidth
              type="number"
              label={`Current ${formData.qtyUnit}`}
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
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.name}
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Update Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
