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
  Stack,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Close, Delete, AddCircle, Save } from "@mui/icons-material";

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

export default function AddRawMaterialModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
}) {
  const emptyRow = {
    name: "",
    category: "Paper",
    hasMeasurement: false,
    measurementValue: "",
    measurementUnit: "KG",
    packaging: "Sacks",
    quantity: "",
    minStock: "",
  };

  const [items, setItems] = useState([{ ...emptyRow }]);
  const [loading, setLoading] = useState(false);
  // State added to store existing raw material names fetched from backend records
  const [existingNames, setExistingNames] = useState([]);

  // Fetch data rows from raw-materials table on initial mount sequences to cross-validate strings
  useEffect(() => {
    if (open) {
      const fetchExistingRawMaterials = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/raw-materials`,
            {
              credentials: "include",
            },
          );
          if (response.ok) {
            const data = await response.json();
            const names = data.map((item) => item.name.trim().toLowerCase());
            setExistingNames(names);
          }
        } catch (error) {
          console.error("Failed to fetch existing raw material names:", error);
        }
      };
      fetchExistingRawMaterials();
    }
  }, [open]);

  // Evaluates input criteria case-insensitively across local state allocations and cloud registries
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
        idx !== currentIndex && item.name.trim().toLowerCase() === cleanName,
    );
    if (duplicateInFormIndex !== -1) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" is duplicated in row ${duplicateInFormIndex + 1}.`,
      };
    }

    return { exists: false, message: "" };
  };

  // --- VALIDATION LOGIC ---
  const isInvalid = items.some(
    (item, index) =>
      !item.name.trim() ||
      item.name.length > 100 ||
      item.category.length > 15 ||
      (item.hasMeasurement && item.measurementUnit.length > 15) ||
      item.packaging.length > 15 ||
      (item.hasMeasurement && !item.measurementValue) ||
      !item.quantity ||
      !item.minStock ||
      checkDuplicateName(item.name, index).exists,
  );

  const addRow = () => setItems([...items, { ...emptyRow }]);

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
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
          credentials: "include", // Required to send session cookies for activity logs
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              ...item,
              measurementValue: item.hasMeasurement
                ? parseFloat(item.measurementValue) || 0
                : null,
              measurementUnit: item.hasMeasurement
                ? item.measurementUnit
                : null,
              quantity: parseFloat(item.quantity) || 0,
              minStock: parseFloat(item.minStock) || 0,
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
      maxWidth="md" // Increased to md to better fit the bulk layout
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
        Raw Materials Intake
        <IconButton onClick={handleReset}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "70vh" }}>
        <Stack spacing={4} divider={<Divider />}>
          {items.map((item, index) => {
            const validationStatus = checkDuplicateName(item.name, index);
            return (
              <Box key={index} sx={{ pt: index === 0 ? 0 : 2 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  {/* Identity Block - Top Field Focus Group */}
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Material Name"
                      value={item.name}
                      inputProps={{ maxLength: 100 }}
                      error={item.name.length > 100 || validationStatus.exists}
                      helperText={
                        item.name.length > 100
                          ? "Maximum 100 characters"
                          : validationStatus.message
                      }
                      onChange={(e) =>
                        handleChange(index, "name", e.target.value)
                      }
                      size="small"
                      placeholder="e.g. Lubricant Oil"
                      autoFocus={index === 0}
                    />
                  </Grid>

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

                  {/* Logistics & Structural Attributes Row */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Packaging"
                      value={item.packaging}
                      onChange={(e) =>
                        handleChange(index, "packaging", e.target.value)
                      }
                      size="small"
                    >
                      {PACKAGING_OPTIONS.map((u) => (
                        <MenuItem key={u} value={u}>
                          {u}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={6} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Initial Stock Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(index, "quantity", e.target.value)
                      }
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={6} md={items.length > 1 ? 3 : 4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Low Stock Alert Threshold"
                      value={item.minStock}
                      onChange={(e) =>
                        handleChange(index, "minStock", e.target.value)
                      }
                      size="small"
                    />
                  </Grid>

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

                  {/* Toggle Measurement Controls */}
                  <Grid item xs={12} sx={{ mt: -0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.hasMeasurement}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "hasMeasurement",
                              e.target.checked,
                            )
                          }
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

                  {/* Measurement Conditional Sub-fields */}
                  {item.hasMeasurement && (
                    <>
                      <Grid item xs={6} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Measurement Value"
                          value={item.measurementValue}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "measurementValue",
                              e.target.value,
                            )
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          select
                          fullWidth
                          label="Unit"
                          value={item.measurementUnit}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "measurementUnit",
                              e.target.value,
                            )
                          }
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
