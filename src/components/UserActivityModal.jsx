import React, { useState, useEffect } from "react";
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
  Chip,
  Box,
  CircularProgress,
  Button, // Added for pagination
  TextField, // Added for calendar filtering
  Stack, // Added for layout handling
} from "@mui/material";
import {
  Close,
  History,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

export default function UserActivityModal({ open, handleClose, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  // States added for pagination and filtering
  const [visibleDaysCount, setVisibleDaysCount] = useState(1);
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");

  useEffect(() => {
    if (open && user) {
      fetchUserLogs();
      // Reset view states when dialog reopens for a new user context
      setVisibleDaysCount(1);
      setSelectedDayFilter("ALL");
    }
  }, [open, user]);

  const fetchUserLogs = async () => {
    try {
      setLoading(true);

      // --- FIX STARTS HERE ---
      // Clean the user ID (converts "4:1" to "4")
      const rawId = String(user.id);
      const cleanId = rawId.split(":")[0];

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/logs/user/${cleanId}`,
      );
      // --- FIX ENDS HERE ---

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case "INSERT":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "error";
      case "FINALIZE": // Added logging color for finalize action
        return "secondary";
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
    return availableDays.slice(0, visibleDaysCount);
  };

  const displayedDateGroups = getDisplayedDateGroups();
  const hasMoreDaysToShow =
    selectedDayFilter === "ALL" && visibleDaysCount < availableDays.length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableScrollLock // Prevents header shifting
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <History color="primary" />
          <Typography variant="h6">Activity Log: {user?.name}</Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Calendar date picker integrated inside the modal filter view row */}
        {!loading && logs.length > 0 && (
          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
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
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 || displayedDateGroups.length === 0 ? (
          <Typography align="center" sx={{ py: 5 }} color="text.secondary">
            {logs.length === 0
              ? "No activities recorded for this user."
              : "No logs found for this specific date."}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
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
                        colSpan={5}
                        sx={{
                          bgcolor: "action.hover",
                          fontWeight: "bold",
                          color: "primary.main",
                          py: 1,
                        }}
                      >
                        {dateGroup}
                      </TableCell>
                    </TableRow>
                    {groupedLogs[dateGroup].map((log) => {
                      // Specific logic to identify and format profile updates
                      const isProfileUpdate =
                        log.table_name === "users" &&
                        log.action_type === "UPDATE";
                      let displayAction = log.action_type;
                      let displayDescription = log.description;

                      if (isProfileUpdate) {
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
                            {/* Displaying only time since header shows the date */}
                            {new Date(log.created_at).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={displayAction}
                              size="small"
                              color={getActionColor(log.action_type)}
                              variant="outlined"
                              sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>
                            {log.table_name}
                          </TableCell>
                          {/* DISPLAY THE ITEM/RECORD ID HERE */}
                          <TableCell sx={{ fontWeight: "bold" }}>
                            #{log.record_id}
                          </TableCell>
                          <TableCell>{displayDescription}</TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Progressive pagination controller component */}
        {!loading && hasMoreDaysToShow && (
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
      </DialogContent>
    </Dialog>
  );
}
