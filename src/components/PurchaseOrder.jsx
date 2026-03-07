import React from "react";
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
  FilterList,
  Visibility,
  Edit,
  Delete,
  Search,
} from "@mui/icons-material";
import CreatePOModal from "./CreatePOModal";

// Updated data structure
const poData = [
  {
    id: 1,
    poId: "PO-1001", // New PO ID column
    customer: "John Doe",
    poNo: "PO-2024-001",
    remarks: "Urgent", // Changed from Status
  },
  {
    id: 2,
    poId: "PO-1002",
    customer: "Sarah Williams",
    poNo: "PO-2024-002",
    remarks: "Standard",
  },
  {
    id: 3,
    poId: "PO-1003",
    customer: "TechCorp Solutions",
    poNo: "PO-2024-003",
    remarks: "Partial Delivery",
  },
  {
    id: 4,
    poId: "PO-1004",
    customer: "Mike Johnson",
    poNo: "PO-2024-004",
    remarks: "Fragile Items",
  },
];

export default function PurchaseOrder({ mode }) {
  const [openPOModal, setOpenPOModal] = React.useState(false);

  // Helper for Remark colors
  const getRemarkStyle = (remark) => {
    if (remark === "Urgent") return { color: "error", variant: "filled" };
    if (remark === "Partial Delivery")
      return { color: "warning", variant: "outlined" };
    return { color: "default", variant: "soft" };
  };

  return (
    <Box
      sx={{
        p: 4,
        mt: 8,
        backgroundColor: "background.default",
        minHeight: "100vh",
      }}
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
            sx={{ color: "primary.main", borderColor: "primary.main" }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenPOModal(true)}
            sx={{
              bgcolor: "primary.main",
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
            Recent Orders
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search PO or Customer..."
              variant="outlined"
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
              size="medium"
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
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                PO ID
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                Customer Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.primary" }}>
                PO No.
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: "bold", color: "text.primary" }}
              >
                Remarks
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", color: "text.primary" }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {poData.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ color: "text.primary", fontWeight: "medium" }}>
                  {row.poId}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="text.primary"
                  >
                    {row.customer}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: "text.primary" }}>{row.poNo}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.remarks}
                    size="small"
                    color={getRemarkStyle(row.remarks).color}
                    variant={getRemarkStyle(row.remarks).variant}
                    sx={{ fontWeight: 600, borderRadius: 1.5 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={0.5}
                    justifyContent="flex-end"
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: "#2ecc71",
                        bgcolor:
                          mode === "light"
                            ? "rgba(46, 204, 113, 0.1)"
                            : "rgba(46, 204, 113, 0.2)",
                      }}
                    >
                      <Visibility fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        color: "#3498db",
                        bgcolor:
                          mode === "light"
                            ? "rgba(52, 152, 219, 0.1)"
                            : "rgba(52, 152, 219, 0.2)",
                      }}
                    >
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        color: "#e74c3c",
                        bgcolor:
                          mode === "light"
                            ? "rgba(231, 76, 60, 0.1)"
                            : "rgba(231, 76, 60, 0.2)",
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

      <CreatePOModal
        open={openPOModal}
        handleClose={() => setOpenPOModal(false)}
        mode={mode}
      />
    </Box>
  );
}
