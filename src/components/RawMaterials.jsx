import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Science,
  Straighten,
  Scale,
  WaterDrop,
} from "@mui/icons-material";

export default function RawMaterials({ mode }) {
  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: "Lubricant Oil",
      category: "Chemical",
      baseValue: 500,
      baseUnit: "ML", // Dynamic Unit 1
      qtyValue: 10,
      qtyUnit: "Bottles", // Dynamic Unit 2
      minStockThreshold: 100,
      minStockTarget: "base", // Monitor 'baseValue'
    },
    {
      id: 2,
      name: "Plastic Resin",
      category: "Plastic",
      baseValue: 25,
      baseUnit: "KG",
      qtyValue: 5,
      qtyUnit: "Sacks",
      minStockThreshold: 10,
      minStockTarget: "qty", // Monitor 'qtyValue'
    },
  ]);

  const isDark = mode === "dark";

  // Dynamic Icon selector based on Unit
  const getUnitIcon = (unit) => {
    switch (unit?.toUpperCase()) {
      case "KG":
        return <Scale fontSize="small" color="primary" />;
      case "ML":
      case "L":
        return <WaterDrop fontSize="small" color="info" />;
      case "METER":
      case "CM":
        return <Straighten fontSize="small" color="secondary" />;
      default:
        return <Science fontSize="small" color="action" />;
    }
  };

  // Logic to determine Status based on the chosen target
  const getStatus = (item) => {
    const currentVal =
      item.minStockTarget === "base" ? item.baseValue : item.qtyValue;
    if (currentVal <= 0) return { label: "Out of Stock", color: "error" };
    if (currentVal <= item.minStockThreshold)
      return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Raw Materials
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dynamic unit tracking for chemicals & supplies
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ borderRadius: 2 }}
        >
          Add Material
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, p: 2 }}>
        <Table size="small">
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa" }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Material Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Measurement</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Monitoring Logic
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((row) => {
              const status = getStatus(row);
              return (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {getUnitIcon(row.baseUnit)}
                      <Typography variant="body2" fontWeight="600">
                        {row.name}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={row.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.baseValue} <small>{row.baseUnit}</small>
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {row.qtyValue} <small>{row.qtyUnit}</small>
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={row.minStockTarget}
                      sx={{
                        width: 140,
                        "& .MuiInputBase-input": { fontSize: "0.75rem" },
                      }}
                      onChange={(e) => {
                        const newTarget = e.target.value;
                        setMaterials(
                          materials.map((m) =>
                            m.id === row.id
                              ? { ...m, minStockTarget: newTarget }
                              : m,
                          ),
                        );
                      }}
                    >
                      <MenuItem value="base">By {row.baseUnit}</MenuItem>
                      <MenuItem value="qty">By {row.qtyUnit}</MenuItem>
                    </TextField>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 0.5, color: "text.secondary" }}
                    >
                      Threshold: {row.minStockThreshold}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                    >
                      <IconButton size="small" color="primary">
                        <Edit fontSize="inherit" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
