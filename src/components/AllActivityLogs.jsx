import React, { useState, useMemo } from "react";
import { useEffect } from "react";
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
  Chip,
  CircularProgress,
  Avatar,
  Stack,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Search,
  FilterListOff,
  AddCircleOutline,
  RemoveCircleOutline,
  EditOutlined,
  DeleteOutline,
  SwapHorizOutlined,
  MoveToInbox,
  Output,
  Tune,
  CheckCircleOutline,
  PersonOutline,
} from "@mui/icons-material";

// ─── Action config: color, icon, label ───────────────────────────────────────
const ACTION_CONFIG = {
  "STOCK IN": {
    color: "#2ecc71",
    bg: "rgba(46,204,113,0.1)",
    border: "rgba(46,204,113,0.3)",
    icon: <MoveToInbox sx={{ fontSize: 14 }} />,
    label: "Stock In",
  },
  "STOCK OUT": {
    color: "#e74c3c",
    bg: "rgba(231,76,60,0.1)",
    border: "rgba(231,76,60,0.3)",
    icon: <Output sx={{ fontSize: 14 }} />,
    label: "Stock Out",
  },
  INSERT: {
    color: "#3498db",
    bg: "rgba(52,152,219,0.1)",
    border: "rgba(52,152,219,0.3)",
    icon: <AddCircleOutline sx={{ fontSize: 14 }} />,
    label: "Added",
  },
  UPDATE: {
    color: "#f39c12",
    bg: "rgba(243,156,18,0.1)",
    border: "rgba(243,156,18,0.3)",
    icon: <EditOutlined sx={{ fontSize: 14 }} />,
    label: "Updated",
  },
  DELETE: {
    color: "#e74c3c",
    bg: "rgba(231,76,60,0.1)",
    border: "rgba(231,76,60,0.3)",
    icon: <DeleteOutline sx={{ fontSize: 14 }} />,
    label: "Deleted",
  },
  ADJUSTMENT: {
    color: "#9b59b6",
    bg: "rgba(155,89,182,0.1)",
    border: "rgba(155,89,182,0.3)",
    icon: <Tune sx={{ fontSize: 14 }} />,
    label: "Adjustment",
  },
  FINALIZE: {
    color: "#1abc9c",
    bg: "rgba(26,188,156,0.1)",
    border: "rgba(26,188,156,0.3)",
    icon: <CheckCircleOutline sx={{ fontSize: 14 }} />,
    label: "Finalized",
  },
  "CHANGE NAME": {
    color: "#f39c12",
    bg: "rgba(243,156,18,0.1)",
    border: "rgba(243,156,18,0.3)",
    icon: <PersonOutline sx={{ fontSize: 14 }} />,
    label: "Name Change",
  },
  "CHANGE EMAIL": {
    color: "#f39c12",
    bg: "rgba(243,156,18,0.1)",
    border: "rgba(243,156,18,0.3)",
    icon: <PersonOutline sx={{ fontSize: 14 }} />,
    label: "Email Change",
  },
  DEFAULT: {
    color: "#95a5a6",
    bg: "rgba(149,165,166,0.1)",
    border: "rgba(149,165,166,0.3)",
    icon: <SwapHorizOutlined sx={{ fontSize: 14 }} />,
    label: "Action",
  },
};

function getActionConfig(key) {
  return ACTION_CONFIG[key] || ACTION_CONFIG["DEFAULT"];
}

// ─── Module display name map ─────────────────────────────────────────────────
const MODULE_LABELS = {
  inventory: "Finished Goods",
  raw_materials: "Raw Materials",
  raw_materials_remarks: "RM Remarks",
  inventory_remarks: "FG Remarks",
  users: "Users",
  brands: "Brands",
};

function getModuleLabel(tableName) {
  return MODULE_LABELS[tableName?.toLowerCase()] || tableName;
}

// ─── Avatar color by username initial ────────────────────────────────────────
const AVATAR_COLORS = [
  "#e67e22",
  "#3498db",
  "#9b59b6",
  "#1abc9c",
  "#e74c3c",
  "#2ecc71",
  "#f39c12",
  "#16a085",
];
function avatarColor(name) {
  if (!name) return "#95a5a6";
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Parse description into structured parts ──────────────────────────────────
// Tries to extract: what happened, item name, from→to quantities, and who
function parseDescription(desc, actionKey) {
  if (!desc) return { summary: "—", detail: null };

  // Stock In / Stock Out:  "Stock In: MaterialName 10 + 5 = 15"
  const stockMatch = desc.match(
    /^(Stock In|Stock Out):\s*(.+?)\s+(\d+)\s*([+-])\s*(\d+)\s*=\s*(\d+)$/i,
  );
  if (stockMatch) {
    const [, action, itemName, from, sign, change, to] = stockMatch;
    return {
      summary: itemName.trim(),
      detail: (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Qty:
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {from}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: sign === "+" ? "#2ecc71" : "#e74c3c",
              fontWeight: 700,
            }}
          >
            {sign}
            {change}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            →
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {to}
          </Typography>
        </Stack>
      ),
    };
  }

  // Update Quantity: "Update Quantity MaterialName 10 to 20"
  const updateQtyMatch = desc.match(
    /^Update Quantity\s+(.+?)\s+(\d+)\s+to\s+(\d+)$/i,
  );
  if (updateQtyMatch) {
    const [, itemName, from, to] = updateQtyMatch;
    const diff = parseInt(to) - parseInt(from);
    return {
      summary: itemName.trim(),
      detail: (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Qty:
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {from}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            →
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {to}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: diff >= 0 ? "#2ecc71" : "#e74c3c", fontWeight: 700 }}
          >
            ({diff >= 0 ? "+" : ""}
            {diff})
          </Typography>
        </Stack>
      ),
    };
  }

  // Added / Updated / Deleted item: "Added raw material: ItemName" or "Updated raw material: ItemName"
  const namedMatch = desc.match(
    /^(Added|Updated|Deleted|Bulk added material|Bulk added|Added raw material|Updated raw material|Deleted raw material|Added item|Updated item|Deleted item)[:\s]+(.+)$/i,
  );
  if (namedMatch) {
    return { summary: namedMatch[2].trim(), detail: null };
  }

  // Remark added: "Added remark for material: ItemName by UserName"
  const remarkMatch = desc.match(
    /^Added remark for (?:material|item):\s*(.+?)\s+by\s+(.+)$/i,
  );
  if (remarkMatch) {
    return {
      summary: remarkMatch[1].trim(),
      detail: (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          by <strong>{remarkMatch[2].trim()}</strong>
        </Typography>
      ),
    };
  }

  // Cleared remark: "Cleared remark for material: ItemName"
  const clearedRemarkMatch = desc.match(
    /^Cleared remark for (?:material|item):\s*(.+)$/i,
  );
  if (clearedRemarkMatch) {
    return { summary: clearedRemarkMatch[1].trim(), detail: null };
  }

  // Fallback — just show as-is
  return { summary: desc, detail: null };
}

// ─── Resolve action key from log ─────────────────────────────────────────────
function resolveActionKey(log) {
  const table = log.table_name?.toLowerCase() || "";
  const desc = log.description?.toLowerCase() || "";
  const action = log.action_type;

  if (table === "inventory" || table === "raw_materials") {
    if (desc.includes("stock in")) return "STOCK IN";
    if (desc.includes("stock out")) return "STOCK OUT";
    if (desc.includes("update quantity") || desc.includes("quantity updated"))
      return "UPDATE";
    if (desc.includes("adjusted")) return "ADJUSTMENT";
  }

  if (table === "users" && action === "UPDATE") {
    if (desc.includes("name")) return "CHANGE NAME";
    if (desc.includes("email")) return "CHANGE EMAIL";
  }

  return action;
}

// ─── Action badge ─────────────────────────────────────────────────────────────
function ActionBadge({ actionKey }) {
  const cfg = getActionConfig(actionKey);
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.3,
        borderRadius: 1.5,
        bgcolor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontWeight: 700,
        fontSize: "0.68rem",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon}
      {cfg.label}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AllActivityLogs({ mode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleDaysCount, setVisibleDaysCount] = useState(1);
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  const isDark = mode === "dark";

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
          credentials: "include",
        });
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch all logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // ─── Grouping ───────────────────────────────────────────────────────────────
  const getGroupedLogs = (filteredLogs) => {
    const groups = {};
    filteredLogs.forEach((log) => {
      const date = new Date(log.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey = date.toDateString();
      if (dateKey === today.toDateString()) dateKey = "Today";
      else if (dateKey === yesterday.toDateString()) dateKey = "Yesterday";
      else dateKey = date.toLocaleDateString(undefined, { dateStyle: "long" });

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  };

  const getGroupKeyFromCalendarInput = (isoString) => {
    if (!isoString) return "ALL";
    const [year, month, day] = isoString.split("-");
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetDate.toDateString() === today.toDateString()) return "Today";
    if (targetDate.toDateString() === yesterday.toDateString())
      return "Yesterday";
    return targetDate.toLocaleDateString(undefined, { dateStyle: "long" });
  };

  // ─── Filter logs ────────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const actionKey = resolveActionKey(log);
      const matchesSearch =
        !searchQuery ||
        log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(log.record_id).includes(searchQuery);
      const matchesModule =
        moduleFilter === "ALL" ||
        log.table_name?.toLowerCase() === moduleFilter;
      const matchesAction =
        actionFilter === "ALL" || actionKey === actionFilter;
      return matchesSearch && matchesModule && matchesAction;
    });
  }, [logs, searchQuery, moduleFilter, actionFilter]);

  const groupedLogs = useMemo(
    () => getGroupedLogs(filteredLogs),
    [filteredLogs],
  );
  const availableDays = Object.keys(groupedLogs);

  const getDisplayedDateGroups = () => {
    if (selectedDayFilter !== "ALL") {
      const resolvedKey = getGroupKeyFromCalendarInput(selectedDayFilter);
      return availableDays.includes(resolvedKey) ? [resolvedKey] : [];
    }
    return availableDays.slice(0, visibleDaysCount);
  };

  const displayedDateGroups = getDisplayedDateGroups();
  const hasMoreDaysToShow =
    selectedDayFilter === "ALL" && visibleDaysCount < availableDays.length;

  const hasActiveFilters =
    searchQuery ||
    moduleFilter !== "ALL" ||
    actionFilter !== "ALL" ||
    selectedDayFilter !== "ALL";

  const handleClearFilters = () => {
    setSearchQuery("");
    setModuleFilter("ALL");
    setActionFilter("ALL");
    setSelectedDayFilter("ALL");
    setVisibleDaysCount(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <HistoryIcon /> System Activity Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time history of all actions performed in the system (Last 7 days)
        </Typography>
      </Box>

      {/* ── Filters ── */}
      <Paper sx={{ borderRadius: 3, p: 2, mb: 2.5, backgroundImage: "none" }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search user, description, ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Date"
              type="date"
              value={selectedDayFilter === "ALL" ? "" : selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value || "ALL")}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Modules</MenuItem>
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Actions</MenuItem>
              {Object.entries(ACTION_CONFIG)
                .filter(([k]) => k !== "DEFAULT")
                .map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: cfg.color,
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </Box>
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
          {hasActiveFilters && (
            <Grid item xs={6} sm={1}>
              <Button
                size="small"
                startIcon={<FilterListOff fontSize="small" />}
                onClick={handleClearFilters}
                sx={{
                  textTransform: "none",
                  color: "text.secondary",
                  fontSize: "0.75rem",
                }}
              >
                Reset
              </Button>
            </Grid>
          )}
        </Grid>

        {/* result count */}
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mt: 1, display: "block" }}
        >
          {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""} found
        </Typography>
      </Paper>

      {/* ── Table ── */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, backgroundImage: "none" }}
      >
        <Table size="small">
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f5f6f8" }}
          >
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                  width: 80,
                }}
              >
                Time
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  width: 130,
                }}
              >
                User
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  width: 120,
                }}
              >
                Action
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  width: 120,
                }}
              >
                Module
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  width: 60,
                }}
              >
                ID
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  color: "text.secondary",
                }}
              >
                What happened
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {displayedDateGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 5, color: "text.secondary", fontSize: "0.85rem" }}
                >
                  No logs found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              displayedDateGroups.map((dateGroup) => (
                <React.Fragment key={dateGroup}>
                  {/* ── Date header ── */}
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{
                        bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#eef2fa",
                        py: 0.8,
                        px: 2,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        color: isDark ? "#90caf9" : "#1565c0",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderBottom: "none",
                      }}
                    >
                      {dateGroup}
                      <Box
                        component="span"
                        sx={{ ml: 1.5, fontWeight: 400, opacity: 0.6 }}
                      >
                        — {groupedLogs[dateGroup].length} event
                        {groupedLogs[dateGroup].length !== 1 ? "s" : ""}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* ── Log rows ── */}
                  {groupedLogs[dateGroup].map((log) => {
                    const actionKey = resolveActionKey(log);
                    const cfg = getActionConfig(actionKey);
                    const { summary, detail } = parseDescription(
                      log.description,
                      actionKey,
                    );
                    const moduleLabel = getModuleLabel(log.table_name);
                    const color = avatarColor(log.user_name);

                    return (
                      <TableRow
                        key={log.log_id}
                        hover
                        sx={{
                          borderLeft: `3px solid ${cfg.color}`,
                          "& td": { py: 1 },
                        }}
                      >
                        {/* Time */}
                        <TableCell
                          sx={{
                            whiteSpace: "nowrap",
                            color: "text.secondary",
                            fontSize: "0.78rem",
                          }}
                        >
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>

                        {/* User */}
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 22,
                                height: 22,
                                fontSize: "0.65rem",
                                bgcolor: color,
                                flexShrink: 0,
                              }}
                            >
                              {log.user_name?.charAt(0)?.toUpperCase() || "?"}
                            </Avatar>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "0.78rem", fontWeight: 500 }}
                            >
                              {log.user_name || "System"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Action badge */}
                        <TableCell>
                          <ActionBadge actionKey={actionKey} />
                        </TableCell>

                        {/* Module */}
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.72rem",
                            }}
                          >
                            {moduleLabel}
                          </Typography>
                        </TableCell>

                        {/* Record ID */}
                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.disabled",
                              fontFamily: "monospace",
                            }}
                          >
                            #{log.record_id}
                          </Typography>
                        </TableCell>

                        {/* Description — parsed into summary + detail */}
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                color: "text.primary",
                                lineHeight: 1.3,
                              }}
                            >
                              {summary}
                            </Typography>
                            {detail && <Box sx={{ mt: 0.3 }}>{detail}</Box>}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── See More ── */}
      {hasMoreDaysToShow && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ExpandMoreIcon />}
            onClick={() => setVisibleDaysCount((prev) => prev + 1)}
            sx={{
              fontWeight: "bold",
              textTransform: "none",
              px: 4,
              borderRadius: 2,
            }}
          >
            See More Logs
          </Button>
        </Box>
      )}
    </Box>
  );
}
