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
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
  useTheme,
  MenuItem,
} from "@mui/material";
import { Close, Print, Download } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

export default function PrintInventoryModal({
  open,
  handleClose,
  inventoryData,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Filter States
  const [filterType, setFilterType] = useState("day"); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [printAll, setPrintAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPrice, setShowPrice] = useState(true);
  const componentRef = useRef();

  // Get unique categories for the dropdown
  const categories = [
    "All",
    ...new Set(inventoryData.map((item) => item.category || "Uncategorized")),
  ];

  // Helper to get range text for the report header
  const getRangeLabel = () => {
    if (printAll)
      return `Full Inventory${selectedCategory !== "All" ? ` - ${selectedCategory}` : ""}`;
    const date = new Date(selectedDate);

    if (filterType === "day") {
      return `Date: ${date.toLocaleDateString("en-US", { dateStyle: "long" })}`;
    }
    if (filterType === "month") {
      return `Month of: ${date.toLocaleString("default", { month: "long", year: "numeric" })}`;
    }
    if (filterType === "year") {
      return `Year: ${date.getFullYear()}`;
    }
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
      return `Week: ${firstday} - ${lastday}`;
    }
    return "";
  };

  // Filter logic - Modified to handle Category and Print All requirements
  const filteredData = inventoryData.filter((item) => {
    // Apply Category Filter first
    if (selectedCategory !== "All" && item.category !== selectedCategory)
      return false;

    if (printAll) return true;

    // Date filtering logic
    const dateToCompare = item.lastUpdated || item.date;
    if (!dateToCompare) return false;

    const itemDate = new Date(dateToCompare);
    const targetDate = new Date(selectedDate);

    // Daily
    if (filterType === "day") {
      return itemDate.toLocaleDateString("en-CA") === selectedDate;
    }

    // Monthly
    if (filterType === "month") {
      return (
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getFullYear() === targetDate.getFullYear()
      );
    }

    // Yearly
    if (filterType === "year") {
      return itemDate.getFullYear() === targetDate.getFullYear();
    }

    // Weekly
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

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Inventory_Report_${getRangeLabel().replace(/ /g, "_")}`,
    onAfterPrint: handleClose,
  });

  const handleExportExcel = () => {
    const worksheetData = filteredData.map((row) => {
      const diff =
        Math.round(row.quantity || 0) - Math.round(row.previousQuantity || 0);

      let rowData = {
        "Item Name": row.name,
        Category: row.category || "---",
        Unit: row.uom,
      };

      if (showPrice) {
        rowData["Price"] = row.price ? Number(row.price) : 0;
      }

      if (printAll) {
        rowData["Quantity"] = Math.round(row.quantity || 0);
        rowData["Status"] = row.status || "Active";
      } else {
        rowData["Prev Qty"] =
          row.previousQuantity != null ? Math.round(row.previousQuantity) : 0;
        rowData["Adjustment"] = diff;
        rowData["Current Qty"] = Math.round(row.quantity || 0);
        rowData["Last Updated"] = new Date(
          row.lastUpdated || row.date,
        ).toLocaleDateString();
      }
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
    XLSX.writeFile(
      workbook,
      `Inventory_Report_${getRangeLabel().replace(/ /g, "_")}.xlsx`,
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: isDarkMode ? "background.paper" : "primary.main",
          color: isDarkMode ? "text.primary" : "white",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Print Inventory Report
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: "inherit" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{ p: 0, bgcolor: isDarkMode ? "#121212" : "grey.100" }}
      >
        {/* Selection Controls */}
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
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
                />
              }
              label="Print All Records"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                />
              }
              label="Include Price"
            />

            <TextField
              select
              label="Category"
              size="small"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ width: 160 }}
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
                  sx={{ width: 140 }}
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

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: "auto" }}
            >
              {filteredData.length} records found.
            </Typography>
          </Box>
        </Box>

        {/* PRINT PREVIEW AREA */}
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: isDarkMode ? "#1e1e1e" : "grey.200",
          }}
        >
          <Paper
            ref={componentRef}
            elevation={4}
            sx={{
              p: "15mm",
              width: "210mm",
              minHeight: "297mm",
              bgcolor: "white",
              color: "black",
              borderRadius: 0,
              "& .MuiTypography-root, & .MuiTableCell-root": { color: "black" },
              "@media print": {
                boxShadow: "none",
                margin: 0,
                width: "100%",
                "& *": { color: "black !important" },
              },
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              align="center"
              sx={{ color: "#1a237e !important" }}
            >
              KIMWIN CORPORATION
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{ mb: 4, letterSpacing: 2, textTransform: "uppercase" }}
            >
              Inventory Assets Report
            </Typography>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="body2">
                <b>Report Scope:</b> {getRangeLabel()}
              </Typography>
              <Typography variant="body2">
                <b>Generated On:</b> {new Date().toLocaleString()}
              </Typography>
            </Box>

            <Table
              size="small"
              sx={{
                "& td, & th": { border: "1px solid black" },
                bgcolor: "white",
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Unit</TableCell>
                  {showPrice && (
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Price
                    </TableCell>
                  )}
                  {printAll ? (
                    <>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Prev Qty
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Adjustment
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Current Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Last Updated
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => {
                    const diff =
                      Math.round(row.quantity || 0) -
                      Math.round(row.previousQuantity || 0);
                    return (
                      <TableRow key={row.id}>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          {row.name}
                        </TableCell>
                        <TableCell>{row.category || "---"}</TableCell>
                        <TableCell>{row.uom}</TableCell>
                        {showPrice && (
                          <TableCell align="right">
                            {row.price
                              ? `₱${Number(row.price).toLocaleString()}`
                              : "---"}
                          </TableCell>
                        )}
                        {printAll ? (
                          <>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: "bold" }}
                            >
                              {Math.round(row.quantity || 0)}
                            </TableCell>
                            <TableCell>{row.status || "Active"}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell align="right">
                              {row.previousQuantity != null
                                ? Math.round(row.previousQuantity)
                                : "---"}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: "bold" }}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: "bold" }}
                            >
                              {Math.round(row.quantity || 0)}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                row.lastUpdated || row.date,
                              ).toLocaleDateString()}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={
                        printAll ? (showPrice ? 6 : 5) : showPrice ? 8 : 7
                      }
                      align="center"
                      sx={{ py: 10 }}
                    >
                      No inventory records found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Footer Section */}
            <Box
              sx={{ mt: 10, display: "flex", justifyContent: "space-between" }}
            >
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
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
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
          Finalize & Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
