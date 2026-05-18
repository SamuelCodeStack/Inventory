import React, { useState } from "react";
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
  userLevel, // Added userLevel prop
}) {
  const emptyRow = {
    name: "",
    category: "",
    uom: "",
    quantity: "",
    price: String(userLevel) === "3" ? "0.00" : "", // Default to 0.00 if Production
    minStock: "",
  };
  const [items, setItems] = useState([emptyRow]);
  const [loading, setLoading] = useState(false);

  // --- VALIDATION LOGIC ---
  // Returns true if ANY field in ANY row is empty
  const isInvalid = items.some(
    (item) =>
      !item.name.trim() ||
      !item.category ||
      !item.uom ||
      item.quantity === "" ||
      item.price === "" ||
      item.minStock === "",
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
    if (field === "name") {
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
        // `http://localhost:3000/api/inventory/bulk-add`,
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
          {items.map((item, index) => (
            <Box key={index}>
              <Grid container spacing={2} alignItems="flex-end">
                {/* --- PRIMARY focus ROW: WHAT IS THE ITEM? --- */}
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
                    error={!item.name && item.name !== ""} // Show red if user touched and left empty
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

                {/* --- SECONDARY Focus ROW: METRICS AND LOGISTICS --- */}
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
                    onChange={(e) => handleChange(index, "uom", e.target.value)}
                  >
                    {UNITS.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* PRICE */}
                {String(userLevel) !== "3" && (
                  <Grid item xs={6} md={3}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      sx={{ mb: 1, display: "block", color: "text.secondary" }}
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
                <Grid item xs={6} md={3}>
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
                <Grid
                  item
                  xs={6}
                  md={
                    items.length > 1
                      ? String(userLevel) === "3"
                        ? 2
                        : 2
                      : String(userLevel) === "3"
                        ? 3
                        : 3
                  }
                >
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

                {/* DELETE ACTION */}
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
          ))}
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
