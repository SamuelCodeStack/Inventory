import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
} from "@mui/material";
import {
  Inventory,
  ShoppingCart,
  Dashboard, // Icon for Job Order
  Assignment, // Icon for Job Order
  Layers, // Icon for Raw Materials
  ManageAccounts, // Icon for User Management
  Storage,
} from "@mui/icons-material";

export default function Sidebar({
  toggleDarkMode,
  mode,
  mobileOpen,
  handleDrawerToggle,
  user, // Added user prop to access user_level
}) {
  const location = useLocation();
  const drawerWidth = 240;

  const hasDashboardAccess =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1" ||
    user?.user_level === 2 ||
    user?.user_level === "2";

  // Helper for Admin check - Updated to include Superadmin (0) and Admin (1)
  const isAdmin =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1";

  const menuItems = [
    // Dashboard is now restricted to Admin only
    // ...(hasDashboardAccess
    //   ? [
    //       {
    //         text: "Dashboard",
    //         icon: <Dashboard />,
    //         path: "/Dashboard",
    //       },
    //     ]
    //   : []),
    {
      text: "Finished Goods",
      icon: <Inventory />,
      // section: "Main Menu", // Section Header
      path: "/inventory",
    },

    {
      text: "Raw Materials",
      icon: <Layers />,
      path: "/raw-materials",
    },

    // Purchase Order restricted for user level 3 and 4
    // ...(![3, "3", 4, "4"].includes(user?.user_level)
    //   ? [
    //       {
    //         text: "Purchase Order",
    //         icon: <ShoppingCart />,
    //         path: "/purchase-order",
    //       },
    //     ]
    //   : []),

    // User Management is now restricted to Admin only
    ...(isAdmin
      ? [
          {
            text: "User Management",
            icon: <ManageAccounts />,
            section: "Administration", // New Section Header
            path: "/user-management",
          },
          {
            text: "Backup",
            icon: <Storage />,
            path: "/backup",
          },
        ]
      : []),
  ];

  // Reusable content for both types of drawers
  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            bgcolor: "primary.main",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Inventory fontSize="small" />
        </Box>
        <Typography
          variant="h6"
          fontSize={18}
          fontWeight="bold"
          color="primary"
        >
          Inventory System
        </Typography>
      </Box>

      <List sx={{ px: 2, order: { xs: 2, sm: 1 } }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <React.Fragment key={index}>
              {item.section && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    mt: 2,
                    mb: 1,
                    display: "block",
                    color: "#999",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {item.section}
                </Typography>
              )}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  onClick={handleDrawerToggle} // Closes drawer on mobile when link is clicked
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor:
                        mode === "light"
                          ? "#fff5ed"
                          : "rgba(241, 145, 73, 0.15)",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor:
                          mode === "light"
                            ? "#ffede0"
                            : "rgba(241, 145, 73, 0.25)",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? "primary.main" : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>

      <Box
        sx={{
          mt: { xs: 0, sm: "auto" },
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: mode === "light" ? "1px solid #eee" : "1px solid #333",
          borderBottom: {
            xs: mode === "light" ? "1px solid #eee" : "1px solid #333",
            sm: "none",
          },
          order: { xs: 1, sm: 2 }, // Moves the toggle box above the list on mobile (XS)
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Dark mode
        </Typography>
        <Switch
          size="small"
          checked={mode === "dark"}
          onChange={toggleDarkMode}
          // Option 1: Use MUI's built-in green success color
          color="success"
          // Option 2: Custom green styling for more control
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "#4caf50", // The thumb color when checked
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.08)",
              },
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: "#4caf50", // The track color when checked
            },
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Temporary Drawer */}
      <Drawer
        variant="temporary"
        anchor="left" // Explicitly slide from left to right
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
          disableScrollLock: true, // FIX: Prevents layout shift/scrollbar flashing when drawer toggles
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: mode === "light" ? "1px solid #eee" : "1px solid #333",
            backgroundColor: mode === "light" ? "#fff" : "#121212",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: mode === "light" ? "1px solid #eee" : "1px solid #333",
            backgroundColor: mode === "light" ? "#fff" : "#121212",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
