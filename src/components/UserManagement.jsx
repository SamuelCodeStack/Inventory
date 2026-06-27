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
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Delete,
  Search,
  ManageAccounts,
  MailOutline,
  History,
} from "@mui/icons-material";
import UserActivityModal from "./UserActivityModal";

const THEME_ORANGE = "#f2994a";

const roles = [
  { label: "Admin", value: 1 },
  { label: "Office", value: 2 },
  { label: "Production", value: 3 },
  { label: "Viewer", value: 4 },
  { label: "Viewer Admin", value: 5 },
  { label: "Trading", value: 6 },
];

export default function UserManagement({ mode }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openLogModal, setOpenLogModal] = useState(false);
  const [selectedUserForLog, setSelectedUserForLog] = useState(null);

  const currentUserLevel = parseInt(localStorage.getItem("userLevel"));
  const isSuperAdmin = currentUserLevel === 0;
  const isDark = mode === "dark";

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_level: newRole }),
        },
      );
      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, user_level: newRole } : u,
          ),
        );
        const roleLabel =
          roles.find((r) => r.value === newRole)?.label || newRole;
        setNotification({
          open: true,
          message: `Role updated to ${roleLabel} successfully!`,
          severity: "success",
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: "Update failed",
        severity: "error",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setNotification({
          open: true,
          message: "User deleted",
          severity: "info",
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: "Delete failed",
        severity: "error",
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.user_level !== 0 &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ManageAccounts /> User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system access levels and user profiles
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 3, backgroundImage: "none" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Registered Users
          </Typography>
          <TextField
            size="small"
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

        <Table size="small">
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover" }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email Address</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Role Permissions
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: THEME_ORANGE,
                        color: "#000",
                        fontSize: "0.9rem",
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold">
                      {user.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MailOutline
                      fontSize="inherit"
                      sx={{ color: "text.secondary" }}
                    />
                    <Typography variant="body2">{user.email}</Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    select
                    value={user.user_level ?? 4}
                    size="small"
                    disabled={!isSuperAdmin && user.user_level === 1}
                    onChange={(e) =>
                      handleRoleChange(user.id, parseInt(e.target.value))
                    }
                    SelectProps={{
                      renderValue: (selected) =>
                        roles.find((r) => r.value === selected)?.label,
                    }}
                    sx={{
                      width: 140,
                      "& .MuiSelect-select": {
                        py: 0.5,
                        fontSize: "0.8125rem",
                        fontWeight: "bold",
                      },
                    }}
                  >
                    {roles
                      .filter((option) => isSuperAdmin || option.value !== 1)
                      .map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                  </TextField>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Activity Logs">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedUserForLog(user);
                          setOpenLogModal(true);
                        }}
                        sx={{ bgcolor: "rgba(242, 153, 74, 0.1)" }}
                      >
                        <History fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    {isSuperAdmin && (
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Delete fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <UserActivityModal
        open={openLogModal}
        handleClose={() => {
          setOpenLogModal(false);
          setSelectedUserForLog(null);
        }}
        user={selectedUserForLog}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
