import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, Box, CssBaseline } from "@mui/material";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import Inventory from "./components/Inventory.jsx";
import PurchaseOrder from "./components/PurchaseOrder.jsx";

function App() {
  const [mode, setMode] = useState("light");

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
          <Sidebar toggleDarkMode={toggleDarkMode} mode={mode} />

          <Box
            component="main"
            sx={{ flexGrow: 1, width: { sm: `calc(100% - 240px)` } }}
          >
            <Header />
            {/* ROUTES DEFINITION */}
            <Routes>
              <Route path="/" element={<Inventory />} />
              <Route
                path="/purchase-order"
                element={<PurchaseOrder mode={mode} />}
              />
              {/* Add other routes here as you build them */}
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
