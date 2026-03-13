import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  TextField,
  Stack,
  Tooltip,
} from "@mui/material";
import { Close, Edit, Check, Cancel, DeleteOutline } from "@mui/icons-material";

export default function LeftoverModal({ open, handleClose, mode }) {
  const [leftovers, setLeftovers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const fetchLeftovers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/leftovers");
      const data = await response.json();
      setLeftovers(data);
    } catch (error) {
      console.error("Error fetching leftovers:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeftovers();
      setEditingId(null);
    }
  }, [open]);

  const handleStartEdit = (row) => {
    setEditingId(row.leftover_id);
    setEditValue(row.quantity);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/leftovers/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: parseFloat(editValue) }),
        },
      );

      if (response.ok) {
        setLeftovers((prev) =>
          prev.map((item) =>
            item.leftover_id === id
              ? { ...item, quantity: parseFloat(editValue) }
              : item,
          ),
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to remove this leftover record?")
    )
      return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/leftovers/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setLeftovers((prev) => prev.filter((item) => item.leftover_id !== id));
      }
    } catch (error) {
      console.error("Error deleting leftover:", error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Leftover Materials Inventory
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 1 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table stickyHeader size="small">
            <TableHead
              sx={{
                "& th": {
                  bgcolor: mode === "light" ? "#f5f5f5" : "#1e1e1e",
                  fontWeight: "bold",
                },
              }}
            >
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Material Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Qty Available</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Type & Remarks</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leftovers.length > 0 ? (
                leftovers.map((row) => (
                  <TableRow key={row.leftover_id} hover>
                    <TableCell>LO-{row.leftover_id}</TableCell>
                    <TableCell sx={{ fontWeight: "medium" }}>
                      {row.material_name}
                    </TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="right">
                      {editingId === row.leftover_id ? (
                        <TextField
                          type="number"
                          size="small"
                          variant="standard"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          sx={{
                            width: "70px",
                            "& input": {
                              textAlign: "right",
                              fontWeight: "bold",
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold", color: "secondary.main" }}
                        >
                          {row.quantity}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>
                      <Stack spacing={0}>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="primary"
                        >
                          {row.type}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: 150 }}
                        >
                          {row.remarks || "No remarks"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      {editingId === row.leftover_id ? (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleSaveEdit(row.leftover_id)}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={handleCancelEdit}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          <Tooltip title="Edit Quantity">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleStartEdit(row)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Record">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(row.leftover_id)}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      No leftover materials currently in stock.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
