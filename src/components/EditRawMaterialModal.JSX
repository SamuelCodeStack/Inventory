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
  const [existingItems, setExistingItems] = useState([]); // { id, name, category }[]
  const [duplicateError, setDuplicateError] = useState("");

  // Fetch existing raw materials for duplicate validation
  useEffect(() => {
    if (!open) return;
    const fetchExisting = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/raw-materials`,
          { credentials: "include" },
        );
        if (res.ok) {
          const data = await res.json();
          setExistingItems(
            data
              .filter((item) => item.material_name)
              .map((item) => ({
                id: String(item.material_id),
                name: item.material_name.trim().toLowerCase(),
                category: item.category?.trim().toLowerCase(),
              })),
          );
        }
      } catch (e) {
        console.error("Failed to fetch existing raw materials:", e);
      }
    };
    fetchExisting();
  }, [open]);

  // Pre-fill form when itemData changes
  useEffect(() => {
    if (itemData) {
      setFormData({
        material_name: itemData.material_name || "",
        category: itemData.category || "Paper",
        unit: itemData.unit || "KG",
        minimum_stock: itemData.minimum_stock ?? 0,
      });
      setDuplicateError("");
    }
  }, [itemData]);

  // Check duplicate whenever name or category changes — exclude the current item
  useEffect(() => {
    if (!formData.material_name.trim() || !formData.category) {
      setDuplicateError("");
      return;
    }
    const cleanName = formData.material_name.trim().toLowerCase();
    const cleanCat = formData.category.trim().toLowerCase();
    const currentId = itemData ? String(itemData.material_id) : null;

    const conflict = existingItems.find(
      (item) =>
        item.name === cleanName &&
        item.category === cleanCat &&
        item.id !== currentId,
    );

    if (conflict) {
      setDuplicateError(
        `"${formData.material_name.trim()}" in ${formData.category} already exists in system records.`,
      );
    } else {
      setDuplicateError("");
    }
  }, [formData.material_name, formData.category, existingItems, itemData]);

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
    if (duplicateError) return;
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
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Material Name */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Material Name"
              name="material_name"
              value={formData.material_name}
              inputProps={{ maxLength: 100 }}
              error={formData.material_name.length > 100 || !!duplicateError}
              helperText={
                formData.material_name.length > 100
                  ? "Maximum 100 characters"
                  : duplicateError
              }
              onChange={handleChange}
              size="small"
              autoFocus
            />
          </Grid>

          {/* Category */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              error={!!duplicateError}
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

          {/* Unit */}
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

          {/* Min Stock */}
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
            !!duplicateError ||
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
