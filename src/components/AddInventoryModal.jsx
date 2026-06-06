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
    brand: "",
    supplier_id: "",
  };
  const [items, setItems] = useState([emptyRow]);
  const [loading, setLoading] = useState(false);
  // State added to store existing inventory item names fetched from the server
  const [existingNames, setExistingNames] = useState([]);
  // Suppliers list fetched from the server for the dropdown
  const [suppliers, setSuppliers] = useState([]);

  // Fetch existing inventory data to run accurate duplication checks
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
            // Extract and clean names for case-insensitive validation lookups
            const names = data.map((item) => item.name.trim().toLowerCase());
            setExistingNames(names);
          }
        } catch (error) {
          console.error("Failed to fetch existing inventory names:", error);
        }
      };
      fetchExistingInventory();
    }
  }, [open]);

  // Fetch suppliers for the supplier dropdown
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
            setSuppliers(data);
          }
        } catch (error) {
          console.error("Failed to fetch suppliers:", error);
        }
      };
      fetchSuppliers();
    }
  }, [open]);

  // Helper logic to verify if a specified name already exists within the database or form rows
  const checkDuplicateName = (nameValue, currentIndex) => {
    const cleanName = nameValue.trim().toLowerCase();
    if (!cleanName) return { exists: false, message: "" };

    // 1. Check database registry conflict boundaries
    if (existingNames.includes(cleanName)) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" already exists in system records.`,
      };
    }

    // 2. Check staged multi-row batch form duplication bounds
    const duplicateInFormIndex = items.findIndex(
      (item, idx) =>
        idx !== currentIndex && item.name.trim().toLowerCase() === cleanName,
    );
    if (duplicateInFormIndex !== -1) {
      return {
        exists: true,
        message: `"${nameValue.trim()}" is duplicated in row ${duplicateInFormIndex + 1}.`,
      };
    }

    return { exists: false, message: "" };
  };

  // --- VALIDATION LOGIC ---
  // Returns true if ANY field in ANY row is empty or contains duplicate validation conflicts
  const isInvalid = items.some(
    (item, index) =>
      !item.name.trim() ||
      !item.category ||
      !item.uom ||
      item.quantity === "" ||
      item.price === "" ||
      item.minStock === "" ||
      checkDuplicateName(item.name, index).exists,
  );

  const addRow = () => setItems([...items, { ...emptyRow }]);

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];

    // Validate and clean values based on datatype limits
    if (field === "name" || field === "brand") {
      newItems[index][field] = value.slice(0, 100); // VARCHAR(100)
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
        // Prevent negative values for DECIMAL(12,2)
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
          credentials: "include", // Required to send session cookies for activity logs
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
            const validationStatus = checkDuplicateName(item.name, index);
            return (
              <Box key={index}>
                <Grid container spacing={2} alignItems="flex-end">
                  {/* --- ROW 1: ITEM NAME + CATEGORY --- */}

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
                      error={
                        (!item.name && item.name !== "") ||
                        validationStatus.exists
                      }
                      helperText={validationStatus.message}
                      inputProps={{ maxLength: 100 }} // VARCHAR(100) limit
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
                      error={!item.category}
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

                  {/* --- ROW 2: BRAND + SUPPLIER — SUPPLIER only visible when category is Trading --- */}

                  {/* BRAND */}
                  <Grid item xs={12} md={item.category === "Trading" ? 6 : 12}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
                    >
                      BRAND
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Samsung, Nike..."
                      value={item.brand}
                      inputProps={{ maxLength: 100 }}
                      onChange={(e) =>
                        handleChange(index, "brand", e.target.value)
                      }
                    />
                  </Grid>

                  {/* SUPPLIER — only visible when category is Trading */}
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
                        SelectProps={{
                          displayEmpty: true,
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

                  {/* --- ROW 3: UNIT + PRICE + QTY + MIN + DELETE --- */}

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
                        inputProps={{ min: 0, step: "0.01" }} // DECIMAL limit rules
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
                      inputProps={{ min: 0, step: "1" }} // INTEGER rules
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
                      inputProps={{ min: 0, step: "1" }} // INTEGER rules
                      onChange={(e) =>
                        handleChange(index, "minStock", e.target.value)
                      }
                    />
                  </Grid>

                  {/* DELETE ROW BUTTON */}
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
              // --- BUTTON IS DISABLED IF LOADING OR ANY FIELD IS EMPTY ---
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
