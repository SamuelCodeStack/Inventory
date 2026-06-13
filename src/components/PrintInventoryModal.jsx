import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  FormControlLabel,
  Checkbox,
  useTheme,
  MenuItem,
  Chip,
} from "@mui/material";
import { Close, Print, Download } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

export default function PrintInventoryModal({
  open,
  handleClose,
  inventoryData, // Each element = one transaction record (may have duplicates of same item)
  userLevel,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [filterType, setFilterType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [printAll, setPrintAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPrice, setShowPrice] = useState(true);
  const componentRef = useRef();

  const canShowPrice =
    userLevel !== 3 &&
    userLevel !== "3" &&
    userLevel !== 4 &&
    userLevel !== "4";

  const categories = [
    "All",
    ...new Set(inventoryData.map((item) => item.category || "Uncategorized")),
  ];

  const getRangeLabel = () => {
    if (printAll)
      return `Full Transaction Log${selectedCategory !== "All" ? ` — ${selectedCategory}` : ""}`;
    const date = new Date(selectedDate);
    if (filterType === "day")
      return `Date: ${date.toLocaleDateString("en-US", { dateStyle: "long" })}`;
    if (filterType === "month")
      return `Month of: ${date.toLocaleString("default", { month: "long", year: "numeric" })}`;
    if (filterType === "year") return `Year: ${date.getFullYear()}`;
    if (filterType === "week") {
      const tempDate = new Date(selectedDate);
      const first = tempDate.getDate() - tempDate.getDay();
      const last = first + 6;
      const firstday = new Date(
        new Date(selectedDate).setDate(first),
      ).toLocaleDateString();
      const lastday = new Date(
        new Date(selectedDate).setDate(last),
      ).toLocaleDateString();
      return `Week: ${firstday} – ${lastday}`;
    }
    return "";
  };

  // ─── Filter: each record is a transaction, keep all that match date range ───
  const filteredData = inventoryData.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory)
      return false;
    if (printAll) return true;

    const dateToCompare = item.lastUpdated || item.date || item.transactionDate;
    if (!dateToCompare) return false;

    const itemDate = new Date(dateToCompare);
    const targetDate = new Date(selectedDate);

    if (filterType === "day")
      return itemDate.toLocaleDateString("en-CA") === selectedDate;
    if (filterType === "month")
      return (
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getFullYear() === targetDate.getFullYear()
      );
    if (filterType === "year")
      return itemDate.getFullYear() === targetDate.getFullYear();
    if (filterType === "week") {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return itemDate >= startOfWeek && itemDate <= endOfWeek;
    }
    return false;
  });

  // ─── Per-transaction movement type ───────────────────────────────────────────
  // Each record has its own qty change. Support both:
  //   - adjustment field  (explicit signed number: +100, -50)
  //   - qty diff (quantity - previousQuantity)
  //   - type / movementType field ("in" / "out" / "stock_in" / "stock_out")
  const getMovement = (row) => {
    // 1. Explicit movement type field
    if (row.movementType || row.type) {
      const t = (row.movementType || row.type).toLowerCase();
      if (t.includes("in"))
        return {
          type: "in",
          qty: Math.abs(row.quantity || row.qty || row.adjustment || 0),
        };
      if (t.includes("out"))
        return {
          type: "out",
          qty: Math.abs(row.quantity || row.qty || row.adjustment || 0),
        };
    }
    // 2. Explicit signed adjustment field
    if (row.adjustment != null) {
      const adj = Number(row.adjustment);
      if (adj > 0) return { type: "in", qty: adj };
      if (adj < 0) return { type: "out", qty: Math.abs(adj) };
      return { type: "neutral", qty: 0 };
    }
    // 3. Diff between current and previous quantity
    const diff =
      Math.round(row.quantity || 0) - Math.round(row.previousQuantity || 0);
    if (diff > 0) return { type: "in", qty: diff };
    if (diff < 0) return { type: "out", qty: Math.abs(diff) };
    return { type: "neutral", qty: 0 };
  };

  const ROW_STYLE = {
    in: {
      bg: isDarkMode ? "#0d2b1a" : "#e8f5e9",
      bgHover: isDarkMode ? "#0a3d1f" : "#c8e6c9",
      border: isDarkMode ? "#2e7d32" : "#66bb6a",
      chipBg: "#2e7d32",
      label: "Stock In",
      sign: "+",
      textColor: "#2e7d32",
    },
    out: {
      bg: isDarkMode ? "#2b0d0d" : "#ffebee",
      bgHover: isDarkMode ? "#3d0a0a" : "#ffcdd2",
      border: isDarkMode ? "#c62828" : "#ef5350",
      chipBg: "#c62828",
      label: "Stock Out",
      sign: "−",
      textColor: "#c62828",
    },
    neutral: {
      bg: "transparent",
      bgHover: isDarkMode ? "#2a2a2a" : "#fafafa",
      border: "transparent",
      chipBg: "#9e9e9e",
      label: "No Change",
      sign: "",
      textColor: "text.secondary",
    },
  };

  // ─── Summary counts ───────────────────────────────────────────────────────────
  const txCounts = filteredData.reduce(
    (acc, row) => {
      const { type, qty } = getMovement(row);
      if (type === "in") {
        acc.inCount++;
        acc.inQty += qty;
      }
      if (type === "out") {
        acc.outCount++;
        acc.outQty += qty;
      }
      return acc;
    },
    { inCount: 0, inQty: 0, outCount: 0, outQty: 0 },
  );

  // ─── Print ────────────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Inventory_Transactions_${getRangeLabel().replace(/ /g, "_")}`,
    onAfterPrint: handleClose,
  });

  // ─── Export Excel ─────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    const worksheetData = filteredData.map((row, idx) => {
      const { type, qty } = getMovement(row);
      const style = ROW_STYLE[type];
      const txDate = row.lastUpdated || row.date || row.transactionDate;

      let rowData = {
        "#": idx + 1,
        "Item Name": row.name,
        Category: row.category || "---",
        Unit: row.uom,
      };
      if (showPrice && canShowPrice) {
        rowData["Price"] = row.price ? Number(row.price) : 0;
      }
      rowData["Movement"] = style.label;
      rowData["Qty Change"] = type === "out" ? -qty : qty;
      rowData["Current Stock"] = Math.round(row.quantity || 0);
      if (txDate) {
        rowData["Date / Time"] = new Date(txDate).toLocaleString();
      }
      if (row.remarks || row.note || row.reason) {
        rowData["Remarks"] = row.remarks || row.note || row.reason || "";
      }
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction Log");
    XLSX.writeFile(
      workbook,
      `Inventory_Transactions_${getRangeLabel().replace(/ /g, "_")}.xlsx`,
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: isDarkMode ? "background.paper" : "primary.main",
          color: isDarkMode ? "text.primary" : "white",
          py: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold" lineHeight={1}>
            Inventory Transaction Log
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {getRangeLabel()}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: "inherit" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {/* ── Filter Bar ── */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={printAll}
                onChange={(e) => setPrintAll(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">All Records</Typography>}
          />

          {canShowPrice && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Include Price</Typography>}
            />
          )}

          <TextField
            select
            label="Category"
            size="small"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{ width: 150 }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          {!printAll && (
            <>
              <TextField
                select
                label="Filter Range"
                size="small"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ width: 150 }}
              >
                <MenuItem value="day">Specific Day</MenuItem>
                <MenuItem value="week">Specific Week</MenuItem>
                <MenuItem value="month">Specific Month</MenuItem>
                <MenuItem value="year">Specific Year</MenuItem>
              </TextField>

              <TextField
                type="date"
                label="Reference Date"
                size="small"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          {/* ── Summary chips ── */}
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Chip
              size="small"
              label={`▲ In: ${txCounts.inCount} tx / +${txCounts.inQty} qty`}
              sx={{
                bgcolor: "#2e7d32",
                color: "#fff",
                fontWeight: 600,
                fontSize: 11,
              }}
            />
            <Chip
              size="small"
              label={`▼ Out: ${txCounts.outCount} tx / −${txCounts.outQty} qty`}
              sx={{
                bgcolor: "#c62828",
                color: "#fff",
                fontWeight: 600,
                fontSize: 11,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* ── Table (print target) ── */}
        <Box
          ref={componentRef}
          sx={{
            overflowY: "auto",
            flex: 1,
            maxHeight: "60vh",
            "@media print": {
              maxHeight: "none",
              overflow: "visible",
              "& *": { color: "black !important" },
            },
          }}
        >
          {/* Print-only company header */}
          <Box
            sx={{
              display: "none",
              "@media print": {
                display: "block",
                textAlign: "center",
                py: 3,
                px: 4,
              },
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: "#1a237e !important" }}
            >
              KIMWIN CORPORATION
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ letterSpacing: 2, textTransform: "uppercase", mb: 1 }}
            >
              Inventory Transaction Log
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 2,
                mb: 2,
              }}
            >
              <Typography variant="body2">
                <b>Report Scope:</b> {getRangeLabel()}
              </Typography>
              <Typography variant="body2">
                <b>Generated On:</b> {new Date().toLocaleString()}
              </Typography>
            </Box>
            {/* Print legend */}
            <Box
              sx={{ display: "flex", gap: 3, justifyContent: "center", mb: 2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: "#c8e6c9",
                    border: "1px solid #66bb6a",
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Stock In</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: "#ffcdd2",
                    border: "1px solid #ef5350",
                    borderRadius: 0.5,
                  }}
                />
                <Typography variant="caption">Stock Out</Typography>
              </Box>
            </Box>
          </Box>

          <Table
            size="small"
            stickyHeader
            sx={{
              "& .MuiTableCell-stickyHeader": {
                bgcolor: isDarkMode ? "#1e1e1e" : "#f5f5f5",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                {showPrice && canShowPrice && (
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Price
                  </TableCell>
                )}
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, minWidth: 100 }}
                >
                  Movement
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, minWidth: 90 }}>
                  Qty Change
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, minWidth: 90 }}>
                  Stock After
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 130 }}>
                  Date / Time
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => {
                  const { type, qty } = getMovement(row);
                  const style = ROW_STYLE[type];
                  const txDate =
                    row.lastUpdated || row.date || row.transactionDate;

                  return (
                    <TableRow
                      key={`${row.id}-${idx}`}
                      sx={{
                        bgcolor: style.bg,
                        borderLeft: `4px solid ${style.border}`,
                        transition: "background 0.12s",
                        "&:hover": { bgcolor: style.bgHover },
                        "@media print": {
                          bgcolor:
                            type === "in"
                              ? "#e8f5e9 !important"
                              : type === "out"
                                ? "#ffebee !important"
                                : "transparent !important",
                        },
                      }}
                    >
                      {/* Row number */}
                      <TableCell sx={{ color: "text.secondary", fontSize: 11 }}>
                        {idx + 1}
                      </TableCell>

                      {/* Item Name — bold, shows duplicates naturally */}
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>

                      <TableCell>{row.category || "—"}</TableCell>
                      <TableCell>{row.uom}</TableCell>

                      {/* Price */}
                      {showPrice && canShowPrice && (
                        <TableCell align="right">
                          {row.price
                            ? `₱${Number(row.price).toLocaleString()}`
                            : "—"}
                        </TableCell>
                      )}

                      {/* Movement chip */}
                      <TableCell align="center">
                        <Chip
                          label={style.label}
                          size="small"
                          sx={{
                            bgcolor: style.chipBg,
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 11,
                            minWidth: 80,
                          }}
                        />
                      </TableCell>

                      {/* Qty change — signed, colored */}
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: style.textColor,
                            fontFamily: "monospace",
                            fontSize: 14,
                          }}
                        >
                          {type === "in"
                            ? `+${qty}`
                            : type === "out"
                              ? `−${qty}`
                              : "—"}
                        </Typography>
                      </TableCell>

                      {/* Stock after transaction */}
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {Math.round(row.quantity || 0)}
                      </TableCell>

                      {/* Date / Time */}
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {txDate
                          ? new Date(txDate).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No transaction records found for the selected criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Print-only summary footer */}
          <Box
            sx={{
              display: "none",
              "@media print": {
                display: "block",
                px: 4,
                mt: 4,
              },
            }}
          >
            <Box sx={{ display: "flex", gap: 4, mb: 6 }}>
              <Typography variant="body2">
                <b>Total Stock In:</b> {txCounts.inCount} transactions, +
                {txCounts.inQty} units
              </Typography>
              <Typography variant="body2">
                <b>Total Stock Out:</b> {txCounts.outCount} transactions, −
                {txCounts.outQty} units
              </Typography>
              <Typography variant="body2">
                <b>Net Movement:</b>{" "}
                {txCounts.inQty - txCounts.outQty >= 0 ? "+" : ""}
                {txCounts.inQty - txCounts.outQty} units
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{ width: 200, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Warehouse Personnel</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{ width: 200, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Authorized Signature</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {/* ── Footer Actions ── */}
      <DialogActions
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          gap: 1,
        }}
      >
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleExportExcel}
          variant="outlined"
          size="large"
          startIcon={<Download />}
          disabled={filteredData.length === 0}
          sx={{ fontWeight: "bold", px: 4 }}
        >
          Export Excel
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          size="large"
          startIcon={<Print />}
          disabled={filteredData.length === 0}
          sx={{ fontWeight: "bold", px: 4 }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
