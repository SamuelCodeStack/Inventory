import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
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
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  TablePagination,
  Grid,
  Checkbox,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Print,
  Save,
  EditNote,
  Undo,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Notes,
  VisibilityOff,
  Straighten,
  AddComment,
  Send,
  Cancel,
} from "@mui/icons-material";
import AddRawMaterialModal from "./AddRawMaterialModal";
import EditRawMaterialModal from "./EditRawMaterialModal";
import PrintRawMaterialModal from "./PrintRawMaterialModal";

export default function RawMaterials({ mode, userLevel }) {
  const [materials, setMaterials] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [enableCheckboxes, setEnableCheckboxes] = useState(false);
  const [ledgerData, setLedgerData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const [showRemarks, setShowRemarks] = useState(false);
  const [showMinStock, setShowMinStock] = useState(false);
  const [activeRemarkRowId, setActiveRemarkRowId] = useState(null);
  const [remarkInputValue, setRemarkInputValue] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [deletingRemarkId, setDeletingRemarkId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [unitFilter, setUnitFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isDark = mode === "dark";

  // ── Permissions ──
  const canPrint = [
    0,
    "0",
    1,
    "1",
    2,
    "2",
    3,
    "3",
    4,
    "4",
    5,
    "5",
    6,
    "6",
  ].includes(userLevel);
  // canAction: can add, edit, delete, update quantities (levels 0–3)
  const canAction = [0, "0", 1, "1", 2, "2", 3, "3", 6, "6"].includes(
    userLevel,
  );
  // canViewAction: show the action column — includes ViewerAdmin (5)
  const canViewAction = [
    0,
    "0",
    1,
    "1",
    2,
    "2",
    3,
    "3",
    5,
    "5",
    6,
    "6",
  ].includes(userLevel);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials`,
        { credentials: "include" },
      );
      const data = await response.json();
      const initializedData = data.map((item) => ({ ...item, adjustment: "" }));
      setMaterials(initializedData);
      setOriginalData(JSON.parse(JSON.stringify(initializedData)));
      setSelectedIds([]);
    } catch (error) {
      showSnackbar("Failed to load raw materials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrint = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/ledger`,
        { credentials: "include" },
      );
      const data = await res.json();
      setLedgerData(data);
    } catch (err) {
      console.error("Failed to load raw materials ledger:", err);
      showSnackbar("Failed to load transaction log", "error");
    }
    setOpenPrintModal(true);
    handleMenuClose();
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      withCredentials: true,
    });
    socket.on(
      "raw_remarks_updated",
      ({ materialId, remarks, remarks_added_by, remarks_created_at }) => {
        setMaterials((prev) =>
          prev.map((item) =>
            item.material_id === materialId
              ? { ...item, remarks, remarks_added_by, remarks_created_at }
              : item,
          ),
        );
        setOriginalData((prev) =>
          prev.map((item) =>
            item.material_id === materialId
              ? { ...item, remarks, remarks_added_by, remarks_created_at }
              : item,
          ),
        );
      },
    );
    return () => socket.disconnect();
  }, []);

  const handleQuantityChangeLocal = (material_id, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity) || 0);
    setMaterials((prev) =>
      prev.map((item) =>
        item.material_id === material_id
          ? { ...item, qty_: qty, adjustment: "" }
          : item,
      ),
    );
  };

  const handleAdjustmentChange = (material_id, value) => {
    if (value !== "" && value !== "-" && !/^-?\d+$/.test(value)) return;
    setMaterials((prev) =>
      prev.map((item) => {
        if (item.material_id === material_id) {
          const original = originalData.find(
            (o) => o.material_id === material_id,
          );
          const adjValue = parseInt(value) || 0;
          const calculatedQty = Math.max(0, (original?.qty_ ?? 0) + adjValue);
          return { ...item, adjustment: value, qty_: calculatedQty };
        }
        return item;
      }),
    );
  };

  const hasChanges = materials.some((item) => {
    const original = originalData.find(
      (o) => o.material_id === item.material_id,
    );
    return original && item.qty_ !== original.qty_;
  });

  const handleDiscard = () => {
    setMaterials(JSON.parse(JSON.stringify(originalData)));
    setIsEditingQty(false);
    showSnackbar("Changes discarded", "info");
  };

  const handleBulkSave = async () => {
    const updates = materials
      .filter((item) => {
        const original = originalData.find(
          (o) => o.material_id === item.material_id,
        );
        return original && item.qty_ !== original.qty_;
      })
      .map((item) => ({
        material_id: item.material_id,
        qty_: item.qty_,
        adjustment: item.adjustment,
      }));
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/bulk`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updates }),
        },
      );
      if (response.ok) {
        showSnackbar("Quantities updated successfully!", "success");
        setIsEditingQty(false);
        fetchMaterials();
      }
    } catch (error) {
      showSnackbar("Save failed", "error");
    }
  };

  const getStatus = (item) => {
    const qty = item.qty_ ?? 0;
    const minStock = item.minimum_stock ?? 0;
    if (qty <= 0) return { label: "Out of Stock", color: "error" };
    if (qty <= minStock) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  const renderStatusBar = (row) => {
    const minStock = row.minimum_stock ?? 0;
    const qty = row.qty_ ?? 0;
    const barColor =
      qty <= 0 ? "#e74c3c" : qty <= minStock ? "#f39c12" : "#2ecc71";
    const bgColor =
      qty <= 0
        ? "rgba(231, 76, 60, 0.15)"
        : qty <= minStock
          ? "rgba(241, 145, 73, 0.15)"
          : "rgba(46, 204, 113, 0.15)";
    const statusLabel =
      qty <= 0 ? "Out of Stock" : qty <= minStock ? "Low Stock" : "In Stock";
    const maxRef = minStock > 0 ? minStock * 2 : 100;
    const pct = qty <= 0 ? 0 : Math.min(Math.round((qty / maxRef) * 100), 100);

    return (
      <Box sx={{ minWidth: 130 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.4,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: "bold", color: barColor, fontSize: "0.7rem" }}
          >
            {statusLabel}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "0.7rem" }}
          >
            {pct}%
          </Typography>
        </Box>
        <Box
          sx={{
            width: "100%",
            height: 7,
            borderRadius: 4,
            bgcolor: bgColor,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 4,
              bgcolor: barColor,
              transition: "width 0.4s ease",
            }}
          />
        </Box>
      </Box>
    );
  };

  const handleToggleRemarkInput = (rowId, currentRemark = "") => {
    if (activeRemarkRowId === rowId) {
      setActiveRemarkRowId(null);
      setRemarkInputValue("");
    } else {
      setActiveRemarkRowId(rowId);
      setRemarkInputValue(currentRemark);
    }
  };

  const handleSaveRemark = async (material_id) => {
    if (!remarkInputValue.trim()) {
      showSnackbar("Remarks cannot be empty", "warning");
      return;
    }
    try {
      setSavingRemark(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/${material_id}/remarks`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remarks: remarkInputValue.trim() }),
        },
      );
      if (res.ok) {
        showSnackbar("Remark saved successfully", "success");
        setActiveRemarkRowId(null);
        setRemarkInputValue("");
        fetchMaterials();
      } else {
        showSnackbar("Failed to save remark", "error");
      }
    } catch (e) {
      showSnackbar("Network error saving remark", "error");
    } finally {
      setSavingRemark(false);
    }
  };

  const handleDeleteRemark = async (material_id) => {
    if (!window.confirm("Clear this remark?")) return;
    try {
      setDeletingRemarkId(material_id);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials/${material_id}/remarks`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (res.ok) {
        showSnackbar("Remark cleared", "info");
        fetchMaterials();
      } else {
        showSnackbar("Failed to clear remark", "error");
      }
    } catch (e) {
      showSnackbar("Network error clearing remark", "error");
    } finally {
      setDeletingRemarkId(null);
    }
  };

  const unitOptions = [
    "All",
    ...[...new Set(materials.map((m) => m.unit).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    ),
  ];

  const filteredMaterials = materials.filter((m) => {
    const statusObj = getStatus(m);
    const name = m.material_name ?? "";
    const id = String(m.material_id ?? "");
    return (
      (name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        id.includes(searchQuery)) &&
      (categoryFilter === "All" || m.category === categoryFilter) &&
      (statusFilter === "All" || statusObj.label === statusFilter) &&
      (unitFilter === "All" || m.unit === unitFilter)
    );
  });

  const paginatedMaterials = filteredMaterials.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete the ${selectedIds.length} selected material(s)?`,
      )
    )
      return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/raw-materials/${id}`,
          { method: "DELETE", credentials: "include" },
        );
        if (response.ok) successCount++;
      }
      if (successCount > 0) {
        showSnackbar(
          `${successCount} material(s) deleted successfully`,
          "info",
        );
        fetchMaterials();
      }
    } catch (error) {
      showSnackbar("Error during bulk delete action", "error");
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const idsOnPage = paginatedMaterials.map((m) => m.material_id);
      setSelectedIds((prev) => [...new Set([...prev, ...idsOnPage])]);
    } else {
      const idsOnPage = paginatedMaterials.map((m) => m.material_id);
      setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    }
  };

  const handleSelectOne = (material_id) => {
    setSelectedIds((prev) =>
      prev.includes(material_id)
        ? prev.filter((item) => item !== material_id)
        : [...prev, material_id],
    );
  };

  const isAllSelectedOnPage =
    paginatedMaterials.length > 0 &&
    paginatedMaterials.every((m) => selectedIds.includes(m.material_id));

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          mb: 3,
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Raw Materials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dynamic unit tracking for chemicals & supplies
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {selectedIds.length > 0 &&
            !isEditingQty &&
            canAction &&
            enableCheckboxes && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}

          {hasChanges && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Undo />}
                onClick={handleDiscard}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Save />}
                onClick={handleBulkSave}
              >
                Save Changes
              </Button>
            </>
          )}

          <Button
            variant="outlined"
            onClick={handleMenuOpen}
            endIcon={isMenuOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            size="small"
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
              flexShrink: 0,
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.dark",
                backgroundColor: isDark
                  ? "rgba(25, 118, 210, 0.08)"
                  : "#f0f4ff",
              },
            }}
          >
            Actions
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            disableScrollLock
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                "& .MuiMenuItem-root": {
                  borderRadius: 1,
                  mx: 0.5,
                  my: 0.25,
                  px: 2,
                  py: 1,
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  gap: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {canPrint && (
              <MenuItem onClick={handleOpenPrint}>
                <ListItemIcon>
                  <Print fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText>Item Logs</ListItemText>
              </MenuItem>
            )}

            <MenuItem
              onClick={() => setShowRemarks((prev) => !prev)}
              sx={{ color: showRemarks ? "primary.main" : "text.primary" }}
            >
              <ListItemIcon>
                {showRemarks ? (
                  <VisibilityOff fontSize="small" color="primary" />
                ) : (
                  <Notes fontSize="small" color="primary" />
                )}
              </ListItemIcon>
              <ListItemText>
                {showRemarks ? "Hide Remarks" : "View Remarks"}
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => setShowMinStock((prev) => !prev)}
              sx={{ color: showMinStock ? "primary.main" : "text.primary" }}
            >
              <ListItemIcon>
                <Straighten fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>
                {showMinStock ? "Hide Min Stock" : "Show Min Stock"}
              </ListItemText>
            </MenuItem>

            {canAction && !isEditingQty && (
              <MenuItem
                onClick={() => setEnableCheckboxes(!enableCheckboxes)}
                sx={{
                  color: enableCheckboxes ? "primary.main" : "text.primary",
                }}
              >
                <ListItemIcon>
                  {enableCheckboxes ? (
                    <CheckBoxIcon fontSize="small" color="primary" />
                  ) : (
                    <CheckBoxOutlineBlank fontSize="small" color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {enableCheckboxes ? "Selection On" : "Select Rows"}
                </ListItemText>
              </MenuItem>
            )}

            {canAction && <Divider sx={{ my: 0.5 }} />}

            {canAction &&
              (!hasChanges || !isEditingQty) &&
              (isEditingQty ? (
                <MenuItem
                  onClick={() => setIsEditingQty(false)}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon>
                    <Undo fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Cancel Edit</ListItemText>
                </MenuItem>
              ) : (
                <MenuItem onClick={() => setIsEditingQty(true)}>
                  <ListItemIcon>
                    <EditNote fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText>Update Quantity</ListItemText>
                </MenuItem>
              ))}

            {canAction && (
              <MenuItem
                onClick={() => {
                  setOpenAddModal(true);
                  handleMenuClose();
                }}
                disabled={isEditingQty}
                sx={{
                  bgcolor: "primary.main",
                  color: "#fff",
                  "&:hover": { bgcolor: "primary.dark" },
                  "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                }}
              >
                <ListItemIcon>
                  <Add fontSize="small" sx={{ color: "#fff" }} />
                </ListItemIcon>
                <ListItemText>Add Material</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Name or ID..."
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
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="Plastic">Plastic</MenuItem>
              <MenuItem value="Injection">Injection</MenuItem>
              <MenuItem value="Paper">Paper</MenuItem>
              <MenuItem value="Trading">Trading</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Unit"
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(e.target.value);
                setPage(0);
              }}
            >
              {unitOptions.map((u) => (
                <MenuItem key={u} value={u}>
                  {u === "All" ? "All Units" : u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="In Stock">In Stock</MenuItem>
              <MenuItem value="Low Stock">Low Stock</MenuItem>
              <MenuItem value="Out of Stock">Out of Stock</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead
                sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa" }}
              >
                <TableRow>
                  {canAction && !isEditingQty && enableCheckboxes && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedIds.length > 0 && !isAllSelectedOnPage
                        }
                        checked={isAllSelectedOnPage}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Material Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>
                  {showMinStock && (
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        minWidth: "100px",
                        color: "primary.main",
                      }}
                    >
                      Min Stock
                    </TableCell>
                  )}
                  {isEditingQty && (
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Adjustment
                    </TableCell>
                  )}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", minWidth: "160px" }}
                  >
                    Status
                  </TableCell>
                  {showRemarks && (
                    <TableCell sx={{ fontWeight: "bold", minWidth: "220px" }}>
                      Remarks
                    </TableCell>
                  )}
                  {canViewAction && (
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedMaterials.map((row) => {
                  const isRemarkOpen = activeRemarkRowId === row.material_id;
                  return (
                    <TableRow key={row.material_id} hover>
                      {canAction && !isEditingQty && enableCheckboxes && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(row.material_id)}
                            onChange={() => handleSelectOne(row.material_id)}
                          />
                        </TableCell>
                      )}

                      <TableCell>
                        <Typography variant="body2">
                          #{row.material_id}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: "200px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        <Typography variant="body2" fontWeight="600">
                          {row.material_name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {row.category}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {row.unit || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          variant={isEditingQty ? "outlined" : "standard"}
                          disabled={
                            !isEditingQty ||
                            (row.adjustment !== "" && row.adjustment !== null)
                          }
                          value={row.qty_ ?? 0}
                          onKeyDown={(e) => {
                            if (e.key === "." || e.key === "e")
                              e.preventDefault();
                          }}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val !== "" && parseFloat(val) > 9999999)
                              val = "9999999";
                            handleQuantityChangeLocal(row.material_id, val);
                          }}
                          slotProps={{
                            input: {
                              disableUnderline: true,
                              sx: {
                                fontWeight: "bold",
                                display: "flex",
                                justifyContent: "flex-end",
                                minWidth: "100px",
                                "& input": {
                                  textAlign: "right",
                                  paddingRight: "8px",
                                  flexGrow: 1,
                                  width: `${Math.max(4, String(row.qty_ ?? 0).length) * 0.5}ch`,
                                },
                              },
                            },
                          }}
                        />
                      </TableCell>

                      {showMinStock && (
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold", color: "text.secondary" }}
                          >
                            {row.minimum_stock ?? 0}
                          </Typography>
                        </TableCell>
                      )}

                      {isEditingQty && (
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="+/-"
                            value={row.adjustment || ""}
                            onKeyDown={(e) => {
                              if (e.key === "." || e.key === "e")
                                e.preventDefault();
                            }}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val !== "" && val !== "-" && val !== "+") {
                                const parsed = parseFloat(val);
                                if (parsed > 9999999) val = "9999999";
                                if (parsed < -9999999) val = "-9999999";
                              }
                              handleAdjustmentChange(row.material_id, val);
                            }}
                            sx={{ width: "120px" }}
                          />
                        </TableCell>
                      )}

                      <TableCell align="center">
                        {renderStatusBar(row)}
                      </TableCell>

                      {showRemarks && (
                        <TableCell sx={{ minWidth: "220px", py: 0.5 }}>
                          <Box>
                            {row.remarks && !isRemarkOpen ? (
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "text.primary",
                                    fontSize: "0.8rem",
                                    maxWidth: "200px",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {row.remarks}
                                </Typography>
                                {row.remarks_added_by && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.disabled",
                                      fontSize: "0.7rem",
                                      display: "block",
                                      mt: 0.2,
                                    }}
                                  >
                                    — {row.remarks_added_by}
                                    {row.remarks_created_at
                                      ? `, ${new Date(row.remarks_created_at).toLocaleDateString()}`
                                      : ""}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              !isRemarkOpen && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "text.disabled",
                                    fontStyle: "italic",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  —
                                </Typography>
                              )
                            )}
                            <Collapse in={isRemarkOpen} unmountOnExit>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={{ mt: 0.5 }}
                              >
                                <TextField
                                  size="small"
                                  fullWidth
                                  autoFocus
                                  placeholder="Add a remark..."
                                  value={remarkInputValue}
                                  onChange={(e) =>
                                    setRemarkInputValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveRemark(row.material_id);
                                    }
                                    if (e.key === "Escape") {
                                      setActiveRemarkRowId(null);
                                      setRemarkInputValue("");
                                    }
                                  }}
                                  inputProps={{ maxLength: 500 }}
                                  sx={{ fontSize: "0.8rem" }}
                                />
                                <Tooltip title="Save remark">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() =>
                                        handleSaveRemark(row.material_id)
                                      }
                                      disabled={savingRemark}
                                    >
                                      <Send fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={() => {
                                      setActiveRemarkRowId(null);
                                      setRemarkInputValue("");
                                    }}
                                  >
                                    <Cancel fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Collapse>
                          </Box>
                        </TableCell>
                      )}

                      {canViewAction && (
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            {showRemarks && canAction && (
                              <>
                                <Tooltip
                                  title={
                                    isRemarkOpen
                                      ? "Cancel"
                                      : row.remarks
                                        ? "Edit remark"
                                        : "Add remark"
                                  }
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleToggleRemarkInput(
                                        row.material_id,
                                        row.remarks,
                                      )
                                    }
                                    sx={{
                                      color: isRemarkOpen
                                        ? "error.main"
                                        : "primary.main",
                                    }}
                                  >
                                    {isRemarkOpen ? (
                                      <Cancel fontSize="inherit" />
                                    ) : (
                                      <AddComment fontSize="inherit" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                                {row.remarks && !isRemarkOpen && (
                                  <Tooltip title="Clear remark">
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleDeleteRemark(row.material_id)
                                        }
                                        disabled={
                                          deletingRemarkId === row.material_id
                                        }
                                      >
                                        <Delete fontSize="inherit" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}
                              </>
                            )}
                            {/* Only canAction users get the edit button */}
                            {canAction && (
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  setSelectedItem(row);
                                  setOpenEditModal(true);
                                }}
                              >
                                <Edit fontSize="inherit" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {paginatedMaterials.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={99}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No materials match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={filteredMaterials.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </TableContainer>

      <AddRawMaterialModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={fetchMaterials}
        mode={mode}
      />
      <PrintRawMaterialModal
        open={openPrintModal}
        handleClose={() => setOpenPrintModal(false)}
        materialsData={
          enableCheckboxes && selectedIds.length > 0
            ? ledgerData.filter((tx) => selectedIds.includes(tx.material_id))
            : ledgerData
        }
      />
      {selectedItem && (
        <EditRawMaterialModal
          open={openEditModal}
          handleClose={() => {
            setOpenEditModal(false);
            setSelectedItem(null);
          }}
          itemData={selectedItem}
          onSaveSuccess={fetchMaterials}
          mode={mode}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
