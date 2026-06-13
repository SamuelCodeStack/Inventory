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
  IconButton,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const UNIT_OPTIONS = [
  "KG",
  "Grams",
  "ML",
  "L",
  "M",
  "CM",
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

const CATEGORIES = ["Paper", "Plastic", "Injection", "Trading"];

export default function EditRawMaterialModal({
  open,
  handleClose,
  itemData,
  onSaveSuccess,
  mode,
}) {
  const [formData, setFormData] = useState({
    material_name: "",
    category: "Paper",
    unit: "KG",
    minimum_stock: 0,
  });

  useEffect(() => {
    if (itemData) {
      setFormData({
        material_name: itemData.material_name || "",
        category: itemData.category || "Paper",
        unit: itemData.unit || "KG",
        minimum_stock: itemData.minimum_stock ?? 0,
      });
    }
  }, [itemData]);

  const isUnchanged =
    itemData &&
    formData.material_name === (itemData.material_name || "") &&
    formData.category === (itemData.category || "Paper") &&
    formData.unit === (itemData.unit || "KG") &&
    String(formData.minimum_stock) === String(itemData.minimum_stock ?? 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "minimum_stock" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/${itemData.material_id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            material_name: formData.material_name,
            category: formData.category,
            unit: formData.unit,
            minimum_stock: formData.minimum_stock,
            qty_: itemData.qty_,
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
      disableScrollLock
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
    >
      {/*
        FIX 1: DialogTitle renders as <h2> by default AND internally wraps
        children in <Typography variant="h6"> → <h6>, causing h2>h6 nesting.
        Adding component="div" overrides the outer tag to <div>, eliminating
        the invalid nesting entirely.
      */}
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: "1.1rem",
          py: 2,
          px: 3,
        }}
      >
        Edit Raw Material Details
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/*
          FIX 2: Grid v2 removed xs/sm/md/item props.
          Use size={{ xs: N, sm: N }} instead of item xs={N} sm={N}.
        */}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Material Name"
              name="material_name"
              value={formData.material_name}
              inputProps={{ maxLength: 100 }}
              error={formData.material_name.length > 100}
              helperText={
                formData.material_name.length > 100
                  ? "Maximum 100 characters"
                  : ""
              }
              onChange={handleChange}
              size="small"
              autoFocus
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
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

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              size="small"
            >
              {UNIT_OPTIONS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              type="number"
              label="Low Stock Alert Threshold"
              name="minimum_stock"
              value={formData.minimum_stock}
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
          disabled={
            isUnchanged ||
            !formData.material_name ||
            formData.material_name.length > 100
          }
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Update Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}
