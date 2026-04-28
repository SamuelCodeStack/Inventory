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
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  TablePagination,
  MenuItem,
  Grid, // Added for responsiveness
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
  FilterListOff,
  Undo, // Added for Discard icon consistency
} from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";
import PrintInventoryModal from "./PrintInventoryModal";

export default function Inventory({ mode, user }) {
  const [inventoryData, setInventoryData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isDark = mode === "dark";

  // --- ROLE CONSTANTS ---
  // Updated roles: ADMIN (0) and PRODUCTION (2) can do everything. OFFICE (1) and VIEW (3) only see.
  const canModify =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 2 ||
    user?.user_level === "2";

  const canViewActionColumn =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 2 ||
    user?.user_level === "2";

  const showMessage = (msg, sev = "success") =>
    setSnackbar({ open: true, message: msg, severity: sev });

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory`);
      // const response = await fetch("http://localhost:3000/api/inventory");
      const data = await response.json();
      // Initialize movement value as empty string for each item
      const initializedData = data.map((item) => ({ ...item, movement: "" }));
      setInventoryData(initializedData);
      setOriginalData(JSON.parse(JSON.stringify(initializedData)));
    } catch (error) {
      showMessage("Network Error: Could not connect to server", "error");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- FILTER LOGIC ---
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id).includes(searchQuery);
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setPage(0);
  };

  // Pagination Handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const hasChanges = inventoryData.some((item) => {
    const originalItem = originalData.find(
      (orig) => String(orig.id).split(":")[0] === String(item.id).split(":")[0],
    );
    return originalItem && item.quantity !== originalItem.quantity;
  });

  const handleQuantityChangeLocal = (id, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const threshold = item.minStock || 10;
          let newStatus =
            qty === 0
              ? "Out of Stock"
              : qty <= threshold
                ? "Low Stock"
                : "In Stock";
          return { ...item, quantity: qty, status: newStatus };
        }
        return item;
      }),
    );
  };

  // Logic for the Stock In/Out Input
  const handleMovementChange = (id, value) => {
    // Allow only numbers and the minus sign
    if (/[^-0-9]/.test(value) && value !== "") return;

    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const movementVal = value === "-" ? "-" : parseInt(value) || 0;
          const originalItem = originalData.find((o) => o.id === id);
          const baseQty = originalItem ? originalItem.quantity : item.quantity;

          const finalMovement = value === "-" ? 0 : movementVal;
          const newQty = baseQty + finalMovement;

          const threshold = item.minStock || 10;
          let newStatus =
            newQty === 0
              ? "Out of Stock"
              : newQty <= threshold
                ? "Low Stock"
                : "In Stock";

          return {
            ...item,
            movement: value,
            quantity: newQty >= 0 ? newQty : 0,
            status: newStatus,
          };
        }
        return item;
      }),
    );
  };

  const handleDiscard = () => {
    setInventoryData(JSON.parse(JSON.stringify(originalData)));
    setIsEditingQty(false); // This locks the quantity fields
    showMessage("Changes discarded", "info");
  };

  const handleBulkSave = async () => {
    const payload = {
      items: inventoryData
        .filter((item) => {
          const original = originalData.find((o) => o.id === item.id);
          return original && item.quantity !== original.quantity;
        })
        .map((item) => ({
          id: String(item.id).split(":")[0],
          quantity: item.quantity,
        })),
    };
    try {
      const response = await fetch(
        // `http://localhost:3000/api/inventory/bulk`,
        `${import.meta.env.VITE_API_URL}/inventory/bulk`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (response.ok) {
        showMessage("Quantities updated!", "info");
        setIsEditingQty(false);
        fetchInventory();
      }
    } catch (error) {
      showMessage("Save failed", "error");
    }
  };

  const handleDelete = async (id) => {
    const cleanId = String(id).split(":")[0];
    if (!window.confirm(`Delete item #${cleanId}?`)) return;
    try {
      const res = await fetch(
        // `http://localhost:3000/api/inventory/${cleanId}`,
        `${import.meta.env.VITE_API_URL}/inventory/${cleanId}`,
        {
          method: "DELETE",
          credentials: "include", // Required to send session cookies for activity logs
        },
      );
      if (res.ok) {
        setInventoryData((prev) => prev.filter((item) => item.id !== id));
        showMessage("Deleted successfully", "success");
      }
    } catch (e) {
      showMessage("Delete failed", "error");
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 }, // Reduced padding on mobile
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Stack on mobile
          justifyContent: "space-between",
          mb: 3,
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Inventory Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stock Control & Material Tracking
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            width: { xs: "100%", sm: "auto" },
            overflowX: "auto", // Allow buttons to scroll if they overflow
            pb: { xs: 1, sm: 0 },
          }}
        >
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
            startIcon={<Print />}
            onClick={() => setOpenPrintModal(true)}
            size="small"
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
              flexShrink: 0,
            }}
          >
            Print
          </Button>

          {/* EDIT QTY AND ADD ITEM RESTRICTED TO ADMIN/PRODUCTION */}
          {canModify && (
            <>
              <Button
                variant={isEditingQty ? "contained" : "outlined"}
                color={isEditingQty ? "warning" : "primary"}
                startIcon={<EditNote />}
                onClick={() => setIsEditingQty(!isEditingQty)}
                size="small"
                sx={{
                  borderRadius: 2,
                  fontWeight: "bold",
                  textTransform: "none",
                  px: 3,
                  flexShrink: 0,
                }}
              >
                {isEditingQty ? "Lock" : "Edit Qty"}
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenAddModal(true)}
                size="small"
                sx={{
                  borderRadius: 2,
                  fontWeight: "bold",
                  textTransform: "none",
                  px: 3,
                  flexShrink: 0,
                }}
              >
                Add Item
              </Button>
            </>
          )}
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: { xs: 1, sm: 2 } }}
      >
        {/* --- FILTER BAR --- */}
        <Grid container spacing={2} sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
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
            <Grid item xs={12}>
              <Button
                startIcon={<FilterListOff />}
                onClick={handleResetFilters}
                color="inherit"
                size="small"
              >
                Reset Filters
              </Button>
            </Grid>
          )}
        </Grid>

        <Box sx={{ overflowX: "auto" }}>
          {" "}
          {/* Added horizontal scroll for table */}
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover",
              }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Price
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Quantity
                </TableCell>
                {isEditingQty && (
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    Adjustment
                  </TableCell>
                )}
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Status
                </TableCell>
                {/* ACTION COLUMN VISIBLE ONLY TO ADMIN/PRODUCTION */}
                {canViewActionColumn && (
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>#{String(row.id).split(":")[0]}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{row.uom}</TableCell>
                  <TableCell align="right">
                    ₱
                    {Number(row.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
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
                          "& input": {
                            textAlign: "right",
                            paddingRight: "8px",
                          },
                        },
                      }}
                    />
                  </TableCell>

                  {/* Adjustment Input (Stock In/Out Functionality) */}
                  {isEditingQty && (
                    <TableCell align="center">
                      <TextField
                        placeholder="+/-"
                        label={
                          parseFloat(row.movement) > 0
                            ? "Stock In"
                            : parseFloat(row.movement) < 0
                              ? "Stock Out"
                              : "Adjustment"
                        }
                        size="small"
                        value={row.movement || ""}
                        onChange={(e) =>
                          handleMovementChange(row.id, e.target.value)
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor:
                                parseFloat(row.movement) > 0
                                  ? "#2ecc71"
                                  : parseFloat(row.movement) < 0
                                    ? "#e74c3c"
                                    : "rgba(255, 255, 255, 0.23)",
                            },
                            "&:hover fieldset": {
                              borderColor:
                                parseFloat(row.movement) > 0
                                  ? "#2ecc71"
                                  : parseFloat(row.movement) < 0
                                    ? "#e74c3c"
                                    : "rgba(255, 255, 255, 0.5)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor:
                                parseFloat(row.movement) > 0
                                  ? "#2ecc71"
                                  : parseFloat(row.movement) < 0
                                    ? "#e74c3c"
                                    : "#f39c12",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color:
                              parseFloat(row.movement) > 0
                                ? "#2ecc71"
                                : parseFloat(row.movement) < 0
                                  ? "#e74c3c"
                                  : "text.secondary",
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color:
                              parseFloat(row.movement) > 0
                                ? "#2ecc71"
                                : parseFloat(row.movement) < 0
                                  ? "#e74c3c"
                                  : "#f39c12",
                          },
                        }}
                        InputProps={{
                          sx: {
                            fontSize: "0.9rem",
                            width: "120px",
                            fontWeight: "bold",
                            color: "text.primary",
                          },
                        }}
                      />
                    </TableCell>
                  )}

                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 2,
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        bgcolor:
                          row.status === "In Stock"
                            ? "rgba(46, 204, 113, 0.2)"
                            : row.status === "Low Stock"
                              ? "rgba(241, 145, 73, 0.2)"
                              : "rgba(231, 76, 60, 0.2)",
                        color:
                          row.status === "In Stock"
                            ? "#2ecc71"
                            : row.status === "Low Stock"
                              ? "#e67e22"
                              : "#e74c3c",
                        border: `1px solid ${
                          row.status === "In Stock"
                            ? "rgba(46, 204, 113, 0.3)"
                            : row.status === "Low Stock"
                              ? "rgba(241, 145, 73, 0.3)"
                              : "rgba(231, 76, 60, 0.3)"
                        }`,
                      }}
                    >
                      {row.status}
                    </Box>
                  </TableCell>

                  {/* ACTION BUTTONS RESTRICTED TO ADMIN/PRODUCTION */}
                  {canViewActionColumn && (
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
                            setSelectedItem({
                              ...row,
                              id: String(row.id).split(":")[0],
                            });
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
                  )}
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isEditingQty ? 9 : 8}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    No items match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <AddInventoryModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={() => {
          fetchInventory();
          showMessage("Added!", "success");
        }}
      />
      <EditInventoryModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        onSaveSuccess={() => {
          fetchInventory();
          showMessage("Updated!", "info");
        }}
        itemData={selectedItem}
      />
      <PrintInventoryModal
        open={openPrintModal}
        handleClose={() => setOpenPrintModal(false)}
        inventoryData={inventoryData}
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
