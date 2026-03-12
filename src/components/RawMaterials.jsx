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

// Import your Modal components
import AddRawMaterialModal from "./AddRawMaterialModal.jsx";
import EditRawMaterialModal from "./EditRawMaterialModal.jsx";

export default function RawMaterials({ mode }) {
  const [materialsData, setMaterialsData] = useState([]);
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

  const componentRef = useRef();

  const showMessage = (msg, sev = "success") => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/raw-materials");
      const data = await response.json();
      setMaterialsData(data);
      setOriginalData(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error("Fetch error:", error);
      const dummy = [
        {
          rm_id: 1,
          material_name: "Aluminum Rod",
          category: "Metals",
          unit: "kg",
          stock: 150.5,
          min_stock: 50.0,
        },
        {
          rm_id: 2,
          material_name: "PVC Pipe 2in",
          category: "Plastics",
          unit: "pcs",
          stock: 12.0,
          min_stock: 20.0,
        },
      ];
      setMaterialsData(dummy);
      setOriginalData(JSON.parse(JSON.stringify(dummy)));
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // DELETE FUNCTION
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this material? This action cannot be undone.",
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/raw-materials/${id}`,
          {
            method: "DELETE",
          },
        );
        if (response.ok) {
          showMessage("Material deleted successfully", "success");
          fetchMaterials();
        } else {
          showMessage("Failed to delete material", "error");
        }
      } catch (error) {
        showMessage("Network error while deleting", "error");
      }
    }
  };

  // BULK STOCK UPDATE
  const handleBulkUpdate = async () => {
    const changedItems = materialsData.filter((item) => {
      const original = originalData.find((o) => o.rm_id === item.rm_id);
      return original && parseFloat(item.stock) !== parseFloat(original.stock);
    });

    try {
      await Promise.all(
        changedItems.map((item) =>
          fetch(`http://localhost:3000/api/raw-materials/${item.rm_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: item.stock }),
          }),
        ),
      );
      showMessage("Stock levels updated successfully!");
      setIsEditingQty(false);
      fetchMaterials();
    } catch (error) {
      showMessage("Failed to update stock", "error");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Raw_Materials_Report",
    onAfterPrint: () => showMessage("Report generated successfully!", "info"),
  });

  const hasChanges = materialsData.some((item) => {
    const originalItem = originalData.find((orig) => orig.rm_id === item.rm_id);
    return (
      originalItem && parseFloat(item.stock) !== parseFloat(originalItem.stock)
    );
  });

  const handleQuantityChangeLocal = (id, newStock) => {
    const qty = parseFloat(newStock) || 0;
    setMaterialsData((prev) =>
      prev.map((item) => (item.rm_id === id ? { ...item, stock: qty } : item)),
    );
  };

  const getStatus = (stock, min_stock) => {
    const s = parseFloat(stock);
    const m = parseFloat(min_stock);
    if (s <= 0) return { label: "Out of Stock", color: "error" };
    if (s <= m) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Raw Materials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inventory Management
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => handlePrint()}
          >
            Print
          </Button>
          <Button
            variant={isEditingQty ? "contained" : "outlined"}
            color={isEditingQty ? "warning" : "primary"}
            startIcon={<EditNote />}
            onClick={() => setIsEditingQty(!isEditingQty)}
          >
            {isEditingQty ? "Lock Editing" : "Quick Stock Update"}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
          >
            Add Material
          </Button>
        </Stack>
      </Box>

      {/* Main Table Container */}
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
            Materials List
          </Typography>
          <TextField
            size="small"
            placeholder="Search material..."
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

        <Table ref={componentRef}>
          <TableHead
            sx={{
              bgcolor:
                mode === "light" ? "action.hover" : "rgba(255,255,255,0.02)",
            }}
          >
            <TableRow>
              <TableCell>RM ID</TableCell>
              <TableCell>Material Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right" className="no-print">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materialsData
              .filter((item) =>
                item.material_name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()),
              )
              .map((row) => {
                const status = getStatus(row.stock, row.min_stock);
                return (
                  <TableRow key={row.rm_id} hover>
                    <TableCell>#{row.rm_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {row.material_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        variant={isEditingQty ? "outlined" : "standard"}
                        size="small"
                        disabled={!isEditingQty}
                        value={row.stock}
                        onChange={(e) =>
                          handleQuantityChangeLocal(row.rm_id, e.target.value)
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
                    <TableCell>{row.unit}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                      />
                    </TableCell>
                    <TableCell align="right" className="no-print">
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
                          onClick={() => handleDelete(row.rm_id)}
                        >
                          <Delete fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              onClick={() =>
                setMaterialsData(JSON.parse(JSON.stringify(originalData)))
              }
            >
              Discard
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleBulkUpdate}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </TableContainer>

      {/* Add Modal */}
      <AddRawMaterialModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={() => {
          showMessage("Material added successfully!");
          fetchMaterials();
        }}
        mode={mode}
      />

      {/* Edit Modal */}
      <EditRawMaterialModal
        open={openEditModal}
        handleClose={() => {
          setOpenEditModal(false);
          setSelectedItem(null);
        }}
        itemData={selectedItem}
        onSaveSuccess={() => {
          showMessage("Material updated successfully!");
          fetchMaterials();
        }}
        mode={mode}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
