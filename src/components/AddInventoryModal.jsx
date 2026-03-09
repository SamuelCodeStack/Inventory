import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Grid,
  Typography,
  MenuItem,
} from "@mui/material";
import { Close } from "@mui/icons-material";

// Options for dropdowns
const categories = ["Plastic", "Injection", "Paper", "Trading"];
const units = ["Pieces", "B undle", "Boxes"]; // Added Unit options

export default function AddInventoryModal({ open, handleClose, mode }) {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "Plastic",
    units_of_measure: "Pieces", // Default value set
    quantity: "",
    mininum_stock: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Saving to Database:", formData);
    handleClose();
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: mode === "light" ? "#fff" : "rgba(255, 255, 255, 0.03)",
      borderRadius: 2,
    },
    "& .MuiInputLabel-root": {
      color: "text.secondary",
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
          borderRadius: 4,
          backgroundImage: "none",
          bgcolor: "background.paper",
          boxShadow:
            mode === "light"
              ? "0px 10px 40px rgba(0,0,0,0.1)"
              : "0px 10px 40px rgba(0,0,0,0.6)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          Add New Item
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          borderColor:
            mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
          py: 3,
        }}
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Name"
              name="item_name"
              placeholder="Enter product name"
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>

          {/* Row 2: Category Dropdown */}
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
              {categories.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Row 2: Unit of Measure Dropdown */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              select // Changed to select
              label="Unit of Measure"
              name="units_of_measure"
              value={formData.units_of_measure}
              onChange={handleChange}
              sx={fieldStyle}
            >
              {units.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Initial Quantity"
              name="quantity"
              placeholder="0"
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Stock Level"
              name="mininum_stock"
              placeholder="Threshold for alerts"
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          sx={{
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            bgcolor: "primary.main",
            borderRadius: 2,
            px: 4,
            py: 1,
            textTransform: "none",
            fontWeight: "bold",
            boxShadow: "0px 4px 12px rgba(241, 145, 73, 0.3)",
            "&:hover": { bgcolor: "#d87d3a" },
          }}
        >
          Add to Inventory
        </Button>
      </DialogActions>
    </Dialog>
  );
}
