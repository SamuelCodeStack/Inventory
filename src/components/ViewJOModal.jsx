import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import {
  Close,
  Inventory,
  Engineering,
  CalendarToday,
  Print,
} from "@mui/icons-material";

export default function ViewJOModal({ open, handleClose, jo, mode }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `JobOrder_${jo?.jo_id || "Details"}`,
  });

  useEffect(() => {
    if (open && jo?.jo_id) {
      setLoading(true);
      fetch(`http://localhost:3000/api/job-orders/${jo.jo_id}/materials`)
        .then((res) => res.json())
        .then((data) => {
          setMaterials(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching materials:", err);
          setLoading(false);
        });
    }
  }, [open, jo]);

  if (!jo) return null;

  const isDark = mode === "dark";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(dateString));
  };

  /**
   * Helper function to format quantity based on unit.
   * If unit is a weight/length base, show 1 decimal. Otherwise whole number.
   */
  const formatQuantity = (qty, unit) => {
    const value = parseFloat(qty) || 0;
    const baseUnits = ["kg", "kilogram", "meter", "m", "liter", "L", "lb"];

    if (baseUnits.includes(unit?.toLowerCase())) {
      return value.toFixed(1);
    }
    return Math.round(value).toString();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Engineering color="primary" /> Job Order Details: #{jo.jo_id}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: isDark ? "#121212" : "#fcfcfc" }}>
        {/* UI VIEW (Visible on Screen) */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                PRODUCTION ITEM
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {jo.item_name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                DATE CREATED
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarToday
                  fontSize="small"
                  color="action"
                  sx={{ fontSize: 16 }}
                />
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(jo.created_at)}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                QUANTITY PRODUCED
              </Typography>
              <Typography variant="h6">
                {jo.quantity_produced
                  ? formatQuantity(jo.quantity_produced, "units")
                  : "--"}{" "}
                units
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                STATUS
              </Typography>
              <Box>
                <Chip
                  label={jo.status}
                  size="small"
                  color={jo.status === "Completed" ? "success" : "warning"}
                  sx={{ fontWeight: "bold" }}
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Inventory fontSize="small" /> Materials Consumed (BOM)
        </Typography>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead
              sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#fafafa" }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Source</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Material Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Qty Used
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((mat, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip
                        label={mat.source_type}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: "bold",
                          borderColor:
                            mat.source_type === "Raw"
                              ? "#f2994a"
                              : "secondary.main",
                          color:
                            mat.source_type === "Raw"
                              ? "#f2994a"
                              : "secondary.main",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {mat.material_name}
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {/* --- CONDITIONAL FORMATTING APPLIED HERE --- */}
                        {formatQuantity(mat.used_stock, mat.unit)} {mat.unit}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- HIDDEN PRINT TEMPLATE --- */}
        <Box sx={{ display: "none" }}>
          <Box
            ref={printRef}
            sx={{ p: "15mm", bgcolor: "white", color: "black", width: "210mm" }}
          >
            <style>{`
              @media print {
                @page { size: A4; margin: 10mm; }
                body { background-color: white !important; }
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color: black !important; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
                th { background-color: #f5f5f5 !important; font-weight: bold; }
              }
            `}</style>

            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: "#1a237e !important" }}
            >
              KIMWIN CORPORATION
            </Typography>
            <Typography variant="h6">Job Order Detail Report</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Generated: {new Date().toLocaleString()}
            </Typography>
            <Divider sx={{ mb: 3, borderColor: "black !important" }} />

            <Stack spacing={1} sx={{ mb: 4 }}>
              <Typography variant="body1">
                <b>JO ID:</b> #{jo.jo_id}
              </Typography>
              <Typography variant="body1">
                <b>Item Produced:</b> {jo.item_name}
              </Typography>
              <Typography variant="body1">
                <b>Date Created:</b> {formatDate(jo.created_at)}
              </Typography>
              <Typography variant="body1">
                <b>Status:</b> {jo.status}
              </Typography>
            </Stack>

            <Typography variant="subtitle1" fontWeight="bold">
              Bill of Materials
            </Typography>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Material Name</th>
                  <th>Quantity Used</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat, index) => (
                  <tr key={index}>
                    <td>{mat.source_type}</td>
                    <td>{mat.material_name}</td>
                    <td>
                      {/* --- CONDITIONAL FORMATTING APPLIED HERE --- */}
                      {formatQuantity(mat.used_stock, mat.unit)} {mat.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Box
              sx={{ mt: 10, display: "flex", justifyContent: "space-between" }}
            >
              <Typography variant="caption">
                Issued by: ____________________
              </Typography>
              <Typography variant="caption">
                Approved by: ____________________
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{
            bgcolor: "#f2994a",
            color: "black",
            "&:hover": { bgcolor: "#d8853a" },
          }}
        >
          Print Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
