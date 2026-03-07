import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  InputAdornment,
  MenuItem, // Added for dropdown
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";

const inventoryItems = [
  { id: 1, name: "Macbook Pro M1", available: 120 },
  { id: 2, name: "Mechanical Keyboard", available: 230 },
  { id: 3, name: "Wired Mouse", available: 1230 },
  { id: 4, name: "Titan Watch", available: 600 },
];

// Options for the Remarks dropdown
const remarkOptions = [
  "Standard",
  "Urgent",
  "Partial Delivery",
  "Fragile Items",
  "Backordered",
];

export default function CreatePOModal({ open, handleClose, mode }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [remarks, setRemarks] = useState("Standard"); // Default remark

  const handleToggleItem = (itemId) => {
    const currentIndex = selectedItems.indexOf(itemId);
    const newChecked = [...selectedItems];
    if (currentIndex === -1) {
      newChecked.push(itemId);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setSelectedItems(newChecked);
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: mode === "light" ? "#fff" : "rgba(255, 255, 255, 0.03)",
      borderRadius: 2,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
          bgcolor: "background.paper",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Create New Purchase Order
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Typography
          variant="subtitle2"
          color="primary"
          fontWeight="bold"
          gutterBottom
        >
          Order Information
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="PO Number"
              placeholder="PO-2024-XXX"
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Total Price"
              type="number"
              sx={fieldStyle}
            />
          </Grid>

          {/* Added Remarks Dropdown */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              size="small"
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={fieldStyle}
            >
              {remarkOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Customer Name"
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Contact Number"
              sx={fieldStyle}
            />
          </Grid>
        </Grid>

        {/* Item Selection Table */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            Select Items
          </Typography>
          <TextField
            size="small"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200, ...fieldStyle }}
          />
        </Box>

        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            maxHeight: 300,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{
                    bgcolor:
                      mode === "light"
                        ? "action.hover"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Checkbox size="small" />
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    bgcolor:
                      mode === "light"
                        ? "action.hover"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  Item Name
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    bgcolor:
                      mode === "light"
                        ? "action.hover"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  Quantity to Order
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  selected={selectedItems.indexOf(item.id) !== -1}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedItems.indexOf(item.id) !== -1}
                      onChange={() => handleToggleItem(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Available: {item.available}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      disabled={selectedItems.indexOf(item.id) === -1}
                      defaultValue={1}
                      sx={{
                        width: 80,
                        "& .MuiInputBase-input": {
                          py: 0.5,
                          textAlign: "center",
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          sx={{ color: "text.secondary", textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            bgcolor: "primary.main",
            px: 4,
            textTransform: "none",
            "&:hover": { bgcolor: "#d87d3a" },
          }}
        >
          Create Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
