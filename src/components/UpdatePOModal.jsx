import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  InputAdornment,
  MenuItem,
  Divider,
  Chip,
} from "@mui/material";
import { Close, Search, Person, ShoppingCart } from "@mui/icons-material";

// Sample Inventory Data
const inventoryItems = [
  {
    id: 1,
    name: "Macbook Pro M1",
    available: 120,
    unit: "pcs",
    category: "Electronics",
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    available: 230,
    unit: "pcs",
    category: "Accessories",
  },
  {
    id: 3,
    name: "Wired Mouse",
    available: 1230,
    unit: "pcs",
    category: "Accessories",
  },
  {
    id: 4,
    name: "Titan Watch",
    available: 600,
    unit: "units",
    category: "Wearables",
  },
];

// Renamed from remarkOptions
const statusOptions = ["Job Order", "Pending", "Done"];

export default function UpdatePOModal({ open, handleClose, mode, poData }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    contact: "",
    status: "Job Order", // Renamed from remark
    totalPrice: "",
  });

  // Sync state when poData is passed
  useEffect(() => {
    if (poData) {
      setFormData({
        customerName: poData.customerName || "",
        email: poData.email || "",
        contact: poData.contact || "",
        status: poData.status || poData.remark || "Job Order", // Handles both naming conventions
        totalPrice: poData.totalPrice || "",
      });
      setSelectedItems(poData.items || []);
    }
  }, [poData]);

  const handleToggleItem = (itemId) => {
    const currentIndex = selectedItems.indexOf(itemId);
    const newChecked = [...selectedItems];
    if (currentIndex === -1) {
      newChecked.push(itemId);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setSelectedItems(newChecked);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: mode === "light" ? "#fff" : "rgba(255, 255, 255, 0.03)",
      borderRadius: 2,
    },
  };

  const tableHeaderStyle = {
    fontWeight: "bold",
    bgcolor: mode === "light" ? "action.hover" : "rgba(255,255,255,0.05)",
  };

  const handleSubmit = () => {
    const finalData = { ...formData, selectedItems };
    console.log("Updating PO ID:", poData?.id, finalData);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
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
            Update Purchase Order
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PO Number: {poData?.poNumber || poData?.id}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {/* Section 1: Customer Information */}
        <Typography
          variant="subtitle2"
          color="primary"
          fontWeight="bold"
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Person fontSize="small" /> Customer Details
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Contact Number"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Section 2: Order Information & Status */}
        <Typography
          variant="subtitle2"
          color="primary"
          fontWeight="bold"
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          <ShoppingCart fontSize="small" /> Order Specifications
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status" // Renamed Label
              name="status" // Renamed Name
              value={formData.status}
              onChange={handleChange}
              sx={fieldStyle}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Total Order Amount"
              name="totalPrice"
              type="number"
              value={formData.totalPrice}
              onChange={handleChange}
              sx={fieldStyle}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Section 3: Item Selection Table */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            Select Items
          </Typography>
          <TextField
            size="small"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250, ...fieldStyle }}
          />
        </Box>

        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            maxHeight: 300,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={tableHeaderStyle}>
                  <Checkbox size="small" />
                </TableCell>
                <TableCell sx={tableHeaderStyle}>Item Name</TableCell>
                <TableCell sx={tableHeaderStyle}>Category</TableCell>
                <TableCell sx={tableHeaderStyle}>Unit</TableCell>
                <TableCell align="right" sx={tableHeaderStyle}>
                  Quantity
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryItems
                .filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    selected={selectedItems.indexOf(item.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedItems.indexOf(item.id) !== -1}
                        onChange={() => handleToggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Available: {item.available}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        disabled={selectedItems.indexOf(item.id) === -1}
                        defaultValue={1}
                        sx={{
                          width: 70,
                          "& .MuiInputBase-input": {
                            py: 0.5,
                            textAlign: "center",
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
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
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
