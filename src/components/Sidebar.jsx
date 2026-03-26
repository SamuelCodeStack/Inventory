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
  Assignment, // Icon for Job Order
  Layers, // Icon for Raw Materials
  ManageAccounts, // Icon for User Management
} from "@mui/icons-material";

export default function Sidebar({ toggleDarkMode, mode }) {
  const location = useLocation();

  const menuItems = [
    {
      text: "Inventory",
      icon: <Inventory />,
      section: "Main Menu", // Section Header
      path: "/",
    },
    {
      text: "Purchase Order",
      icon: <ShoppingCart />,
      path: "/purchase-order",
    },

    {
      text: "Raw Materials",
      icon: <Layers />,
      path: "/raw-materials",
    },
    {
      text: "User Management",
      icon: <ManageAccounts />,
      section: "Administration", // New Section Header
      path: "/user-management",
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          borderRight: mode === "light" ? "1px solid #eee" : "1px solid #333",
          backgroundColor: mode === "light" ? "#fff" : "#121212",
        },
      }}
    >
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

      <List sx={{ px: 2 }}>
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
          mt: "auto",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: mode === "light" ? "1px solid #eee" : "1px solid #333",
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
    </Drawer>
  );
}
