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
  InputAdornment,
  Snackbar,
  Alert,
  TablePagination,
  MenuItem,
  Grid,
  Checkbox,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Save,
  EditNote,
  Print,
  FilterListOff,
  Undo,
  CheckCircleOutline,
  CheckBoxOutlineBlank,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Notes,
  VisibilityOff,
  Straighten,
  LocalOffer,
  AddComment,
  Send,
  Cancel,
  Sort,
} from "@mui/icons-material";
import AddInventoryModal from "./AddInventoryModal";
import EditInventoryModal from "./EditInventoryModal";
import PrintInventoryModal from "./PrintInventoryModal";
import BrandModal from "./BrandModal";

function getContrastText(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a2e" : "#ffffff";
}

function hexToRgba(hex, alpha = 0.07) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return "transparent";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Inventory({ mode, user }) {
  const [inventoryData, setInventoryData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [openBrandModal, setOpenBrandModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionEnabled, setIsSelectionEnabled] = useState(false);

  // ── Ledger data for print modal ──
  const [ledgerData, setLedgerData] = useState([]);

  const [groupByBrand, setGroupByBrand] = useState(false);
  const [brandColorMap, setBrandColorMap] = useState({});

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
  const [brandFilter, setBrandFilter] = useState("All");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isDark = mode === "dark";

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

  const canViewPrice =
    user?.user_level !== 3 &&
    user?.user_level !== "3" &&
    user?.user_level !== 4 &&
    user?.user_level !== "4";

  const showMessage = (msg, sev = "success") =>
    setSnackbar({ open: true, message: msg, severity: sev });

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/brands`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const map = {};
        data.forEach((b) => {
          if (b.brand_name?.trim()) {
            map[b.brand_name.trim()] = b.brand_color || "#1565c0";
          }
        });
        setBrandColorMap(map);
      }
    } catch (e) {
      console.error("Failed to fetch brand colors", e);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory`);
      const data = await response.json();
      const initializedData = data.map((item) => ({ ...item, movement: "" }));
      setInventoryData(initializedData);
      setOriginalData(JSON.parse(JSON.stringify(initializedData)));
    } catch (error) {
      showMessage("Network Error: Could not connect to server", "error");
    }
  };

  // ── Fetch ledger then open print modal ──
  const handleOpenPrint = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/ledger`,
      );
      const data = await res.json();
      setLedgerData(data);
    } catch (err) {
      console.error("Failed to load ledger:", err);
      showMessage("Failed to load transaction log", "error");
    }
    setOpenPrintModal(true);
    handleMenuClose();
  };

  useEffect(() => {
    fetchInventory();
    fetchBrands();
  }, []);

  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id).includes(searchQuery);
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;
    const matchesBrand =
      brandFilter === "All" || item.brand?.trim() === brandFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesBrand;
  });

  const getGroupedData = (data) => {
    const groups = {};
    data.forEach((item) => {
      const brandKey = item.brand?.trim();
      if (!brandKey) return;
      if (!groups[brandKey]) groups[brandKey] = [];
      groups[brandKey].push(item);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([brand, items]) => ({ brand, items }));
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const groupedPaginatedData = getGroupedData(paginatedData);

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setBrandFilter("All");
    setPage(0);
  };

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

  const handleMovementChange = (id, value) => {
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
    setIsEditingQty(false);
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
            update_type: isAdjustment ? 2 : 1,
            adjustment: isAdjustment ? item.movement : null,
            movement_value: isAdjustment ? item.movement : null,
          };
        }),
    };
    try {
      const response = await fetch(
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
        `${import.meta.env.VITE_API_URL}/inventory/${cleanId}`,
        { method: "DELETE", credentials: "include" },
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
          { method: "DELETE", credentials: "include" },
        );
        if (res.ok) successCount++;
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

  const handleToggleRemarkInput = (rowId, currentRemark = "") => {
    if (activeRemarkRowId === rowId) {
      setActiveRemarkRowId(null);
      setRemarkInputValue("");
    } else {
      setActiveRemarkRowId(rowId);
      setRemarkInputValue(currentRemark);
    }
  };

  const handleSaveRemark = async (itemId) => {
    if (!remarkInputValue.trim()) {
      showMessage("Remarks cannot be empty", "warning");
      return;
    }
    try {
      setSavingRemark(true);
      const cleanId = String(itemId).split(":")[0];
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/${cleanId}/remarks`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remarks: remarkInputValue.trim() }),
        },
      );
      if (res.ok) {
        showMessage("Remark saved successfully", "success");
        setActiveRemarkRowId(null);
        setRemarkInputValue("");
        fetchInventory();
      } else {
        showMessage("Failed to save remark", "error");
      }
    } catch (e) {
      showMessage("Network error saving remark", "error");
    } finally {
      setSavingRemark(false);
    }
  };

  const handleDeleteRemark = async (itemId) => {
    if (!window.confirm("Clear this remark?")) return;
    try {
      setDeletingRemarkId(itemId);
      const cleanId = String(itemId).split(":")[0];
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/${cleanId}/remarks`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) {
        showMessage("Remark cleared", "info");
        fetchInventory();
      } else {
        showMessage("Failed to clear remark", "error");
      }
    } catch (e) {
      showMessage("Network error clearing remark", "error");
    } finally {
      setDeletingRemarkId(null);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Out of Stock") return "#e74c3c";
    if (status === "Low Stock") return "#e67e22";
    return "inherit";
  };

  const renderStatusBar = (row) => {
    const minStock = row.min_stock ?? row.minStock ?? 0;
    const qty = row.quantity ?? 0;
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

  const totalColumns =
    7 +
    (canModify && isSelectionEnabled ? 1 : 0) +
    (canViewPrice ? 1 : 0) +
    (isEditingQty ? 1 : 0) +
    (showRemarks ? 1 : 0) +
    (showMinStock ? 1 : 0) +
    (canViewActionColumn ? 1 : 0);

  const renderRow = (row, brandColor = null) => {
    const currentMinStock = row.min_stock ?? row.minStock ?? 0;
    const statusColor = getStatusColor(row.status);
    const isRemarkOpen = activeRemarkRowId === row.id;

    return (
      <TableRow
        key={row.id}
        hover
        selected={selectedIds.includes(row.id)}
        sx={{
          "& .MuiTableCell-root": { color: statusColor },
          ...(brandColor && {
            borderLeft: `4px solid ${brandColor}`,
            "&:hover td": { bgcolor: hexToRgba(brandColor, 0.08) },
          }),
        }}
      >
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
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ color: statusColor }}
          >
            {row.name}
          </Typography>
        </TableCell>

        <TableCell>
          {row.brand?.trim() ? (
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: brandColorMap[row.brand.trim()] || "#9e9e9e",
                  border: "1.5px solid",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.15)",
                }}
              />
              <Typography variant="body2" sx={{ color: statusColor }}>
                {row.brand}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              —
            </Typography>
          )}
        </TableCell>

        <TableCell>{row.supplier || "—"}</TableCell>
        <TableCell>{row.category}</TableCell>
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
              !isEditingQty || (row.movement !== "" && row.movement !== null)
            }
            value={row.quantity}
            onKeyDown={(e) => {
              if (e.key === "." || e.key === "e") e.preventDefault();
            }}
            onChange={(e) => {
              let val = e.target.value;
              if (val !== "" && parseFloat(val) > 9999999) val = "9999999";
              handleQuantityChangeLocal(row.id, val);
            }}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: {
                  fontWeight: "bold",
                  color: statusColor,
                  display: "flex",
                  justifyContent: "flex-end",
                  minWidth: "100px",
                  "& input": {
                    textAlign: "right",
                    paddingRight: "8px",
                    flexGrow: 1,
                    color: statusColor,
                    width: `${Math.max(4, String(row.quantity).length) * 0.5}ch`,
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
                const original = originalData.find((o) => o.id === row.id);
                return (
                  original &&
                  row.quantity !== original.quantity &&
                  (row.movement === "" || row.movement === null)
                );
              })()}
              value={row.movement || ""}
              onKeyDown={(e) => {
                if (e.key === "." || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                let val = e.target.value;
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
                          : "rgba(255,255,255,0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor:
                      parseFloat(row.movement) > 0
                        ? "#2ecc71"
                        : parseFloat(row.movement) < 0
                          ? "#e74c3c"
                          : "rgba(255,255,255,0.5)",
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

        <TableCell align="center">{renderStatusBar(row)}</TableCell>

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
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.disabled",
                      fontSize: "0.7rem",
                      display: "block",
                      mt: 0.2,
                    }}
                  >
                    {row.remarks_added_by && `by ${row.remarks_added_by}`}
                    {row.remarks_added_by && row.remarks_created_at && " · "}
                    {row.remarks_created_at &&
                      new Date(row.remarks_created_at).toLocaleDateString()}
                  </Typography>
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
                    placeholder={
                      row.remarks ? "Update remark..." : "Add a remark..."
                    }
                    value={remarkInputValue}
                    onChange={(e) => setRemarkInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveRemark(row.id);
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
                        onClick={() => handleSaveRemark(row.id)}
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

        {canViewActionColumn && (
          <TableCell align="right">
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              {showRemarks && canModify && (
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
                        handleToggleRemarkInput(row.id, row.remarks || "")
                      }
                      sx={{ color: isRemarkOpen ? "error.main" : "#ef7d14" }}
                    >
                      {isRemarkOpen ? (
                        <Cancel fontSize="inherit" />
                      ) : row.remarks ? (
                        <Edit fontSize="inherit" />
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
                          onClick={() => handleDeleteRemark(row.id)}
                          disabled={deletingRemarkId === row.id}
                        >
                          <Delete fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </>
              )}
              <IconButton
                size="small"
                color="info"
                onClick={() => {
                  setSelectedItem({ ...row, id: String(row.id).split(":")[0] });
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
  };

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
          flexDirection: { xs: "column", md: "row" },
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
          sx={{ width: { xs: "100%", sm: "auto" }, alignItems: "center" }}
        >
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
            disableScrollLock
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
            {/* Print — closes menu since it opens a modal */}
            <MenuItem onClick={handleOpenPrint}>
              <ListItemIcon>
                <Print fontSize="small" sx={{ color: "#ef7d14" }} />
              </ListItemIcon>
              <ListItemText>Print</ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => setShowRemarks((prev) => !prev)}
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

            <MenuItem
              onClick={() => setShowMinStock((prev) => !prev)}
              sx={{ color: showMinStock ? "#ef7d14" : "text.primary" }}
            >
              <ListItemIcon>
                <Straighten fontSize="small" sx={{ color: "#ef7d14" }} />
              </ListItemIcon>
              <ListItemText>
                {showMinStock ? "Hide Min Stock" : "Show Min Stock"}
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={() => setGroupByBrand((prev) => !prev)}
              sx={{ color: groupByBrand ? "#ef7d14" : "text.primary" }}
            >
              <ListItemIcon>
                <Sort fontSize="small" sx={{ color: "#ef7d14" }} />
              </ListItemIcon>
              <ListItemText>
                {groupByBrand ? "Ungroup Brands" : "Group by Brand"}
              </ListItemText>
            </MenuItem>

            {canModify && (
              <MenuItem
                onClick={() => {
                  setOpenBrandModal(true);
                  handleMenuClose();
                }}
              >
                <ListItemIcon>
                  <LocalOffer fontSize="small" sx={{ color: "#ef7d14" }} />
                </ListItemIcon>
                <ListItemText>Manage Brands</ListItemText>
              </MenuItem>
            )}

            {canModify && !isEditingQty && (
              <MenuItem
                onClick={() => {
                  setIsSelectionEnabled(!isSelectionEnabled);
                  if (isSelectionEnabled) setSelectedIds([]);
                }}
                sx={{ color: isSelectionEnabled ? "#ef7d14" : "text.primary" }}
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

            {canModify && isEditingQty && (
              <MenuItem
                onClick={() => {
                  handleDiscard();
                }}
                sx={{ color: "error.main" }}
              >
                <ListItemIcon>
                  <Undo fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Cancel Edit</ListItemText>
              </MenuItem>
            )}

            {canModify && !isEditingQty && (
              <MenuItem onClick={() => setIsEditingQty(true)}>
                <ListItemIcon>
                  <EditNote fontSize="small" sx={{ color: "#ef7d14" }} />
                </ListItemIcon>
                <ListItemText>Edit Qty</ListItemText>
              </MenuItem>
            )}

            {canModify && (
              <MenuItem
                onClick={() => {
                  setOpenAddModal(true);
                  handleMenuClose();
                }}
                disabled={isEditingQty}
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
            )}
          </Menu>
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: { xs: 1, sm: 2 } }}
      >
        <Grid container spacing={2} sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
          <Grid size={{ xs: 12, md: 6 }}>
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
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Brand"
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All Brands</MenuItem>
              {[
                ...new Set(
                  inventoryData
                    .map((item) => item.brand?.trim())
                    .filter(Boolean),
                ),
              ]
                .sort()
                .map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: brandColorMap[brand] || "#9e9e9e",
                          flexShrink: 0,
                        }}
                      />
                      {brand}
                    </Stack>
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
          {(searchQuery ||
            categoryFilter !== "All" ||
            statusFilter !== "All" ||
            brandFilter !== "All") && (
            <Grid size={12}>
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
          <Table size="small" sx={{ minWidth: 650 }}>
            <TableHead
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover",
              }}
            >
              <TableRow>
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
                {canViewActionColumn && (
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {groupByBrand
                ? groupedPaginatedData.map(({ brand, items }) => {
                    const headerColor =
                      brandColorMap[brand] || (isDark ? "#1a2744" : "#1565c0");
                    const textColor = getContrastText(headerColor);
                    return (
                      <React.Fragment key={brand}>
                        <TableRow>
                          <TableCell
                            colSpan={totalColumns}
                            sx={{
                              bgcolor: headerColor,
                              color: textColor,
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              py: 1,
                              px: 2,
                              borderBottom: "none",
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: textColor,
                                  opacity: 0.6,
                                }}
                              />
                              {brand} ({items.length})
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {items.map((row) => renderRow(row, headerColor))}
                      </React.Fragment>
                    );
                  })
                : paginatedData.map((row) => renderRow(row))}

              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
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
        userLevel={user?.user_level}
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
        userLevel={user?.user_level}
      />

      <PrintInventoryModal
        open={openPrintModal}
        userLevel={user?.user_level}
        handleClose={() => setOpenPrintModal(false)}
        inventoryData={
          selectedIds.length > 0
            ? ledgerData.filter((tx) => selectedIds.includes(tx.itemId))
            : ledgerData
        }
      />

      <BrandModal
        open={openBrandModal}
        handleClose={() => {
          setOpenBrandModal(false);
          fetchBrands();
        }}
        mode={mode}
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
