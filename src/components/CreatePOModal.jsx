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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  InputAdornment,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import { Close, Search, ShoppingCart, Person } from "@mui/icons-material";

// --- Constants ---
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

const statusOptions = ["Job Order", "Pending", "Done"];

export default function CreatePOModal({ open, handleClose, mode }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("Job Order");
  const [customerName, setCustomerName] = useState("");

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
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        Create New Purchase Order
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={4}>
          {/* LEFT SIDE: SELECTION & INFO */}
          <Grid item xs={12} md={7}>
            <Typography
              variant="subtitle2"
              color="primary"
              fontWeight="bold"
              gutterBottom
            >
              Order Information
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Name"
                  placeholder="Enter full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldStyle}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  sx={fieldStyle}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="PO Number"
                  placeholder="PO-XXXX"
                  sx={fieldStyle}
                />
              </Grid>
              <Grid item xs={6} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total Price"
                  type="number"
                  sx={fieldStyle}
                />
              </Grid>
            </Grid>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                Select Items
              </Typography>
              <TextField
                size="small"
                placeholder="Search..."
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 180, ...fieldStyle }}
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
                    {/* Checkbox column removed from here */}
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
                    .filter((i) =>
                      i.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((item) => {
                      const isChecked = selectedItems.some(
                        (i) => i.id === item.id,
                      );
                      return (
                        <TableRow key={item.id} hover selected={isChecked}>
                          {/* Checkbox cell removed from here */}
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Avail: {item.available} {item.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => handleToggleItem(item)}
                              color={isChecked ? "error" : "primary"}
                              variant={isChecked ? "outlined" : "text"}
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
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 2,
                bgcolor:
                  mode === "light" ? "grey.50" : "rgba(255, 255, 255, 0.02)",
                borderRadius: 3,
                height: "100%",
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <ShoppingCart color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Order Summary
                </Typography>
                <Chip
                  label={selectedItems.length}
                  size="small"
                  color="primary"
                  sx={{ ml: "auto" }}
                />
              </Box>

              {customerName && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Ordering for: <b>{customerName}</b>
                </Typography>
              )}

              <Divider sx={{ mb: 2 }} />

              {selectedItems.length === 0 ? (
                <Box sx={{ py: 10, textAlign: "center", opacity: 0.5 }}>
                  <Typography variant="body2">
                    No items selected yet.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                  {selectedItems.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.5,
                        p: 1.5,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.category}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TextField
                          size="small"
                          type="number"
                          label="Qty"
                          value={item.qty}
                          onChange={(e) =>
                            handleQtyChange(item.id, e.target.value)
                          }
                          sx={{
                            width: 70,
                            "& .MuiInputBase-input": {
                              py: 0.5,
                              textAlign: "center",
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={selectedItems.length === 0 || !customerName}
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Create Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
