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
  useTheme, // Added to detect theme
} from "@mui/material";
import { Close, Print } from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";

export default function PrintInventoryModal({
  open,
  handleClose,
  inventoryData,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [printAll, setPrintAll] = useState(false);
  const componentRef = useRef();

  // Filter logic
  const filteredData = printAll
    ? inventoryData
    : inventoryData.filter((item) => {
        if (!item.date) return false;
        // Robust date comparison
        const itemDate = new Date(item.date).toLocaleDateString("en-CA");
        return itemDate === selectedDate;
      });

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Inventory_Report_${printAll ? "Full" : selectedDate}`,
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
          borderBottom: isDarkMode ? "1px solid" : "none",
          borderColor: "divider",
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
            display: "flex",
            alignItems: "center",
            gap: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={printAll}
                onChange={(e) => setPrintAll(e.target.checked)}
              />
            }
            label="Print All Dates"
          />

          {!printAll && (
            <TextField
              type="date"
              label="Report Date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}

          <Typography variant="caption" color="text.secondary">
            {filteredData.length} items to be printed.
          </Typography>
        </Box>

        {/* PRINT PREVIEW AREA */}
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowX: "auto",
            // Darken the background around the white paper in dark mode
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
              bgcolor: "white", // Paper is ALWAYS white
              color: "black", // Text is ALWAYS black for the report
              borderRadius: 0,
              // Apply specific styles for printing to ensure dark mode doesn't leak into the PDF
              "@media print": {
                boxShadow: "none",
                margin: 0,
                width: "100%",
                "& *": { color: "black !important" }, // Force all sub-elements to black text
              },
              // Inside the preview, force text to black regardless of global mode
              "& .MuiTypography-root, & .MuiTableCell-root": {
                color: "black",
              },
            }}
          >
            {/* Print Styles */}
            <style>{`
              @media print {
                @page { size: A4; margin: 10mm; }
                body { background-color: white !important; -webkit-print-color-adjust: exact; }
                * { color: black !important; border-color: #000 !important; }
                .no-print { display: none !important; }
              }
            `}</style>

            <Typography
              variant="h4"
              fontWeight="bold"
              align="center"
              sx={{ color: "#1a237e !important", mb: 0.5 }}
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
                <b>Filter:</b>{" "}
                {printAll
                  ? "Full Inventory"
                  : `Date: ${new Date(selectedDate).toLocaleDateString()}`}
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
                <TableRow sx={{ bgcolor: "#eeeeee" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Quantity
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{String(row.id).split(":")[0]}</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {row.name}
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell>{row.uom}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      No inventory records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Footer Signature */}
            <Box
              sx={{ mt: 15, display: "flex", justifyContent: "space-between" }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{ width: 180, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Warehouse In-Charge</Typography>
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
          startIcon={<Print />}
          disabled={filteredData.length === 0}
          sx={{ fontWeight: "bold" }}
        >
          Finalize & Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
