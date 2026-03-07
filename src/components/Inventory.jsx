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
  FilterList,
  Visibility,
  Edit,
  Delete,
  Search,
} from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";

const data = [
  {
    id: "01",
    name: "Macbook Pro M1 2020",
    category: "Laptop",
    uom: "Pieces",
    quantity: 120,
    status: "In Stock",
  },
  {
    id: "02",
    name: "Mechanical Keyboard",
    category: "Accessories",
    uom: "Boxes",
    quantity: 5,
    status: "Low Stock",
  },
  {
    id: "03",
    name: "Wired Mouse",
    category: "Accessories",
    uom: "Pieces",
    quantity: 0,
    status: "Out of Stock",
  },
];

export default function Inventory({ mode }) {
  // Modal States
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  // Data States
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Open Edit Modal with selected row data
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpenEditModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete item ${id}?`)) {
      console.log("Deleting item:", id);
      // Logic to filter local state or call API would go here
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "success";
      case "Low Stock":
        return "warning";
      case "Out of Stock":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard / Inventory
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FileUpload />}
            sx={{
              color: "primary.main",
              borderColor: "primary.main",
              textTransform: "none",
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              bgcolor: "primary.main",
              textTransform: "none",
              "&:hover": { bgcolor: "#d87d3a" },
              boxShadow: "none",
            }}
          >
            Add Inventory
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
            Inventory List
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search items..."
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
              <TableCell sx={{ fontWeight: "bold" }}>No</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Unit</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Quantity
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.id}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.category}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell color="text.secondary">{row.uom}</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {row.quantity}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.status}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{ fontWeight: 600, borderRadius: 1.5 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="small"
                      sx={{
                        color: "#2ecc71",
                        bgcolor: "rgba(46, 204, 113, 0.1)",
                      }}
                    >
                      <Visibility fontSize="inherit" />
                    </IconButton>

                    {/* EDIT BUTTON */}
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

                    {/* DELETE BUTTON */}
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

      {/* Modals */}
      <AddInventoryModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        mode={mode}
      />

      <EditInventoryModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        mode={mode}
        itemData={selectedItem}
      />
    </Box>
  );
}
