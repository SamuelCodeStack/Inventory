import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme, Box, CssBaseline } from "@mui/material";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Inventory from "./components/Inventory.jsx";
import PurchaseOrder from "./components/PurchaseOrder.jsx";
import UserManagement from "./components/UserManagement.jsx";
import Auth from "./components/Auth.jsx";

// --- NEW IMPORTS (Ensure these files exist in your components folder) ---
// import JobOrder from "./components/JobOrder.jsx";
import RawMaterials from "./components/RawMaterials.jsx";

function AppContent({ mode, toggleDarkMode }) {
  const location = useLocation();

  // 1. State for Responsive Mobile Drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // 2. Auth Page Detection
  const isAuthPage = location.pathname === "/login";

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Auth mode={mode} />} />
      </Routes>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* 3. Responsive Sidebar */}
      <Sidebar
        toggleDarkMode={toggleDarkMode}
        mode={mode}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - 240px)` },
          transition: "margin 0.2s ease-in-out",
        }}
      >
        {/* 4. Responsive Header */}
        <Header mode={mode} onMenuClick={handleDrawerToggle} />

        {/* 5. App Routes */}
        <Box sx={{ p: 0 }}>
          <Routes>
            <Route path="/" element={<Inventory mode={mode} />} />

            <Route
              path="/purchase-order"
              element={<PurchaseOrder mode={mode} />}
            />

            {/* --- NEW ROUTES ADDED HERE --- */}
            {/* <Route path="/job-order" element={<JobOrder mode={mode} />} /> */}

            <Route
              path="/raw-materials"
              element={<RawMaterials mode={mode} />}
            />

            <Route
              path="/user-management"
              element={<UserManagement mode={mode} />}
            />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const [mode, setMode] = useState("light");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#f19149" }, // Kimwin Orange
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

  const toggleDarkMode = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));

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
