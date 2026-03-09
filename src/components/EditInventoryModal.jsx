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
import { Close } from "@mui/icons-material";

const categories = ["Plastic", "Injection", "Paper", "Trading"];
const units = ["Pieces", "Bundle", "Box"];

export default function EditInventoryModal({
  open,
  handleClose,
  mode,
  itemData,
}) {
  const [formData, setFormData] = useState({
    item_name: "", // Added item_name
    category: "",
    uom: "",
    minStock: "",
  });

  useEffect(() => {
    if (itemData) {
      setFormData({
        item_name: itemData.name || "", // Syncing with 'name' from table row
        category: itemData.category || "",
        uom: itemData.uom || "",
        minStock: itemData.minStock || 5,
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
            Product ID: {itemData?.id}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Item Name Field - Replaced Quantity */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>

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

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Min Stock Level"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              helperText="Threshold for low stock alerts"
              sx={fieldStyle}
            />
          </Grid>
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
