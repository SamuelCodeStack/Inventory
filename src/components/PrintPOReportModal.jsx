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
import { Close, Print } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";

export default function PrintPOReportModal({ open, handleClose, poData }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [filterType, setFilterType] = useState("day");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [printAll, setPrintAll] = useState(false);
  const componentRef = useRef();

  const getRangeLabel = () => {
    if (printAll) return "Full History";
    const date = new Date(selectedDate);
    if (filterType === "day") return `Date: ${date.toLocaleDateString()}`;
    if (filterType === "month")
      return `Month: ${date.toLocaleString("default", { month: "long", year: "numeric" })}`;
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
      return `Week: ${firstday} - ${lastday}`;
    }
    return "";
  };

  const filteredData = printAll
    ? poData
    : poData.filter((po) => {
        // UPDATED: Now filters based on createdAt (the date the PO was added to the system)
        const dateToFilter = po.createdAt || po.date;
        if (!dateToFilter) return false;

        const poDate = new Date(dateToFilter);
        const targetDate = new Date(selectedDate);

        if (filterType === "day")
          return poDate.toLocaleDateString("en-CA") === selectedDate;
        if (filterType === "month")
          return (
            poDate.getMonth() === targetDate.getMonth() &&
            poDate.getFullYear() === targetDate.getFullYear()
          );
        if (filterType === "year")
          return poDate.getFullYear() === targetDate.getFullYear();
        if (filterType === "week") {
          const startOfWeek = new Date(targetDate);
          startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return poDate >= startOfWeek && poDate <= endOfWeek;
        }
        return false;
      });

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `PO_Report_${getRangeLabel().replace(/ /g, "_")}`,
    onAfterPrint: handleClose,
  });

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
          Print Purchase Order Report
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
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 2,
            alignItems: "center",
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
            label="Print All"
          />
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
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
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

        <Box
          sx={{
            p: 4,
            display: "flex",
            justifyContent: "center",
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
              sx={{ mb: 4, letterSpacing: 2 }}
            >
              PO SUMMARY REPORT
            </Typography>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="body2">
                <b>Scope:</b> {getRangeLabel()}
              </Typography>
              <Typography variant="body2">
                <b>Generated:</b> {new Date().toLocaleString()}
              </Typography>
            </Box>
            <Table
              size="small"
              sx={{ "& td, & th": { border: "1px solid black" } }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>PO No.</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Total Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.poNo}</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {row.customer}
                      </TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell align="right">
                        ₱{Number(row.totalPrice).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      No records found.
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
                  sx={{ width: 180, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Accounting</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{ width: 180, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Authorized Signature</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: "background.paper" }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<Print />}
          disabled={filteredData.length === 0}
          sx={{ fontWeight: "bold" }}
        >
          Print PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
