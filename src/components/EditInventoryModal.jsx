import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Grid,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import { Close, WarningAmber } from "@mui/icons-material"; // Added icon for visual cue

const categories = ["Laptop", "Accessories", "Furniture", "Office Supplies"];
const units = ["Pieces", "Boxes", "Kilograms", "Sets"];

export default function EditInventoryModal({
  open,
  handleClose,
  mode,
  itemData,
}) {
  const [formData, setFormData] = useState({
    category: "",
    uom: "",
    quantity: "",
    minStock: "", // New state field
  });

  useEffect(() => {
    if (itemData) {
      setFormData({
        category: itemData.category || "",
        uom: itemData.uom || "",
        quantity: itemData.quantity || 0,
        minStock: itemData.minStock || 5, // Defaulting to 5 if not provided
      });
    }
  }, [itemData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Saving Changes for ID:", itemData.id, formData);
    handleClose();
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: mode === "light" ? "#fff" : "rgba(255, 255, 255, 0.03)",
      borderRadius: 2,
    },
  };

  // Logic to show a warning if current quantity is below min stock
  const isLowStock = Number(formData.quantity) <= Number(formData.minStock);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3, backgroundImage: "none" },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Edit Product
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {itemData?.name} (ID: {itemData?.id})
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
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

          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Unit of Measure"
              name="uom"
              value={formData.uom}
              onChange={handleChange}
              sx={fieldStyle}
            >
              {units.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Current Quantity */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Current Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>

          {/* Minimum Stock Level */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Min Stock Level"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              helperText="Alert threshold"
              sx={fieldStyle}
            />
          </Grid>

          {/* Dynamic Warning Message */}
          {isLowStock && (
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "warning.lighter", // Ensure your theme has 'lighter' or use 'rgba(237, 108, 2, 0.1)'
                  color: "warning.main",
                  border: "1px solid",
                  borderColor: "warning.light",
                }}
              >
                <WarningAmber fontSize="small" />
                <Typography variant="caption" fontWeight="bold">
                  Low stock alert: Quantity is at or below minimum level.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          sx={{ color: "text.secondary", textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            bgcolor: "primary.main",
            px: 4,
            textTransform: "none",
            fontWeight: "bold",
            "&:hover": { bgcolor: "#d87d3a" },
          }}
        >
          Update Item
        </Button>
      </DialogActions>
    </Dialog>
  );
}
