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
  Paper,
  MenuItem,
  Stack,
  FormControlLabel,
  Checkbox,
  useTheme,
} from "@mui/material";
import { Close, Print } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";

export default function PrintRawMaterialModal({
  open,
  handleClose,
  materialsData,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Filter States
  const [filterType, setFilterType] = useState("day"); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [printAll, setPrintAll] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const componentRef = useRef();

  const categories = ["All", "Paper", "Plastic", "Injection", "Trading"];

  // Helper to get range text for the report header
  const getRangeLabel = () => {
    if (printAll) return "Full Inventory";
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

  // Filter logic - Matches Inventory logic using latest update date
  const filteredData = materialsData.filter((item) => {
    // Check Category first
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    if (!matchesCategory) return false;

    if (printAll) return true;

    // Check Date (Uses updatedAt if it exists, otherwise createdAt)
    const dateToCompare = item.updated_at || item.createdAt;
    if (!dateToCompare) return false;

    const itemDate = new Date(dateToCompare);
    const targetDate = new Date(selectedDate);

    if (filterType === "day") {
      return itemDate.toLocaleDateString("en-CA") === selectedDate;
    }
    if (filterType === "month") {
      return (
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getFullYear() === targetDate.getFullYear()
      );
    }
    if (filterType === "year") {
      return itemDate.getFullYear() === targetDate.getFullYear();
    }
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
    documentTitle: `Raw_Materials_Report_${new Date().toLocaleDateString()}`,
    onAfterPrint: handleClose,
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: isDarkMode ? "background.paper" : "#f2994a",
          color: isDarkMode ? "text.primary" : "white",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Print Raw Materials Report
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
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={printAll}
                  onChange={(e) => setPrintAll(e.target.checked)}
                />
              }
              label="Print All"
            />

            <TextField
              select
              label="Category"
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ width: 130 }}
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
                  label="Range"
                  size="small"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ width: 130 }}
                >
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </TextField>

                <TextField
                  type="date"
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
          </Stack>
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
              sx={{ color: "#f2994a !important" }}
            >
              KIMWIN CORPORATION
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{ mb: 4, letterSpacing: 2, textTransform: "uppercase" }}
            >
              Raw Materials Inventory Report
            </Typography>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="body2">
                <b>Scope:</b> {getRangeLabel()} | <b>Category:</b>{" "}
                {categoryFilter}
              </Typography>
              <Typography variant="body2">
                <b>Generated:</b> {new Date().toLocaleString()}
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
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {printAll ? (
                    <>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Material Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Category
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Measurement
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Material Name
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Measurement
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Prev. Qty
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
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
                      (row.quantity || 0) - (row.previousQuantity || 0);
                    return (
                      <TableRow key={row.id}>
                        {printAll ? (
                          <>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              {row.name}
                            </TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell align="right">
                              {row.measurementValue} {row.measurementUnit}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: "bold" }}
                            >
                              {row.quantity}
                            </TableCell>
                            <TableCell>
                              {row.quantity <= 0
                                ? "Out of Stock"
                                : row.status || "In Stock"}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>#{row.id}</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              {row.name}
                            </TableCell>
                            <TableCell align="right">
                              {row.measurementValue} {row.measurementUnit}
                            </TableCell>
                            <TableCell align="right">
                              {row.previousQuantity}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: "bold" }}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </TableCell>
                            <TableCell align="right">{row.quantity}</TableCell>
                            <TableCell>
                              {new Date(
                                row.updated_at || row.createdAt,
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
                      colSpan={printAll ? 5 : 7}
                      align="center"
                      sx={{ py: 10 }}
                    >
                      No records found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

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
          onClick={handlePrint}
          variant="contained"
          size="large"
          startIcon={<Print />}
          disabled={filteredData.length === 0}
          sx={{
            fontWeight: "bold",
            px: 4,
            bgcolor: "#f2994a",
            "&:hover": { bgcolor: "#d8853a" },
          }}
        >
          Print Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
