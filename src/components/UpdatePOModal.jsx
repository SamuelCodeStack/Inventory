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

const inventoryItems = [
  {
    id: 1,
    name: "Macbook Pro M1",
    available: 120,
    unit: "Pieces",
    category: "Plastic",
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    available: 230,
    unit: "Pieces",
    category: "Plastic",
  },
  {
    id: 3,
    name: "Wired Mouse",
    available: 1230,
    unit: "Bundle",
    category: "Trading",
  },
  {
    id: 4,
    name: "Titan Watch",
    available: 600,
    unit: "Box",
    category: "Paper",
  },
];

const statusOptions = ["Job Order", "Pending", "Done"];

export default function UpdatePOModal({ open, handleClose, mode, poData }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    contact: "",
    status: "Job Order",
    totalPrice: "",
  });

  useEffect(() => {
    if (poData) {
      setFormData({
        customerName: poData.customerName || "",
        email: poData.email || "",
        contact: poData.contact || "",
        status: poData.status || poData.remark || "Job Order",
        totalPrice: poData.totalPrice || "",
      });
      setSelectedItems(poData.items || []);
    }
  }, [poData]);

  const handleToggleItem = (item) => {
    const currentIndex = selectedItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) {
      setSelectedItems([...selectedItems, { ...item, qty: 1 }]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    }
  };

  const handleQtyChange = (itemId, newQty) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, qty: parseInt(newQty) || 1 } : item,
      ),
    );
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

  const handleSubmit = () => {
    const finalData = { ...formData, items: selectedItems };
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md" // Reduced from 'lg' to 'md' to tighten the layout
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Update Purchase Order
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PO Number: {poData?.poNumber || poData?.id || "N/A"}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* LEFT SIDE: INPUTS AND INVENTORY */}
          <Grid item xs={12} md={7}>
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight="bold"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Person fontSize="small" /> Customer Details
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
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
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Status"
                  select
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

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                Inventory
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
                sx={{ width: 160, ...fieldStyle }}
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
                  {inventoryItems
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
                        <TableRow key={item.id} hover selected={isChecked}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Avail: {item.available}
                            </Typography>
                          </TableCell>
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

          {/* RIGHT SIDE: SUMMARY (Tightened) */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2,
                bgcolor:
                  mode === "light" ? "grey.50" : "rgba(255,255,255,0.02)",
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                minHeight: 400, // Fixed height keeps the look consistent
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ShoppingCart color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Order Summary
                </Typography>
                <Chip
                  label={selectedItems.length}
                  size="small"
                  color="primary"
                  sx={{ ml: "auto" }}
                />
              </Box>

              <Box sx={{ flexGrow: 1, overflow: "auto", maxHeight: 320 }}>
                {selectedItems.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ textAlign: "center", py: 5, opacity: 0.5 }}
                  >
                    No items selected.
                  </Typography>
                ) : (
                  selectedItems.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                        p: 1,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        Wrap
                        sx={{ maxWidth: 100 }}
                      >
                        {item.name}
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          handleQtyChange(item.id, e.target.value)
                        }
                        sx={{
                          width: 100,
                          "& .MuiInputBase-input": {
                            py: 0.5,
                            textAlign: "center",
                            fontSize: "0.75rem",
                          },
                        }}
                      />
                    </Box>
                  ))
                )}
              </Box>

              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Total Amount"
                  name="totalPrice"
                  type="number"
                  value={formData.totalPrice}
                  onChange={handleChange}
                  sx={fieldStyle}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={handleClose}
          sx={{ color: "text.secondary", textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedItems.length === 0}
          sx={{ px: 4, textTransform: "none", fontWeight: "bold" }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
