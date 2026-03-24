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
} from "@mui/icons-material";

import CreatePOModal from "./CreatePOModal";
import UpdatePOModal from "./UpdatePOModal";
import ViewPOModal from "./ViewPOModal";
import DeliveryActionModal from "./DeliveryActionModal";
import PrintPOReportModal from "./PrintPOReportModal";

export default function PurchaseOrder({ mode }) {
  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const componentRef = useRef();
  const isDark = mode === "dark";

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

  // --- API CALLS ---
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/purchase-orders");
      const data = await response.json();
      setPoData(data);
    } catch (error) {
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus, remarks = "") => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/purchase-orders/${id}/status`,
        {
          method: "PATCH",
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

  const handleViewClick = (po) => {
    setSelectedPO(po);
    setOpenViewModal(true);
  };
  const handleEditClick = (po) => {
    setSelectedPO(po);
    setOpenUpdateModal(true);
  };
  const handleDeliveryActionClick = (po) => {
    setSelectedPO(po);
    setOpenDeliveryModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PO?")) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/purchase-orders/${id}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        fetchPurchaseOrders();
        showSnackbar("Purchase Order deleted", "error");
      }
    } catch (error) {
      showSnackbar("Error deleting PO", "error");
    }
  };

  // --- PAGINATION HANDLERS ---
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // --- FILTER & SORT LOGIC ---
  const filteredAndSortedData = poData
    .filter(
      (row) =>
        row.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.poNo.includes(searchQuery),
    )
    .sort((a, b) => {
      const priority = { "Job Order": 1, Pending: 2 };
      const aPriority = priority[a.status] || 3;
      const bPriority = priority[b.status] || 3;
      return aPriority - bPriority;
    });

  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order Workflow Management
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => setOpenPrintModal(true)}
          >
            Print Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setOpenCreateModal(true)}
            sx={{ fontWeight: "bold", color: "#000000" }}
          >
            Create PO
          </Button>
        </Stack>
      </Box>

      {/* Main Table Container */}
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
            Master Order List
          </Typography>
          <TextField
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
            sx={{ width: 300 }}
          />
        </Box>

        <Table size="small">
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover" }}
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
                clean === "JobOrder" || clean === "Pending" || isOngoing;

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
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      {isActionAvailable && (
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDeliveryActionClick(row)}
                            sx={{ bgcolor: "rgba(25, 118, 210, 0.1)" }}
                          >
                            <CheckCircleOutline fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleViewClick(row)}
                        sx={{
                          color: "#2ecc71",
                          bgcolor: "rgba(46, 204, 113, 0.1)",
                        }}
                      >
                        <Visibility fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(row)}
                        disabled={isOngoing || isFinal}
                        sx={{
                          color: "#3498db",
                          bgcolor: "rgba(52, 152, 219, 0.1)",
                        }}
                      >
                        <Edit fontSize="inherit" />
                      </IconButton>
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
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Modals */}
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

      {/* Snackbar */}
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
