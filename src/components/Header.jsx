import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added for navigation
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Badge,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  NotificationsNone,
  KeyboardArrowDown,
  History,
  Logout,
  Person, // Added for Profile icon
  Menu as MenuIcon, // Added back for mobile responsiveness
} from "@mui/icons-material";
import UserActivityModal from "./UserActivityModal"; // Import the modal

export default function Header({ mode, user, onMenuClick }) {
  // Added onMenuClick prop back
  // Added user prop
  const navigate = useNavigate(); // Hook for navigation
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadLogs, setUnreadLogs] = useState(0); // State for notification badge
  const [openPersonalLogs, setOpenPersonalLogs] = useState(false); // Modal state
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // --- LOGOUT HANDLER ---
  // const handleLogout = async () => {
  //   try {
  //     const response = await fetch("http://localhost:3000/api/auth/logout", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include", // Required to send the session cookie to be destroyed
  //     });

  //     if (response.ok) {
  //       // Refresh the page to trigger the App.jsx auth check,
  //       // which will redirect the user to /login
  //       window.location.href = "/login";
  //     }
  //   } catch (err) {
  //     console.error("Logout failed", err);
  //   }
  // };

  // Inside handleLogout in Header.jsx
  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // TRIGGER ALL OTHER TABS TO LOGOUT
        localStorage.setItem("kimwin_logout", Date.now());
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
      // Even if network fails, we clear local state to prevent "zombie" sessions
      localStorage.setItem("kimwin_logout", Date.now());
      window.location.href = "/login";
    }
  };
  // FETCH ACTIVITY LOG COUNT (Polling for notifications)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const cleanId = String(user?.id).split(":")[0];
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/logs/user/${cleanId}`,
          {
            credentials: "include",
          },
        );
        const data = await response.json();

        // --- LOCAL STORAGE LOGIC ---
        // Get the last time the user checked notifications from their browser
        const lastRead = localStorage.getItem(`lastReadLogs_${cleanId}`);

        if (lastRead) {
          // Only count logs that happened AFTER the stored timestamp
          const newLogs = data.filter(
            (log) => new Date(log.created_at) > new Date(lastRead),
          );
          setUnreadLogs(newLogs.length);
        } else {
          setUnreadLogs(data.length);
        }
      } catch (err) {
        console.error("Notification fetch failed", err);
      }
    };

    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: "background.paper",
        color: "text.primary",
        width: { sm: "calc(100% - 240px)" },
        ml: { sm: "240px" },
        borderBottom: "1px solid",
        borderColor: mode === "light" ? "#eee" : "#333",
        left: "auto",
        right: 0,
      }}
    >
      {/* Changed to space-between so menu icon is left and profile is right */}
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* FIXED: This button was missing. It only shows on mobile (xs) */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick} // This triggers the handleDrawerToggle in App.jsx
          sx={{ mr: 2, display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Empty Box to push items to right on desktop */}
        <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* UPDATED: Clears badge using LocalStorage and navigates */}
          <IconButton
            onClick={() => {
              const cleanId = String(user?.id).split(":")[0];
              // Save the current time to LocalStorage so these logs are now "read"
              localStorage.setItem(
                `lastReadLogs_${cleanId}`,
                new Date().toISOString(),
              );
              setUnreadLogs(0);
              navigate("/activity-logs");
            }}
          >
            <Badge badgeContent={unreadLogs} color="error" max={99}>
              <NotificationsNone sx={{ color: "text.primary" }} />
            </Badge>
          </IconButton>

          {/* Profile Section */}
          <Box
            onClick={handleClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 1,
              "&:hover": {
                backgroundColor:
                  mode === "light" ? "#f5f5f5" : "rgba(255,255,255,0.05)",
              },
            }}
          >
            <Avatar
              src={user?.avatar_url || ""}
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#f19149",
                fontSize: "0.9rem",
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" fontWeight="bold">
                {user?.name || "User"}
              </Typography>
              {/* DISPLAY CLEANED USER ID HERE */}
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ lineHeight: 1 }}
              >
                ID: #{user?.id ? String(user.id).split(":")[0] : "N/A"}
              </Typography>
            </Box>
            <KeyboardArrowDown
              fontSize="small"
              sx={{
                color: "text.secondary",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </Box>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            disableScrollLock={true} // Prevents shifting
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 180,
                mt: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: mode === "light" ? "#eee" : "#333",
              },
            }}
          >
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleClose();
                setOpenPersonalLogs(true);
              }}
            >
              <ListItemIcon>
                <History fontSize="small" />
              </ListItemIcon>
              Activity
            </MenuItem>

            <Divider />

            {/* TRIGGER LOGOUT HERE */}
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* MODAL FOR LOGGED IN USER'S ACTIVITY */}
      <UserActivityModal
        open={openPersonalLogs}
        handleClose={() => setOpenPersonalLogs(false)}
        user={user}
      />
    </AppBar>
  );
}
