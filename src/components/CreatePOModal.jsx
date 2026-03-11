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
  Typography,
  MenuItem,
  Divider,
  Paper,
  InputAdornment,
  Snackbar,
  Alert,
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
  // --- STATE ---
  const [dbInventory, setDbInventory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Snackbar State
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success", // "success" | "error" | "warning" | "info"
  });

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

  // 1. Fetch Inventory
  useEffect(() => {
    if (open) {
      fetch("http://localhost:3000/api/inventory")
        .then((res) => res.json())
        .then((data) => setDbInventory(data))
        .catch((err) => {
          showNotification("Failed to load inventory", "error");
        });
    }
  }, [open]);

  // 2. Auto-calculate Total Price
  useEffect(() => {
    const calculated = selectedItems.reduce(
      (sum, item) => sum + item.qty * (item.price || 0),
      0,
    );
    setFormData((prev) => ({ ...prev, totalPrice: calculated }));
  }, [selectedItems]);

  // --- HANDLERS ---
  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
  };

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

      const data = await response.json();

      if (response.ok) {
        // Success!
        onSaveSuccess();
        handleReset();
        // Note: You might want to show the success snackbar on the parent dashboard
        // after the modal closes, but we'll show it here for immediate feedback.
      } else {
        // Duplicate PO or DB error caught by backend
        showNotification(data.error || "Failed to create order", "error");
      }
    } catch (error) {
      showNotification("Network error. Please check your connection.", "error");
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
    <>
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
            {/* LEFT SIDE: INPUT FORM */}
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
                <Typography
                  variant="subtitle2"
                  color="primary"
                  fontWeight="bold"
                >
                  Select Items
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
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
                          bgcolor:
                            mode === "light" ? "action.hover" : "#1e1e1e",
                        }}
                      >
                        Item
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: "bold",
                          bgcolor:
                            mode === "light" ? "action.hover" : "#1e1e1e",
                        }}
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

            {/* RIGHT SIDE: SUMMARY */}
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
                  <ShoppingCart fontSize="small" color="primary" /> Order
                  Summary
                </Typography>

                <Box
                  sx={{ flexGrow: 1, maxHeight: 400, overflow: "auto", mb: 2 }}
                >
                  {selectedItems.map((item) => (
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
                      <Typography variant="body2" fontWeight="bold">
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
                      <Grid container spacing={1} sx={{ mt: 1 }}>
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
                  ))}
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

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
