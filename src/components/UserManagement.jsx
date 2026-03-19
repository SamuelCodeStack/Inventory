import React, { useState, useEffect } from "react";
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
  Add,
  Edit,
  Delete,
  Search,
  ManageAccounts,
  MailOutline,
} from "@mui/icons-material";

const THEME_ORANGE = "#f2994a";
const roles = ["Admin", "Manager", "Staff"];

export default function UserManagement({ mode }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
  });

  const isDark = mode === "dark";

  useEffect(() => {
    const mockUsers = [
      { id: 1, name: "Sam Win", email: "sam.win@kimwin.com", role: "Admin" },
      { id: 2, name: "John Doe", email: "j.doe@kimwin.com", role: "Manager" },
      {
        id: 3,
        name: "Alice Smith",
        email: "alice.s@kimwin.com",
        role: "Staff",
      },
      { id: 4, name: "Bob Johnson", email: "bob.j@kimwin.com", role: "Staff" },
    ];
    setUsers(mockUsers);
  }, []);

  // Handler for dropdown change
  const handleRoleChange = (userId, newRole) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      ),
    );
    setNotification({
      open: true,
      message: `Role updated to ${newRole} successfully!`,
    });

    // NOTE: Here you would typically trigger your API call:
    // fetch(`/api/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) })
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* HEADER SECTION */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 4,
          alignItems: "center",
        }}
      >
        <Box>
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
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            bgcolor: THEME_ORANGE,
            color: "#000",
            fontWeight: "bold",
            "&:hover": { bgcolor: "#d8853a" },
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* TABLE CONTAINER */}
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
                        fontSize: "0.9rem",
                        bgcolor: THEME_ORANGE,
                        color: "#000",
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
                  {/* ROLE DROPDOWN INSTEAD OF CHIP */}
                  <TextField
                    select
                    value={user.role}
                    size="small"
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    sx={{
                      width: 130,
                      "& .MuiSelect-select": {
                        py: 0.5,
                        fontSize: "0.8125rem",
                        fontWeight: "bold",
                      },
                    }}
                  >
                    {roles.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit Profile">
                      <IconButton size="small" color="info">
                        <Edit fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton size="small" color="error">
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* SUCCESS NOTIFICATION */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
