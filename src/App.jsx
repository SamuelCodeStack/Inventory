import { useState, useMemo, useEffect } from "react";
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
} from "@mui/material";
import { CleaningServices } from "@mui/icons-material";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Inventory from "./components/Inventory.jsx";
import PurchaseOrder from "./components/PurchaseOrder.jsx";
import UserManagement from "./components/UserManagement.jsx";
import Auth from "./components/Auth.jsx";
import RawMaterials from "./components/RawMaterials.jsx";
import AllActivityLogs from "./components/AllActivityLogs.jsx";
import Dashboard from "./components/Dashboard.jsx"; // ADDED: Dashboard Import
import Backup from "./components/Backup.jsx";
import Profile from "./components/UserProfile.jsx"; // ADDED: Profile Import

function AppContent({ mode, toggleDarkMode, user, setUser, loading }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- ADDED: GLOBAL CLEANUP STATE ---
  const [prevLogCount, setPrevLogCount] = useState(null);
  const [cleanupNotify, setCleanupNotify] = useState({ open: false, count: 0 });

  // --- ADDED: BACKGROUND MONITOR FOR CRON CLEANUP ---
  useEffect(() => {
    // Only Superadmin (0) monitors cleanup based on your requirement
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

    // Check for cleanup every minute, synced with the cron cycle roughly
    const interval = setInterval(() => {
      const seconds = new Date().getSeconds();
      if (seconds === 0) {
        monitorCleanup();
      }
    }, 1000);

    // Initial check on mount
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

  // STRICT GUARD: If no user, only the login route exists in the entire app
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

  // If logged in, redirect away from login
  if (isAuthPage && user) {
    return <Navigate to="/" replace />;
  }

  // Helper for Role-Based Access Control
  // Superadmin = 0, Admin = 1 (Both have same access)
  const isAdmin =
    user.user_level === 0 ||
    user.user_level === "0" ||
    user.user_level === 1 ||
    user.user_level === "1";

  // Logic for Action Buttons visibility: Admin and Production can edit.
  // Superadmin = 0, Admin = 1, Office = 2, Production = 3, Viewer = 4
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
        <Header mode={mode} onMenuClick={handleDrawerToggle} user={user} />

        <Box sx={{ p: 0 }}>
          <Routes>
            {/* Root path: Redirect user level 3 and 4 to inventory, others to dashboard */}
            <Route
              path="/"
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
              path="/purchase-order"
              element={<PurchaseOrder mode={mode} user={user} />}
            />
            <Route
              path="/raw-materials"
              element={<RawMaterials mode={mode} userLevel={user.user_level} />}
            />

            {/* Protected Routes based on user_level */}
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

      {/* --- ADDED: GLOBAL CLEANUP DIALOG NOTIFICATION --- */}
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
    </Box>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("kimwin_theme_mode") || "light";
  });

  // Check Auth on Load
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
          // Sync user level to localStorage for child components if needed
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

  // ADDED: Sync logout across all open tabs
  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "kimwin_logout") {
        // Force a reload to clear all state and trigger auth check
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
        {/* The key prop here is MAGIC. When user changes to null, 
            the whole AppContent is destroyed and reset. */}
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
