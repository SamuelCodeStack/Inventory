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
  Stack, // Added missing Stack import
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
  const [categoryFilter, setCategoryFilter] = useState("All");
  const componentRef = useRef();

  const categories = ["All", "Paper", "Plastic", "Injection", "Trading"];

  // Filter logic
  const filteredData = materialsData.filter((item) => {
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;
    return matchesCategory;
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
        {/* Filter Controls */}
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Filter by Category"
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ width: 200 }}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              {filteredData.length} materials included in this report.
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
            {/* Header */}
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
                <b>Category Scope:</b> {categoryFilter}
              </Typography>
              <Typography variant="body2">
                <b>Generated On:</b> {new Date().toLocaleString()}
              </Typography>
            </Box>

            {/* Table */}
            <Table
              size="small"
              sx={{
                "& td, & th": { border: "1px solid black" },
                bgcolor: "white",
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold", width: "50px" }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Material Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Base Stock
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Qty/Containers
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Ratio Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => {
                    const ratio =
                      row.qtyValue > 0
                        ? (row.baseValue / row.qtyValue).toFixed(2)
                        : 0;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>#{row.id}</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          {row.name}
                        </TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell align="right">
                          {row.baseValue} {row.baseUnit}
                        </TableCell>
                        <TableCell align="right">
                          {row.qtyValue} {row.qtyUnit}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>
                          1 {row.qtyUnit.replace(/s$/, "")} = {ratio}{" "}
                          {row.baseUnit}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      No raw materials found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Signatures */}
            <Box
              sx={{ mt: 10, display: "flex", justifyContent: "space-between" }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{ width: 200, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Warehouse Custodian</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{ width: 200, borderBottom: "1px solid black", mb: 1 }}
                />
                <Typography variant="caption">Production Manager</Typography>
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
