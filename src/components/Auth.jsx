import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  Link,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ArrowBack,
  DarkMode,
  LightMode,
} from "@mui/icons-material";

export default function Auth({ mode, toggleDarkMode }) {
  // Views: 'login' | 'register' | 'forgot'
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const isDark = mode === "dark";

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when typing
  };

  // --- SUBMIT HANDLERS ---
  // const handleAuthAction = async (e) => {
  //   e.preventDefault();
  //   setError("");

  //   // FIXED: Endpoint selection logic
  //   let endpoint = "";
  //   if (view === "login") endpoint = "/api/auth/login";
  //   else if (view === "register") endpoint = "/api/auth/register";
  //   else if (view === "forgot") endpoint = "/api/auth/forgot-password"; // Add your forgot pw endpoint

  //   try {
  //     const response = await fetch(`http://localhost:3000${endpoint}`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include", // FIXED: Required for session cookies to work
  //       body: JSON.stringify(formData),
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       if (view === "login") {
  //         // Redirect to main inventory page on successful login
  //         window.location.href = "/";
  //       } else if (view === "register") {
  //         // If register success, switch to login view
  //         setView("login");
  //         setFormData({ ...formData, password: "" });
  //         alert("Registration successful! Please sign in.");
  //       } else {
  //         // If forgot password success
  //         alert("Reset link sent to your email!");
  //         setView("login");
  //       }
  //     } else {
  //       setError(data.error || "An error occurred. Please try again.");
  //     }
  //   } catch (err) {
  //     setError("Network error: Could not connect to server.");
  //   }
  // };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError("");

    let endpoint = "";
    if (view === "login") endpoint = "/api/auth/login";
    else if (view === "register") endpoint = "/api/auth/register";
    else if (view === "forgot") endpoint = "/api/auth/forgot-password";

    try {
      // FIXED: Use VITE_API_URL instead of hardcoded localhost
      // We clean the URL to ensure it points to the correct base path
      const apiUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Critical for keeping you logged in
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (view === "login") {
          window.location.href = "/";
        } else {
          setView("login");
          setFormData({ ...formData, password: "" });
          alert("Action successful!");
        }
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Network error: Could not connect to server.");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: isDark ? "#121212" : "#f4f7f9",
        p: 2,
        position: "relative", // Required for absolute positioning of the toggle
      }}
    >
      {/* --- DARK MODE TOGGLE BUTTON --- */}
      <Box sx={{ position: "absolute", top: 20, right: 20 }}>
        <Tooltip
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <IconButton
            onClick={toggleDarkMode}
            sx={{
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              },
            }}
          >
            {isDark ? <LightMode sx={{ color: "#f19149" }} /> : <DarkMode />}
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 4,
          textAlign: "center",
          backgroundImage: "none",
        }}
      >
        {/* LOGO AREA */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            KIMWIN
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inventory Management System
          </Typography>
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {view === "login" && "Welcome Back"}
          {view === "register" && "Create Account"}
          {view === "forgot" && "Reset Password"}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {view === "login" && "Please enter your details to sign in"}
          {view === "register" && "Join us to start managing your inventory"}
          {view === "forgot" && "Enter your email to receive a reset link"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleAuthAction}>
          <Stack spacing={2.5}>
            {view === "register" && (
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                size="small"
                required
                value={formData.name}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              size="small"
              required
              value={formData.email}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {view !== "forgot" && (
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                size="small"
                required
                value={formData.password}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {view === "login" && (
              <Box sx={{ textAlign: "right", mt: -1 }}>
                <Link
                  component="button"
                  type="button"
                  variant="caption"
                  onClick={() => {
                    setView("forgot");
                    setError(""); // FIXED: Clear error when switching
                  }}
                  sx={{ textDecoration: "none", fontWeight: "bold" }}
                >
                  Forgot Password?
                </Link>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              sx={{ py: 1.2, fontWeight: "bold", textTransform: "none" }}
            >
              {view === "login" && "Sign In"}
              {view === "register" && "Sign Up"}
              {view === "forgot" && "Send Reset Link"}
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 4 }}>
          <Divider>
            <Typography variant="caption" color="text.disabled">
              OR
            </Typography>
          </Divider>

          <Box sx={{ mt: 2 }}>
            {view === "login" ? (
              <Typography variant="body2">
                Don't have an account?{" "}
                <Link
                  component="button"
                  onClick={() => {
                    setView("register");
                    setError(""); // FIXED: Clear error when switching
                  }}
                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                >
                  Register here
                </Link>
              </Typography>
            ) : (
              <Button
                startIcon={<ArrowBack />}
                onClick={() => {
                  setView("login");
                  setError(""); // FIXED: Clear error when switching
                }}
                size="small"
                sx={{ textTransform: "none" }}
              >
                Back to Login
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
