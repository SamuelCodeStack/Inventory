import React, { useState } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Paper,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Box,
  Typography,
  LinearProgress,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Search } from "@mui/icons-material";

// Accept 'mode' as a prop from your global App wrapper (e.g., mode === 'dark')
export default function Dashboard({ mode }) {
  const isDark = mode === "dark";

  // Classified Mock Data State
  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: "Premium Kraft Paper Roll",
      category: "Paper",
      type: "Raw Material",
      quantity: 500,
      minStock: 200,
    },
    {
      id: 2,
      name: "HDPE Clear Plastic Sheets",
      category: "Plastic",
      type: "Raw Material",
      quantity: 45,
      minStock: 100,
    },
    {
      id: 3,
      name: "Injection Mold Node B",
      category: "Injection",
      type: "Raw Material",
      quantity: 0,
      minStock: 50,
    },
    {
      id: 4,
      name: "Standard Trading Box Slats",
      category: "Trading",
      type: "Inventory",
      quantity: 1200,
      minStock: 500,
    },
  ]);

  // System Configuration States
  const [loading, setLoading] = useState(false);

  // Split States for Inventory Filters
  const [invSearchQuery, setInvSearchQuery] = useState("");
  const [invCategoryFilter, setInvCategoryFilter] = useState("All");
  const [invStatusFilter, setInvStatusFilter] = useState("All");

  // Split States for Raw Materials Filters
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [rawCategoryFilter, setRawCategoryFilter] = useState("All");
  const [rawStatusFilter, setRawStatusFilter] = useState("All");

  // Pagination for Inventory Table
  const [invPage, setInvPage] = useState(0);
  const [invRowsPerPage, setInvRowsPerPage] = useState(5);

  // Pagination for Raw Materials Table
  const [rawPage, setRawPage] = useState(0);
  const [rawRowsPerPage, setRawRowsPerPage] = useState(5);

  // Dynamic UI Control States
  const [showMSL, setShowMSL] = useState(true);
  const [showRemarks, setShowRemarks] = useState(true);

  // Helper function to resolve live inventory thresholds
  const getStatus = (row) => {
    if (row.quantity <= 0) return { label: "Out of Stock", color: "error" };
    if (row.quantity <= row.minStock)
      return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  // Helper function to compute context remarks based on stock levels
  const getRemarks = (row) => {
    if (row.quantity <= 0) return "Urgent reorder required; operations paused.";
    if (row.quantity <= row.minStock)
      return "Stock dropped below minimum safety threshold.";
    return "Inventory levels nominal.";
  };

  // Shared Filter Logic Engine
  const applyFilters = (items, search, cat, stat) => {
    return items.filter((row) => {
      const status = getStatus(row);
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        String(row.id).includes(search);
      const matchesCategory = cat === "All" || row.category === cat;
      const matchesStatus = stat === "All" || status.label === stat;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  // Split Data Streams
  const inventoryItems = materials.filter((item) => item.type === "Inventory");
  const rawMaterialItems = materials.filter(
    (item) => item.type === "Raw Material",
  );

  const filteredInventory = applyFilters(
    inventoryItems,
    invSearchQuery,
    invCategoryFilter,
    invStatusFilter,
  );
  const filteredRaw = applyFilters(
    rawMaterialItems,
    rawSearchQuery,
    rawCategoryFilter,
    rawStatusFilter,
  );

  const paginatedInventory = filteredInventory.slice(
    invPage * invRowsPerPage,
    invPage * invRowsPerPage + invRowsPerPage,
  );

  const paginatedRaw = filteredRaw.slice(
    rawPage * rawRowsPerPage,
    rawPage * rawRowsPerPage + rawRowsPerPage,
  );

  // Reusable Table Component Body to eliminate redundancy
  const renderTableContent = (
    paginatedData,
    dataCount,
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,
  ) => {
    // Dynamically calculate column span for empty state
    let baseColumns = 6;
    if (showMSL) baseColumns += 1;
    if (showRemarks) baseColumns += 1;

    return (
      <>
        <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead
              sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa" }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", py: 1.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", py: 1.5 }}>
                  Material Name
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", py: 1.5 }}>
                  Category
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", py: 1.5 }}>
                  Quantity
                </TableCell>
                {showMSL && (
                  <TableCell align="right" sx={{ fontWeight: "bold", py: 1.5 }}>
                    Min Stock
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: "bold", pl: 2, py: 1.5 }}>
                  Chart
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", py: 1.5 }}>
                  Status
                </TableCell>
                {showRemarks && (
                  <TableCell sx={{ fontWeight: "bold", py: 1.5 }}>
                    Remarks
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => {
                const status = getStatus(row);
                const remarksText = getRemarks(row);
                const barPercentage =
                  row.quantity <= 0
                    ? 0
                    : row.minStock === 0
                      ? 100
                      : Math.min(
                          Math.round((row.quantity / (row.minStock * 2)) * 100),
                          100,
                        );

                let barColor = "#2ecc71";
                if (row.quantity <= 0) barColor = "#e74c3c";
                else if (row.quantity <= row.minStock) barColor = "#f39c12";

                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ py: 1.5 }}>#{row.id}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "160px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        py: 1.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        sx={{ fontSize: "0.825rem" }}
                      >
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.825rem" }}
                      >
                        {row.category}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Typography
                        variant="body2"
                        fontWeight="700"
                        sx={{ fontSize: "0.825rem" }}
                      >
                        {row.quantity.toLocaleString()}
                      </Typography>
                    </TableCell>
                    {showMSL && (
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="text.secondary"
                          sx={{ fontSize: "0.825rem" }}
                        >
                          {row.minStock.toLocaleString()}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell sx={{ width: "140px", pl: 2, py: 1.5 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={barPercentage}
                          sx={{
                            flexGrow: 1,
                            height: 8,
                            borderRadius: 6,
                            bgcolor: isDark
                              ? "rgba(255,255,255,0.1)"
                              : "#eeeeee",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: barColor,
                              borderRadius: 6,
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            fontSize: "0.75rem",
                            minWidth: "28px",
                            textAlign: "right",
                          }}
                        >
                          {barPercentage}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          bgcolor:
                            status.color === "success"
                              ? "rgba(46, 204, 113, 0.15)"
                              : status.color === "warning"
                                ? "rgba(241, 145, 73, 0.15)"
                                : "rgba(231, 76, 60, 0.15)",
                          color: barColor,
                        }}
                      >
                        {status.label}
                      </Box>
                    </TableCell>
                    {showRemarks && (
                      <TableCell sx={{ py: 1.5, maxWidth: "200px" }}>
                        <Typography
                          variant="body2"
                          color={
                            status.color === "error"
                              ? "error.main"
                              : status.color === "warning"
                                ? "warning.main"
                                : "text.secondary"
                          }
                          sx={{ fontSize: "0.775rem", fontStyle: "italic" }}
                        >
                          {remarksText}
                        </Typography>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={baseColumns}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      No items match your selected filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={dataCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </>
    );
  };

  return (
    <Box
      sx={{ p: 4, bgcolor: isDark ? "#121212" : "#fafafa", minHeight: "100vh" }}
    >
      {/* Control Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Typography variant="h5" fontWeight="700" color="text.primary">
          Inventory & Materials Dashboard
        </Typography>

        {/* Toggle Configuration Switches */}
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <FormControlLabel
            control={
              <Switch
                checked={showMSL}
                onChange={(e) => setShowMSL(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                fontWeight="600"
                color="text.secondary"
              >
                Show Min Stock Level
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={showRemarks}
                onChange={(e) => setShowRemarks(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                fontWeight="600"
                color="text.secondary"
              >
                Show Remarks
              </Typography>
            }
          />
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        /* Layout replaced with horizontal flex box container to avoid automatic column wrapping */
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 3,
            overflowX: "auto",
            pb: 2,
            width: "100%",
          }}
        >
          {/* Table 1: Inventory (Finished / Trading Goods) */}
          <Box
            sx={{
              minWidth: { xs: "500px", md: "calc(50% - 12px)" },
              flexGrow: 1,
              flexShrink: 0,
            }}
          >
            <Paper
              sx={{
                borderRadius: 3,
                p: 2,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="700"
                sx={{ mb: 1.5, color: "primary.main" }}
              >
                Inventory Items (Finished/Trading Goods)
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              {/* Inline Search Panel for Inventory */}
              <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search inventory..."
                    value={invSearchQuery}
                    onChange={(e) => {
                      setInvSearchQuery(e.target.value);
                      setInvPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Category"
                    value={invCategoryFilter}
                    onChange={(e) => {
                      setInvCategoryFilter(e.target.value);
                      setInvPage(0);
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Plastic">Plastic</MenuItem>
                    <MenuItem value="Injection">Injection</MenuItem>
                    <MenuItem value="Paper">Paper</MenuItem>
                    <MenuItem value="Trading">Trading</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={invStatusFilter}
                    onChange={(e) => {
                      setInvStatusFilter(e.target.value);
                      setInvPage(0);
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="In Stock">In Stock</MenuItem>
                    <MenuItem value="Low Stock">Low Stock</MenuItem>
                    <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {renderTableContent(
                paginatedInventory,
                filteredInventory.length,
                invPage,
                invRowsPerPage,
                setInvPage,
                setInvRowsPerPage,
              )}
            </Paper>
          </Box>

          {/* Table 2: Raw Materials */}
          <Box
            sx={{
              minWidth: { xs: "500px", md: "calc(50% - 12px)" },
              flexGrow: 1,
              flexShrink: 0,
            }}
          >
            <Paper
              sx={{
                borderRadius: 3,
                p: 2,
                boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="700"
                sx={{ mb: 1.5, color: "secondary.main" }}
              >
                Raw Materials Track
              </Typography>
              <Divider sx={{ mb: 1.5 }} />

              {/* Inline Search Panel for Raw Materials */}
              <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search raw materials..."
                    value={rawSearchQuery}
                    onChange={(e) => {
                      setRawSearchQuery(e.target.value);
                      setRawPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Category"
                    value={rawCategoryFilter}
                    onChange={(e) => {
                      setRawCategoryFilter(e.target.value);
                      setRawPage(0);
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Plastic">Plastic</MenuItem>
                    <MenuItem value="Injection">Injection</MenuItem>
                    <MenuItem value="Paper">Paper</MenuItem>
                    <MenuItem value="Trading">Trading</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={rawStatusFilter}
                    onChange={(e) => {
                      setRawStatusFilter(e.target.value);
                      setRawPage(0);
                    }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="In Stock">In Stock</MenuItem>
                    <MenuItem value="Low Stock">Low Stock</MenuItem>
                    <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {renderTableContent(
                paginatedRaw,
                filteredRaw.length,
                rawPage,
                rawRowsPerPage,
                setRawPage,
                setRawRowsPerPage,
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}
