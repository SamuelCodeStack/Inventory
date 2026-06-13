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
  Divider,
  Stack,
} from "@mui/material";
import { Close, Delete, AddCircle, Save } from "@mui/icons-material";

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

export default function AddRawMaterialModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
}) {
  const emptyRow = {
    material_name: "",
    category: "Paper",
    unit: "KG",
    qty_: "",
    minimum_stock: "",
  };

  const [items, setItems] = useState([{ ...emptyRow }]);
  const [loading, setLoading] = useState(false);
  const [existingNames, setExistingNames] = useState([]);

  useEffect(() => {
    if (open) {
      const fetchExistingRawMaterials = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/raw-materials`,
            { credentials: "include" },
          );
          if (response.ok) {
            const data = await response.json();
            setExistingNames(
              data
                .filter((item) => item.material_name)
                .map((item) => item.material_name.trim().toLowerCase()),
            );
          }
        } catch (error) {
          console.error("Failed to fetch existing raw material names:", error);
        }
      };
      fetchExistingRawMaterials();
    }
  }, [open]);

  const checkDuplicateName = (nameValue, currentIndex) => {
    const cleanName = nameValue.trim().toLowerCase();
    if (!cleanName) return { exists: false, message: "" };

    if (existingNames.includes(cleanName)) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" already exists in system records.`,
      };
    }

    const duplicateInFormIndex = items.findIndex(
      (item, idx) =>
        idx !== currentIndex &&
        item.material_name.trim().toLowerCase() === cleanName,
    );
    if (duplicateInFormIndex !== -1) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" is duplicated in row ${duplicateInFormIndex + 1}.`,
      };
    }

    return { exists: false, message: "" };
  };

  const isInvalid = items.some(
    (item, index) =>
      !item.material_name.trim() ||
      item.material_name.length > 100 ||
      !item.unit ||
      !item.qty_ ||
      !item.minimum_stock ||
      checkDuplicateName(item.material_name, index).exists,
  );

  const addRow = () => setItems([...items, { ...emptyRow }]);

  const removeRow = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/bulk-add`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              material_name: item.material_name,
              category: item.category,
              unit: item.unit,
              qty_: parseFloat(item.qty_) || 0,
              minimum_stock: parseFloat(item.minimum_stock) || 0,
            })),
          }),
        },
      );
      if (response.ok) {
        onSaveSuccess();
        handleReset();
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setItems([{ ...emptyRow }]);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleReset}
      fullWidth
      maxWidth="md"
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
        Raw Materials Intake
        <IconButton onClick={handleReset}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "70vh" }}>
        <Stack spacing={4} divider={<Divider />}>
          {items.map((item, index) => {
            const validationStatus = checkDuplicateName(
              item.material_name,
              index,
            );
            return (
              <Box key={index} sx={{ pt: index === 0 ? 0 : 2 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  {/* Material Name */}
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Material Name"
                      value={item.material_name}
                      inputProps={{ maxLength: 100 }}
                      error={
                        item.material_name.length > 100 ||
                        validationStatus.exists
                      }
                      helperText={
                        item.material_name.length > 100
                          ? "Maximum 100 characters"
                          : validationStatus.message
                      }
                      onChange={(e) =>
                        handleChange(index, "material_name", e.target.value)
                      }
                      size="small"
                      placeholder="e.g. Lubricant Oil"
                      autoFocus={index === 0}
                    />
                  </Grid>

                  {/* Category */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Category"
                      value={item.category}
                      onChange={(e) =>
                        handleChange(index, "category", e.target.value)
                      }
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
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Unit"
                      value={item.unit}
                      onChange={(e) =>
                        handleChange(index, "unit", e.target.value)
                      }
                      size="small"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <MenuItem key={u} value={u}>
                          {u}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Initial Quantity */}
                  <Grid item xs={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Initial Stock Quantity"
                      value={item.qty_}
                      onChange={(e) =>
                        handleChange(index, "qty_", e.target.value)
                      }
                      size="small"
                    />
                  </Grid>

                  {/* Min Stock */}
                  <Grid item xs={6} md={items.length > 1 ? 3 : 4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Low Stock Alert Threshold"
                      value={item.minimum_stock}
                      onChange={(e) =>
                        handleChange(index, "minimum_stock", e.target.value)
                      }
                      size="small"
                    />
                  </Grid>

                  {/* Remove row button */}
                  {items.length > 1 && (
                    <Grid
                      item
                      xs={12}
                      md={1}
                      sx={{ textAlign: "right", pt: "6px !important" }}
                    >
                      <IconButton
                        color="error"
                        onClick={() => removeRow(index)}
                        disabled={items.length === 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<AddCircle />}
            onClick={addRow}
            sx={{ borderRadius: 2 }}
          >
            Add Another Material
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleReset} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading || isInvalid}
          sx={{ px: 4, fontWeight: "bold" }}
        >
          {loading ? "Saving..." : "Save All Materials"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
