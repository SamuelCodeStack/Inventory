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
  Divider,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Visibility,
  Edit,
  Delete,
  Search,
  Print,
} from "@mui/icons-material";
import CreatePOModal from "./CreatePOModal";
import UpdatePOModal from "./UpdatePOModal";
import ViewPOModal from "./ViewPOModal";

const THEME_ORANGE = "#f2994a";

export default function PurchaseOrder({ mode }) {
  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const componentRef = useRef();
  const isDark = mode === "dark";

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/purchase-orders");
      const data = await response.json();
      setPoData(data);
    } catch (error) {
      console.error("Error fetching POs:", error);
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Kimwin_Corporation_PO_Report",
    onAfterPrint: () => showSnackbar("Master list report generated!", "info"),
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Job Order":
        return { bgcolor: "rgba(52, 152, 219, 0.2)", color: "#3498db" };
      case "Done":
        return { bgcolor: "rgba(46, 204, 113, 0.2)", color: "#2ecc71" };
      case "Pending":
        return { bgcolor: "rgba(241, 145, 73, 0.2)", color: THEME_ORANGE };
      default:
        return { bgcolor: "rgba(0,0,0,0.1)", color: "inherit" };
    }
  };

  const handleEditClick = (po) => {
    setSelectedPO(po);
    setOpenUpdateModal(true);
  };

  const handleViewClick = (po) => {
    setSelectedPO(po);
    setOpenViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PO?")) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/purchase-orders/${id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        fetchPurchaseOrders();
        showSnackbar("Purchase Order deleted", "error");
      }
    } catch (error) {
      showSnackbar("Error connecting to server", "error");
    }
  };

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
            Dashboard / Purchase Order
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print All
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateModal(true)}
            sx={{
              bgcolor: THEME_ORANGE,
              color: "#000",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#d8853a" },
            }}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
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
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {poData
              .filter(
                (row) =>
                  row.customer
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  row.poNo.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {row.customer}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.poNo}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "0.7rem",
                        ...getStatusStyle(row.status),
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="View Order">
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
                      </Tooltip>

                      <Tooltip
                        title={
                          row.status === "Done"
                            ? "Completed orders cannot be edited"
                            : "Edit Order"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(row)}
                            // DISABLE LOGIC APPLIED HERE
                            disabled={row.status === "Done"}
                            sx={{
                              color: "#3498db",
                              bgcolor: "rgba(52, 152, 219, 0.1)",
                              "&.Mui-disabled": {
                                bgcolor: isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.05)",
                                color: "text.disabled",
                              },
                            }}
                          >
                            <Edit fontSize="inherit" />
                          </IconButton>
                        </span>
                      </Tooltip>

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
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <Box sx={{ position: "absolute", left: "-9999px", top: 0 }}>
        <Box
          ref={componentRef}
          sx={{ p: "15mm", bgcolor: "white", color: "black", width: "210mm" }}
        >
          <style>{`
            @media print {
              @page { size: A4; margin: 15mm; }
              body { background-color: white !important; }
              * { color: black !important; border-color: #333 !important; -webkit-print-color-adjust: exact; }
              .p-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .p-table th, .p-table td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            }
          `}</style>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#1a237e !important" }}
          >
            KIMWIN CORPORATION
          </Typography>
          <Typography variant="h6">Purchase Order Master List</Typography>
          <Divider sx={{ my: 2, borderColor: "black !important" }} />
          <table className="p-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>PO No.</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {poData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.customer}</td>
                  <td>{row.poNo}</td>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Modals & Feedback */}
      <CreatePOModal
        open={openCreateModal}
        handleClose={() => setOpenCreateModal(false)}
        onSaveSuccess={fetchPurchaseOrders}
        mode={mode}
      />
      {selectedPO && (
        <>
          <UpdatePOModal
            open={openUpdateModal}
            handleClose={() => setOpenUpdateModal(false)}
            onUpdateSuccess={fetchPurchaseOrders}
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
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
