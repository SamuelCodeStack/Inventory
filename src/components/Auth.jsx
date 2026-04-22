import React, { useState, useEffect } from "react";
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
  CircularProgress,
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
  VpnKey,
} from "@mui/icons-material";

export default function Auth({ mode, toggleDarkMode }) {
  // Views: 'login' | 'register' | 'forgot' | 'verify-otp'
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New Loading State
  const isDark = mode === "dark";

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "", // Added for OTP verification
  });

  // FIXED: Immediate cross-tab synchronization for Login and Logout
  useEffect(() => {
    const syncAuth = (event) => {
      // If any tab logs in, all other tabs on the login page must redirect to home
      if (event.key === "kimwin_login") {
        window.location.href = "/";
      }
      // If any tab logs out, all other tabs must return to login
      if (event.key === "kimwin_logout") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when typing
  };

  // --- SUBMIT HANDLERS ---
  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Start animation

    let endpoint = "";
    if (view === "login") endpoint = "/api/auth/login";
    else if (view === "register") endpoint = "/api/auth/register";
    else if (view === "forgot") endpoint = "/api/auth/forgot-password";
    else if (view === "verify-otp") endpoint = "/api/auth/reset-password"; // Use reset endpoint when submitting OTP + New Password

    try {
      // FIXED: Use VITE_API_URL instead of hardcoded localhost
      // We clean the URL to ensure it points to the correct base path
      const apiUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Critical for keeping you logged in
        body: JSON.stringify({
          ...formData,
          newPassword: formData.password, // Mapping for reset-password endpoint
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (view === "login") {
          // CRITICAL: Set the login signal BEFORE redirecting the current tab
          // This ensures other tabs receive the "storage" event immediately
          localStorage.setItem("kimwin_login", Date.now().toString());
          window.location.href = "/";
        } else if (view === "forgot") {
          // After requesting reset, move to OTP entry
          setView("verify-otp");
          alert("OTP sent! Please check your email.");
        } else {
          setView("login");
          setFormData({ name: "", email: "", password: "", otp: "" });
          alert(data.message || "Action successful!");
        }
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Network error: Could not connect to server.");
    } finally {
      setIsLoading(false); // Stop animation regardless of outcome
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
          {view === "verify-otp" && "Verify OTP"}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {view === "login" && "Please enter your details to sign in"}
          {view === "register" && "Join us to start managing your inventory"}
          {view === "forgot" && "Enter your email to receive a reset link"}
          {view === "verify-otp" && "Enter the 6-digit code sent to your email"}
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
                disabled={isLoading}
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
              disabled={view === "verify-otp" || isLoading} // Prevent email change during OTP entry
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

            {view === "verify-otp" && (
              <TextField
                fullWidth
                label="Enter OTP"
                name="otp"
                size="small"
                required
                disabled={isLoading}
                value={formData.otp}
                onChange={handleInputChange}
                inputProps={{
                  maxLength: 6,
                  style: {
                    letterSpacing: "4px",
                    textAlign: "center",
                    fontWeight: "bold",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {view !== "forgot" && (
              <TextField
                fullWidth
                label={view === "verify-otp" ? "New Password" : "Password"}
                name="password"
                type={showPassword ? "text" : "password"}
                size="small"
                required
                disabled={isLoading}
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
                      <IconButton
                        onClick={togglePassword}
                        edge="end"
                        disabled={isLoading}
                      >
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
                  disabled={isLoading}
                  onClick={() => {
                    setView("forgot");
                    setError("");
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
              disabled={isLoading}
              sx={{
                py: 1.2,
                fontWeight: "bold",
                textTransform: "none",
                minHeight: "48px",
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  {view === "login" && "Sign In"}
                  {view === "register" && "Sign Up"}
                  {view === "forgot" && "Send Reset Link"}
                  {view === "verify-otp" && "Reset Password"}
                </>
              )}
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
                  disabled={isLoading}
                  onClick={() => {
                    setView("register");
                    setError("");
                  }}
                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                >
                  Register here
                </Link>
              </Typography>
            ) : (
              <Button
                startIcon={<ArrowBack />}
                disabled={isLoading}
                onClick={() => {
                  setView("login");
                  setError("");
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
