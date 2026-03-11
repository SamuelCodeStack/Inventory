import React, { useState, useEffect } from "react";
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
import {
  Close,
  ReceiptLong,
  Person,
  Business,
  Email,
  Phone,
  Home,
  Payments,
} from "@mui/icons-material";

export default function ViewPOModal({ open, handleClose, mode, poData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "done":
        return "success";
      case "pending":
        return "warning";
      case "job order":
        return "info";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: "none" } }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReceiptLong color="primary" />
          <Box>
            <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
              Purchase Order Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {poData.id} • Issued: {formatDate(poData.date)}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ py: 3, bgcolor: mode === "light" ? "#f8f9fa" : "inherit" }}
      >
        {/* TOP BAR: PO NUMBER & STATUS */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              PO Number
            </Typography>
            <Typography variant="h5" fontWeight="900" color="primary">
              {poData.poNo}
            </Typography>
          </Box>
          <Chip
            label={poData.status}
            color={getStatusColor(poData.status)}
            sx={{ fontWeight: "bold", textTransform: "uppercase" }}
          />
        </Box>

        <Grid container spacing={2}>
          {/* CUSTOMER INFO CARD */}
          <Grid item xs={12} md={7}>
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, height: "100%" }}
            >
              <Typography
                variant="subtitle2"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Person fontSize="small" /> Customer & Shipping
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Name / Company
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {poData.customer}{" "}
                    {poData.company ? `(${poData.company})` : ""}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2">{poData.email || "—"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography variant="body2">
                    {poData.contact || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping Address
                  </Typography>
                  <Typography variant="body2">
                    {poData.address || "—"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* TOTAL SUMMARY CARD */}
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: mode === "light" ? "primary.main" : "primary.dark",
                color: "white",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  opacity: 0.8,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Payments fontSize="small" /> Total Amount
              </Typography>
              <Typography variant="h3" fontWeight="900">
                ₱{Number(poData.totalPrice).toLocaleString()}
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.2)" }} />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Items: {items.length}
              </Typography>
            </Paper>
          </Grid>

          {/* ITEMS TABLE */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, mt: 1 }}
            >
              Items Breakdown
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Item Description
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Unit Price
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell align="right">
                          ₱{Number(item.price).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          ₱{(item.quantity * item.price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={{ borderRadius: 2 }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
