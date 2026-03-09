import React from "react";
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
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import { Close, ReceiptLong, Person, ListAlt } from "@mui/icons-material";

export default function ViewPOModal({ open, handleClose, mode, poData }) {
  if (!poData) return null;

  // Helper to determine status chip color
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 3, backgroundImage: "none" },
      }}
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
              ID: {poData.id} • Date Created: {poData.date || "2024-05-20"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ py: 3, bgcolor: mode === "light" ? "#fcfcfc" : "inherit" }}
      >
        {/* Top Header Section: PO No and Status */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", mb: -0.5 }}
            >
              PO Number
            </Typography>
            <Typography variant="h5" fontWeight="900" color="primary">
              {poData.poNumber || "N/A"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              Current Status
            </Typography>
            <Chip
              label={poData.remark || "Pending"}
              color={getStatusColor(poData.remark)}
              variant="filled"
              sx={{ fontWeight: "bold", textTransform: "uppercase", px: 1 }}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Section 1: Customer Details Card */}
          <Grid item xs={12} md={5}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                height: "100%",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle2"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Person fontSize="small" /> Customer Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {poData.customerName || "—"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Email Address
                </Typography>
                <Typography variant="body2">{poData.email || "—"}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Contact Number
                </Typography>
                <Typography variant="body2">{poData.contact || "—"}</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Section 2: Financial Summary Card */}
          <Grid item xs={12} md={7}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                height: "100%",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="subtitle2"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <ListAlt fontSize="small" /> Order Summary
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total Items Ordered:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {poData.items?.length || 0} Items
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Total Amount:
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="900">
                  ₱{poData.totalPrice || "0.00"}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Section 3: Ordered Items Table */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1.5, mt: 1 }}
            >
              Items Breakdown
            </Typography>
            <TableContainer
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      Unit
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Qty
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Note: In a real app, you would map poData.items which contains the full item objects */}
                  {(poData.fullItems || []).map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell fontWeight="500">{item.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.65rem", height: 20 }}
                        />
                      </TableCell>
                      <TableCell align="center">{item.unit}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {item.quantity || 1}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!poData.fullItems || poData.fullItems.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 3, color: "text.secondary" }}
                      >
                        No items found in this order.
                      </TableCell>
                    </TableRow>
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
          variant="outlined"
          onClick={handleClose}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Close View
        </Button>
      </DialogActions>
    </Dialog>
  );
}
