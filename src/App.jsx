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
} from "@mui/material";
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
  const isAdmin = user.user_level === "admin" || user.role === "admin";

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
            <Route path="/" element={<Dashboard mode={mode} user={user} />} />
            <Route
              path="/inventory"
              element={<Inventory mode={mode} user={user} />}
            />
            <Route
              path="/purchase-order"
              element={<PurchaseOrder mode={mode} user={user} />}
            />
            <Route
              path="/raw-materials"
              element={<RawMaterials mode={mode} user={user} />}
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
