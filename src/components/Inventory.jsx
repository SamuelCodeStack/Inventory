import React, { useState, useEffect } from "react"; // Added useEffect here
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import { FileUpload, Add, Edit, Delete, Search } from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";

export default function Inventory({ mode }) {
  // --- 1. HOOKS MUST BE INSIDE THE FUNCTION ---
  const [inventoryData, setInventoryData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- 2. FETCH LOGIC INSIDE THE FUNCTION ---
  const fetchInventory = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/inventory");
      const data = await response.json();
      setInventoryData(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- 3. HANDLERS ---
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleAddSuccess = () => {
    setOpenAddModal(false);
    fetchInventory(); // Refresh data from server
    setSnackbar({
      open: true,
      message: "New item added successfully!",
      severity: "success",
    });
  };

  const handleEditSuccess = () => {
    setOpenEditModal(false);
    fetchInventory(); // Refresh data from server
    setSnackbar({
      open: true,
      message: "Item updated successfully!",
      severity: "info",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/inventory/${id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setInventoryData(inventoryData.filter((item) => item.id !== id));
        setSnackbar({ open: true, message: `Item deleted`, severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Server error", severity: "error" });
    }
  };

  const handleQuantityChange = async (id, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;

    // Optimistic UI Update
    const updatedData = inventoryData.map((item) => {
      if (item.id === id) {
        // Use the item's specific minimum stock threshold
        const threshold = item.minStock || 10;

        let newStatus = "In Stock";
        if (qty === 0) newStatus = "Out of Stock";
        else if (qty <= threshold) newStatus = "Low Stock";

        return { ...item, quantity: qty, status: newStatus };
      }
      return item;
    });

    setInventoryData(updatedData);

    try {
      // You are missing the PATCH route in your server.js snippet!
      // Make sure the backend endpoint exists (see Step 2 below)
      await fetch(`http://localhost:3000/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
    } catch (error) {
      console.error("Sync failed");
      fetchInventory(); // Revert on error
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpenEditModal(true);
  };

  const getStatusColor = (status) => {
    if (status === "In Stock") return "success";
    if (status === "Low Stock") return "warning";
    if (status === "Out of Stock") return "error";
    return "default";
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard / Inventory
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<FileUpload />}>
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
          >
            Add Inventory
          </Button>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 2, backgroundImage: "none" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Inventory List
          </Typography>
          <TextField
            size="small"
            placeholder="Search items..."
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Table>
          <TableHead
            sx={{
              bgcolor:
                mode === "light" ? "action.hover" : "rgba(255,255,255,0.02)",
            }}
          >
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventoryData
              .filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.category} size="small" />
                  </TableCell>
                  <TableCell color="text.secondary">{row.uom}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      variant="standard"
                      value={row.quantity}
                      onChange={(e) =>
                        handleQuantityChange(row.id, e.target.value)
                      }
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontWeight: "bold",
                          "& input": { textAlign: "right" },
                        },
                      }}
                      sx={{ width: "60px" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status}
                      size="small"
                      color={getStatusColor(row.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <IconButton
                        size="small"
                        sx={{ color: "#3498db" }}
                        onClick={() => handleEditClick(row)}
                      >
                        <Edit fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: "#e74c3c" }}
                        onClick={() => handleDelete(row.id)}
                      >
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals & Snackbar */}
      <AddInventoryModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={handleAddSuccess}
        mode={mode}
      />
      <EditInventoryModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        onSaveSuccess={handleEditSuccess}
        mode={mode}
        itemData={selectedItem}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, fontWeight: "bold" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
