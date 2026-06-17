import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  MenuItem,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const categories = ["Plastic", "Injection", "Paper", "Trading"];
const units = ["Pieces", "Bundle", "Boxes"];

export default function EditInventoryModal({
  open,
  handleClose,
  onSaveSuccess,
  mode,
  itemData,
  userLevel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Plastic",
    uom: "Pieces",
    minStock: 10,
    price: 0,
    brand_id: "",
    supplier_id: "",
  });

  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [existingItems, setExistingItems] = useState([]); // { id, name, category }[]
  const [duplicateError, setDuplicateError] = useState("");

  // Fetch existing inventory for duplicate validation
  useEffect(() => {
    if (!open) return;
    const fetchExisting = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/inventory`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setExistingItems(
            data.map((item) => ({
              id: String(item.id).split(":")[0],
              name: item.name?.trim().toLowerCase(),
              category: item.category?.trim().toLowerCase(),
            })),
          );
        }
      } catch (e) {
        console.error("Failed to fetch existing inventory:", e);
      }
    };
    fetchExisting();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchBrands = async () => {
      try {
        setLoadingBrands(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/brands`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setBrands(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to fetch brands:", e);
        setBrands([]);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/suppliers`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to fetch suppliers:", e);
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, [open]);

  // Pre-fill form when itemData changes
  useEffect(() => {
    if (itemData && brands.length > 0) {
      const matchedBrand = brands.find(
        (b) =>
          b.brand_name?.toLowerCase().trim() ===
          itemData.brand?.toLowerCase().trim(),
      );
      const matchedSupplier = suppliers.find(
        (s) =>
          s.supplier_name?.toLowerCase().trim() ===
          itemData.supplier?.toLowerCase().trim(),
      );
      setFormData({
        name: itemData.name || "",
        category: itemData.category || "Plastic",
        uom: itemData.uom || "Pieces",
        minStock: itemData.minStock || 10,
        price: itemData.price || 0,
        brand_id: matchedBrand ? matchedBrand.brand_id : "",
        supplier_id: matchedSupplier ? matchedSupplier.supplier_id : "",
      });
    } else if (itemData && brands.length === 0) {
      setFormData({
        name: itemData.name || "",
        category: itemData.category || "Plastic",
        uom: itemData.uom || "Pieces",
        minStock: itemData.minStock || 10,
        price: itemData.price || 0,
        brand_id: "",
        supplier_id: "",
      });
    }
    setDuplicateError("");
  }, [itemData, brands, suppliers]);

  // Check duplicate whenever name or category changes — exclude the current item itself
  useEffect(() => {
    if (!formData.name.trim() || !formData.category) {
      setDuplicateError("");
      return;
    }
    const cleanName = formData.name.trim().toLowerCase();
    const cleanCat = formData.category.trim().toLowerCase();
    const currentId = itemData ? String(itemData.id).split(":")[0] : null;

    const conflict = existingItems.find(
      (item) =>
        item.name === cleanName &&
        item.category === cleanCat &&
        item.id !== currentId,
    );

    if (conflict) {
      setDuplicateError(
        `"${formData.name.trim()}" in ${formData.category} already exists in system records.`,
      );
    } else {
      setDuplicateError("");
    }
  }, [formData.name, formData.category, existingItems, itemData]);

  const isProduction =
    String(userLevel) === "3" || String(itemData?.user_level) === "3";

  const isUnchanged =
    itemData &&
    formData.name === (itemData.name || "") &&
    formData.category === (itemData.category || "Plastic") &&
    formData.uom === (itemData.uom || "Pieces") &&
    formData.minStock === (itemData.minStock || 10) &&
    formData.price === (itemData.price || 0) &&
    formData.brand_id === (itemData.brand_id || "") &&
    formData.supplier_id === (itemData.supplier_id || "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;
    if (name === "name") {
      updatedValue = value.slice(0, 100);
    } else if (name === "minStock") {
      updatedValue = Math.max(0, parseInt(value, 10) || 0);
    } else if (name === "price") {
      updatedValue = Math.max(0, parseFloat(value) || 0);
    }
    setFormData({ ...formData, [name]: updatedValue });
  };

  const handleSubmit = async () => {
    if (duplicateError) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/${itemData.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            quantity: itemData.quantity,
          }),
        },
      );

      if (response.ok) {
        onSaveSuccess();
        handleClose();
      } else {
        alert("Update Error: Check backend console.");
      }
    } catch (error) {
      alert("Network Error: Could not connect to server.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Edit Item Details
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* ITEM NAME */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              inputProps={{ maxLength: 100 }}
              error={!!duplicateError}
              helperText={duplicateError}
              onChange={handleChange}
            />
          </Grid>

          {/* CATEGORY */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              error={!!duplicateError}
              onChange={handleChange}
            >
              {categories.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* UNIT */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Unit"
              name="uom"
              value={formData.uom}
              onChange={handleChange}
            >
              {units.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* BRAND DROPDOWN */}
          <Grid item xs={formData.category === "Trading" ? 6 : 12}>
            <TextField
              select
              fullWidth
              label="Brand"
              name="brand_id"
              value={formData.brand_id}
              onChange={handleChange}
              disabled={loadingBrands}
              InputProps={{
                endAdornment: loadingBrands ? (
                  <CircularProgress size={16} sx={{ mr: 2 }} />
                ) : null,
              }}
            >
              <MenuItem value="">— None —</MenuItem>
              {brands.map((b) => (
                <MenuItem key={b.brand_id} value={b.brand_id}>
                  {b.brand_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* SUPPLIER DROPDOWN — only for Trading */}
          {formData.category === "Trading" && (
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Supplier"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                disabled={loadingSuppliers}
                InputProps={{
                  endAdornment: loadingSuppliers ? (
                    <CircularProgress size={16} sx={{ mr: 2 }} />
                  ) : null,
                }}
              >
                <MenuItem value="">— None —</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* MIN STOCK */}
          <Grid item xs={isProduction ? 12 : 6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Stock Level"
              name="minStock"
              value={formData.minStock}
              inputProps={{ min: 0, step: "1" }}
              onChange={handleChange}
            />
          </Grid>

          {/* PRICE — hidden for Production */}
          {!isProduction && (
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Price"
                name="price"
                value={formData.price}
                inputProps={{ min: 0, step: "0.01" }}
                onChange={handleChange}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isUnchanged || !!duplicateError}
          sx={{ fontWeight: "bold" }}
        >
          Update Item
        </Button>
      </DialogActions>
    </Dialog>
  );
}
