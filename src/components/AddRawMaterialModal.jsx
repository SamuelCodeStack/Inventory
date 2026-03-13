import React, { useState } from "react";
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
import { Close, Inventory2 } from "@mui/icons-material";

const categories = ["Plastic", "Injection", "Paper", "Metals", "Trading"];
const units = ["Pieces", "Bundle", "Boxes", "kg", "L"];

export default function AddRawMaterialModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
}) {
  const [formData, setFormData] = useState({
    material_name: "",
    category: "Plastic",
    unit: "Pieces",
    stock: 0,
    min_stock: 10,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "stock" || name === "min_stock"
          ? parseFloat(value) || 0
          : value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.material_name) return alert("Material name is required");

    try {
      const response = await fetch("http://localhost:3000/api/raw-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSaveSuccess(); // This triggers the fetch in the parent component
        handleReset();
      } else {
        // If the response is not ok, try to read the error message
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown Server Error" }));
        alert("Error: " + errorData.error);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert(
        "Network Error: Make sure your backend server is running on port 3000.",
      );
    }
  };

  const handleReset = () => {
    setFormData({
      material_name: "",
      category: "Plastic",
      unit: "Pieces",
      stock: 0,
      min_stock: 10,
    });
    handleClose();
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
      onClose={handleReset}
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
          <Inventory2 sx={{ color: "#f2994a" }} />
          <Typography variant="h6" fontWeight="bold">
            Add New Raw Material
          </Typography>
        </Box>
        <IconButton onClick={handleReset} size="small">
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
              placeholder="e.g. PP Resin Grade A"
              value={formData.material_name}
              onChange={handleChange}
              sx={fieldStyle}
              autoFocus
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
              label="Unit of Measure"
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
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Initial Stock Quantity"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              sx={fieldStyle}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Alert Level (Min Stock)"
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
          onClick={handleReset}
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
          Save Material
        </Button>
      </DialogActions>
    </Dialog>
  );
}
