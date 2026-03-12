import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, Box, CssBaseline } from "@mui/material";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Inventory from "./components/Inventory.jsx";
import PurchaseOrder from "./components/PurchaseOrder.jsx";
import RawMaterials from "./components/RawMaterials.jsx";

function App() {
  const [mode, setMode] = useState("dark"); // Default to dark based on your project style

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
        typography: { fontFamily: "'Inter', sans-serif" },
      }),
    [mode],
  );

  const toggleDarkMode = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            bgcolor: "background.default",
          }}
        >
          {/* Sidebar handles navigation and theme switching */}
          <Sidebar toggleDarkMode={toggleDarkMode} mode={mode} />

          <Box
            component="main"
            sx={{ flexGrow: 1, width: { sm: `calc(100% - 240px)` } }}
          >
            <Header />
            <Routes>
              {/* Dashboard / Inventory */}
              <Route path="/" element={<Inventory mode={mode} />} />

              {/* Purchase Orders */}
              <Route
                path="/purchase-order"
                element={<PurchaseOrder mode={mode} />}
              />

              {/* Raw Materials (Measurements: KG, ML, etc.) */}
              <Route
                path="/raw-materials"
                element={<RawMaterials mode={mode} />}
              />

              {/* Job Orders Placeholder */}
              <Route
                path="/job-order"
                element={
                  <Box sx={{ p: 4, color: mode === "dark" ? "#fff" : "#000" }}>
                    Job Order Content Coming Soon
                  </Box>
                }
              />
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
