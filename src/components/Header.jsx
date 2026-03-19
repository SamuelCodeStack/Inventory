import React, { useState } from "react";
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
} from "@mui/icons-material";

export default function Header({ mode }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
      }}
    >
      {/* Changed justifyContent to flex-end to push items to the right */}
      <Toolbar sx={{ justifyContent: "flex-end" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton>
            <Badge variant="dot" color="error">
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
            <Avatar src="" sx={{ width: 32, height: 32 }} />
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" fontWeight="bold">
                Sam
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
            onClick={handleClose}
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
                <History fontSize="small" />
              </ListItemIcon>
              Activity
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleClose} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
