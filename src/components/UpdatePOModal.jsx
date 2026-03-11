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
} from "@mui/material";
import {
  Close,
  Person,
  ShoppingCart,
  DeleteOutline,
} from "@mui/icons-material";

const statusOptions = ["Job Order", "Pending", "Done"];

export default function UpdatePOModal({
  open,
  handleClose,
  mode,
  poData,
  onUpdateSuccess,
}) {
  const [dbInventory, setDbInventory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    company: "",
    email: "",
    contact: "",
    address: "",
    status: "Job Order",
    totalPrice: 0,
  });

  useEffect(() => {
    if (open) {
      // Fetch available inventory
      fetch("http://localhost:3000/api/inventory")
        .then((res) => res.json())
        .then((data) => setDbInventory(data));

      if (poData) {
        // Set basic form info
        setFormData({
          customerName: poData.customer || "",
          company: poData.company || "",
          email: poData.email || "",
          contact: poData.contact || "",
          address: poData.address || "",
          status: poData.status || "Job Order",
          totalPrice: poData.totalPrice || 0,
        });

        // Fetch current items for this PO
        fetch(`http://localhost:3000/api/purchase-orders/${poData.id}/items`)
          .then((res) => res.json())
          .then((data) => {
            const mappedItems = data.map((item) => ({
              id: item.item_id,
              name: item.name,
              qty: item.quantity,
              price: item.price,
              unit: item.unit,
              category: item.category,
            }));
            setSelectedItems(mappedItems);
          });
      }
    }
  }, [open, poData]);

  // Re-calculate total price whenever items change
  useEffect(() => {
    const calculated = selectedItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    setFormData((prev) => ({ ...prev, totalPrice: calculated }));
  }, [selectedItems]);

  const handleToggleItem = (item) => {
    const currentIndex = selectedItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) {
      // Adding new item (default price 0 or item.price if available in dbInventory)
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const payload = {
      customer_name: formData.customerName,
      company: formData.company,
      email: formData.email,
      contact: formData.contact,
      address: formData.address,
      status: formData.status,
      total_price: formData.totalPrice,
      items: selectedItems,
    };

    try {
      const response = await fetch(
        `http://localhost:3000/api/purchase-orders/${poData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        onUpdateSuccess();
        handleClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
        },
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
            PO Reference: {poData?.poNo}
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* LEFT SIDE: INVENTORY SEARCH */}
          <Grid item xs={12} md={7}>
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight="bold"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Person fontSize="small" /> Customer & Business Info
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {["customerName", "company", "email", "contact"].map((field) => (
                <Grid item xs={12} md={6} key={field}>
                  <TextField
                    fullWidth
                    size="small"
                    label={field.replace(/([A-Z])/g, " $1")}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    sx={fieldStyle}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
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
                Add Items
              </Typography>
              <TextField
                size="small"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 220, ...fieldStyle }}
              />
            </Box>

            <TableContainer
              sx={{
                maxHeight: 300,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: "action.hover",
                        fontWeight: "bold",
                        width: 80,
                      }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      sx={{ bgcolor: "action.hover", fontWeight: "bold" }}
                    >
                      Item Name
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ bgcolor: "action.hover", fontWeight: "bold" }}
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
                              color: "text.secondary",
                              fontSize: "0.75rem",
                            }}
                          >
                            #{item.id}
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => handleToggleItem(item)}
                              color={isChecked ? "error" : "primary"}
                              sx={{ fontWeight: "bold" }}
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

          {/* RIGHT SIDE: ORDER SUMMARY & EDITING */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2,
                bgcolor:
                  mode === "light" ? "grey.50" : "rgba(255,255,255,0.02)",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <ShoppingCart fontSize="small" color="primary" /> Edit
                Quantities
              </Typography>

              <Box
                sx={{ flexGrow: 1, maxHeight: 450, overflow: "auto", mb: 2 }}
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
                        mb: 1.5,
                        borderRadius: 2,
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Box sx={{ pr: 4 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ fontSize: "0.65rem", fontWeight: "bold" }}
                          >
                            ID: #{item.id}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {item.name}
                          </Typography>
                        </Box>
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
                        <Grid item xs={6}>
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
                        <Grid item xs={6}>
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
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedItems.length === 0 || !formData.customerName.trim()}
          sx={{
            px: 4,
            fontWeight: "bold",
            "&.Mui-disabled": {
              bgcolor:
                mode === "light"
                  ? "rgba(0, 0, 0, 0.12)"
                  : "rgba(255, 255, 255, 0.12)",
            },
          }}
        >
          Update Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
