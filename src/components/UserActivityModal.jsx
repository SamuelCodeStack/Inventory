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
} from "@mui/material";
import { Close, History } from "@mui/icons-material";

export default function UserActivityModal({ open, handleClose, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserLogs();
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
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Typography align="center" sx={{ py: 5 }} color="text.secondary">
            No activities recorded for this user.
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
                {Object.keys(groupedLogs).map((dateGroup) => (
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
      </DialogContent>
    </Dialog>
  );
}
