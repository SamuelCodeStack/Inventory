import React, { useState, useEffect } from "react";
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
  Typography,
  Paper,
  InputAdornment,
  Snackbar,
  Alert,
  MenuItem,
  Stack,
  Chip,
} from "@mui/material";
import {
  Close,
  Assignment,
  Inventory,
  DeleteOutline,
  Search,
  AddCircleOutline,
  Recycling,
} from "@mui/icons-material";

const statusOptions = ["Pending", "In Progress", "Completed"];

export default function CreateJOModal({
  open,
  handleClose,
  mode,
  onSaveSuccess,
}) {
  const [dbRawMaterials, setDbRawMaterials] = useState([]);
  const [leftoverMaterials, setLeftoverMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    itemName: "",
    handledBy: "",
    status: "Pending",
    quantityProduced: 0,
  });

  useEffect(() => {
    if (open) {
      // Fetch Raw Materials
      fetch("http://localhost:3000/api/raw-materials")
        .then((res) => res.json())
        .then((data) => setDbRawMaterials(data))
        .catch(() => showNotification("Failed to load raw materials", "error"));

      // Fetch Leftovers
      fetch("http://localhost:3000/api/leftovers")
        .then((res) => res.json())
        .then((data) => setLeftoverMaterials(data))
        .catch(() => setLeftoverMaterials([]));
    }
  }, [open]);

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleAddMaterial = (item, isLeftover = false) => {
    // FIX: Check for the correct ID field based on your schema
    const actualId = isLeftover ? item.leftover_id : item.rm_id;
    const uniqueId = isLeftover ? `LO-${actualId}` : `RM-${actualId}`;

    const exists = selectedMaterials.find((m) => m.uniqueId === uniqueId);

    if (!exists) {
      setSelectedMaterials([
        ...selectedMaterials,
        {
          ...item,
          uniqueId,
          isLeftover,
          useQty: 1,
          id: actualId, // This is the ID passed to the backend
        },
      ]);
    } else {
      showNotification("Item already in the list", "warning");
    }
  };

  const handleQtyChange = (uniqueId, value) => {
    setSelectedMaterials((prev) =>
      prev.map((m) =>
        m.uniqueId === uniqueId ? { ...m, useQty: parseFloat(value) || 0 } : m,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!formData.itemName)
      return showNotification("Item name is required", "error");

    const payload = {
      item_name: formData.itemName,
      handle_by: formData.handledBy,
      status: formData.status,
      quantity_produced: parseFloat(formData.quantityProduced) || 0,
      materials: selectedMaterials.map((m) => ({
        id: m.id,
        source_type: m.isLeftover ? "Leftover" : "Raw",
        used_stock: parseFloat(m.useQty) || 0,
        material_name: m.material_name,
        category: m.category,
        unit: m.unit,
      })),
    };

    try {
      const response = await fetch("http://localhost:3000/api/job-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("Job Order created successfully!");
        onSaveSuccess();
        handleReset();
      } else {
        showNotification(data.error || "Failed to save Job Order", "error");
      }
    } catch (error) {
      showNotification("Network error: Backend unreachable", "error");
    }
  };

  const handleReset = () => {
    setSelectedMaterials([]);
    setFormData({
      itemName: "",
      handledBy: "",
      status: "Pending",
      quantityProduced: 0,
    });
    setSearchQuery("");
    handleClose();
  };

  const isDark = mode === "dark";
  const selectionHeaderStyle = {
    fontWeight: "bold",
    bgcolor: isDark ? "#1e1e1e" : "#f5f5f5",
    fontSize: "0.75rem",
  };

  return (
    <>
      <Dialog open={open} onClose={handleReset} fullWidth maxWidth="lg">
        <DialogTitle
          sx={{
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Assignment sx={{ color: "#f2994a" }} /> Create Job Order
          </Box>
          <IconButton onClick={handleReset} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ py: 3, bgcolor: isDark ? "#121212" : "#fcfcfc" }}
        >
          <Grid container spacing={2}>
            {/* LEFT SIDE: SELECTION TABLES */}
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search across all..."
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

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    sx={{ mb: 0.5, display: "block", color: "primary.main" }}
                  >
                    RAW MATERIALS
                  </Typography>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ maxHeight: 200, borderRadius: 2 }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={selectionHeaderStyle}>
                            Material
                          </TableCell>
                          <TableCell align="center" sx={selectionHeaderStyle}>
                            Add
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dbRawMaterials
                          .filter((m) =>
                            m.material_name
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )
                          .map((m) => (
                            <TableRow key={m.rm_id} hover>
                              <TableCell>
                                {m.material_name}
                                <br />
                                <Typography variant="caption">
                                  {m.stock} {m.unit}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleAddMaterial(m, false)}
                                >
                                  <AddCircleOutline fontSize="inherit" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    sx={{ mb: 0.5, display: "block", color: "secondary.main" }}
                  >
                    LEFTOVER INVENTORY
                  </Typography>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ maxHeight: 200, borderRadius: 2 }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={selectionHeaderStyle}>
                            Leftover Scrap
                          </TableCell>
                          <TableCell align="center" sx={selectionHeaderStyle}>
                            Add
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leftoverMaterials
                          .filter((m) =>
                            m.material_name
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )
                          .map((m) => (
                            <TableRow key={m.leftover_id} hover>
                              <TableCell>
                                {m.material_name}
                                <br />
                                <Typography variant="caption" color="secondary">
                                  {m.quantity} {m.unit} available
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="secondary"
                                  size="small"
                                  onClick={() => handleAddMaterial(m, true)}
                                >
                                  <Recycling fontSize="inherit" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </Grid>

            {/* RIGHT SIDE: BOM & OUTPUT */}
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderLeft: "5px solid #f2994a",
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Job Output Item"
                        size="small"
                        value={formData.itemName}
                        onChange={(e) =>
                          setFormData({ ...formData, itemName: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={6} md={2.5}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Qty to Produce"
                        size="small"
                        value={formData.quantityProduced}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantityProduced: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={6} md={2.5}>
                      <TextField
                        fullWidth
                        label="Handled By"
                        size="small"
                        value={formData.handledBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            handledBy: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        select
                        fullWidth
                        label="Status"
                        size="small"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        {statusOptions.map((o) => (
                          <MenuItem key={o} value={o}>
                            {o}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                </Paper>

                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Inventory fontSize="small" /> Combined Materials (BOM)
                </Typography>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ minHeight: 320, borderRadius: 2 }}
                >
                  <Table size="small">
                    <TableHead
                      sx={{
                        bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      }}
                    >
                      <TableRow>
                        <TableCell>Source</TableCell>
                        <TableCell>Material Name</TableCell>
                        <TableCell align="center">Unit</TableCell>
                        <TableCell align="center">Qty to Use</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedMaterials.length > 0 ? (
                        selectedMaterials.map((m) => (
                          <TableRow key={m.uniqueId}>
                            <TableCell>
                              <Chip
                                label={m.isLeftover ? "Leftover" : "Raw"}
                                size="small"
                                color={m.isLeftover ? "secondary" : "primary"}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {m.material_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">{m.unit}</TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={m.useQty}
                                onChange={(e) =>
                                  handleQtyChange(m.uniqueId, e.target.value)
                                }
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() =>
                                  setSelectedMaterials(
                                    selectedMaterials.filter(
                                      (i) => i.uniqueId !== m.uniqueId,
                                    ),
                                  )
                                }
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            align="center"
                            sx={{ py: 10, color: "text.secondary" }}
                          >
                            Select materials from the left to build the BOM.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleReset} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selectedMaterials.length === 0 || !formData.itemName}
            sx={{
              bgcolor: "#f2994a",
              color: "#000",
              "&:hover": { bgcolor: "#d8853a" },
            }}
          >
            Submit Job Order
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
