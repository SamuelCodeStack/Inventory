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

  // 1. THIS REF NOW POINTS TO THE HIDDEN PRINT TEMPLATE
  const printRef = useRef();

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
      showMessage("Failed to load materials from server", "error");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // 2. UPDATED PRINT HANDLER
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Points to the clean report
    documentTitle: `KIMWIN_Inventory_Report_${new Date().toLocaleDateString()}`,
    onAfterPrint: () => showMessage("Report generated successfully!", "info"),
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
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

  // Filter logic used for both Screen and Print
  const filteredData = materialsData.filter(
    (item) =>
      item.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* --- SCREEN VIEW UI --- */}
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
            Raw Materials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard / Raw Materials
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
          >
            Leftovers
          </Button>
          <Button
            variant={isEditingQty ? "contained" : "outlined"}
            color={isEditingQty ? "warning" : "primary"}
            startIcon={isEditingQty ? <Save /> : <EditNote />}
            onClick={() =>
              isEditingQty && hasChanges
                ? handleBulkUpdate()
                : setIsEditingQty(!isEditingQty)
            }
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
            Raw Materials List
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
            sx={{ width: 300 }}
          />
        </Box>

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
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row) => {
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
                          handleQuantityChangeLocal(row.rm_id, e.target.value)
                        }
                        sx={{
                          width: "90px",
                          "& input": { textAlign: "right", py: 0.5 },
                        }}
                      />
                    ) : (
                      row.stock
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
              Discard
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleBulkUpdate}
            >
              Save Stock
            </Button>
          </Box>
        )}
      </TableContainer>

      {/* --- MODALS --- */}
      <AddRawMaterialModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={fetchMaterials}
        mode={mode}
      />
      <EditRawMaterialModal
        open={openEditModal}
        handleClose={() => {
          setOpenEditModal(false);
          setSelectedItem(null);
        }}
        itemData={selectedItem}
        onSaveSuccess={fetchMaterials}
        mode={mode}
      />
      <LeftoverModal
        open={openLeftoverModal}
        handleClose={() => setOpenLeftoverModal(false)}
        mode={mode}
        onUpdate={fetchMaterials}
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

      {/* --- 3. HIDDEN PRINT TEMPLATE --- */}
      <Box sx={{ display: "none" }}>
        <Box
          ref={printRef}
          sx={{
            p: "15mm",
            bgcolor: "white",
            color: "black",
            width: "210mm",
            "& *": { color: "black !important" },
          }}
        >
          <style>{`
            @media print {
              @page { size: A4; margin: 10mm; }
              body { background-color: white !important; }
              * { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
              th { background-color: #f5f5f5 !important; font-weight: bold; }
            }
          `}</style>

          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#1a237e !important" }}
          >
            KIMWIN CORPORATION
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Raw Materials Assets Report
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Date Generated: {new Date().toLocaleString()}
          </Typography>

          <Divider sx={{ mb: 3, borderColor: "black !important" }} />

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Material Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.rm_id}>
                  <td>{row.rm_id}</td>
                  <td>{row.material_name}</td>
                  <td>{row.category}</td>
                  <td>
                    {row.stock} {row.unit}
                  </td>

                  <td>{getStatus(row.stock, row.min_stock).label}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Box sx={{ mt: 5, display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="caption">
                Prepared by: ____________________
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption">
                Approved by: ____________________
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
