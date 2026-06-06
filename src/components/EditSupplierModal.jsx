import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function EditSupplierModal({
  open,
  handleClose,
  supplierData,
  onSaveSuccess,
  mode,
}) {
  const [form, setForm] = useState({
    item_id: "",
    supplier_name: "",
    address: "",
    contact_no: "",
    other_details: "",
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill form when supplierData changes
  useEffect(() => {
    if (supplierData) {
      setForm({
        item_id: supplierData.item_id ?? "",
        supplier_name: supplierData.supplier_name ?? "",
        address: supplierData.address ?? "",
        contact_no: supplierData.contact_no ?? "",
        other_details: supplierData.other_details ?? "",
      });
      setErrors({});
    }
  }, [supplierData]);

  // Fetch inventory items for the item_id dropdown
  useEffect(() => {
    if (!open) return;
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/inventory`);
        const data = await res.json();
        setInventoryItems(data);
      } catch (e) {
        console.error("Failed to load inventory items", e);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.supplier_name.trim())
      newErrors.supplier_name = "Supplier name is required";
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        item_id: form.item_id || null,
        supplier_name: form.supplier_name.trim(),
        address: form.address.trim() || null,
        contact_no: form.contact_no.trim() || null,
        other_details: form.other_details.trim() || null,
      };
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/suppliers/${supplierData.supplier_id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        onSaveSuccess();
        handleClose();
      }
    } catch (e) {
      console.error("Update failed", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>
        Edit Supplier
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 400 }}
        >
          Supplier #{supplierData?.supplier_id}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {/* SUPPLIER NAME */}
          <TextField
            label="Supplier Name"
            size="small"
            fullWidth
            required
            value={form.supplier_name}
            onChange={(e) => handleChange("supplier_name", e.target.value)}
            error={!!errors.supplier_name}
            helperText={errors.supplier_name}
            inputProps={{ maxLength: 100 }}
          />

          {/* LINKED INVENTORY ITEM */}
          <TextField
            select
            label="Linked Inventory Item (Optional)"
            size="small"
            fullWidth
            value={form.item_id}
            onChange={(e) => handleChange("item_id", e.target.value)}
            disabled={loadingItems}
            InputProps={{
              endAdornment: loadingItems ? (
                <CircularProgress size={16} sx={{ mr: 2 }} />
              ) : null,
            }}
          >
            <MenuItem value="">— None —</MenuItem>
            {inventoryItems.map((item) => (
              <MenuItem key={item.item_id} value={item.item_id}>
                #{item.item_id} — {item.name}
              </MenuItem>
            ))}
          </TextField>

          {/* CONTACT NO */}
          <TextField
            label="Contact No."
            size="small"
            fullWidth
            value={form.contact_no}
            onChange={(e) => handleChange("contact_no", e.target.value)}
            inputProps={{ maxLength: 50 }}
            placeholder="e.g. 09XX-XXX-XXXX"
          />

          {/* ADDRESS */}
          <TextField
            label="Address"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Street, City, Province..."
          />

          {/* OTHER DETAILS */}
          <TextField
            label="Other Details"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={form.other_details}
            onChange={(e) => handleChange("other_details", e.target.value)}
            placeholder="Additional notes, payment terms, etc..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: "bold" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="info"
          disabled={saving}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "bold",
            minWidth: 120,
          }}
        >
          {saving ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
