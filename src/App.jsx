import { useState, useMemo, useEffect } from "react";
import { io } from "socket.io-client";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  Box,
  CssBaseline,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import {
  CleaningServices,
  GppMaybe,
  Menu as MenuIcon,
} from "@mui/icons-material";
import Sidebar from "./components/Sidebar.jsx";
import Inventory from "./components/Inventory.jsx";
import UserManagement from "./components/UserManagement.jsx";
import Auth from "./components/Auth.jsx";
import RawMaterials from "./components/RawMaterials.jsx";
import AllActivityLogs from "./components/AllActivityLogs.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Backup from "./components/Backup.jsx";
import Profile from "./components/UserProfile.jsx";
import Suppliers from "./components/Suppliers.jsx";

function AppContent({ mode, toggleDarkMode, user, setUser, loading }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [prevLogCount, setPrevLogCount] = useState(null);
  const [cleanupNotify, setCleanupNotify] = useState({ open: false, count: 0 });

  const [roleChangeNotice, setRoleChangeNotice] = useState({
    open: false,
    roleName: "",
    reason: "role",
  });

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      withCredentials: true,
    });

    socket.on("role_changed", ({ userId, roleName }) => {
      if (parseInt(userId) === parseInt(user.id)) {
        setRoleChangeNotice({ open: true, roleName, reason: "role" });
      }
    });

    socket.on("user_deleted", ({ userId }) => {
      if (parseInt(userId) === parseInt(user.id)) {
        setRoleChangeNotice({ open: true, roleName: "", reason: "deleted" });
      }
    });

    return () => socket.disconnect();
  }, [user]);

  const handleForcedLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Forced logout request failed", e);
    } finally {
      localStorage.setItem("kimwin_logout", Date.now().toString());
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    if (!user || user.user_level !== 0) return;

    const monitorCleanup = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/logs`, {
          credentials: "include",
        });
        const data = await res.json();

        if (prevLogCount !== null && data.length < prevLogCount) {
          setCleanupNotify({ open: true, count: prevLogCount - data.length });
        }
        setPrevLogCount(data.length);
      } catch (err) {
        console.error("Cleanup monitor failed", err);
      }
    };

    const interval = setInterval(() => {
      const seconds = new Date().getSeconds();
      if (seconds === 0) {
        monitorCleanup();
      }
    }, 1000);

    monitorCleanup();

    return () => clearInterval(interval);
  }, [user, prevLogCount]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const isAuthPage = location.pathname === "/login";

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Auth mode={mode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (isAuthPage && user) {
    return <Navigate to="/" replace />;
  }

  const isAdmin =
    user.user_level === 0 ||
    user.user_level === "0" ||
    user.user_level === "1" ||
    user.user_level === 1;

  const canEditInventory =
    isAdmin || user.user_level === 3 || user.user_level === "3";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Sidebar
        toggleDarkMode={toggleDarkMode}
        mode={mode}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        user={user}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - 240px)` },
          transition: "margin 0.2s ease-in-out",
        }}
      >
        {/* Minimal mobile-only menu button replaces the old Header bar */}
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            alignItems: "center",
            p: 1,
            borderBottom:
              mode === "light" ? "1px solid #eee" : "1px solid #333",
            bgcolor: "background.paper",
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 0 }}>
          <Routes>
            <Route
              path="/"
              element={
                [3, "3", 4, "4"].includes(user.user_level) ? (
                  <Navigate to="/inventory" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                [3, "3", 4, "4"].includes(user.user_level) ? (
                  <Navigate to="/inventory" replace />
                ) : (
                  <Dashboard mode={mode} user={user} />
                )
              }
            />
            <Route
              path="/inventory"
              element={
                <Inventory mode={mode} user={user} canEdit={canEditInventory} />
              }
            />

            <Route
              path="/raw-materials"
              element={<RawMaterials mode={mode} userLevel={user.user_level} />}
            />
            <Route
              path="/suppliers"
              element={<Suppliers mode={mode} user={user} />}
            />
            <Route
              path="/user-management"
              element={
                isAdmin ? (
                  <UserManagement mode={mode} user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/activity-logs"
              element={
                isAdmin ? (
                  <AllActivityLogs mode={mode} user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/backup"
              element={
                isAdmin ? (
                  <Backup mode={mode} user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/profile"
              element={<Profile mode={mode} userData={user} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>

      <Snackbar
        open={cleanupNotify.open}
        autoHideDuration={8000}
        onClose={() => setCleanupNotify({ ...cleanupNotify, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setCleanupNotify({ ...cleanupNotify, open: false })}
          severity="info"
          variant="filled"
          icon={<CleaningServices fontSize="inherit" />}
          sx={{ fontWeight: "bold", borderRadius: 2 }}
        >
          Last Minute Cleanup: {cleanupNotify.count} logs (older than 1 min)
          auto-deleted.
        </Alert>
      </Snackbar>

      <Dialog
        open={roleChangeNotice.open}
        disableEscapeKeyDown
        onClose={() => {}}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          <GppMaybe color="warning" />
          {roleChangeNotice.reason === "deleted"
            ? "Account Removed"
            : "Account Permissions Updated"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {roleChangeNotice.reason === "deleted"
              ? "Your account has been removed by an administrator. You will now be logged out."
              : `Your role has been changed to "${roleChangeNotice.roleName}" by an administrator. Please log in again for the changes to take effect.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleForcedLogout} autoFocus>
            OK, Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("kimwin_theme_mode") || "light";
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          { credentials: "include" },
        );
        const data = await response.json();
        if (data.loggedIn) {
          setUser(data.user);
          localStorage.setItem("userLevel", data.user.user_level);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "kimwin_logout") {
        window.location.reload();
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#f19149" },
          background: {
            default: mode === "light" ? "#f8f9fa" : "#121212",
            paper: mode === "light" ? "#ffffff" : "#1e1e1e",
          },
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          button: { textTransform: "none", fontWeight: 600 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 8 },
            },
          },
        },
      }),
    [mode],
  );

  const toggleDarkMode = () => {
    setMode((prev) => {
      const newMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("kimwin_theme_mode", newMode);
      return newMode;
    });
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent
          key={user ? user.id : "guest"}
          mode={mode}
          toggleDarkMode={toggleDarkMode}
          user={user}
          setUser={setUser}
          loading={loading}
        />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
