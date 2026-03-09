import React, { useState } from "react";
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
} from "@mui/material";
import {
  FileUpload,
  Add,
  Visibility,
  Edit,
  Delete,
  Search,
  FilterList,
} from "@mui/icons-material";
import CreatePOModal from "./CreatePOModal";
import UpdatePOModal from "./UpdatePOModal";
import ViewPOModal from "./ViewPOModal";

const poData = [
  {
    id: 1,
    poId: "PO-1001",
    customer: "John Doe",
    email: "john@example.com",
    contact: "09123456789",
    poNo: "PO-2024-001",
    status: "Job Order", // Changed key from remarks to status
    totalPrice: "1,200.00",
    fullItems: [
      {
        name: "Macbook Pro M1",
        category: "Plastic",
        unit: "Pieces",
        quantity: 1,
      },
    ],
  },
  {
    id: 2,
    poId: "PO-1002",
    customer: "Sarah Williams",
    email: "sarah@example.com",
    contact: "09987654321",
    poNo: "PO-2024-002",
    status: "Done", // Changed key from remarks to status
    totalPrice: "250.00",
    fullItems: [
      {
        name: "Mechanical Keyboard",
        category: "Injection",
        unit: "Bundle",
        quantity: 2,
      },
    ],
  },
];

export default function PurchaseOrder({ mode }) {
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const prepareModalData = (po) => ({
    id: po.id,
    poNumber: po.poNo,
    customerName: po.customer,
    email: po.email,
    contact: po.contact,
    status: po.status, // Renamed from remark
    totalPrice: po.totalPrice,
    fullItems: po.fullItems,
  });

  const handleEditClick = (po) => {
    setSelectedPO(prepareModalData(po));
    setOpenUpdateModal(true);
  };

  const handleViewClick = (po) => {
    setSelectedPO(prepareModalData(po));
    setOpenViewModal(true);
  };

  const getStatusStyle = (status) => {
    if (status === "Job Order") return { color: "info", variant: "filled" };
    if (status === "Done") return { color: "success", variant: "filled" };
    return { color: "default", variant: "soft" };
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Purchase Order
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard / Purchase Order
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FileUpload />}
            sx={{
              textTransform: "none",
              borderColor: "primary.main",
              color: "primary.main",
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateModal(true)}
            sx={{
              bgcolor: "primary.main",
              textTransform: "none",
              "&:hover": { bgcolor: "#d87d3a" },
              boxShadow: "none",
            }}
          >
            Create PO
          </Button>
        </Stack>
      </Box>

      {/* Main Table Container */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          p: 2,
          backgroundImage: "none",
          boxShadow:
            mode === "light"
              ? "0px 2px 8px rgba(0,0,0,0.05)"
              : "0px 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Table Toolbar: Label + Search */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="text.primary"
          >
            Purchase Order List
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: 250,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor:
                    mode === "light"
                      ? "background.default"
                      : "rgba(255,255,255,0.05)",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{
                color: "text.primary",
                borderColor: "divider",
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Filter
            </Button>
          </Stack>
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
                  <TableCell sx={{ fontWeight: "medium" }}>
                    {row.poId}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.customer}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.poNo}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.status}
                      size="small"
                      {...getStatusStyle(row.status)}
                      sx={{ fontWeight: 600, borderRadius: 1.5 }}
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

      {/* Modals */}
      <CreatePOModal
        open={openCreateModal}
        handleClose={() => setOpenCreateModal(false)}
        mode={mode}
      />
      <UpdatePOModal
        open={openUpdateModal}
        handleClose={() => setOpenUpdateModal(false)}
        mode={mode}
        poData={selectedPO}
      />
      <ViewPOModal
        open={openViewModal}
        handleClose={() => setOpenViewModal(false)}
        mode={mode}
        poData={selectedPO}
      />
    </Box>
  );
}
