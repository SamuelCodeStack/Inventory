import React, { useState, useEffect } from "react";
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
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Print,
  FilterListOff,
} from "@mui/icons-material";

// --- MODAL IMPORTS ---
import AddRawMaterialModal from "./AddRawMaterialModal";
import EditRawMaterialModal from "./EditRawMaterialModal";
import PrintRawMaterialModal from "./PrintRawMaterialModal";

export default function RawMaterials({ mode }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // --- PAGINATION STATES ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Modal States
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isDark = mode === "dark";

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/raw-materials");
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      showSnackbar("Failed to load raw materials", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // --- FILTER LOGIC ---
  const getStatus = (item) => {
    const currentVal =
      item.minStockTarget === "base" ? item.baseValue : item.qtyValue;
    if (currentVal <= 0) return { label: "Out of Stock", color: "error" };
    if (currentVal <= item.minStockThreshold)
      return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  const filteredMaterials = materials.filter((m) => {
    const statusObj = getStatus(m);

    // Matches Name OR ID
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.id).includes(searchQuery);

    const matchesCategory =
      categoryFilter === "All" || m.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" || statusObj.label === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedMaterials = filteredMaterials.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setPage(0);
  };

  // --- HANDLERS ---
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?"))
      return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/raw-materials/${id}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setMaterials(materials.filter((m) => m.id !== id));
        showSnackbar("Material deleted successfully", "info");
      }
    } catch (error) {
      showSnackbar("Error deleting material", "error");
    }
  };

  const handleTargetChange = async (item, newTarget) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/raw-materials/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, minStockTarget: newTarget }),
        },
      );
      if (response.ok) {
        fetchMaterials();
        showSnackbar(
          `Monitoring changed to ${newTarget === "base" ? item.baseUnit : item.qtyUnit}`,
          "success",
        );
      }
    } catch (error) {
      showSnackbar("Failed to update monitoring logic", "error");
    }
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Raw Materials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dynamic unit tracking for chemicals & supplies
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => setOpenPrintModal(true)}
            sx={{ borderRadius: 2, fontWeight: "bold" }}
          >
            Print Report
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
            sx={{ borderRadius: 2, fontWeight: "bold" }}
          >
            Add Material
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, p: 2 }}>
        {/* --- FILTER BAR --- */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 3, p: 2, alignItems: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search Name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            <MenuItem value="Plastic">Plastic</MenuItem>
            <MenuItem value="Injection">Injection</MenuItem>
            <MenuItem value="Paper">Paper</MenuItem>
            <MenuItem value="Trading">Trading</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="In Stock">In Stock</MenuItem>
            <MenuItem value="Low Stock">Low Stock</MenuItem>
            <MenuItem value="Out of Stock">Out of Stock</MenuItem>
          </TextField>

          {(searchQuery ||
            categoryFilter !== "All" ||
            statusFilter !== "All") && (
            <Button
              startIcon={<FilterListOff />}
              onClick={handleResetFilters}
              color="inherit"
              size="small"
            >
              Reset
            </Button>
          )}
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead
                sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa" }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Material Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Measurement</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Monitoring Logic
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      No raw materials match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMaterials.map((row) => {
                    const status = getStatus(row);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>#{row.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {row.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {row.category}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {row.baseValue} <small>{row.baseUnit}</small>
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.qtyValue} <small>{row.qtyUnit}</small>
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={row.minStockTarget}
                            sx={{
                              width: 140,
                              "& .MuiInputBase-input": { fontSize: "0.75rem" },
                            }}
                            onChange={(e) =>
                              handleTargetChange(row, e.target.value)
                            }
                          >
                            <MenuItem value="base">By {row.baseUnit}</MenuItem>
                            <MenuItem value="qty">By {row.qtyUnit}</MenuItem>
                          </TextField>
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 0.5, color: "text.secondary" }}
                          >
                            Threshold: {row.minStockThreshold}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "inline-block",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              bgcolor:
                                status.color === "success"
                                  ? "rgba(46, 204, 113, 0.15)"
                                  : status.color === "warning"
                                    ? "rgba(241, 145, 73, 0.15)"
                                    : "rgba(231, 76, 60, 0.15)",
                              color:
                                status.color === "success"
                                  ? "#27ae60"
                                  : status.color === "warning"
                                    ? "#e67e22"
                                    : "#c0392b",
                            }}
                          >
                            {status.label}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={filteredMaterials.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      <AddRawMaterialModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={() => {
          fetchMaterials();
          showSnackbar("Material added successfully!", "success");
        }}
        mode={mode}
      />
      <PrintRawMaterialModal
        open={openPrintModal}
        handleClose={() => setOpenPrintModal(false)}
        materialsData={materials}
      />
      {selectedItem && (
        <EditRawMaterialModal
          open={openEditModal}
          handleClose={() => {
            setOpenEditModal(false);
            setSelectedItem(null);
          }}
          itemData={selectedItem}
          onSaveSuccess={() => {
            fetchMaterials();
            showSnackbar("Material updated successfully!", "info");
          }}
          mode={mode}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
