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
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  TablePagination,
  MenuItem,
  Grid, // Added for responsiveness
  Checkbox, // Added for selection
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
  Save,
  RestartAlt,
  EditNote,
  Print,
  FilterListOff,
  Undo, // Added for Discard icon consistency
  CheckCircleOutline, // Added for Selection toggle on
  RadioButtonUnchecked, // Added for Selection toggle off
  CheckBoxOutlineBlank, // Imported for the custom look
  KeyboardArrowDown,
  KeyboardArrowUp,
  BarChart,
  Notes,
  VisibilityOff,
  Straighten, // Icon for Min Stock Level
} from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";
import PrintInventoryModal from "./PrintInventoryModal";

export default function Inventory({ mode, user }) {
  const [inventoryData, setInventoryData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // Track selected rows for deletion
  const [isSelectionEnabled, setIsSelectionEnabled] = useState(false); // Track checkbox visibility state

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

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isDark = mode === "dark";

  // --- ROLE CONSTANTS ---
  // Updated roles: ADMIN (0) and PRODUCTION (2) can do everything. OFFICE (1) and VIEW (3) only see.
  const canModify =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1" ||
    user?.user_level === 2 ||
    user?.user_level === "2" ||
    user?.user_level === 3 ||
    user?.user_level === "3";

  const canViewActionColumn =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1" ||
    user?.user_level === 2 ||
    user?.user_level === "2" ||
    user?.user_level === 3 ||
    user?.user_level === "3";

  // Logic to hide price for user level 3 (Production) and level 4
  const canViewPrice =
    user?.user_level !== 3 &&
    user?.user_level !== "3" &&
    user?.user_level !== 4 &&
    user?.user_level !== "4";

  const showMessage = (msg, sev = "success") =>
    setSnackbar({ open: true, message: msg, severity: sev });

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory`);
      // const response = await fetch("http://localhost:3000/api/inventory");
      const data = await response.json();
      // Initialize movement value as empty string for each item
      const initializedData = data.map((item) => ({ ...item, movement: "" }));
      setInventoryData(initializedData);
      setOriginalData(JSON.parse(JSON.stringify(initializedData)));
    } catch (error) {
      showMessage("Network Error: Could not connect to server", "error");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- FILTER LOGIC ---
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id).includes(searchQuery);
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setPage(0);
  };

  // Pagination Handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const hasChanges = inventoryData.some((item) => {
    const originalItem = originalData.find(
      (orig) => String(orig.id).split(":")[0] === String(item.id).split(":")[0],
    );
    return originalItem && item.quantity !== originalItem.quantity;
  });

  const handleQuantityChangeLocal = (id, newQuantity) => {
    // Math.max(0, ...) ensures result is never negative, parseInt ensures whole number
    const qty = Math.max(0, parseInt(newQuantity) || 0);
    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const threshold = item.minStock || 10;
          let newStatus =
            qty === 0
              ? "Out of Stock"
              : qty <= threshold
                ? "Low Stock"
                : "In Stock";
          return { ...item, quantity: qty, status: newStatus };
        }
        return item;
      }),
    );
  };

  // Logic for the Stock In/Out Input
  const handleMovementChange = (id, value) => {
    // Allow only numbers and the minus sign
    if (/[^-0-9]/.test(value) && value !== "") return;

    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const movementVal = value === "-" ? "-" : parseInt(value) || 0;
          const originalItem = originalData.find((o) => o.id === id);
          const baseQty = originalItem ? originalItem.quantity : item.quantity;

          const finalMovement = value === "-" ? 0 : movementVal;
          const newQty = baseQty + finalMovement;

          const threshold = item.minStock || 10;
          // Ensure newQty result doesn't go below 0
          const clampedQty = newQty >= 0 ? newQty : 0;

          let newStatus =
            clampedQty === 0
              ? "Out of Stock"
              : clampedQty <= threshold
                ? "Low Stock"
                : "In Stock";

          return {
            ...item,
            movement: value,
            quantity: clampedQty,
            status: newStatus,
          };
        }
        return item;
      }),
    );
  };

  const handleDiscard = () => {
    setInventoryData(JSON.parse(JSON.stringify(originalData)));
    setIsEditingQty(false); // This locks the quantity fields
    showMessage("Changes discarded", "info");
  };

  const handleBulkSave = async () => {
    const payload = {
      items: inventoryData
        .filter((item) => {
          const original = originalData.find((o) => o.id === item.id);
          return original && item.quantity !== original.quantity;
        })
        .map((item) => {
          const isAdjustment = item.movement !== "" && item.movement !== "-";
          return {
            id: String(item.id).split(":")[0],
            quantity: item.quantity,
            // type 1 for direct edit, 2 for adjustment (stock in/out)
            update_type: isAdjustment ? 2 : 1,
            // Changed key to 'adjustment' to match common backend expectations for logging
            adjustment: isAdjustment ? item.movement : null,
            movement_value: isAdjustment ? item.movement : null,
          };
        }),
    };
    try {
      const response = await fetch(
        // `http://localhost:3000/api/inventory/bulk`,
        `${import.meta.env.VITE_API_URL}/inventory/bulk`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (response.ok) {
        showMessage("Quantities updated!", "info");
        setIsEditingQty(false);
        fetchInventory();
      }
    } catch (error) {
      showMessage("Save failed", "error");
    }
  };

  const handleDelete = async (id) => {
    const cleanId = String(id).split(":")[0];
    if (!window.confirm(`Delete item #${cleanId}?`)) return;
    try {
      const res = await fetch(
        // `http://localhost:3000/api/inventory/${cleanId}`,
        `${import.meta.env.VITE_API_URL}/inventory/${cleanId}`,
        {
          method: "DELETE",
          credentials: "include", // Required to send session cookies for activity logs
        },
      );
      if (res.ok) {
        setInventoryData((prev) => prev.filter((item) => item.id !== id));
        setSelectedIds((prev) =>
          prev.filter((selectedId) => selectedId !== id),
        );
        showMessage("Deleted successfully", "success");
      }
    } catch (e) {
      showMessage("Delete failed", "error");
    }
  };

  // --- NEW HANDLERS FOR SELECTION & BULK DELETION ---
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllRows = (e) => {
    if (e.target.checked) {
      const currentIds = paginatedData.map((row) => row.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    } else {
      const currentIds = paginatedData.map((row) => row.id);
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected item(s)?`))
      return;

    let successCount = 0;
    for (const id of selectedIds) {
      const cleanId = String(id).split(":")[0];
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/inventory/${cleanId}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );
        if (res.ok) {
          successCount++;
        }
      } catch (e) {
        console.error("Failed to delete item " + cleanId, e);
      }
    }

    if (successCount > 0) {
      setInventoryData((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id)),
      );
      showMessage(`Successfully deleted ${successCount} item(s)`, "success");
    } else {
      showMessage("Bulk delete failed", "error");
    }
    setSelectedIds([]);
  };

  // --- STATUS BAR RENDERER ---
  // Calculates a percentage from quantity vs minStock and renders a colored progress bar
  const renderStatusBar = (row) => {
    const minStock = row.min_stock ?? row.minStock ?? 0;
    const qty = row.quantity ?? 0;

    // Determine bar color and label based on status
    const barColor =
      row.status === "In Stock"
        ? "#2ecc71"
        : row.status === "Low Stock"
          ? "#e67e22"
          : "#e74c3c";

    const bgColor =
      row.status === "In Stock"
        ? "rgba(46, 204, 113, 0.15)"
        : row.status === "Low Stock"
          ? "rgba(241, 145, 73, 0.15)"
          : "rgba(231, 76, 60, 0.15)";

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
            {row.status}
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

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 }, // Reduced padding on mobile
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Stack on mobile
          justifyContent: "space-between",
          mb: 3,
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Finished Goods Inventory Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stock Control & Material Tracking
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            width: { xs: "100%", sm: "auto" },
            alignItems: "center",
          }}
        >
          {/* BULK DELETE BUTTON - VISIBLE WHEN ITEMS ARE CHECKED */}
          {selectedIds.length > 0 && canModify && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: "bold",
                textTransform: "none",
                px: 3,
                flexShrink: 0,
              }}
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
                sx={{
                  borderRadius: 2,
                  fontWeight: "bold",
                  textTransform: "none",
                  px: 3,
                }}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Save />}
                onClick={handleBulkSave}
                sx={{
                  borderRadius: 2,
                  fontWeight: "bold",
                  textTransform: "none",
                  px: 3,
                }}
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
              borderColor: "#ef7d14",
              color: "#ef7d14",
              "&:hover": {
                borderColor: "#d66e0f",
                backgroundColor: isDark
                  ? "rgba(239, 125, 20, 0.08)"
                  : "#fff5ee",
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
                overflow: "visible",
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
            <MenuItem
              onClick={() => {
                setOpenPrintModal(true);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <Print fontSize="small" sx={{ color: "#ef7d14" }} />
              </ListItemIcon>
              <ListItemText>Print</ListItemText>
            </MenuItem>

            {/* VIEW REMARKS TOGGLE — shows/hides the Remarks column */}
            <MenuItem
              onClick={() => {
                setShowRemarks((prev) => !prev);
                handleMenuClose();
              }}
              sx={{ color: showRemarks ? "#ef7d14" : "text.primary" }}
            >
              <ListItemIcon>
                {showRemarks ? (
                  <VisibilityOff fontSize="small" sx={{ color: "#ef7d14" }} />
                ) : (
                  <Notes fontSize="small" sx={{ color: "#ef7d14" }} />
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
              sx={{ color: showMinStock ? "#ef7d14" : "text.primary" }}
            >
              <ListItemIcon>
                <Straighten fontSize="small" sx={{ color: "#ef7d14" }} />
              </ListItemIcon>
              <ListItemText>
                {showMinStock ? "Hide Min Stock" : "Show Min Stock"}
              </ListItemText>
            </MenuItem>

            {canModify && !isEditingQty && (
              <MenuItem
                onClick={() => {
                  setIsSelectionEnabled(!isSelectionEnabled);
                  if (isSelectionEnabled) setSelectedIds([]); // Clear selection when turning off
                  handleMenuClose();
                }}
                sx={{
                  color: isSelectionEnabled ? "#ef7d14" : "text.primary",
                }}
              >
                <ListItemIcon>
                  {isSelectionEnabled ? (
                    <CheckCircleOutline
                      fontSize="small"
                      sx={{ color: "#ef7d14" }}
                    />
                  ) : (
                    <CheckBoxOutlineBlank
                      fontSize="small"
                      sx={{ color: "#ef7d14" }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {isSelectionEnabled ? "Selection On" : "Select Rows"}
                </ListItemText>
              </MenuItem>
            )}

            {canModify && <Divider sx={{ my: 0.5 }} />}

            {/* EDIT QTY AND ADD ITEM RESTRICTED TO ADMIN/PRODUCTION */}
            {canModify && (
              <>
                {/* REMOVED LOCK BUTTON STATE EXPRESSION / COMPLETELY HIDES WHEN EDITING */}
                {isEditingQty ? (
                  <MenuItem
                    onClick={() => {
                      handleDiscard();
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
                      <EditNote fontSize="small" sx={{ color: "#ef7d14" }} />
                    </ListItemIcon>
                    <ListItemText>Edit Qty</ListItemText>
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    setOpenAddModal(true);
                    handleMenuClose();
                  }}
                  disabled={isEditingQty} // Disable button add when edit qty is on to prevent conflicts
                  sx={{
                    bgcolor: "#ef7d14",
                    color: "#fff",
                    "&:hover": { bgcolor: "#d66e0f" },
                    "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                  }}
                >
                  <ListItemIcon>
                    <Add fontSize="small" sx={{ color: "#fff" }} />
                  </ListItemIcon>
                  <ListItemText>Add Item</ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: { xs: 1, sm: 2 } }}
      >
        {" "}
        {/* --- FILTER BAR --- */}
        <Grid container spacing={2} sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Name or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
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

          <Grid item xs={6} md={2.5}>
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

          {(searchQuery ||
            categoryFilter !== "All" ||
            statusFilter !== "All") && (
            <Grid item xs={12}>
              <Button
                startIcon={<FilterListOff />}
                onClick={handleResetFilters}
                color="inherit"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Reset Filters
              </Button>
            </Grid>
          )}
        </Grid>
        <Box sx={{ overflowX: "auto" }}>
          {" "}
          {/* Added horizontal scroll for table */}
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover",
              }}
            >
              <TableRow>
                {/* SELECT ALL CHECKBOX COLUMN HEADER */}
                {canModify && isSelectionEnabled && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < paginatedData.length
                      }
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((row) =>
                          selectedIds.includes(row.id),
                        )
                      }
                      onChange={handleSelectAllRows}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>

                {/* NEW HEADERS: Brand & Supplier */}
                <TableCell sx={{ fontWeight: "bold" }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Supplier</TableCell>

                <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Unit</TableCell>
                {canViewPrice && (
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Price
                  </TableCell>
                )}
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", pr: 2, minWidth: "100px" }}
                >
                  Quantity
                </TableCell>

                {/* MIN STOCK HEADER — only visible when showMinStock is true */}
                {showMinStock && (
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      minWidth: "100px",
                      color: "#ef7d14",
                    }}
                  >
                    Min Stock
                  </TableCell>
                )}

                {isEditingQty && (
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
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
                            statusView === "bar" ? "#ef7d14" : "divider",
                          color:
                            statusView === "bar" ? "#ef7d14" : "text.secondary",
                          bgcolor:
                            statusView === "bar"
                              ? isDark
                                ? "rgba(239,125,20,0.12)"
                                : "rgba(239,125,20,0.08)"
                              : "transparent",
                          "&:hover": {
                            borderColor: "#ef7d14",
                            color: "#ef7d14",
                            bgcolor: isDark
                              ? "rgba(239,125,20,0.12)"
                              : "rgba(239,125,20,0.08)",
                          },
                        }}
                      >
                        <BarChart sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>

                {/* NEW HEADER: Remarks — only visible when showRemarks is true */}
                {showRemarks && (
                  <TableCell sx={{ fontWeight: "bold", minWidth: "150px" }}>
                    Remarks
                  </TableCell>
                )}

                {/* ACTION COLUMN VISIBLE ONLY TO ADMIN/PRODUCTION */}
                {canViewActionColumn && (
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => {
                const currentMinStock = row.min_stock ?? row.minStock ?? 0;
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={selectedIds.includes(row.id)}
                  >
                    {/* SELECTION ROW CHECKBOX */}
                    {canModify && isSelectionEnabled && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>#{String(row.id).split(":")[0]}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "200px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {row.name}
                      </Typography>
                    </TableCell>

                    {/* NEW CELL DATA: Brand & Supplier */}
                    <TableCell>{row.brand || "—"}</TableCell>
                    <TableCell>{row.supplier || "—"}</TableCell>

                    <TableCell>
                      <Chip
                        label={row.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.uom}</TableCell>
                    {canViewPrice && (
                      <TableCell align="right">
                        ₱
                        {Number(row.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                    )}
                    <TableCell align="right" sx={{ pr: 2 }}>
                      <TextField
                        type="number"
                        variant={isEditingQty ? "outlined" : "standard"}
                        size="small"
                        disabled={
                          !isEditingQty ||
                          (row.movement !== "" && row.movement !== null)
                        }
                        value={row.quantity}
                        onKeyDown={(e) => {
                          if (e.key === "." || e.key === "e")
                            e.preventDefault();
                        }}
                        onChange={(e) => {
                          let val = e.target.value;
                          // Capped quantity input parsing at 9,999,999
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
                              row.quantity <= currentMinStock
                                ? "#ef7d14"
                                : "text.secondary",
                          }}
                        >
                          {currentMinStock}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Adjustment Input (Stock In/Out Functionality) */}
                    {isEditingQty && (
                      <TableCell align="center">
                        <TextField
                          placeholder="+/-"
                          label={
                            parseFloat(row.movement) > 0
                              ? "Stock In"
                              : parseFloat(row.movement) < 0
                                ? "Stock Out"
                                : "Adjustment"
                          }
                          size="small"
                          disabled={(() => {
                            const original = originalData.find(
                              (o) => o.id === row.id,
                            );
                            return (
                              original &&
                              row.quantity !== original.quantity &&
                              (row.movement === "" || row.movement === null)
                            );
                          })()}
                          value={row.movement || ""}
                          onKeyDown={(e) => {
                            if (e.key === "." || e.key === "e")
                              e.preventDefault();
                          }}
                          onChange={(e) => {
                            let val = e.target.value;
                            // Safe check if a numeric string boundary exceeds upper limits
                            if (val !== "" && val !== "-" && val !== "+") {
                              const parsed = parseFloat(val);
                              if (parsed > 9999999) val = "9999999";
                              if (parsed < -9999999) val = "-9999999";
                            }
                            handleMovementChange(row.id, val);
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": {
                                borderColor:
                                  parseFloat(row.movement) > 0
                                    ? "#2ecc71"
                                    : parseFloat(row.movement) < 0
                                      ? "#e74c3c"
                                      : "rgba(255, 255, 255, 0.23)",
                              },
                              "&:hover fieldset": {
                                borderColor:
                                  parseFloat(row.movement) > 0
                                    ? "#2ecc71"
                                    : parseFloat(row.movement) < 0
                                      ? "#e74c3c"
                                      : "rgba(255, 255, 255, 0.5)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor:
                                  parseFloat(row.movement) > 0
                                    ? "#2ecc71"
                                    : parseFloat(row.movement) < 0
                                      ? "#e74c3c"
                                      : "#f39c12",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color:
                                parseFloat(row.movement) > 0
                                  ? "#2ecc71"
                                  : parseFloat(row.movement) < 0
                                    ? "#e74c3c"
                                    : "text.secondary",
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color:
                                parseFloat(row.movement) > 0
                                  ? "#2ecc71"
                                  : parseFloat(row.movement) < 0
                                    ? "#e74c3c"
                                    : "#f39c12",
                            },
                          }}
                          InputProps={{
                            sx: {
                              fontSize: "0.9rem",
                              width: "120px",
                              fontWeight: "bold",
                              color: "text.primary",
                            },
                          }}
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
                            borderRadius: 1.5,
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            bgcolor:
                              row.status === "In Stock"
                                ? "rgba(46, 204, 113, 0.15)"
                                : row.status === "Low Stock"
                                  ? "rgba(241, 145, 73, 0.15)"
                                  : "rgba(231, 76, 60, 0.15)",
                            color:
                              row.status === "In Stock"
                                ? "#2ecc71"
                                : row.status === "Low Stock"
                                  ? "#e67e22"
                                  : "#e74c3c",
                          }}
                        >
                          {row.status}
                        </Box>
                      )}
                    </TableCell>

                    {/* NEW CELL DATA: Remarks — only visible when showRemarks is true */}
                    {showRemarks && (
                      <TableCell
                        sx={{
                          maxWidth: "250px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          color: "text.secondary",
                          fontSize: "0.85rem",
                        }}
                      >
                        {row.remarks || "—"}
                      </TableCell>
                    )}

                    {/* ACTION BUTTONS RESTRICTED TO ADMIN/PRODUCTION */}
                    {canViewActionColumn && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => {
                              setSelectedItem({
                                ...row,
                                id: String(row.id).split(":")[0],
                              });
                              setOpenEditModal(true);
                            }}
                          >
                            <Edit fontSize="inherit" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={
                      7 + // Binago mula 5 para isama ang 3 bagong columns (Brand, Supplier, Remarks) minus yung kailangang alignments
                      (canModify && isSelectionEnabled ? 1 : 0) +
                      (canViewPrice ? 1 : 0) +
                      (isEditingQty ? 1 : 0) +
                      (showRemarks ? 1 : 0) +
                      (showMinStock ? 1 : 0) +
                      (canViewActionColumn ? 1 : 0)
                    }
                    align="center"
                    sx={{ py: 3 }}
                  >
                    No items match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <AddInventoryModal
        open={openAddModal}
        userLevel={user?.user_level} // Use user_level from the user object
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={() => {
          fetchInventory();
          showMessage("Added!", "success");
        }}
      />
      <EditInventoryModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        onSaveSuccess={() => {
          fetchInventory();
          showMessage("Updated!", "info");
        }}
        itemData={selectedItem}
      />
      <PrintInventoryModal
        open={openPrintModal}
        userLevel={user?.user_level}
        handleClose={() => setOpenPrintModal(false)}
        inventoryData={
          selectedIds.length > 0
            ? inventoryData.filter((item) => selectedIds.includes(item.id))
            : inventoryData
        }
      />

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
