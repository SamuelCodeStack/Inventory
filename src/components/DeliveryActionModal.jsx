import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";

export default function DeliveryActionModal({
  open,
  handleClose,
  po,
  onUpdate,
}) {
  const [status, setStatus] = useState("Delivered");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = () => {
    onUpdate(po.id, status, remarks);
    setRemarks(""); // Reset
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle fontWeight="bold">Finalize Delivery</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Updating status for PO: <b>{po?.poNo}</b>
        </Typography>

        <TextField
          select
          fullWidth
          label="Final Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ mb: 3 }}
        >
          <MenuItem value="Delivered">Delivered</MenuItem>
          <MenuItem value="Backload">Backload</MenuItem>
        </TextField>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Remarks / Reasons"
          placeholder="e.g., Recipient not available, Item accepted..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit Final Status
        </Button>
      </DialogActions>
    </Dialog>
  );
}
