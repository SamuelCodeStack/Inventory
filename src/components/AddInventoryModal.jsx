import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import { AddCircle, Delete, Save, Close } from "@mui/icons-material";

const CATEGORIES = ["Paper", "Plastic", "Injection", "Trading"];
const UNITS = ["Pieces", "Bundle", "Box"];

export default function AddInventoryModal({
  open,
  handleClose,
  onSaveSuccess,
  userLevel,
}) {
  const emptyRow = {
    name: "",
    category: "",
    uom: "",
    quantity: "",
    price: String(userLevel) === "3" ? "0.00" : "",
    minStock: "",
    brand_id: "",
    supplier_id: "",
  };
  const [items, setItems] = useState([emptyRow]);
  const [loading, setLoading] = useState(false);
  const [existingItems, setExistingItems] = useState([]); // { name, category }[]
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Fetch existing inventory — store name + category pairs for combined validation
  useEffect(() => {
    if (open) {
      const fetchExistingInventory = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/inventory`,
            { credentials: "include" },
          );
          if (response.ok) {
            const data = await response.json();
            setExistingItems(
              data.map((item) => ({
                name: item.name?.trim().toLowerCase(),
                category: item.category?.trim().toLowerCase(),
              })),
            );
          }
        } catch (error) {
          console.error("Failed to fetch existing inventory:", error);
        }
      };
      fetchExistingInventory();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const fetchBrands = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/brands`,
            { credentials: "include" },
          );
          if (response.ok) {
            const data = await response.json();
            setBrands(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Failed to fetch brands:", error);
          setBrands([]);
        }
      };
      fetchBrands();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const fetchSuppliers = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/suppliers`,
            { credentials: "include" },
          );
          if (response.ok) {
            const data = await response.json();
            setSuppliers(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Failed to fetch suppliers:", error);
          setSuppliers([]);
        }
      };
      fetchSuppliers();
    }
  }, [open]);

  // Validate: duplicate = same name AND same category (in DB or within the form)
  const checkDuplicate = (nameValue, categoryValue, currentIndex) => {
    const cleanName = nameValue.trim().toLowerCase();
    const cleanCat = categoryValue.trim().toLowerCase();
    if (!cleanName || !cleanCat) return { exists: false, message: "" };

    // Check against DB records
    const existsInDB = existingItems.some(
      (item) => item.name === cleanName && item.category === cleanCat,
    );
    if (existsInDB) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" in ${categoryValue} already exists in system records.`,
      };
    }

    // Check within form rows
    const duplicateInFormIndex = items.findIndex(
      (item, idx) =>
        idx !== currentIndex &&
        item.name.trim().toLowerCase() === cleanName &&
        item.category.trim().toLowerCase() === cleanCat,
    );
    if (duplicateInFormIndex !== -1) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" in ${categoryValue} is duplicated in row ${duplicateInFormIndex + 1}.`,
      };
    }

    return { exists: false, message: "" };
  };

  const isInvalid = items.some(
    (item, index) =>
      !item.name.trim() ||
      !item.category ||
      !item.uom ||
      item.quantity === "" ||
      item.price === "" ||
      item.minStock === "" ||
      checkDuplicate(item.name, item.category || "", index).exists,
  );

  const addRow = () => setItems([...items, { ...emptyRow }]);

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];

    if (field === "name") {
      newItems[index][field] = value.slice(0, 100);
    } else if (field === "quantity" || field === "minStock") {
      if (value === "") {
        newItems[index][field] = "";
      } else {
        const parsed = parseInt(value, 10);
        newItems[index][field] = isNaN(parsed)
          ? ""
          : String(Math.max(0, parsed));
      }
    } else if (field === "price") {
      if (value === "") {
        newItems[index][field] = "";
      } else {
        newItems[index][field] = parseFloat(value) < 0 ? "0" : value;
      }
    } else {
      newItems[index][field] = value;
    }

    setItems(newItems);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/bulk-add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ items }),
        },
      );

      if (response.ok) {
        onSaveSuccess();
        setItems([{ ...emptyRow }]);
        handleClose();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", md: 1100 },
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Inventory Intake
          </Typography>
          <IconButton onClick={handleClose} aria-label="close">
            <Close />
          </IconButton>
        </Box>

        <Stack spacing={4} divider={<Divider />}>
          {items.map((item, index) => {
            const validationStatus = checkDuplicate(
              item.name,
              item.category || "",
              index,
            );
            return (
              <Box key={index}>
                <Grid container spacing={2} alignItems="flex-end">
                  {/* ITEM NAME */}
                  <Grid item xs={12} md={8}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      ITEM NAME *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter item name..."
                      value={item.name}
                      error={validationStatus.exists}
                      helperText={validationStatus.message}
                      inputProps={{ maxLength: 100 }}
                      onChange={(e) =>
                        handleChange(index, "name", e.target.value)
                      }
                      autoFocus={index === 0}
                    />
                  </Grid>

                  {/* CATEGORY */}
                  <Grid item xs={12} md={4}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      CATEGORY *
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={item.category}
                      error={!item.category || validationStatus.exists}
                      onChange={(e) =>
                        handleChange(index, "category", e.target.value)
                      }
                    >
                      {CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* BRAND DROPDOWN */}
                  <Grid item xs={12} md={item.category === "Trading" ? 6 : 12}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      BRAND
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={item.brand_id}
                      onChange={(e) =>
                        handleChange(index, "brand_id", e.target.value)
                      }
                      SelectProps={{ displayEmpty: true }}
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
                  {item.category === "Trading" && (
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          mb: 1,
                          display: "block",
                          color: "text.secondary",
                        }}
                      >
                        SUPPLIER
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={item.supplier_id}
                        onChange={(e) =>
                          handleChange(index, "supplier_id", e.target.value)
                        }
                        SelectProps={{ displayEmpty: true }}
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

                  {/* UNIT */}
                  <Grid item xs={6} md={3}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      UNIT *
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={item.uom}
                      error={!item.uom}
                      onChange={(e) =>
                        handleChange(index, "uom", e.target.value)
                      }
                    >
                      {UNITS.map((unit) => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* PRICE — hidden for Production (userLevel 3) */}
                  {String(userLevel) !== "3" && (
                    <Grid item xs={6} md={3}>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          mb: 1,
                          display: "block",
                          color: "text.secondary",
                        }}
                      >
                        PRICE *
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        placeholder="0.00"
                        value={item.price}
                        error={item.price === ""}
                        inputProps={{ min: 0, step: "0.01" }}
                        onChange={(e) =>
                          handleChange(index, "price", e.target.value)
                        }
                      />
                    </Grid>
                  )}

                  {/* QTY */}
                  <Grid item xs={6} md={String(userLevel) === "3" ? 3 : 2}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      QTY *
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      value={item.quantity}
                      error={item.quantity === ""}
                      inputProps={{ min: 0, step: "1" }}
                      onChange={(e) =>
                        handleChange(index, "quantity", e.target.value)
                      }
                    />
                  </Grid>

                  {/* MIN STOCK */}
                  <Grid item xs={6} md={String(userLevel) === "3" ? 3 : 2}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      MIN *
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      value={item.minStock}
                      error={item.minStock === ""}
                      inputProps={{ min: 0, step: "1" }}
                      onChange={(e) =>
                        handleChange(index, "minStock", e.target.value)
                      }
                    />
                  </Grid>

                  {/* DELETE ROW */}
                  {items.length > 1 && (
                    <Grid
                      item
                      xs={12}
                      md={1}
                      sx={{ textAlign: "right", pb: 0.5 }}
                    >
                      <IconButton
                        color="error"
                        onClick={() => removeRow(index)}
                        disabled={items.length === 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </Box>
            );
          })}
        </Stack>

        <Box
          sx={{
            mt: 5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<AddCircle />}
            onClick={addRow}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Add Another Item
          </Button>

          <Stack direction="row" spacing={2}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading || isInvalid}
              sx={{
                px: 5,
                borderRadius: 2,
                bgcolor: "primary.main",
                fontWeight: "bold",
              }}
            >
              {loading ? "Saving..." : "Commit All Items"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
}
