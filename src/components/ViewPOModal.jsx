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
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Close, ReceiptLong, Print } from "@mui/icons-material";

export default function ViewPOModal({ open, handleClose, mode, poData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef();

  // Print Configuration
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `PO_${poData?.poNo || "Export"}`,
  });

  // Fetch Items from item_order table
  useEffect(() => {
    if (open && poData?.id) {
      const fetchOrderItems = async () => {
        setLoading(true);
        // Ensure ID is clean (handles "16:1" cases)
        const cleanId = String(poData.id).split(":")[0];
        try {
          const response = await fetch(
            // `http://localhost:3000/api/purchase-orders/${cleanId}/items`,
            `${import.meta.env.VITE_API_URL}/purchase-orders/${cleanId}/items`,
          );
          if (!response.ok) throw new Error("Failed to fetch");
          const data = await response.json();
          setItems(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching PO items:", error);
          setItems([]);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderItems();
    }
  }, [open, poData]);

  if (!poData) return null;

  // Finalized check for Printing
  const isFinalized =
    poData.status === "Delivered" || poData.status === "Backload";
  const isPrintDisabled = loading || !isFinalized;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
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
        {/* PRINTABLE AREA START */}
        <Box
          ref={componentRef}
          sx={{
            p: 4,
            bgcolor: "white",
            color: "black",
            "& *": {
              color: "black !important",
              borderColor: "rgba(0, 0, 0, 0.2) !important",
            },
            "@media print": { p: 0, bgcolor: "white !important" },
          }}
        >
          <style>{` @media print { body { background: white !important; } @page { size: auto; margin: 15mm; } } `}</style>

          {/* HEADER: Company Info & PO Status */}
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
                sx={{ color: "#1a237e !important", textTransform: "uppercase" }}
              >
                {poData.company || "KIMWIN CORPORATION"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                {poData.address || "Company Address Not Provided"}
              </Typography>
              <Typography variant="body2">
                <b>Customer:</b> {poData.customer}
              </Typography>
              <Typography variant="body2">
                <b>Contact:</b> {poData.contact} | {poData.email}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                PURCHASE ORDER
              </Typography>
              <Typography variant="body1">
                <b>PO NO:</b>{" "}
                <span style={{ color: "#d32f2f", fontWeight: "bold" }}>
                  {poData.poNo}
                </span>
              </Typography>
              <Typography variant="body1">
                <b>ORDER DATE:</b> {formatDate(poData.date)}
              </Typography>
              {isFinalized && (
                <Typography variant="body1">
                  <b>{poData.status.toUpperCase()} DATE:</b>{" "}
                  {formatDate(poData.statusDate || poData.date)}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider
            sx={{
              mb: 4,
              borderBottomWidth: 2,
              borderColor: "black !important",
            }}
          />

          {/* SHIPPING & STATUS DETAILS */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                fontWeight="bold"
                display="block"
                sx={{ color: "#666 !important", textTransform: "uppercase" }}
              >
                Current Status
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  color:
                    poData.status === "Delivered"
                      ? "green !important"
                      : "orange !important",
                }}
              >
                {poData.status}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                variant="caption"
                fontWeight="bold"
                display="block"
                sx={{ color: "#666 !important", textTransform: "uppercase" }}
              >
                Remarks / Instructions
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {poData.remarks || "No additional remarks."}
              </Typography>
            </Grid>
          </Grid>

          {/* ITEMS TABLE */}
          <TableContainer component={Box} sx={{ mb: 4 }}>
            <Table size="small" sx={{ border: "1px solid #000" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#eeeeee !important" }}>
                  <TableCell
                    sx={{ fontWeight: "bold", border: "1px solid #000" }}
                  >
                    Description (Item Name)
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", border: "1px solid #000" }}
                  >
                    Category
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #000" }}
                  >
                    Qty
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #000" }}
                  >
                    Unit Cost
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", border: "1px solid #000" }}
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
                ) : items.length > 0 ? (
                  items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ border: "1px solid #000" }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #000" }}>
                        {item.category}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ border: "1px solid #000" }}
                      >
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ border: "1px solid #000" }}
                      >
                        ₱{Number(item.price).toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", border: "1px solid #000" }}
                      >
                        ₱
                        {(
                          Number(item.quantity) * Number(item.price)
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No items found for this order.
                    </TableCell>
                  </TableRow>
                )}

                {/* SUMMARY ROW */}
                <TableRow>
                  <TableCell colSpan={3} sx={{ border: "none" }} />
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      border: "1px solid #000",
                      bgcolor: "#f9f9f9 !important",
                    }}
                  >
                    TOTAL AMOUNT :
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      border: "1px solid #000",
                      bgcolor: "#f9f9f9 !important",
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
              mt: 10,
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
                Prepared By
              </Typography>
              <Typography variant="caption">Warehouse Staff</Typography>
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
                Received By
              </Typography>
              <Typography variant="caption">Authorized Signature</Typography>
            </Box>
          </Box>
        </Box>
        {/* PRINTABLE AREA END */}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Close Review
        </Button>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Print />}
          onClick={handlePrint}
          disabled={isPrintDisabled}
          sx={{ fontWeight: "bold", py: 1.2 }}
        >
          {isFinalized
            ? `Download ${poData.status} Report (PDF)`
            : `Pending Finalization (${poData.status})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
