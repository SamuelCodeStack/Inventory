import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Inventory,
  Dashboard,
  Layers,
  ManageAccounts,
  Storage,
  ChevronLeft,
  LocalShipping,
  NotificationsNone,
  KeyboardArrowDown,
  History,
  Logout,
  Person,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import UserActivityModal from "./UserActivityModal";

export default function Sidebar({
  toggleDarkMode,
  mode,
  mobileOpen,
  handleDrawerToggle,
  user,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const drawerWidth = isCollapsed ? 70 : 240;

  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadLogs, setUnreadLogs] = useState(0);
  const [openPersonalLogs, setOpenPersonalLogs] = useState(false);
  const profileMenuOpen = Boolean(anchorEl);

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.setItem("kimwin_logout", Date.now());
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.setItem("kimwin_logout", Date.now());
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const cleanId = String(user?.id).split(":")[0];
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/logs/user/${cleanId}`,
          { credentials: "include" },
        );
        const data = await response.json();

        const lastRead = localStorage.getItem(`lastReadLogs_${cleanId}`);

        if (lastRead) {
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
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const roleLabels = {
    0: "Superadmin",
    1: "Admin",
    2: "Office",
    3: "Production",
    4: "Viewer",
  };

  const hasDashboardAccess =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1" ||
    user?.user_level === 2 ||
    user?.user_level === "2";

  const isAdmin =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1";

  const superAdmin = user?.user_level === 0 || user?.user_level === "0";

  const menuItems = [
    ...(hasDashboardAccess
      ? [{ text: "Dashboard", icon: <Dashboard />, path: "/Dashboard" }]
      : []),
    { text: "Finished Goods", icon: <Inventory />, path: "/inventory" },
    { text: "Raw Materials", icon: <Layers />, path: "/raw-materials" },
    ...(hasDashboardAccess
      ? [{ text: "Suppliers", icon: <LocalShipping />, path: "/suppliers" }]
      : []),
    ...(isAdmin
      ? [
          {
            text: "User Management",
            icon: <ManageAccounts />,
            section: "Administration",
            path: "/user-management",
          },
        ]
      : []),
    ...(superAdmin
      ? [{ text: "Backup", icon: <Storage />, path: "/backup" }]
      : []),
  ];

  const borderColor = mode === "light" ? "#eee" : "#2a2a2a";

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* ── Logo / Brand header ── */}
      <Box
        sx={{
          px: isCollapsed ? 1.5 : 2,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: 1,
          minHeight: 64,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              bgcolor: "primary.main",
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(241,145,73,0.35)",
            }}
          >
            <Inventory fontSize="small" />
          </Box>
          {!isCollapsed && (
            <Typography
              variant="h6"
              fontSize={16}
              fontWeight={700}
              color="primary"
              sx={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                letterSpacing: 0.2,
              }}
            >
              Inventory
            </Typography>
          )}
        </Box>

        {/* Notification bell — only shown when expanded */}
        {!isCollapsed && isAdmin && (
          <IconButton
            size="small"
            onClick={() => {
              const cleanId = String(user?.id).split(":")[0];
              localStorage.setItem(
                `lastReadLogs_${cleanId}`,
                new Date().toISOString(),
              );
              setUnreadLogs(0);
              navigate("/activity-logs");
            }}
          >
            <Badge badgeContent={unreadLogs} color="error" max={99}>
              <NotificationsNone
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
            </Badge>
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor }} />

      {/* ── Nav list ── */}
      <List
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: isCollapsed ? 1 : 1.5,
          py: 1.5,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: mode === "light" ? "#ddd" : "#444",
            borderRadius: 4,
          },
        }}
      >
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          return (
            <React.Fragment key={index}>
              {item.section && !isCollapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    mt: 2.5,
                    mb: 1,
                    display: "block",
                    color: "#999",
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    fontSize: 11,
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
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: 2,
                    justifyContent: isCollapsed ? "center" : "initial",
                    px: 1.5,
                    py: 1,
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
                      minWidth: isCollapsed ? 0 : 36,
                      justifyContent: "center",
                      color: isActive ? "primary.main" : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>

      <Divider sx={{ borderColor }} />

      {/* ── Footer: profile + dark mode toggle ── */}
      <Box sx={{ flexShrink: 0 }}>
        <Box sx={{ px: isCollapsed ? 1 : 1.5, py: 1.25 }}>
          <Box
            onClick={handleProfileClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              cursor: "pointer",
              p: 1,
              borderRadius: 2,
              justifyContent: isCollapsed ? "center" : "flex-start",
              transition: "background-color 0.15s ease",
              "&:hover": {
                backgroundColor:
                  mode === "light" ? "#f5f5f5" : "rgba(255,255,255,0.06)",
              },
            }}
          >
            <Avatar
              src={user?.avatar_url || ""}
              sx={{
                width: 34,
                height: 34,
                bgcolor: "#f19149",
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </Avatar>

            {!isCollapsed && (
              <>
                <Box sx={{ overflow: "hidden", flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {user?.name || "User"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    noWrap
                    sx={{ lineHeight: 1.4, textTransform: "capitalize" }}
                  >
                    ID: #{user?.id ? String(user.id).split(":")[0] : "N/A"} •{" "}
                    {roleLabels[user?.user_level] || user?.role || "No Role"}
                  </Typography>
                </Box>
                <KeyboardArrowDown
                  fontSize="small"
                  sx={{
                    color: "text.secondary",
                    transform: profileMenuOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "0.2s",
                    flexShrink: 0,
                  }}
                />
              </>
            )}
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={profileMenuOpen}
            onClose={handleProfileClose}
            disableScrollLock={true}
            transformOrigin={{ horizontal: "left", vertical: "bottom" }}
            anchorOrigin={{ horizontal: "left", vertical: "top" }}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 190,
                mb: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor,
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleProfileClose();
                navigate("/profile");
              }}
              sx={{ py: 1, fontSize: 14 }}
            >
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleProfileClose();
                setOpenPersonalLogs(true);
              }}
              sx={{ py: 1, fontSize: 14 }}
            >
              <ListItemIcon>
                <History fontSize="small" />
              </ListItemIcon>
              Activity
            </MenuItem>

            <Divider />

            <MenuItem
              onClick={handleLogout}
              sx={{ color: "error.main", py: 1, fontSize: 14 }}
            >
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Dark mode toggle */}
        <Box
          sx={{
            px: isCollapsed ? 1 : 1.5,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            gap: 1,
          }}
        >
          {!isCollapsed && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {mode === "dark" ? (
                <DarkMode fontSize="small" sx={{ color: "text.secondary" }} />
              ) : (
                <LightMode fontSize="small" sx={{ color: "text.secondary" }} />
              )}
              <Typography variant="body2" color="text.secondary">
                Dark mode
              </Typography>
            </Box>
          )}
          <Switch
            size="small"
            checked={mode === "dark"}
            onChange={toggleDarkMode}
            color="success"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#4caf50",
                "&:hover": { backgroundColor: "rgba(76, 175, 80, 0.08)" },
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#4caf50",
              },
            }}
          />
        </Box>
      </Box>

      <UserActivityModal
        open={openPersonalLogs}
        handleClose={() => setOpenPersonalLogs(false)}
        user={user}
      />
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: drawerWidth },
        flexShrink: { sm: 0 },
        transition: (theme) =>
          theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      }}
    >
      {/* Mobile Temporary Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true, disableScrollLock: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
            borderRight: `1px solid ${borderColor}`,
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
            borderRight: `1px solid ${borderColor}`,
            backgroundColor: mode === "light" ? "#fff" : "#121212",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: "hidden",
            overflowY: "visible",
          },
        }}
        open
      >
        {drawerContent}

        {/* ── Half-circle arrow tab on the right edge ── */}
        <Box
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{
            position: "fixed",
            left: drawerWidth - 1,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1300,
            width: 20,
            height: 48,
            cursor: "pointer",
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "0 24px 24px 0",
            bgcolor: mode === "light" ? "#fff" : "#1e1e1e",
            border: `1px solid ${borderColor}`,
            borderLeft: "none",
            boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
            transition: (theme) =>
              theme.transitions.create("left", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            "&:hover": {
              bgcolor: mode === "light" ? "#fff5ed" : "#2a2a2a",
              "& .arrow-icon": { color: "#f19149" },
            },
          }}
        >
          <ChevronLeft
            className="arrow-icon"
            sx={{
              fontSize: 16,
              color: "text.secondary",
              transition: "transform 0.3s ease, color 0.2s ease",
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </Box>
      </Drawer>
    </Box>
  );
}
