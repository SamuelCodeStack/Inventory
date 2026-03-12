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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Close, ReceiptLong, Print } from "@mui/icons-material";

export default function ViewPOModal({ open, handleClose, mode, poData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef();

  // Print Handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `PO_${poData?.poNo || "Export"}`,
  });

  useEffect(() => {
    if (open && poData?.id) {
      const fetchOrderItems = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `http://localhost:3000/api/purchase-orders/${poData.id}/items`,
          );
          const data = await response.json();
          setItems(data);
        } catch (error) {
          console.error("Error fetching PO items:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderItems();
    }
  }, [open, poData]);

  if (!poData) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* MODAL HEADER (Visible in Dashboard) */}
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReceiptLong color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Review Purchase Order
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: mode === "light" ? "#f8f9fa" : "rgba(255,255,255,0.05)",
        }}
      >
        {/* --- PRINTABLE AREA START --- */}
        <Box
          ref={componentRef}
          sx={{
            p: 4,
            bgcolor: "white",
            color: "black",
            // DARK MODE FIX: Force all nested children to black text/gray borders
            "& *": {
              color: "black !important",
              borderColor: "rgba(0, 0, 0, 0.15) !important",
            },
            // Print engine specific overrides
            "@media print": {
              p: 0,
              bgcolor: "white !important",
              WebkitPrintColorAdjust: "exact",
            },
          }}
        >
          <style>{`
            @media print {
              body { -webkit-print-color-adjust: exact; background: white !important; }
              @page { size: auto; margin: 15mm; }
              * { color: black !important; }
            }
          `}</style>

          {/* DYNAMIC COMPANY HEADER */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 4,
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ maxWidth: "65%" }}>
              <Typography
                variant="h4"
                fontWeight="900"
                sx={{
                  color: "#1a237e !important",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1.1,
                }}
              >
                {poData.company || poData.customer}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1.5, color: "#444 !important", fontWeight: 500 }}
              >
                {poData.address}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ mb: 1, letterSpacing: 1 }}
              >
                PURCHASE ORDER
              </Typography>
              <Table size="small" sx={{ "& td": { border: 0, p: 0.2 } }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                      PO NO:
                    </TableCell>
                    <TableCell
                      sx={{
                        pl: 2,
                        color: "#d32f2f !important",
                        fontWeight: "bold",
                      }}
                    >
                      {poData.poNo}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
                      DATE:
                    </TableCell>
                    <TableCell sx={{ pl: 2 }}>
                      {new Date(poData.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Divider
            sx={{
              mb: 4,
              borderBottomWidth: 2,
              borderColor: "black !important",
            }}
          />

          {/* VENDOR & SHIP TO SECTION */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{
                  color: "#666 !important",
                  textTransform: "uppercase",
                  display: "block",
                  mb: 1,
                }}
              >
                Customer Information
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {poData.customer}
              </Typography>
              <Typography variant="body2">{poData.email}</Typography>
              <Typography variant="body2">{poData.contact}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{
                  color: "#666 !important",
                  textTransform: "uppercase",
                  display: "block",
                  mb: 1,
                }}
              >
                Shipping Details
              </Typography>

              <Typography variant="body2">
                Address: <b>{poData.address || "Office Address"}</b>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Status: <b>{poData.status}</b>
              </Typography>
            </Grid>
          </Grid>

          {/* ITEMS TABLE */}
          <TableContainer component={Box} sx={{ mb: 4 }}>
            <Table size="small" sx={{ border: "1px solid #ddd" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5 !important" }}>
                  <TableCell
                    sx={{ fontWeight: "bold", border: "1px solid #ddd" }}
                  >
                    Description
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", border: "1px solid #ddd" }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #ddd" }}
                  >
                    Qty
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #ddd" }}
                  >
                    Unit Cost
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #ddd" }}
                  >
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ border: "1px solid #ddd" }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ddd" }}>
                        {item.category}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ border: "1px solid #ddd" }}
                      >
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ border: "1px solid #ddd" }}
                      >
                        ₱{Number(item.price).toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", border: "1px solid #ddd" }}
                      >
                        ₱{(item.quantity * item.price).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow>
                  <TableCell colSpan={3} sx={{ border: "none" }} />
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "#fafafa !important",
                      border: "1px solid #ddd",
                    }}
                  >
                    Total Amount:
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "#fafafa !important",
                      border: "1px solid #ddd",
                      borderBottom: "3px double black !important",
                    }}
                  >
                    ₱{Number(poData.totalPrice).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* SIGNATURE SECTION */}
          <Box
            sx={{
              mt: 8,
              display: "flex",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <Box
              sx={{
                width: 220,
                borderTop: "1.5px solid black",
                textAlign: "center",
                pt: 1,
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Created By
              </Typography>
              <Typography variant="caption" sx={{ color: "#777 !important" }}>
                Authorized Personnel
              </Typography>
            </Box>
            <Box
              sx={{
                width: 220,
                borderTop: "1.5px solid black",
                textAlign: "center",
                pt: 1,
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Approved By
              </Typography>
              <Typography variant="caption" sx={{ color: "#777 !important" }}>
                Management Signature
              </Typography>
            </Box>
          </Box>
        </Box>
        {/* --- PRINTABLE AREA END --- */}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{ borderRadius: 2, py: 1.2, fontWeight: "bold", boxShadow: 3 }}
        >
          Print Purchase Order (PDF)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
