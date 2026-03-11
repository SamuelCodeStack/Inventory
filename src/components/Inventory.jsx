import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
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
  Divider,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Save,
  RestartAlt,
  EditNote,
  Print,
} from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";

export default function Inventory({ mode }) {
  const [inventoryData, setInventoryData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- SNACKBAR STATE ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success=green, error=red, info=blue
  });

  const componentRef = useRef();

  // Helper for Snackbar
  const showMessage = (msg, sev = "success") => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/inventory");
      const data = await response.json();
      setInventoryData(data);
      setOriginalData(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error("Fetch error:", error);
      showMessage("Failed to fetch inventory data", "error"); // Red
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Print Logic
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Kimwin_Corporation_Inventory_Report",
    onAfterPrint: () => showMessage("Report generated successfully!", "info"), // Blue
  });

  const hasChanges = inventoryData.some((item) => {
    const originalItem = originalData.find((orig) => orig.id === item.id);
    return originalItem && item.quantity !== originalItem.quantity;
  });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleQuantityChangeLocal = (id, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    const updatedData = inventoryData.map((item) => {
      if (item.id === id) {
        const threshold = item.minStock || 10;
        let newStatus = "In Stock";
        if (qty === 0) newStatus = "Out of Stock";
        else if (qty <= threshold) newStatus = "Low Stock";
        return { ...item, quantity: qty, status: newStatus };
      }
      return item;
    });
    setInventoryData(updatedData);
  };

  const handleBulkSave = async () => {
    const modifiedItems = inventoryData.filter((item) => {
      const original = originalData.find((o) => o.id === item.id);
      return original && item.quantity !== original.quantity;
    });

    const payload = {
      items: modifiedItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch(`http://localhost:3000/api/inventory/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setOriginalData(JSON.parse(JSON.stringify(inventoryData)));
        setIsEditingQty(false);
        showMessage("All quantities updated successfully!", "info"); // blue
      }
    } catch (error) {
      showMessage("Error saving changes", "error"); // Red
    }
  };

  const handleResetChanges = () => {
    setInventoryData(JSON.parse(JSON.stringify(originalData)));
    setIsEditingQty(false);
    showMessage("Changes discarded", "info"); // Blue
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInventoryData(inventoryData.filter((item) => item.id !== id));
        showMessage("Item deleted successfully", "error"); // Red
      }
    } catch (e) {
      showMessage("Delete failed", "error"); // Red
    }
  };

  const getStatusColor = (status) => {
    if (status === "In Stock") return "success";
    if (status === "Low Stock") return "warning";
    if (status === "Out of Stock") return "error";
    return "default";
  };

  // Modal Handlers
  const handleAddSuccess = () => {
    fetchInventory();
    showMessage("New item added successfully!", "success"); // Green
  };

  const handleEditSuccess = () => {
    fetchInventory();
    showMessage("Item details updated successfully!", "info"); // Green
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
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => handlePrint()}
          >
            Print Report
          </Button>
          <Button
            variant={isEditingQty ? "contained" : "outlined"}
            color={isEditingQty ? "warning" : "primary"}
            startIcon={<EditNote />}
            onClick={() => setIsEditingQty(!isEditingQty)}
          >
            {isEditingQty ? "Lock Editing" : "Enable Qty Edit"}
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

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, p: 2 }}>
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
              <TableCell>ID</TableCell>
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
                  <TableCell>{row.uom}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      variant={isEditingQty ? "outlined" : "standard"}
                      size="small"
                      disabled={!isEditingQty}
                      value={row.quantity}
                      onChange={(e) =>
                        handleQuantityChangeLocal(row.id, e.target.value)
                      }
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontWeight: "bold",
                          width: "80px",
                          "& input": { textAlign: "right" },
                        },
                      }}
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
                        color="info"
                        onClick={() => {
                          setSelectedItem(row);
                          setOpenEditModal(true);
                        }}
                      >
                        <Edit fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
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

        {hasChanges && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Button
              variant="text"
              color="inherit"
              startIcon={<RestartAlt />}
              onClick={handleResetChanges}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleBulkSave}
            >
              Save All Changes
            </Button>
          </Box>
        )}
      </TableContainer>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <Box sx={{ display: "none" }}>
        <Box
          ref={componentRef}
          sx={{
            p: "10mm",
            bgcolor: "white",
            color: "black",
            width: "210mm",
            // This ensures MUI Typography components inside this box default to black
            "& *": { color: "black !important" },
          }}
        >
          {/* CRITICAL: CSS to override Dark Mode styles during printing */}
          <style>{`
            @media print {
              @page { 
                size: A4; 
                margin: 15mm; 
              }
              body { 
                background-color: white !important; 
                color: black !important;
              }
              /* Force all elements to black and borders to be visible */
              * { 
                color: black !important; 
                background-color: transparent !important;
                border-color: #333 !important;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
              /* Ensure the header text is dark blue even in print */
              .print-header {
                color: #1a237e !important;
              }
            }
          `}</style>

          <Typography
            variant="h4"
            fontWeight="bold"
            className="print-header"
            sx={{ color: "#1a237e !important" }}
          >
            KIMWIN CORPORATION
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Inventory Assets Report
          </Typography>

          <Divider
            sx={{
              mb: 3,
              borderColor: "black !important",
              borderBottomWidth: 1,
            }}
          />

          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: "bold",
                    color: "black !important",
                    borderBottom: "2px solid black !important",
                  },
                }}
              >
                <TableCell>ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Unit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                  <TableCell>{row.uom}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ mt: 4, textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "black !important" }}>
              Report Generated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Modals */}
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

      {/* --- REFINED SNACKBAR --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, boxShadow: 6 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
