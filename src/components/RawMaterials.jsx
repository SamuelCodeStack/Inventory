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
  Grid,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Print,
  FilterListOff,
  Save,
  RestartAlt,
  EditNote,
  Undo,
} from "@mui/icons-material";

// --- MODAL IMPORTS ---
import AddRawMaterialModal from "./AddRawMaterialModal";
import EditRawMaterialModal from "./EditRawMaterialModal";
import PrintRawMaterialModal from "./PrintRawMaterialModal";

export default function RawMaterials({ mode }) {
  const [materials, setMaterials] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Added to track changes
  const [loading, setLoading] = useState(true);
  const [isEditingQty, setIsEditingQty] = useState(false); // Toggle for bulk edit mode

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials`,
      );
      const data = await response.json();
      // Initialize items with an adjustment field
      const initializedData = data.map((item) => ({ ...item, adjustment: "" }));
      setMaterials(initializedData);
      setOriginalData(JSON.parse(JSON.stringify(initializedData))); // Keep a deep copy
    } catch (error) {
      showSnackbar("Failed to load raw materials", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // --- BULK EDIT LOGIC ---
  const handleQuantityChangeLocal = (id, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: qty };
        }
        return item;
      }),
    );
  };

  // --- ADJUSTMENT LOGIC ---
  const handleAdjustmentChange = (id, value) => {
    // Only allow numbers and the minus sign
    if (value !== "" && value !== "-" && !/^-?\d+$/.test(value)) return;

    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const original = originalData.find((o) => o.id === id);
          const adjValue = parseInt(value) || 0;
          // Automatically update the quantity based on original + adjustment
          return {
            ...item,
            adjustment: value,
            quantity: original.quantity + adjValue,
          };
        }
        return item;
      }),
    );
  };

  const hasChanges = materials.some((item) => {
    const original = originalData.find((o) => o.id === item.id);
    return original && item.quantity !== original.quantity;
  });

  const handleDiscard = () => {
    setMaterials(JSON.parse(JSON.stringify(originalData)));
    setIsEditingQty(false); // <--- THIS LOCKS THE QUANTITY AUTOMATICALLY
    showSnackbar("Changes discarded", "info");
  };

  const handleBulkSave = async () => {
    const updates = materials
      .filter((item) => {
        const original = originalData.find((o) => o.id === item.id);
        return original && item.quantity !== original.quantity;
      })
      .map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/bulk`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updates }),
        },
      );
      if (response.ok) {
        showSnackbar("Quantities updated successfully!", "success");
        setIsEditingQty(false);
        fetchMaterials();
      }
    } catch (error) {
      showSnackbar("Save failed", "error");
    }
  };

  // --- FILTER LOGIC ---
  const getStatus = (item) => {
    const currentVal = item.quantity;
    if (currentVal <= 0) return { label: "Out of Stock", color: "error" };
    if (currentVal <= item.minStock)
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
        `${import.meta.env.VITE_API_URL}/raw-materials/${id}`,
        {
          method: "DELETE",
          credentials: "include", // Required to send session cookies for activity logs
        },
      );
      if (response.ok) {
        setMaterials(materials.filter((m) => m.id !== id));
        showSnackbar("Material deleted successfully", "info");
      }
    } catch (error) {
      showSnackbar("Error deleting material", "error");
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          mb: 3,
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
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
        <Stack direction="row" spacing={1.5} sx={{ width: "auto" }}>
          {hasChanges && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Undo />}
                onClick={handleDiscard}
                sx={{
                  borderRadius: 2,
                  fontWeight: "bold",
                  textTransform: "none",
                  px: 3,
                }}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Save />}
                onClick={handleBulkSave}
                sx={{
                  borderRadius: 2,
                  fontWeight: "bold",
                  textTransform: "none",
                  px: 3,
                }}
              >
                Save Changes
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Print />}
            onClick={() => setOpenPrintModal(true)}
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
            }}
          >
            Print
          </Button>
          <Button
            variant={isEditingQty ? "contained" : "outlined"}
            color={isEditingQty ? "warning" : "primary"}
            startIcon={<EditNote />}
            onClick={() => setIsEditingQty(!isEditingQty)}
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
            }}
          >
            {isEditingQty ? "Lock" : "Edit Qty"}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
            }}
          >
            Add Material
          </Button>
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: { xs: 1, sm: 2 } }}
      >
        {/* --- FILTER BAR --- */}
        <Grid
          container
          spacing={2}
          sx={{ mb: 3, p: { xs: 1, sm: 2 } }}
          alignItems="center"
        >
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
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
            />
          </Grid>

          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="Plastic">Plastic</MenuItem>
              <MenuItem value="Injection">Injection</MenuItem>
              <MenuItem value="Paper">Paper</MenuItem>
              <MenuItem value="Trading">Trading</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="In Stock">In Stock</MenuItem>
              <MenuItem value="Low Stock">Low Stock</MenuItem>
              <MenuItem value="Out of Stock">Out of Stock</MenuItem>
            </TextField>
          </Grid>

          {(searchQuery ||
            categoryFilter !== "All" ||
            statusFilter !== "All") && (
            <Grid item xs={12} md={1}>
              <Button
                startIcon={<FilterListOff />}
                onClick={handleResetFilters}
                color="inherit"
                size="small"
                fullWidth
              >
                Reset
              </Button>
            </Grid>
          )}
        </Grid>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa",
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Material Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Measurement
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>
                    {isEditingQty && (
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Adjustment
                      </TableCell>
                    )}
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
                      <TableCell
                        colSpan={isEditingQty ? 8 : 7}
                        align="center"
                        sx={{ py: 5 }}
                      >
                        No raw materials match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMaterials.map((row) => {
                      const status = getStatus(row);
                      // Dynamic label for adjustment
                      let adjustmentLabel = "Adjustment";
                      if (parseInt(row.adjustment) > 0)
                        adjustmentLabel = "Stock In";
                      if (parseInt(row.adjustment) < 0)
                        adjustmentLabel = "Stock Out";

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
                              {row.measurementValue}
                              {row.measurementUnit} {row.packaging}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              variant={isEditingQty ? "outlined" : "standard"}
                              disabled={!isEditingQty}
                              value={row.quantity}
                              onChange={(e) =>
                                handleQuantityChangeLocal(
                                  row.id,
                                  e.target.value,
                                )
                              }
                              InputProps={{
                                disableUnderline: true,
                                sx: {
                                  fontWeight: "bold",
                                  width: "100px",
                                  "& input": {
                                    textAlign: "left",
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          {isEditingQty && (
                            <TableCell>
                              <TextField
                                size="small"
                                label={adjustmentLabel}
                                placeholder="+/-"
                                value={row.adjustment || ""}
                                onChange={(e) =>
                                  handleAdjustmentChange(row.id, e.target.value)
                                }
                                color={
                                  parseInt(row.adjustment) > 0
                                    ? "success"
                                    : parseInt(row.adjustment) < 0
                                      ? "error"
                                      : "primary"
                                }
                                sx={{ width: "120px" }}
                              />
                            </TableCell>
                          )}
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
            </Box>
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
