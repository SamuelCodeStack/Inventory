import React, { useState } from "react";
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
  Snackbar, // Added
  Alert, // Added
} from "@mui/material";
import {
  FileUpload,
  Add,
  FilterList,
  Edit,
  Delete,
  Search,
} from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";

const initialData = [
  {
    id: "01",
    name: "Macbook Pro M1 2020",
    category: "Plastic",
    uom: "Pieces",
    quantity: 120,
    status: "In Stock",
  },
  {
    id: "02",
    name: "Mechanical Keyboard",
    category: "Injection",
    uom: "Box",
    quantity: 5,
    status: "Low Stock",
  },
  {
    id: "03",
    name: "Wired Mouse",
    category: "Paper",
    uom: "Pieces",
    quantity: 0,
    status: "Out of Stock",
  },
];

export default function Inventory({ mode }) {
  const [inventoryData, setInventoryData] = useState(initialData);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // 'success' = green, 'info' = blue, 'error' = red
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 1. ADD Logic (Call this when Add Modal successfully saves)
  const handleAddSuccess = () => {
    setOpenAddModal(false);
    setSnackbar({
      open: true,
      message: "New item added successfully!",
      severity: "success", // GREEN
    });
  };

  // 2. UPDATE Logic (Call this when Edit Modal successfully saves)
  const handleEditSuccess = () => {
    setOpenEditModal(false);
    setSnackbar({
      open: true,
      message: "Item updated successfully!",
      severity: "info", // BLUE (MUI 'info' is blue)
    });
  };

  // 3. DELETE Logic
  const handleDelete = (id) => {
    setInventoryData(inventoryData.filter((item) => item.id !== id));
    setSnackbar({
      open: true,
      message: `Item ${id} deleted successfully`,
      severity: "error", // RED
    });
  };

  const handleQuantityChange = (id, newQuantity) => {
    const updatedData = inventoryData.map((item) => {
      if (item.id === id) {
        const qty = parseInt(newQuantity) || 0;
        let newStatus = "In Stock";
        if (qty === 0) newStatus = "Out of Stock";
        else if (qty <= 10) newStatus = "Low Stock";
        return { ...item, quantity: qty, status: newStatus };
      }
      return item;
    });
    setInventoryData(updatedData);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpenEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Low Stock":
        return "warning";
      case "Out of Stock":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Header & Table (logic remains same) */}
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
                          textAlign: "right",
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

      {/* MODALS - Added the success handlers */}
      <AddInventoryModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={handleAddSuccess} // Pass this to your Add modal
        mode={mode}
      />

      <EditInventoryModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        onSaveSuccess={handleEditSuccess} // Pass this to your Edit modal
        mode={mode}
        itemData={selectedItem}
      />

      {/* DYNAMIC NOTIFICATION (BOTTOM RIGHT) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled" // 'filled' makes the background color solid and vibrant
          sx={{
            width: "100%",
            borderRadius: 2,
            fontWeight: "bold",
            // Customizing colors to be exactly what you want if default MUI isn't enough
            ...(snackbar.severity === "info" && { bgcolor: "#3498db" }), // Blue
            ...(snackbar.severity === "success" && { bgcolor: "#2ecc71" }), // Green
            ...(snackbar.severity === "error" && { bgcolor: "#e74c3c" }), // Red
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
