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
  Box,
} from "@mui/material";
import { Close, EditNote } from "@mui/icons-material";

const categories = ["Plastic", "Injection", "Paper", "Metals", "Trading"];
const units = ["Pieces", "Bundle", "Boxes", "kg", "L"];

export default function EditRawMaterialModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
  itemData,
}) {
  const [formData, setFormData] = useState({
    material_name: "",
    category: "Plastic",
    unit: "Pieces",
    min_stock: 10,
  });

  // Sync modal state with the selected item when it opens
  useEffect(() => {
    if (itemData && open) {
      setFormData({
        material_name: itemData.material_name || "",
        category: itemData.category || "Plastic",
        unit: itemData.unit || "Pieces",
        min_stock: itemData.min_stock || 0,
      });
    }
  }, [itemData, open]);

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
          // We only update details; stock is managed via the main table or Job Orders
          body: JSON.stringify({
            ...formData,
            stock: itemData.stock,
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

  const isDark = mode === "dark";

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "#fff",
      borderRadius: 2,
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "rgba(255,255,255,0.7)" : "inherit",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
          bgcolor: isDark ? "#1e1e1e" : "#fff",
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <EditNote sx={{ color: "#f2994a" }} />
          <Typography variant="h6" fontWeight="bold">
            Edit Material Details
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
        }}
      >
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
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
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: isDark ? "#1e1e1e" : "#fff" }}>
        <Button
          onClick={handleClose}
          sx={{ color: "text.secondary", fontWeight: "bold" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            fontWeight: "bold",
            px: 4,
            borderRadius: 2,
            bgcolor: "#f2994a",
            color: "#000",
            "&:hover": { bgcolor: "#d8853a" },
          }}
        >
          Update Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
