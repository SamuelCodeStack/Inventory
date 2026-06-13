import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Save, Close, Cancel } from "@mui/icons-material";

export default function BrandModal({ open, handleClose, mode }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandColor, setNewBrandColor] = useState("#1565c0");
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);

  // --- INLINE EDIT STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#1565c0");
  const [editError, setEditError] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isDark = mode === "dark";

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/brands`);
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      showSnackbar("Failed to load brands", "error");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchBrands();
  }, [open]);

  const validateName = (name) => {
    if (!name.trim()) return "Brand name is required";
    if (name.trim().length > 40)
      return "Brand name must be 40 characters or less";
    return "";
  };

  // --- ADD BRAND ---
  const handleAdd = async () => {
    const error = validateName(newBrandName);
    if (error) {
      setAddError(error);
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/brands`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: newBrandName.trim(),
          brand_color: newBrandColor,
        }),
      });
      if (res.ok) {
        setNewBrandName("");
        setNewBrandColor("#1565c0");
        setAddError("");
        showSnackbar("Brand added successfully", "success");
        fetchBrands();
      } else {
        const data = await res.json();
        setAddError(data.error || "Failed to add brand");
      }
    } catch (e) {
      showSnackbar("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- START INLINE EDIT ---
  const handleStartEdit = (brand) => {
    setEditingId(brand.brand_id);
    setEditingName(brand.brand_name);
    setEditingColor(brand.brand_color || "#1565c0");
    setEditError("");
  };

  // --- CANCEL INLINE EDIT ---
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingColor("#1565c0");
    setEditError("");
  };

  // --- SAVE INLINE EDIT ---
  const handleSaveEdit = async (id) => {
    const error = validateName(editingName);
    if (error) {
      setEditError(error);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/brands/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: editingName.trim(),
          brand_color: editingColor,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        showSnackbar("Brand updated successfully", "success");
        fetchBrands();
      } else {
        const data = await res.json();
        setEditError(data.error || "Failed to update brand");
      }
    } catch (e) {
      showSnackbar("Network error", "error");
    }
  };

  // --- DELETE BRAND ---
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showSnackbar("Brand deleted successfully", "info");
        fetchBrands();
      }
    } catch (e) {
      showSnackbar("Delete failed", "error");
    }
  };

  const handleModalClose = () => {
    setNewBrandName("");
    setNewBrandColor("#1565c0");
    setAddError("");
    setEditingId(null);
    setEditingName("");
    setEditingColor("#1565c0");
    setEditError("");
    handleClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleModalClose}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "bold",
            pb: 1,
          }}
        >
          Manage Brands
          <IconButton onClick={handleModalClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* --- ADD BRAND ROW --- */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2 }}
            alignItems="flex-start"
          >
            <TextField
              size="small"
              fullWidth
              placeholder="New brand name..."
              value={newBrandName}
              onChange={(e) => {
                if (e.target.value.length <= 40) {
                  setNewBrandName(e.target.value);
                  setAddError("");
                }
              }}
              error={!!addError}
              helperText={addError || `${newBrandName.length}/40`}
              inputProps={{ maxLength: 40 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />

            {/* Color picker for new brand */}
            <Tooltip title="Pick brand color">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.3,
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1.5,
                    bgcolor: newBrandColor,
                    border: "2px solid",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <input
                    type="color"
                    value={newBrandColor}
                    onChange={(e) => setNewBrandColor(e.target.value)}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      border: "none",
                      padding: 0,
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.6rem", color: "text.disabled" }}
                >
                  Color
                </Typography>
              </Box>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Add />
                )
              }
              onClick={handleAdd}
              disabled={saving}
              sx={{
                borderRadius: 2,
                fontWeight: "bold",
                textTransform: "none",
                px: 3,
                flexShrink: 0,
                height: 40,
                bgcolor: "#ef7d14",
                "&:hover": { bgcolor: "#d66e0f" },
              }}
            >
              Add
            </Button>
          </Stack>

          {/* --- BRANDS TABLE --- */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              <Table size="small">
                <TableHead
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.04)" : "action.hover",
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", width: 60 }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: 56 }}>
                      Color
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Brand Name
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow
                      key={brand.brand_id}
                      hover
                      sx={{
                        borderLeft: `4px solid ${brand.brand_color || "#1565c0"}`,
                      }}
                    >
                      <TableCell>#{brand.brand_id}</TableCell>

                      {/* COLOR SWATCH / PICKER */}
                      <TableCell>
                        {editingId === brand.brand_id ? (
                          <Tooltip title="Pick color">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: editingColor,
                                border: "2px solid",
                                borderColor: isDark
                                  ? "rgba(255,255,255,0.2)"
                                  : "rgba(0,0,0,0.15)",
                                overflow: "hidden",
                                cursor: "pointer",
                                position: "relative",
                              }}
                            >
                              <input
                                type="color"
                                value={editingColor}
                                onChange={(e) =>
                                  setEditingColor(e.target.value)
                                }
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  width: "100%",
                                  height: "100%",
                                  opacity: 0,
                                  cursor: "pointer",
                                  border: "none",
                                  padding: 0,
                                }}
                              />
                            </Box>
                          </Tooltip>
                        ) : (
                          <Tooltip title={brand.brand_color || "#1565c0"}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: brand.brand_color || "#1565c0",
                                border: "2px solid",
                                borderColor: isDark
                                  ? "rgba(255,255,255,0.15)"
                                  : "rgba(0,0,0,0.12)",
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* BRAND NAME */}
                      <TableCell>
                        {editingId === brand.brand_id ? (
                          <TextField
                            size="small"
                            fullWidth
                            autoFocus
                            value={editingName}
                            onChange={(e) => {
                              if (e.target.value.length <= 40) {
                                setEditingName(e.target.value);
                                setEditError("");
                              }
                            }}
                            error={!!editError}
                            helperText={editError || `${editingName.length}/40`}
                            inputProps={{ maxLength: 40 }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSaveEdit(brand.brand_id);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight="600">
                            {brand.brand_name}
                          </Typography>
                        )}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell align="right">
                        {editingId === brand.brand_id ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleSaveEdit(brand.brand_id)}
                            >
                              <Save fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="inherit"
                              onClick={handleCancelEdit}
                            >
                              <Cancel fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleStartEdit(brand)}
                            >
                              <Edit fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDelete(brand.brand_id, brand.brand_name)
                              }
                            >
                              <Delete fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {brands.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 3, color: "text.secondary" }}
                      >
                        No brands yet. Add one above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleModalClose}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: "bold" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
