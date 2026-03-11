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
  Print, // Added Print Icon
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const componentRef = useRef(); // Ref for printing

  const fetchInventory = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/inventory");
      const data = await response.json();
      setInventoryData(data);
      setOriginalData(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Print Logic
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Kimwin_Corporation_Inventory_Report",
  });

  const hasChanges = inventoryData.some((item) => {
    const originalItem = originalData.find((orig) => orig.id === item.id);
    return originalItem && item.quantity !== originalItem.quantity;
  });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

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
        setSnackbar({
          open: true,
          message: "All quantities updated in database!",
          severity: "success",
        });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Error saving", severity: "error" });
    }
  };

  const handleResetChanges = () => {
    setInventoryData(JSON.parse(JSON.stringify(originalData)));
    setIsEditingQty(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInventoryData(inventoryData.filter((item) => item.id !== id));
        setSnackbar({ open: true, message: "Deleted", severity: "error" });
      }
    } catch (e) {
      console.error(e);
    }
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
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 2, position: "relative" }}
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
            placeholder="Search..."
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
                  <TableCell align="right" sx={{ width: "120px" }}>
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
                          width: "100px",
                          textAlign: "right",
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
                        color="primary"
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
              Save All
            </Button>
          </Box>
        )}
      </TableContainer>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <Box sx={{ display: "none" }}>
        <Box
          ref={componentRef}
          sx={{
            p: "10mm", // Use mm for consistent print sizing
            bgcolor: "white",
            color: "black",
            width: "210mm", // Standard A4 Width
            // Remove minHeight to prevent forcing extra pages
            "& *": {
              color: "black !important",
              borderColor: "rgba(0, 0, 0, 0.2) !important",
            },
          }}
        >
          <style>{`
      @media print {
        @page { 
          size: A4; 
          margin: 0; /* Let the Box handle padding instead */
        }
        body { 
          margin: 0; 
          -webkit-print-color-adjust: exact; 
        }
        /* Ensure no extra space at the end of the document */
        html, body { height: auto !important; overflow: visible !important; }
      }
    `}</style>

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ color: "#1a237e !important" }}
              >
                KIMWIN CORPORATION
              </Typography>
              <Typography variant="h6">Inventory Assets Report</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2">
                Date: {new Date().toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Divider
            sx={{
              mb: 3,
              borderBottomWidth: 2,
              borderColor: "black !important",
            }}
          />

          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: "bold",
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

          {/* Signatures */}
          <Box
            sx={{
              mt: 6,
              display: "flex",
              justifyContent: "space-between",
              px: 4,
            }}
          >
            <Box
              sx={{
                borderTop: "1px solid black !important",
                width: 180,
                textAlign: "center",
                pt: 1,
              }}
            >
              <Typography variant="caption">Prepared By</Typography>
            </Box>
            <Box
              sx={{
                borderTop: "1px solid black !important",
                width: 180,
                textAlign: "center",
                pt: 1,
              }}
            >
              <Typography variant="caption">Verified By</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      {/* Modals & Snackbar */}
      <AddInventoryModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={fetchInventory}
        mode={mode}
      />
      <EditInventoryModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        onSaveSuccess={fetchInventory}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
