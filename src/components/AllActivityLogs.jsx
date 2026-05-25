import React, { useState, useEffect } from "react";
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
  TextField, // Swapped FormControl/Select/InputLabel/MenuItem for TextField
} from "@mui/material";
import {
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

export default function AllActivityLogs({ mode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // States added for pagination and filtering
  const [visibleDaysCount, setVisibleDaysCount] = useState(1);
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");

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
        loading && setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (type) => {
    switch (type) {
      case "INSERT":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "error";
      case "FINALIZE":
        return "secondary";
      case "STOCK IN":
        return "success";
      case "STOCK OUT":
        return "error";
      case "ADJUSTMENT":
        return "warning";
      case "QUANTITY EDIT":
        return "primary";
      default:
        return "default";
    }
  };

  // --- HELPER TO GROUP BY DATE ---
  const getGroupedLogs = () => {
    const groups = {};
    logs.forEach((log) => {
      const date = new Date(log.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey = date.toDateString();
      if (dateKey === today.toDateString()) {
        dateKey = "Today";
      } else if (dateKey === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else {
        dateKey = date.toLocaleDateString(undefined, {
          dateStyle: "long",
        });
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  };

  const groupedLogs = getGroupedLogs();

  // Sorted list of unique date groups available in your current logs
  const availableDays = Object.keys(groupedLogs);

  // Helper to accurately map standard YYYY-MM-DD input strings to your custom grouping keys
  const getGroupKeyFromCalendarInput = (isoString) => {
    if (!isoString) return "ALL";

    // Parse the calendar date safely as local midnight to avoid timezone offsetting
    const [year, month, day] = isoString.split("-");
    const targetDate = new Date(year, month - 1, day);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (targetDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (targetDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return targetDate.toLocaleDateString(undefined, {
      dateStyle: "long",
    });
  };

  // Determine which days should be rendered based on view states and filters
  const getDisplayedDateGroups = () => {
    if (selectedDayFilter !== "ALL") {
      const resolvedKey = getGroupKeyFromCalendarInput(selectedDayFilter);
      return availableDays.includes(resolvedKey) ? [resolvedKey] : [];
    }
    // Default or "See More" behavior: slice chronological keys array sequentially
    return availableDays.slice(0, visibleDaysCount);
  };

  const displayedDateGroups = getDisplayedDateGroups();
  const hasMoreDaysToShow =
    selectedDayFilter === "ALL" && visibleDaysCount < availableDays.length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between", // Fixed string literal from 'between' to valid 'space-between'
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <HistoryIcon /> System Activity Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time history of all actions performed in the system (Last 7
            Days)
          </Typography>
        </Box>

        {/* Day selection filter using calendar date picker */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Filter by Date"
            type="date"
            size="small"
            value={selectedDayFilter === "ALL" ? "" : selectedDayFilter}
            onChange={(e) => setSelectedDayFilter(e.target.value || "ALL")}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 220 }}
          />
          {selectedDayFilter !== "ALL" && (
            <Button
              size="small"
              onClick={() => setSelectedDayFilter("ALL")}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 3, backgroundImage: "none" }}
      >
        <Table size="small">
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover" }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Module</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedDateGroups.map((dateGroup) => (
              <React.Fragment key={dateGroup}>
                {/* Date Header Row */}
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{
                      bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fa",
                      fontWeight: "bold",
                      color: "primary.main",
                      py: 1.5,
                    }}
                  >
                    {dateGroup}
                  </TableCell>
                </TableRow>
                {groupedLogs[dateGroup].map((log) => {
                  // --- LOGIC TO CUSTOMIZE ACTION LABELS ---
                  let displayAction = log.action_type;
                  let colorKey = log.action_type;

                  // Updated Inventory/Raw Materials logic to match your images
                  if (
                    log.table_name.toLowerCase() === "inventory" ||
                    log.table_name.toLowerCase() === "raw_materials"
                  ) {
                    const desc = log.description.toLowerCase();

                    if (desc.includes("stock in")) {
                      displayAction = "STOCK IN";
                      colorKey = "STOCK IN";
                    } else if (desc.includes("stock out")) {
                      displayAction = "STOCK OUT";
                      colorKey = "STOCK OUT";
                    } else if (
                      desc.includes("update quantity") ||
                      desc.includes("quantity updated")
                    ) {
                      displayAction = "UPDATE";
                      colorKey = "UPDATE";
                    } else if (desc.includes("adjusted")) {
                      displayAction = "ADJUSTMENT";
                      colorKey = "ADJUSTMENT";
                    }
                  }

                  if (
                    log.table_name === "users" &&
                    log.action_type === "UPDATE"
                  ) {
                    if (log.description.toLowerCase().includes("name")) {
                      displayAction = "CHANGE NAME";
                    } else if (
                      log.description.toLowerCase().includes("email")
                    ) {
                      displayAction = "CHANGE EMAIL";
                    }
                  }

                  return (
                    <TableRow key={log.log_id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: "0.7rem",
                              bgcolor: "#f19149",
                            }}
                          >
                            {log.user_name?.charAt(0) || "S"}
                          </Avatar>
                          <Typography variant="body2">
                            {log.user_name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={displayAction}
                          size="small"
                          color={getActionColor(colorKey)}
                          variant="outlined"
                          sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {log.table_name}
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        #{log.record_id}
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
            {(logs.length === 0 || displayedDateGroups.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Progressive pagination controller */}
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
