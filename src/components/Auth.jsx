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
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isDark = mode === "dark";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  useEffect(() => {
    const syncAuth = (event) => {
      if (event.key === "kimwin_login") window.location.href = "/";
      if (event.key === "kimwin_logout") window.location.href = "/login";
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    let endpoint = "";
    if (view === "login") endpoint = "/api/auth/login";
    else if (view === "register") endpoint = "/api/auth/register";
    else if (view === "forgot") endpoint = "/api/auth/forgot-password";
    else if (view === "verify-otp") endpoint = "/api/auth/reset-password";

    try {
      const apiUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, "");
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          newPassword: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (view === "login") {
          localStorage.setItem("kimwin_login", Date.now().toString());
          window.location.href = "/";
        } else if (view === "forgot") {
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
      setIsLoading(false);
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
        position: "relative",
      }}
    >
      {/* Dark mode toggle */}
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
        {/* Logo */}
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
              disabled={view === "verify-otp" || isLoading}
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

            {/* ── Password field — single eye icon, no browser default ── */}
            {view !== "forgot" && (
              <TextField
                fullWidth
                label={view === "verify-otp" ? "New Password" : "Password"}
                name="password"
                // Always use "text" type and control visibility manually
                // This prevents the browser from rendering its own eye icon
                type={showPassword ? "text" : "password"}
                size="small"
                required
                disabled={isLoading}
                value={formData.password}
                onChange={handleInputChange}
                // Suppress browser's native password reveal button
                inputProps={{
                  style: { WebkitTextSecurity: undefined },
                }}
                sx={{
                  // Hide MS Edge / IE built-in password reveal button
                  "& input::-ms-reveal": { display: "none" },
                  "& input::-ms-clear": { display: "none" },
                  // Hide Chrome's built-in password reveal button
                  "& input::-webkit-credentials-auto-fill-button": {
                    visibility: "hidden",
                    display: "none !important",
                    pointerEvents: "none",
                    height: 0,
                    width: 0,
                    margin: 0,
                  },
                }}
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
                        tabIndex={-1}
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
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
