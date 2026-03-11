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
  Grid, // Using Grid2 for the latest MUI standards
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  MenuItem,
  Divider,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  Close,
  Person,
  ShoppingCart,
  DeleteOutline,
  Search,
} from "@mui/icons-material";

const statusOptions = ["Job Order", "Pending", "Done"];

export default function CreatePOModal({
  open,
  handleClose,
  mode,
  onSaveSuccess,
}) {
  // --- DATABASE DATA STATE ---
  const [dbInventory, setDbInventory] = useState([]);

  // --- FORM STATE ---
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    company: "",
    email: "",
    contact: "",
    address: "",
    poNumber: "",
    status: "Job Order",
    totalPrice: 0,
  });

  // 1. Fetch Inventory when Modal opens
  useEffect(() => {
    if (open) {
      fetch("http://localhost:3000/api/inventory")
        .then((res) => res.json())
        .then((data) => setDbInventory(data))
        .catch((err) => console.error("Error fetching inventory:", err));
    }
  }, [open]);

  // 2. Auto-calculate Total Price whenever selectedItems change
  useEffect(() => {
    const calculated = selectedItems.reduce(
      (sum, item) => sum + item.qty * (item.price || 0),
      0,
    );
    setFormData((prev) => ({ ...prev, totalPrice: calculated }));
  }, [selectedItems]);

  const handleToggleItem = (item) => {
    const currentIndex = selectedItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) {
      setSelectedItems([
        ...selectedItems,
        { ...item, qty: 1, price: item.price || 0 },
      ]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, [field]: parseFloat(value) || 0 }
          : item,
      ),
    );
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const payload = {
      customer_name: formData.customerName,
      company: formData.company,
      email: formData.email,
      contact: formData.contact,
      address: formData.address,
      po_number: formData.poNumber,
      status: formData.status,
      total_price: formData.totalPrice,
      items: selectedItems,
    };

    try {
      const response = await fetch(
        "http://localhost:3000/api/purchase-orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        onSaveSuccess();
        handleReset();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Network error. Could not save order.");
    }
  };

  const handleReset = () => {
    setSelectedItems([]);
    setFormData({
      customerName: "",
      company: "",
      email: "",
      contact: "",
      address: "",
      poNumber: "",
      status: "Job Order",
      totalPrice: 0,
    });
    setSearchQuery("");
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
      onClose={handleReset}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Create New Purchase Order
        <IconButton onClick={handleReset} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* LEFT SIDE: INPUT FORM & INVENTORY */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight="bold"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Person fontSize="small" /> Customer & Business Info
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Number"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="PO Number"
                  name="poNumber"
                  placeholder="PO-2026-XXX"
                  value={formData.poNumber}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  sx={fieldStyle}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                Select Items from Inventory
              </Typography>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: 220, ...fieldStyle }}
              />
            </Box>

            <TableContainer
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                maxHeight: 250,
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        bgcolor: "action.hover",
                        width: "100px",
                      }}
                    >
                      Item ID
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", bgcolor: "action.hover" }}
                    >
                      Item Name
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: "bold", bgcolor: "action.hover" }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dbInventory
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    )
                    .map((item) => {
                      const isChecked = selectedItems.some(
                        (i) => i.id === item.id,
                      );
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "monospace",
                              color: "text.secondary",
                            }}
                          >
                            {item.id}
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => handleToggleItem(item)}
                              color={isChecked ? "error" : "primary"}
                            >
                              {isChecked ? "Remove" : "Add"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* RIGHT SIDE: SUMMARY & QTY EDITING */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                p: 2,
                bgcolor:
                  mode === "light" ? "grey.50" : "rgba(255,255,255,0.02)",
                borderRadius: 3,
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <ShoppingCart fontSize="small" color="primary" /> Order Summary
              </Typography>

              <Box
                sx={{ flexGrow: 1, maxHeight: 400, overflow: "auto", mb: 2 }}
              >
                {selectedItems.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 4 }}
                  >
                    No items selected
                  </Typography>
                ) : (
                  selectedItems.map((item) => (
                    <Paper
                      key={`summary-${item.id}`}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "primary.main",
                            fontWeight: "bold",
                            fontSize: "0.65rem",
                          }}
                        >
                          ID: {item.id}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ pr: 4 }}
                        >
                          {item.name}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleToggleItem(item)}
                          sx={{ position: "absolute", top: 4, right: 4 }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Qty"
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(item.id, "qty", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Price"
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(item.id, "price", e.target.value)
                            }
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Box>

              <Box
                sx={{
                  p: 2,
                  bgcolor: "primary.main",
                  color: "white",
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption">Total Amount</Typography>
                <Typography variant="h5" fontWeight="900">
                  ₱{formData.totalPrice.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleReset} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            selectedItems.length === 0 ||
            !formData.customerName.trim() ||
            !formData.poNumber.trim()
          }
          sx={{ px: 4, fontWeight: "bold", borderRadius: 2 }}
        >
          Create Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
