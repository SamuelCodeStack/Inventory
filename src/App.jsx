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

function AppContent({ mode, toggleDarkMode }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const response = await fetch("http://localhost:3000/api/auth/me", {
  //         credentials: "include",
  //       });
  //       const data = await response.json();
  //       if (data.loggedIn) {
  //         setUser(data.user);
  //       } else {
  //         setUser(null);
  //       }
  //     } catch (err) {
  //       console.error("Auth check failed", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   checkAuth();
  // }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // FIXED: Changed "http://localhost:3000" to use your VITE_API_URL variable
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            credentials: "include",
          },
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

  if (isAuthPage) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <Auth mode={mode} toggleDarkMode={toggleDarkMode} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

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
            {/* ADDED: Dashboard as Home */}
            <Route path="/" element={<Dashboard mode={mode} />} />

            {/* UPDATED: Inventory moved to /inventory */}
            <Route path="/inventory" element={<Inventory mode={mode} />} />

            <Route
              path="/purchase-order"
              element={<PurchaseOrder mode={mode} />}
            />
            <Route
              path="/raw-materials"
              element={<RawMaterials mode={mode} />}
            />
            <Route
              path="/user-management"
              element={<UserManagement mode={mode} />}
            />

            <Route
              path="/activity-logs"
              element={<AllActivityLogs mode={mode} />}
            />
            {/* UPDATED: Redirect to Dashboard instead of Inventory */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  // 1. Initialize state from localStorage so it remembers the mode on refresh/logout
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("kimwin_theme_mode") || "light";
  });

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

  // 2. Wrap toggle function to save the choice to localStorage
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
        <AppContent mode={mode} toggleDarkMode={toggleDarkMode} />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
