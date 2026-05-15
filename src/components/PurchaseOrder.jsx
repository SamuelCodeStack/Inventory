import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
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
  InputAdornment,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  Divider,
  TablePagination,
  MenuItem,
  Grid, // Added for responsiveness
} from "@mui/material";
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Search,
  Print,
  LocalShipping,
  CheckCircleOutline,
  FilterListOff,
} from "@mui/icons-material";

import CreatePOModal from "./CreatePOModal";
import UpdatePOModal from "./UpdatePOModal";
import ViewPOModal from "./ViewPOModal";
import DeliveryActionModal from "./DeliveryActionModal";
import PrintPOReportModal from "./PrintPOReportModal";

// Define consistent status options for the filter
const statusFilterOptions = [
  "Job Order",
  "Pending",
  "Partial",
  "Delivered",
  "Backload",
];

export default function PurchaseOrder({ mode }) {
  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // --- USER ROLE LOGIC ---
  const userLevel = parseInt(localStorage.getItem("userLevel")); // 0: Superadmin, 1: Admin, 2: Office, 3: Production, 4: Viewer
  const canManagePO = userLevel === 0 || userLevel === 1 || userLevel === 2; // Superadmin and Admin can Create/Print/Update
  const canSeeActions = userLevel === 0 || userLevel === 1 || userLevel === 2; // Only Superadmin and Admin see the action column buttons

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isDark = mode === "dark";

  // --- API CALLS ---
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders`,
      );
      // const response = await fetch("http://localhost:3000/api/purchase-orders");
      const data = await response.json();
      setPoData(data);
    } catch (error) {
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();

    // --- CLEANUP EFFECT TO FIX DISABLED SCROLLBAR ---
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, []);

  // --- HELPERS ---
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusStyle = (status) => {
    const clean = status?.replace(/\s/g, "") || "";
    switch (clean) {
      case "JobOrder":
        return { color: "#3498db", bg: "rgba(52, 152, 219, 0.1)" };
      case "Pending":
        return { color: "#f19149", bg: "rgba(241, 145, 73, 0.1)" };
      case "Partial":
        return { color: "#f39c12", bg: "rgba(243, 156, 18, 0.1)" };
      case "DeliverOnGoing":
        return { color: "#9b59b2", bg: "rgba(155, 89, 182, 0.1)" };
      case "Delivered":
        return { color: "#2ecc71", bg: "rgba(46, 204, 113, 0.1)" };
      case "Backload":
        return { color: "#e74c3c", bg: "rgba(231, 76, 60, 0.15)" };
      default:
        return { color: "text.primary", bg: "transparent" };
    }
  };

  // --- HANDLERS ---
  const handleStatusUpdate = async (id, newStatus, remarks = "") => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${id}/status`,
        // `http://localhost:3000/api/purchase-orders/${id}/status`,
        {
          method: "PATCH",
          credentials: "include", // FIXED: Added to ensure the user session is sent for logging
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, remarks: remarks }),
        },
      );
      if (response.ok) {
        fetchPurchaseOrders();
        showSnackbar(`Order status updated to ${newStatus}`, "success");
      }
    } catch (error) {
      showSnackbar("Error connecting to server", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PO?")) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders/${id}`,
        // `http://localhost:3000/api/purchase-orders/${id}`,
        {
          method: "DELETE",
          credentials: "include", // Required to send session cookies for activity logs
        },
      );
      if (response.ok) {
        fetchPurchaseOrders();
        showSnackbar("Purchase Order deleted", "error");
      }
    } catch (error) {
      showSnackbar("Error deleting PO", "error");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- FILTER & SORT LOGIC ---
  const filteredAndSortedData = poData
    .filter((row) => {
      const matchesSearch =
        row.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.poNo.includes(searchQuery);

      const matchesStatus =
        statusFilter === "All" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const priority = { "Job Order": 1, Pending: 2, Partial: 3 };
      const aPriority = priority[a.status] || 4;
      const bPriority = priority[b.status] || 4;
      return aPriority - bPriority;
    });

  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order Workflow Management
          </Typography>
        </Box>

        {/* ACTION BUTTONS: Visible only to Admin (0) and Office (1) */}
        {canManagePO && (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<Print />}
              onClick={() => setOpenPrintModal(true)}
              fullWidth={false}
              sx={{
                flex: { xs: 1, md: "none" },
                height: 32,
                px: 2,
                fontSize: "0.8125rem",
              }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Add />}
              onClick={() => setOpenCreateModal(true)}
              sx={{
                fontWeight: "bold",
                color: "#000000",
                flex: { xs: 1, md: "none" },
                height: 32,
                px: 2,
                fontSize: "0.8125rem",
              }}
            >
              Create PO
            </Button>
          </Stack>
        )}
      </Box>

      {/* Main Table Container */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: { xs: 1, sm: 3 }, backgroundImage: "none" }}
      >
        {/* --- FILTER BAR --- */}
        <Grid container spacing={2} sx={{ mb: 3, alignItems: "center" }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search customer or PO#..."
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

          <Grid item xs={12} sm={8} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status Filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              SelectProps={{
                MenuProps: { disableScrollLock: true }, // Prevents scroll lock on select
              }}
            >
              <MenuItem value="All">All Status</MenuItem>
              {statusFilterOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {(searchQuery || statusFilter !== "All") && (
            <Grid item xs={12} sm={4} md={2}>
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

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover",
              }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>PO Number</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => {
                const style = getStatusStyle(row.status);
                const clean = row.status?.replace(/\s/g, "") || "";
                const isOngoing = clean === "DeliverOnGoing";
                const isFinal = clean === "Delivered" || clean === "Backload";
                const isActionAvailable =
                  clean === "JobOrder" ||
                  clean === "Pending" ||
                  clean === "Partial" ||
                  isOngoing;

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>#{row.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {row.customer}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.poNo}</TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={
                          isOngoing ? (
                            <LocalShipping
                              style={{ fontSize: "1rem", color: style.color }}
                            />
                          ) : null
                        }
                        label={row.status}
                        sx={{
                          fontWeight: "bold",
                          bgcolor: style.bg,
                          color: style.color,
                          border: "none",
                          fontSize: "0.75rem",
                          height: 28,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Tooltip title={row.remarks || ""}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontStyle: row.remarks ? "normal" : "italic",
                          }}
                        >
                          {row.remarks || "No remarks"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                        member="true"
                      >
                        {/* UPDATE STATUS: Only Admin and Office */}
                        {canSeeActions && isActionAvailable && (
                          <Tooltip title="Update Status">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedPO(row);
                                setOpenDeliveryModal(true);
                              }}
                              sx={{ bgcolor: "rgba(25, 118, 210, 0.1)" }}
                            >
                              <CheckCircleOutline fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* VIEW: Always visible to all roles */}
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPO(row);
                            setOpenViewModal(true);
                          }}
                          sx={{
                            color: "#2ecc71",
                            bgcolor: "rgba(46, 204, 113, 0.1)",
                          }}
                        >
                          <Visibility fontSize="inherit" />
                        </IconButton>

                        {/* EDIT: Only Admin and Office */}
                        {canSeeActions && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPO(row);
                              setOpenUpdateModal(true);
                            }}
                            disabled={isOngoing || isFinal}
                            sx={{
                              color: "#3498db",
                              bgcolor: "rgba(52, 152, 219, 0.1)",
                            }}
                          >
                            <Edit fontSize="inherit" />
                          </IconButton>
                        )}

                        {/* DELETE: Only Admin and Office */}
                        {canSeeActions && (
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(row.id)}
                            sx={{
                              color: "#e74c3c",
                              bgcolor: "rgba(231, 76, 60, 0.1)",
                            }}
                          >
                            <Delete fontSize="inherit" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No purchase orders match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          SelectProps={{
            MenuProps: { disableScrollLock: true }, // Prevents scroll lock on rows per page select
          }}
        />
      </TableContainer>

      {/* Modals and other components remain unchanged */}
      <DeliveryActionModal
        open={openDeliveryModal}
        handleClose={() => setOpenDeliveryModal(false)}
        po={selectedPO}
        onUpdate={handleStatusUpdate}
      />
      <CreatePOModal
        open={openCreateModal}
        handleClose={() => setOpenCreateModal(false)}
        onSaveSuccess={() => {
          fetchPurchaseOrders();
          showSnackbar("Purchase Order created successfully!", "success");
        }}
        mode={mode}
      />
      {selectedPO && (
        <>
          <UpdatePOModal
            open={openUpdateModal}
            handleClose={() => setOpenUpdateModal(false)}
            onUpdateSuccess={() => {
              fetchPurchaseOrders();
              showSnackbar("Purchase Order updated successfully!", "info");
            }}
            mode={mode}
            poData={selectedPO}
          />
          <ViewPOModal
            open={openViewModal}
            handleClose={() => setOpenViewModal(false)}
            mode={mode}
            poData={selectedPO}
          />
        </>
      )}
      <PrintPOReportModal
        open={openPrintModal}
        handleClose={() => setOpenPrintModal(false)}
        poData={poData}
      />

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
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
