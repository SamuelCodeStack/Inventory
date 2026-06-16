import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Grid,
  Divider,
  Button,
} from "@mui/material";
import {
  Search,
  Inventory2Outlined,
  ScienceOutlined,
  CommentOutlined,
  LocalOfferOutlined,
  FilterListOff,
} from "@mui/icons-material";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getStatusInfo(qty, minStock) {
  if (qty <= 0)
    return {
      label: "Out of Stock",
      barColor: "#e74c3c",
      bgColor: "rgba(231,76,60,0.12)",
      textColor: "#c0392b",
    };
  if (qty <= minStock)
    return {
      label: "Low Stock",
      barColor: "#e67e22",
      bgColor: "rgba(230,126,34,0.12)",
      textColor: "#ca6f1e",
    };
  return {
    label: "In Stock",
    barColor: "#27ae60",
    bgColor: "rgba(39,174,96,0.12)",
    textColor: "#1e8449",
  };
}

function barPct(qty, minStock) {
  if (qty <= 0) return 0;
  const ref = minStock > 0 ? minStock * 2 : Math.max(qty * 1.5, 100);
  return Math.min(Math.round((qty / ref) * 100), 100);
}

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function getContrastText(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a2e" : "#ffffff";
}

function hexToRgba(hex, alpha = 0.07) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return "transparent";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBar({ qty, minStock }) {
  const { label, barColor, bgColor, textColor } = getStatusInfo(qty, minStock);
  const pct = barPct(qty, minStock);
  return (
    <Box sx={{ minWidth: 120 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: textColor, fontSize: "0.68rem" }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: "0.68rem" }}
        >
          {pct}%
        </Typography>
      </Box>
      <Box
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: bgColor,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            bgcolor: barColor,
            transition: "width .4s ease",
          }}
        />
      </Box>
    </Box>
  );
}

function RemarkCell({ remarks, remarksBy, remarksDate }) {
  if (!remarks)
    return (
      <Typography
        variant="caption"
        sx={{ color: "text.disabled", fontStyle: "italic" }}
      >
        —
      </Typography>
    );
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          fontSize: "0.78rem",
          fontStyle: "italic",
          color: "text.primary",
          lineHeight: 1.4,
          maxWidth: 200,
          wordBreak: "break-word",
        }}
      >
        "{remarks}"
      </Typography>
      {remarksBy && (
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            fontSize: "0.68rem",
            display: "block",
            mt: 0.3,
          }}
        >
          — {remarksBy}
          {remarksDate ? " · " + fmtDate(remarksDate) : ""}
        </Typography>
      )}
    </Box>
  );
}

function KpiCard({ label, value, color }) {
  const colorMap = {
    default: "text.primary",
    danger: "#c0392b",
    warning: "#ca6f1e",
    success: "#1e8449",
  };
  return (
    <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: "0.68rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: colorMap[color] || "text.primary",
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ─── finished goods table ─────────────────────────────────────────────────────

function FinishedGoodsTable({ data, isDark, brandColorMap }) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const brands = useMemo(
    () =>
      [
        "All",
        ...new Set(data.map((x) => x.brand?.trim()).filter(Boolean)),
      ].sort((a, b) => (a === "All" ? -1 : a.localeCompare(b))),
    [data],
  );
  const cats = useMemo(
    () =>
      ["All", ...new Set(data.map((x) => x.category).filter(Boolean))].sort(
        (a, b) => (a === "All" ? -1 : a.localeCompare(b)),
      ),
    [data],
  );

  const filtered = useMemo(() => {
    return data.filter((x) => {
      const qty = x.quantity ?? 0;
      const minStock = x.min_stock ?? x.minStock ?? 0;
      const { label } = getStatusInfo(qty, minStock);
      const s = search.toLowerCase();
      return (
        (!s || x.name?.toLowerCase().includes(s) || String(x.id).includes(s)) &&
        (brandFilter === "All" ||
          (x.brand?.trim() || "— No Brand —") === brandFilter) &&
        (catFilter === "All" || x.category === catFilter) &&
        (statusFilter === "All" || label === statusFilter)
      );
    });
  }, [data, search, brandFilter, catFilter, statusFilter]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((x) => {
      const b = x.brand?.trim() || "— No Brand —";
      if (!g[b]) g[b] = [];
      g[b].push(x);
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const hasFilters =
    search ||
    brandFilter !== "All" ||
    catFilter !== "All" ||
    statusFilter !== "All";
  const resetFilters = () => {
    setSearch("");
    setBrandFilter("All");
    setCatFilter("All");
    setStatusFilter("All");
  };

  const thSx = {
    fontWeight: 700,
    fontSize: "0.72rem",
    color: "text.secondary",
    py: 1,
    whiteSpace: "nowrap",
  };
  const tdSx = { py: 1, fontSize: "0.8rem" };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} sm={2.5}>
          <TextField
            select
            fullWidth
            size="small"
            label="Brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            {brands.map((b) => (
              <MenuItem key={b} value={b}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {b !== "All" && (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        flexShrink: 0,
                        bgcolor: brandColorMap[b] || "#9e9e9e",
                      }}
                    />
                  )}
                  {b}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={2.5}>
          <TextField
            select
            fullWidth
            size="small"
            label="Category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {cats.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["All", "In Stock", "Low Stock", "Out of Stock"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {hasFilters && (
          <Grid item xs={6} sm={1}>
            <Button
              size="small"
              startIcon={<FilterListOff fontSize="small" />}
              onClick={resetFilters}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              Reset
            </Button>
          </Grid>
        )}
      </Grid>

      <Typography
        variant="caption"
        sx={{ color: "text.secondary", mb: 1, display: "block" }}
      >
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
      </Typography>

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 780 }}>
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f5f6f8" }}
          >
            <TableRow>
              <TableCell sx={thSx}>ID</TableCell>
              <TableCell sx={thSx}>Item name</TableCell>
              <TableCell sx={thSx}>Brand</TableCell>
              <TableCell sx={thSx}>Supplier</TableCell>
              <TableCell sx={thSx}>Category</TableCell>
              <TableCell align="right" sx={thSx}>
                Qty
              </TableCell>
              <TableCell align="right" sx={{ ...thSx, color: "#e67e22" }}>
                Min stock
              </TableCell>
              <TableCell sx={{ ...thSx, minWidth: 130 }}>Status</TableCell>
              <TableCell sx={{ ...thSx, minWidth: 180 }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grouped.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  align="center"
                  sx={{ py: 3, color: "text.secondary", fontSize: "0.8rem" }}
                >
                  No items match your filters.
                </TableCell>
              </TableRow>
            ) : (
              grouped.map(([brand, items]) => {
                const headerColor =
                  brandColorMap[brand] || (isDark ? "#1a2744" : "#1565c0");
                const textColor = getContrastText(headerColor);

                return (
                  <React.Fragment key={brand}>
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        sx={{
                          bgcolor: headerColor,
                          color: textColor,
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          py: 0.8,
                          px: 2,
                          borderBottom: "none",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: textColor,
                              opacity: 0.6,
                              flexShrink: 0,
                            }}
                          />
                          <LocalOfferOutlined
                            sx={{ fontSize: 12, opacity: 0.8 }}
                          />
                          {brand}
                          <Box
                            component="span"
                            sx={{ ml: 0.5, opacity: 0.6, fontWeight: 400 }}
                          >
                            ({items.length})
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {items.map((row) => {
                      const qty = row.quantity ?? 0;
                      const minStock = row.min_stock ?? row.minStock ?? 0;
                      const { textColor: statusTextColor } = getStatusInfo(
                        qty,
                        minStock,
                      );
                      return (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            borderLeft: `4px solid ${headerColor}`,
                            "&:hover td": {
                              bgcolor: hexToRgba(headerColor, 0.08),
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              ...tdSx,
                              color: "text.secondary",
                              fontSize: "0.72rem",
                            }}
                          >
                            #{String(row.id).split(":")[0]}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...tdSx,
                              maxWidth: 180,
                              wordBreak: "break-word",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                color:
                                  qty <= 0 ? statusTextColor : "text.primary",
                              }}
                            >
                              {row.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={tdSx}>
                            {row.brand?.trim() ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.8,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    bgcolor:
                                      brandColorMap[row.brand.trim()] ||
                                      "#9e9e9e",
                                    border: "1.5px solid",
                                    borderColor: isDark
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(0,0,0,0.15)",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "text.secondary",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {row.brand}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.disabled",
                                  fontSize: "0.75rem",
                                }}
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...tdSx,
                              color: "text.secondary",
                              fontSize: "0.75rem",
                            }}
                          >
                            {row.supplier || "—"}
                          </TableCell>
                          <TableCell sx={tdSx}>
                            <Chip
                              label={row.category}
                              size="small"
                              sx={{ fontSize: "0.68rem", height: 20 }}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              ...tdSx,
                              fontWeight: 700,
                              color:
                                qty <= 0
                                  ? statusTextColor
                                  : qty <= minStock
                                    ? "#ca6f1e"
                                    : "text.primary",
                            }}
                          >
                            {qty.toLocaleString()}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              ...tdSx,
                              color:
                                qty <= minStock ? "#ca6f1e" : "text.secondary",
                              fontWeight: qty <= minStock ? 700 : 400,
                            }}
                          >
                            {minStock.toLocaleString()}
                          </TableCell>
                          <TableCell sx={tdSx}>
                            <StatusBar qty={qty} minStock={minStock} />
                          </TableCell>
                          <TableCell sx={tdSx}>
                            <RemarkCell
                              remarks={row.remarks}
                              remarksBy={row.remarks_added_by}
                              remarksDate={row.remarks_created_at}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── raw materials table ──────────────────────────────────────────────────────

function RawMaterialsTable({ data, isDark }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const cats = useMemo(
    () =>
      ["All", ...new Set(data.map((x) => x.category).filter(Boolean))].sort(
        (a, b) => (a === "All" ? -1 : a.localeCompare(b)),
      ),
    [data],
  );

  const filtered = useMemo(() => {
    return data.filter((x) => {
      const qty = x.quantity ?? 0;
      const minStock = x.min_stock ?? x.minStock ?? 0;
      const { label } = getStatusInfo(qty, minStock);
      const s = search.toLowerCase();
      return (
        (!s || x.name?.toLowerCase().includes(s) || String(x.id).includes(s)) &&
        (catFilter === "All" || x.category === catFilter) &&
        (statusFilter === "All" || label === statusFilter)
      );
    });
  }, [data, search, catFilter, statusFilter]);

  const hasFilters = search || catFilter !== "All" || statusFilter !== "All";
  const resetFilters = () => {
    setSearch("");
    setCatFilter("All");
    setStatusFilter("All");
  };

  const thSx = {
    fontWeight: 700,
    fontSize: "0.72rem",
    color: "text.secondary",
    py: 1,
    whiteSpace: "nowrap",
  };
  const tdSx = { py: 1, fontSize: "0.8rem" };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
        <Grid item xs={12} sm={5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {cats.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["All", "In Stock", "Low Stock", "Out of Stock"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {hasFilters && (
          <Grid item xs={12} sm={1}>
            <Button
              size="small"
              startIcon={<FilterListOff fontSize="small" />}
              onClick={resetFilters}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              Reset
            </Button>
          </Grid>
        )}
      </Grid>

      <Typography
        variant="caption"
        sx={{ color: "text.secondary", mb: 1, display: "block" }}
      >
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
      </Typography>

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f5f6f8" }}
          >
            <TableRow>
              <TableCell sx={thSx}>ID</TableCell>
              <TableCell sx={thSx}>Material name</TableCell>
              <TableCell sx={thSx}>Category</TableCell>
              <TableCell sx={thSx}>Unit</TableCell>
              <TableCell align="right" sx={thSx}>
                Qty
              </TableCell>
              <TableCell align="right" sx={{ ...thSx, color: "#1976d2" }}>
                Min stock
              </TableCell>
              <TableCell sx={{ ...thSx, minWidth: 130 }}>Status</TableCell>
              <TableCell sx={{ ...thSx, minWidth: 180 }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 3, color: "text.secondary", fontSize: "0.8rem" }}
                >
                  No items match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const qty = row.quantity ?? 0;
                const minStock = row.min_stock ?? row.minStock ?? 0;
                const { textColor } = getStatusInfo(qty, minStock);
                return (
                  <TableRow key={row.id} hover>
                    <TableCell
                      sx={{
                        ...tdSx,
                        color: "text.secondary",
                        fontSize: "0.72rem",
                      }}
                    >
                      #{row.id}
                    </TableCell>
                    <TableCell
                      sx={{ ...tdSx, maxWidth: 200, wordBreak: "break-word" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          color: qty <= 0 ? textColor : "text.primary",
                        }}
                      >
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={tdSx}>
                      <Chip
                        label={row.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: "0.68rem", height: 20 }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        ...tdSx,
                        color: "text.secondary",
                        fontSize: "0.75rem",
                      }}
                    >
                      {row.uom || row.unit || "—"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        ...tdSx,
                        fontWeight: 700,
                        color:
                          qty <= 0
                            ? textColor
                            : qty <= minStock
                              ? "#ca6f1e"
                              : "text.primary",
                      }}
                    >
                      {qty.toLocaleString()}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        ...tdSx,
                        color: qty <= minStock ? "#1976d2" : "text.secondary",
                        fontWeight: qty <= minStock ? 700 : 400,
                      }}
                    >
                      {minStock.toLocaleString()}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      <StatusBar qty={qty} minStock={minStock} />
                    </TableCell>
                    <TableCell sx={tdSx}>
                      <RemarkCell
                        remarks={row.remarks}
                        remarksBy={row.remarks_added_by}
                        remarksDate={row.remarks_created_at}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── all remarks view ─────────────────────────────────────────────────────────

function AllRemarksView({ fgData, rmData, brandColorMap }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const allBrands = useMemo(
    () =>
      [
        "All",
        ...new Set(fgData.map((x) => x.brand?.trim()).filter(Boolean)),
      ].sort((a, b) => (a === "All" ? -1 : a.localeCompare(b))),
    [fgData],
  );
  const allCats = useMemo(() => {
    const c = new Set(
      [
        ...fgData.map((x) => x.category),
        ...rmData.map((x) => x.category),
      ].filter(Boolean),
    );
    return ["All", ...[...c].sort()];
  }, [fgData, rmData]);

  const allWithRemarks = useMemo(() => {
    const fg = fgData
      .filter((x) => x.remarks)
      .map((x) => ({ ...x, _type: "Finished Goods" }));
    const rm = rmData
      .filter((x) => x.remarks)
      .map((x) => ({ ...x, _type: "Raw Materials" }));
    return [...fg, ...rm];
  }, [fgData, rmData]);

  const filtered = useMemo(() => {
    return allWithRemarks.filter((x) => {
      const qty = x.quantity ?? 0;
      const minStock = x.min_stock ?? x.minStock ?? 0;
      const { label } = getStatusInfo(qty, minStock);
      return (
        (typeFilter === "All" || x._type === typeFilter) &&
        (brandFilter === "All" ||
          (x.brand?.trim() || "— No Brand —") === brandFilter) &&
        (catFilter === "All" || x.category === catFilter) &&
        (statusFilter === "All" || label === statusFilter)
      );
    });
  }, [allWithRemarks, typeFilter, brandFilter, catFilter, statusFilter]);

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 2 }} alignItems="center">
        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {["All", "Finished Goods", "Raw Materials"].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            {allBrands.map((b) => (
              <MenuItem key={b} value={b}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {b !== "All" && (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        flexShrink: 0,
                        bgcolor: brandColorMap[b] || "#9e9e9e",
                      }}
                    />
                  )}
                  {b}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {allCats.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["All", "In Stock", "Low Stock", "Out of Stock"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Typography
        variant="caption"
        sx={{ color: "text.secondary", mb: 1.5, display: "block" }}
      >
        {filtered.length} remark{filtered.length !== 1 ? "s" : ""} found
      </Typography>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <CommentOutlined sx={{ fontSize: 32, mb: 1, opacity: 0.3 }} />
          <Typography variant="body2">
            No remarks match your filters.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {filtered.map((item) => {
            const qty = item.quantity ?? 0;
            const minStock = item.min_stock ?? item.minStock ?? 0;
            const { label, barColor, bgColor } = getStatusInfo(qty, minStock);
            const isFG = item._type === "Finished Goods";
            const brandColor = item.brand?.trim()
              ? brandColorMap[item.brand.trim()] || null
              : null;

            return (
              <Grid item xs={12} sm={6} key={`${item._type}-${item.id}`}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderLeft: brandColor
                      ? `4px solid ${brandColor}`
                      : undefined,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                      mb: 0.8,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontSize: "0.7rem" }}
                    >
                      #{String(item.id).split(":")[0]}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Chip
                      label={item._type}
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        height: 18,
                        bgcolor: isFG
                          ? "rgba(21,101,192,0.1)"
                          : "rgba(27,94,32,0.1)",
                        color: isFG ? "#1565c0" : "#1b5e20",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}
                  >
                    {item.brand && (
                      <Chip
                        icon={
                          <LocalOfferOutlined
                            sx={{
                              fontSize: "10px !important",
                              color: brandColor || "inherit",
                            }}
                          />
                        }
                        label={item.brand}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          height: 18,
                          bgcolor: brandColor
                            ? hexToRgba(brandColor, 0.15)
                            : undefined,
                          color: brandColor || "inherit",
                          fontWeight: 600,
                          border: brandColor
                            ? `1px solid ${hexToRgba(brandColor, 0.4)}`
                            : undefined,
                        }}
                      />
                    )}
                    <Chip
                      label={item.category}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.65rem", height: 18 }}
                    />
                    <Chip
                      label={label}
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        height: 18,
                        bgcolor: bgColor,
                        color: barColor,
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      bgcolor: "action.hover",
                      borderRadius: 1.5,
                      p: 1,
                      mb: 0.8,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.78rem",
                        fontStyle: "italic",
                        lineHeight: 1.5,
                        color: "text.primary",
                      }}
                    >
                      "{item.remarks}"
                    </Typography>
                  </Box>

                  {item.remarks_added_by && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.disabled", fontSize: "0.68rem" }}
                    >
                      — {item.remarks_added_by}
                      {item.remarks_created_at
                        ? " · " + fmtDate(item.remarks_created_at)
                        : ""}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ mode }) {
  const isDark = mode === "dark";

  const [fgData, setFgData] = useState([]);
  const [rmData, setRmData] = useState([]);
  const [brandColorMap, setBrandColorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fgRes, rmRes, brandsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/inventory`),
        fetch(`${import.meta.env.VITE_API_URL}/raw-materials`),
        fetch(`${import.meta.env.VITE_API_URL}/brands`),
      ]);
      const [fg, rm, brands] = await Promise.all([
        fgRes.json(),
        rmRes.json(),
        brandsRes.json(),
      ]);

      setFgData(Array.isArray(fg) ? fg : []);

      // ── Normalize raw materials field names to match the shared components ──
      // The raw-materials API returns material_id, material_name, qty_, minimum_stock
      // but the table components expect: id, name, quantity, min_stock
      setRmData(
        Array.isArray(rm)
          ? rm.map((item) => ({
              ...item,
              id: item.material_id ?? item.id,
              name: item.material_name ?? item.name,
              quantity: item.qty_ ?? item.quantity ?? 0,
              min_stock: item.minimum_stock ?? item.min_stock ?? 0,
              unit: item.unit ?? item.uom,
            }))
          : [],
      );

      if (Array.isArray(brands)) {
        const map = {};
        brands.forEach((b) => {
          if (b.brand_name?.trim())
            map[b.brand_name.trim()] = b.brand_color || "#1565c0";
        });
        setBrandColorMap(map);
      }
    } catch (err) {
      setError("Failed to load data. Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const kpis = useMemo(() => {
    const fgOut = fgData.filter((x) => (x.quantity ?? 0) <= 0).length;
    const fgLow = fgData.filter((x) => {
      const q = x.quantity ?? 0;
      const m = x.min_stock ?? x.minStock ?? 0;
      return q > 0 && q <= m;
    }).length;
    const rmOut = rmData.filter((x) => (x.quantity ?? 0) <= 0).length;
    const rmLow = rmData.filter((x) => {
      const q = x.quantity ?? 0;
      const m = x.min_stock ?? x.minStock ?? 0;
      return q > 0 && q <= m;
    }).length;
    const withRemarks = [...fgData, ...rmData].filter((x) => x.remarks).length;
    return { fgOut, fgLow, rmOut, rmLow, withRemarks };
  }, [fgData, rmData]);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Inventory Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stock control · Raw materials · Remarks overview
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ alignSelf: "flex-end" }}
        >
          {new Date().toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            label="Finished Goods"
            value={fgData.length}
            color="default"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            label="Raw Materials"
            value={rmData.length}
            color="default"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="FG Out of Stock" value={kpis.fgOut} color="danger" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="FG Low Stock" value={kpis.fgLow} color="warning" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="RM Out of Stock" value={kpis.rmOut} color="danger" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard
            label="Items with Remarks"
            value={kpis.withRemarks}
            color="success"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2,
            pt: 1,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              minHeight: 44,
            },
          }}
        >
          <Tab
            icon={<Inventory2Outlined sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Finished Goods"
          />
          <Tab
            icon={<ScienceOutlined sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Raw Materials"
          />
          <Tab
            icon={<CommentOutlined sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="All Remarks"
          />
        </Tabs>
        <Divider />

        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
              <Button
                onClick={fetchAll}
                sx={{ mt: 2, textTransform: "none" }}
                variant="outlined"
              >
                Retry
              </Button>
            </Box>
          ) : (
            <>
              {activeTab === 0 && (
                <FinishedGoodsTable
                  data={fgData}
                  isDark={isDark}
                  brandColorMap={brandColorMap}
                />
              )}
              {activeTab === 1 && (
                <RawMaterialsTable data={rmData} isDark={isDark} />
              )}
              {activeTab === 2 && (
                <AllRemarksView
                  fgData={fgData}
                  rmData={rmData}
                  brandColorMap={brandColorMap}
                />
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
