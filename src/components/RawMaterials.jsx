import React, { useState, useEffect } from "react";

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
  LinearProgress,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";

import {
  Add,
  Edit,
  Delete,
  Search,
  Print,
  FilterListOff,
  Save,
  RestartAlt,
  EditNote,
  Undo,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank,
  KeyboardArrowDown,
  KeyboardArrowUp,
  BarChart,
  Notes,
  VisibilityOff,
  Straighten, // Icon for Min Stock Level
} from "@mui/icons-material";

// --- MODAL IMPORTS ---

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

  // --- DROPDOWN MENU STATE ---
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // --- STATUS VIEW TOGGLE: 'badge' | 'bar' ---
  const [statusView, setStatusView] = useState("badge");

  // --- REMARKS COLUMN VISIBILITY TOGGLE ---
  const [showRemarks, setShowRemarks] = useState(false);

  // --- MIN STOCK COLUMN VISIBILITY TOGGLE ---
  const [showMinStock, setShowMinStock] = useState(false);

  // --- PERMISSION CHECKS ---

  const canPrint = [0, "0", 1, "1", 2, "2", 3, "3", 4, "4"].includes(userLevel);

  const canAction = [0, "0", 1, "1", 2, "2", 3, "3"].includes(userLevel);

  // --- FILTER STATES ---

  const [searchQuery, setSearchQuery] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");

  const [statusFilter, setStatusFilter] = useState("All");

  // --- PAGINATION STATES ---

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Modal States

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

  const fetchMaterials = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/raw-materials`,
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

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleQuantityChangeLocal = (id, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity) || 0);

    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: qty, adjustment: "" };
        }

        return item;
      }),
    );
  };

  const handleAdjustmentChange = (id, value) => {
    if (value !== "" && value !== "-" && !/^-?\d+$/.test(value)) return;

    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const original = originalData.find((o) => o.id === id);

          const adjValue = parseInt(value) || 0;

          const calculatedQty = Math.max(0, original.quantity + adjValue);

          return {
            ...item,

            adjustment: value,

            quantity: calculatedQty,
          };
        }

        return item;
      }),
    );
  };

  const handleRemarksChange = (id, value) => {
    setMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remarks: value } : item)),
    );
  };

  const hasChanges = materials.some((item) => {
    const original = originalData.find((o) => o.id === item.id);

    return (
      original &&
      (item.quantity !== original.quantity ||
        (item.remarks || "") !== (original.remarks || ""))
    );
  });

  const handleDiscard = () => {
    setMaterials(JSON.parse(JSON.stringify(originalData)));

    setIsEditingQty(false);

    showSnackbar("Changes discarded", "info");
  };

  const handleBulkSave = async () => {
    const updates = materials

      .filter((item) => {
        const original = originalData.find((o) => o.id === item.id);

        return (
          original &&
          (item.quantity !== original.quantity ||
            (item.remarks || "") !== (original.remarks || ""))
        );
      })

      .map((item) => ({
        id: item.id,

        quantity: item.quantity,

        adjustment: item.adjustment,

        remarks: item.remarks || "",
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
    const currentVal = item.quantity;

    if (currentVal <= 0) return { label: "Out of Stock", color: "error" };

    if (currentVal <= item.minStock)
      return { label: "Low Stock", color: "warning" };

    return { label: "In Stock", color: "success" };
  };

  // --- STATUS BAR RENDERER ---
  // Calculates a percentage from quantity vs minStock and renders a colored progress bar
  const renderStatusBar = (row) => {
    const minStock = row.minStock ?? 0;
    const qty = row.quantity ?? 0;

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

    // Calculate percentage: cap at 100%, use minStock * 2 as "full" threshold
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

  const filteredMaterials = materials.filter((m) => {
    const statusObj = getStatus(m);

    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(m.id).includes(searchQuery);

    const matchesCategory =
      categoryFilter === "All" || m.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" || statusObj.label === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedMaterials = filteredMaterials.slice(
    page * rowsPerPage,

    page * rowsPerPage + rowsPerPage,
  );

  const handleResetFilters = () => {
    setSearchQuery("");

    setCategoryFilter("All");

    setStatusFilter("All");

    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));

    setPage(0);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

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

          {
            method: "DELETE",

            credentials: "include",
          },
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
      const idsOnPage = paginatedMaterials.map((m) => m.id);

      setSelectedIds((prev) => [...new Set([...prev, ...idsOnPage])]);
    } else {
      const idsOnPage = paginatedMaterials.map((m) => m.id);

      setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isAllSelectedOnPage =
    paginatedMaterials.length > 0 &&
    paginatedMaterials.every((m) => selectedIds.includes(m.id));

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
          {/* BULK DELETE BUTTON - VISIBLE WHEN ITEMS ARE CHECKED */}
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

          {/* --- GROUPED ACTIONS DROPDOWN BUTTON --- */}
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
            {/* PRINT */}
            {canPrint && (
              <MenuItem
                onClick={() => {
                  setOpenPrintModal(true);
                  handleMenuClose();
                }}
              >
                <ListItemIcon>
                  <Print fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText>Print</ListItemText>
              </MenuItem>
            )}

            {/* VIEW REMARKS TOGGLE — shows/hides the Remarks column */}
            <MenuItem
              onClick={() => {
                setShowRemarks((prev) => !prev);
                handleMenuClose();
              }}
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

            {/* MIN STOCK TOGGLE — shows/hides the Min Stock column next to Quantity */}
            <MenuItem
              onClick={() => {
                setShowMinStock((prev) => !prev);
                handleMenuClose();
              }}
              sx={{ color: showMinStock ? "primary.main" : "text.primary" }}
            >
              <ListItemIcon>
                <Straighten fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>
                {showMinStock ? "Hide Min Stock" : "Show Min Stock"}
              </ListItemText>
            </MenuItem>

            {/* SELECT ROWS */}
            {canAction && !isEditingQty && (
              <MenuItem
                onClick={() => {
                  setEnableCheckboxes(!enableCheckboxes);
                  handleMenuClose();
                }}
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

            {/* EDIT QTY */}
            {canAction &&
              (!hasChanges || !isEditingQty) &&
              (isEditingQty ? (
                <MenuItem
                  onClick={() => {
                    setIsEditingQty(false);
                    handleMenuClose();
                  }}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon>
                    <Undo fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Cancel Edit</ListItemText>
                </MenuItem>
              ) : (
                <MenuItem
                  onClick={() => {
                    setIsEditingQty(true);
                    handleMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <EditNote fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText>Edit Qty</ListItemText>
                </MenuItem>
              ))}

            {/* ADD MATERIAL */}
            {canAction && (
              <MenuItem
                onClick={() => {
                  setOpenAddModal(true);
                  handleMenuClose();
                }}
                disabled={isEditingQty} // Disable button add when edit qty is on to prevent conflicts
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
          <Grid item xs={12} md={6}>
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

          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="All">All Categories</MenuItem>

              <MenuItem value="Plastic">Plastic</MenuItem>

              <MenuItem value="Injection">Injection</MenuItem>

              <MenuItem value="Paper">Paper</MenuItem>

              <MenuItem value="Trading">Trading</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

                  <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>

                  {/* MIN STOCK HEADER — only visible when showMinStock is true */}
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

                  {/* STATUS COLUMN HEADER WITH VIEW TOGGLE BUTTON */}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", minWidth: "160px" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      Status
                      <Tooltip
                        title={
                          statusView === "badge"
                            ? "Switch to bar chart view"
                            : "Switch to badge view"
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            setStatusView((v) =>
                              v === "badge" ? "bar" : "badge",
                            )
                          }
                          sx={{
                            p: 0.4,
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor:
                              statusView === "bar" ? "primary.main" : "divider",
                            color:
                              statusView === "bar"
                                ? "primary.main"
                                : "text.secondary",
                            bgcolor:
                              statusView === "bar"
                                ? isDark
                                  ? "rgba(25,118,210,0.12)"
                                  : "rgba(25,118,210,0.08)"
                                : "transparent",
                            "&:hover": {
                              borderColor: "primary.main",
                              color: "primary.main",
                              bgcolor: isDark
                                ? "rgba(25,118,210,0.12)"
                                : "rgba(25,118,210,0.08)",
                            },
                          }}
                        >
                          <BarChart sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>

                  {/* REMARKS HEADER — only visible when showRemarks is true */}
                  {showRemarks && (
                    <TableCell sx={{ fontWeight: "bold", minWidth: "150px" }}>
                      Remarks
                    </TableCell>
                  )}

                  {canAction && (
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedMaterials.map((row) => {
                  const status = getStatus(row);

                  const barPercentage =
                    row.quantity <= 0
                      ? 0
                      : row.minStock === 0
                        ? 100
                        : Math.min(
                            Math.round(
                              (row.quantity / (row.minStock * 2)) * 100,
                            ),

                            100,
                          );

                  let barColor = "#2ecc71";

                  if (row.quantity <= 0) barColor = "#e74c3c";
                  else if (row.quantity <= row.minStock) barColor = "#f39c12";

                  return (
                    <TableRow key={row.id} hover>
                      {canAction && !isEditingQty && enableCheckboxes && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(row.id)}
                            onChange={() => handleSelectOne(row.id)}
                          />
                        </TableCell>
                      )}

                      <TableCell>#{row.id}</TableCell>

                      <TableCell
                        sx={{
                          maxWidth: "200px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        <Typography variant="body2" fontWeight="600">
                          {row.name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {row.category}
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
                          value={row.quantity}
                          onKeyDown={(e) => {
                            if (e.key === "." || e.key === "e")
                              e.preventDefault();
                          }}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val !== "" && parseFloat(val) > 9999999) {
                              val = "9999999";
                            }
                            handleQuantityChangeLocal(row.id, val);
                          }}
                          InputProps={{
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
                                width: `${Math.max(4, String(row.quantity).length) * 0.5}ch`,
                              },
                            },
                          }}
                        />
                      </TableCell>

                      {/* MIN STOCK CELL — only visible when showMinStock is true */}
                      {showMinStock && (
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "bold",
                              color:
                                row.quantity <= (row.minStock ?? 0)
                                  ? "primary.main"
                                  : "text.secondary",
                            }}
                          >
                            {row.minStock ?? 0}
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
                              handleAdjustmentChange(row.id, val);
                            }}
                            sx={{ width: "120px" }}
                          />
                        </TableCell>
                      )}

                      {/* STATUS CELL — toggles between badge and bar view */}
                      <TableCell align="center">
                        {statusView === "bar" ? (
                          renderStatusBar(row)
                        ) : (
                          <Box
                            sx={{
                              display: "inline-block",

                              px: 1.5,

                              py: 0.5,

                              borderRadius: 1,

                              fontSize: "0.75rem",

                              fontWeight: "bold",

                              bgcolor:
                                status.color === "success"
                                  ? "rgba(46, 204, 113, 0.15)"
                                  : status.color === "warning"
                                    ? "rgba(241, 145, 73, 0.15)"
                                    : "rgba(231, 76, 60, 0.15)",

                              color: barColor,
                            }}
                          >
                            {status.label}
                          </Box>
                        )}
                      </TableCell>

                      {/* Remarks Column — only visible when showRemarks is true */}
                      {showRemarks && (
                        <TableCell sx={{ minWidth: "180px" }}>
                          {isEditingQty ? (
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Add remarks..."
                              value={row.remarks || ""}
                              onChange={(e) =>
                                handleRemarksChange(row.id, e.target.value)
                              }
                              inputProps={{ maxLength: 200 }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              color={
                                row.remarks ? "text.primary" : "text.disabled"
                              }
                              sx={{
                                fontStyle: row.remarks ? "normal" : "italic",
                                maxWidth: "200px",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {row.remarks || "—"}
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {canAction && (
                        <TableCell align="right">
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
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={filteredMaterials.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
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
            ? materials.filter((m) => selectedIds.includes(m.id))
            : materials
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
