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
  HistoryToggleOff,
} from "@mui/icons-material";

// Import your Modal components
import AddRawMaterialModal from "./AddRawMaterialModal.jsx";
import EditRawMaterialModal from "./EditRawMaterialModal.jsx";
import LeftoverModal from "./LeftoverModal.jsx";

export default function RawMaterials({ mode }) {
  const [materialsData, setMaterialsData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openLeftoverModal, setOpenLeftoverModal] = useState(false);
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
      // Deep copy to track local changes
      setOriginalData(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error("Fetch error:", error);
      showMessage("Failed to load materials from server", "error");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this material? This may affect Job Orders using it.",
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
          showMessage("Material deleted successfully");
          fetchMaterials();
        }
      } catch (error) {
        showMessage("Network error while deleting", "error");
      }
    }
  };

  const handleBulkUpdate = async () => {
    const changedItems = materialsData.filter((item) => {
      const original = originalData.find((o) => o.rm_id === item.rm_id);
      return original && parseFloat(item.stock) !== parseFloat(original.stock);
    });

    try {
      // Note: Using PATCH as it's more standard for partial updates
      await Promise.all(
        changedItems.map((item) =>
          fetch(`http://localhost:3000/api/raw-materials/${item.rm_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: parseFloat(item.stock) }),
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
    documentTitle: `Raw_Materials_Report_${new Date().toLocaleDateString()}`,
    onAfterPrint: () => showMessage("Report generated successfully!", "info"),
  });

  const handleQuantityChangeLocal = (id, newStock) => {
    setMaterialsData((prev) =>
      prev.map((item) =>
        item.rm_id === id ? { ...item, stock: newStock } : item,
      ),
    );
  };

  const hasChanges = materialsData.some((item) => {
    const originalItem = originalData.find((orig) => orig.rm_id === item.rm_id);
    return (
      originalItem && parseFloat(item.stock) !== parseFloat(originalItem.stock)
    );
  });

  const getStatus = (stock, min_stock) => {
    const s = parseFloat(stock) || 0;
    const m = parseFloat(min_stock) || 0;
    if (s <= 0) return { label: "Out of Stock", color: "error" };
    if (s <= m) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Print Styles */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          }
        `}
      </style>

      {/* HEADER SECTION */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 4,
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Raw Materials Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage your factory raw stock
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
            variant="outlined"
            color="secondary"
            startIcon={<HistoryToggleOff />}
            onClick={() => setOpenLeftoverModal(true)}
            sx={{ fontWeight: "bold" }}
          >
            Leftovers
          </Button>

          <Button
            variant={isEditingQty ? "contained" : "outlined"}
            color={isEditingQty ? "warning" : "primary"}
            startIcon={isEditingQty ? <Save /> : <EditNote />}
            onClick={() => {
              if (isEditingQty && hasChanges) {
                handleBulkUpdate();
              } else {
                setIsEditingQty(!isEditingQty);
              }
            }}
          >
            {isEditingQty
              ? hasChanges
                ? "Save Changes"
                : "Lock Edit"
              : "Quick Edit Qty"}
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              bgcolor: "#f2994a",
              "&:hover": { bgcolor: "#d8853a" },
              color: "#000",
              fontWeight: "bold",
            }}
          >
            Add Material
          </Button>
        </Stack>
      </Box>

      {/* TABLE SECTION */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 3, backgroundImage: "none" }}
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
            Active Stock List
          </Typography>
          <TextField
            size="small"
            placeholder="Search material or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

        <Box ref={componentRef}>
          <Table>
            <TableHead
              sx={{
                bgcolor:
                  mode === "light" ? "action.hover" : "rgba(255,255,255,0.05)",
              }}
            >
              <TableRow>
                <TableCell>RM ID</TableCell>
                <TableCell>Material Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Stock Level</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right" className="no-print">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materialsData
                .filter(
                  (item) =>
                    item.material_name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    item.category
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
                        {isEditingQty ? (
                          <TextField
                            type="number"
                            size="small"
                            value={row.stock}
                            onChange={(e) =>
                              handleQuantityChangeLocal(
                                row.rm_id,
                                e.target.value,
                              )
                            }
                            sx={{
                              width: "90px",
                              "& input": { textAlign: "right", py: 0.5 },
                            }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight="bold">
                            {row.stock}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={status.label}
                          size="small"
                          color={status.color}
                          sx={{ fontWeight: "bold", minWidth: 90 }}
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
        </Box>

        {/* BULK UPDATE ACTIONS */}
        {hasChanges && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              borderTop: "1px solid divider",
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
              Discard Changes
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleBulkUpdate}
            >
              Save Stock Levels
            </Button>
          </Box>
        )}
      </TableContainer>

      {/* MODALS */}
      <AddRawMaterialModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={() => {
          showMessage("Material added successfully!");
          fetchMaterials();
        }}
        mode={mode}
      />

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

      <LeftoverModal
        open={openLeftoverModal}
        handleClose={() => setOpenLeftoverModal(false)}
        mode={mode}
        onUpdate={fetchMaterials} // Refreshes main list if leftover logic changes rm stock
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
