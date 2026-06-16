import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Button,
  TextField,
  Stack,
  Grid,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import {
  Close,
  History,
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

// ─── Action config ────────────────────────────────────────────────────────────
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

// ─── Module labels ────────────────────────────────────────────────────────────
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

// ─── Parse description into structured parts ──────────────────────────────────
function parseDescription(desc) {
  if (!desc) return { summary: "—", detail: null };

  // Stock In / Stock Out: "Stock In: MaterialName 10 + 5 = 15"
  const stockMatch = desc.match(
    /^(Stock In|Stock Out):\s*(.+?)\s+(\d+)\s*([+-])\s*(\d+)\s*=\s*(\d+)$/i,
  );
  if (stockMatch) {
    const [, , itemName, from, sign, change, to] = stockMatch;
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

  // Named actions: "Added raw material: ItemName"
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

  // Cleared remark
  const clearedRemarkMatch = desc.match(
    /^Cleared remark for (?:material|item):\s*(.+)$/i,
  );
  if (clearedRemarkMatch) {
    return { summary: clearedRemarkMatch[1].trim(), detail: null };
  }

  return { summary: desc, detail: null };
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
export default function UserActivityModal({ open, handleClose, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleDaysCount, setVisibleDaysCount] = useState(1);
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    if (open && user) {
      fetchUserLogs();
      setVisibleDaysCount(1);
      setSelectedDayFilter("ALL");
      setSearchQuery("");
      setActionFilter("ALL");
    }
  }, [open, user]);

  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      const rawId = String(user.id);
      const cleanId = rawId.split(":")[0];
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/logs/user/${cleanId}`,
      );
      if (!response.ok)
        throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtering ───────────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const actionKey = resolveActionKey(log);
      const matchesSearch =
        !searchQuery ||
        log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(log.record_id).includes(searchQuery);
      const matchesAction =
        actionFilter === "ALL" || actionKey === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  // ─── Grouping ────────────────────────────────────────────────────────────────
  const groupedLogs = useMemo(() => {
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
  }, [filteredLogs]);

  const availableDays = Object.keys(groupedLogs);

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
    searchQuery || actionFilter !== "ALL" || selectedDayFilter !== "ALL";

  const handleClearFilters = () => {
    setSearchQuery("");
    setActionFilter("ALL");
    setSelectedDayFilter("ALL");
    setVisibleDaysCount(1);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableScrollLock
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <History color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Activity History
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* ── Filters ── */}
        {!loading && logs.length > 0 && (
          <Box
            sx={{
              px: 2.5,
              pt: 2,
              pb: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search description or ID…"
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
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Date"
                  type="date"
                  value={selectedDayFilter === "ALL" ? "" : selectedDayFilter}
                  onChange={(e) =>
                    setSelectedDayFilter(e.target.value || "ALL")
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
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
                <Grid item xs={12} sm={1}>
                  <Button
                    size="small"
                    startIcon={<FilterListOff fontSize="small" />}
                    onClick={handleClearFilters}
                    sx={{
                      textTransform: "none",
                      color: "text.secondary",
                      fontSize: "0.72rem",
                    }}
                  >
                    Reset
                  </Button>
                </Grid>
              )}
            </Grid>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 0.8, display: "block" }}
            >
              {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""}{" "}
              found
            </Typography>
          </Box>
        )}

        {/* ── Content ── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredLogs.length === 0 || displayedDateGroups.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
            <History sx={{ fontSize: 36, opacity: 0.2, mb: 1 }} />
            <Typography variant="body2">
              {logs.length === 0
                ? "No activities recorded for this user."
                : "No logs match your filters."}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        color: "text.secondary",
                        width: 70,
                      }}
                    >
                      Time
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
                        width: 55,
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
                  {displayedDateGroups.map((dateGroup) => (
                    <React.Fragment key={dateGroup}>
                      {/* ── Date header ── */}
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{
                            bgcolor: "action.selected",
                            py: 0.7,
                            px: 2,
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            color: "primary.main",
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
                        );

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
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {new Date(log.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
                                {getModuleLabel(log.table_name)}
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

                            {/* Parsed description */}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ── See More ── */}
            {hasMoreDaysToShow && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2.5 }}>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
