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
} from "@mui/material";
import {
  FileUpload,
  Add,
  Visibility,
  Edit,
  Delete,
  Search,
  Print, // Added Print Icon
} from "@mui/icons-material";
import CreatePOModal from "./CreatePOModal";
import UpdatePOModal from "./UpdatePOModal";
import ViewPOModal from "./ViewPOModal";

export default function PurchaseOrder({ mode }) {
  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const componentRef = useRef(); // Ref for printing

  // Print Logic
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Kimwin_Corporation_PO_Report",
  });

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/purchase-orders");
      const data = await response.json();
      setPoData(data);
    } catch (error) {
      console.error("Error fetching POs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Job Order":
        return { color: "info", variant: "filled" };
      case "Done":
        return { color: "success", variant: "filled" };
      case "Pending":
        return { color: "warning", variant: "filled" };
      default:
        return { color: "default", variant: "outlined" };
    }
  };

  const handleSaveSuccess = () => {
    setOpenCreateModal(false);
    setOpenUpdateModal(false);
    fetchPurchaseOrders();
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
    if (window.confirm("Are you sure?")) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/purchase-orders/${id}`,
          { method: "DELETE" },
        );
        if (response.ok) fetchPurchaseOrders();
      } catch (error) {
        alert("Error deleting");
      }
    }
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Purchase Order
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard / Purchase Order
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => handlePrint()}
          >
            Print All
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateModal(true)}
          >
            Create PO
          </Button>
        </Stack>
      </Box>

      {/* Visible Dashboard Table */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 2, backgroundImage: "none" }}
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
            Purchase Order List
          </Typography>
          <TextField
            size="small"
            placeholder="Search orders..."
            value={searchQuery}
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
              <TableCell sx={{ fontWeight: "bold" }}>PO ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>PO No.</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date Created</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Action
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
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.customer}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.poNo}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status}
                      size="small"
                      {...getStatusStyle(row.status)}
                      sx={{ fontWeight: 600 }}
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
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <Box sx={{ display: "none" }}>
        <Box
          ref={componentRef}
          sx={{ p: "10mm", bgcolor: "white", color: "black", width: "210mm" }}
        >
          <style>{`
            @media print {
              @page { size: A4; margin: 0; }
              body { margin: 0; -webkit-print-color-adjust: exact; }
              * { color: black !important; border-color: #ddd !important; }
            }
          `}</style>

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
              <Typography variant="h6">Purchase Order Master List</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2">
                Report Date: {new Date().toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                Total Records: {poData.length}
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
                    bgcolor: "#f5f5f5 !important",
                  },
                }}
              >
                <TableCell>ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>PO No.</TableCell>
                <TableCell>Date Created</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {poData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {row.customer}
                  </TableCell>
                  <TableCell>{row.poNo}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell align="center">{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box
            sx={{
              mt: 10,
              display: "flex",
              justifyContent: "space-between",
              px: 4,
            }}
          >
            <Box
              sx={{
                borderTop: "1px solid black !important",
                width: 200,
                textAlign: "center",
                pt: 1,
              }}
            >
              <Typography variant="body2">Prepared By</Typography>
            </Box>
            <Box
              sx={{
                borderTop: "1px solid black !important",
                width: 200,
                textAlign: "center",
                pt: 1,
              }}
            >
              <Typography variant="body2">Authorized By</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <CreatePOModal
        open={openCreateModal}
        handleClose={() => setOpenCreateModal(false)}
        onSaveSuccess={handleSaveSuccess}
        mode={mode}
      />
      {selectedPO && (
        <>
          <UpdatePOModal
            open={openUpdateModal}
            handleClose={() => setOpenUpdateModal(false)}
            onUpdateSuccess={handleSaveSuccess}
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
    </Box>
  );
}
