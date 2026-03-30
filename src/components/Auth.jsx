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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ArrowBack,
} from "@mui/icons-material";

export default function Auth({ mode }) {
  // Views: 'login' | 'register' | 'forgot'
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const isDark = mode === "dark";

  const togglePassword = () => setShowPassword(!showPassword);

  // --- SUBMIT HANDLERS ---
  const handleAuthAction = (e) => {
    e.preventDefault();
    console.log(`Performing ${view} action...`);
    // Add your API logic here (fetch to /api/auth/...)
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
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 4,
          textAlign: "center",
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

        <form onSubmit={handleAuthAction}>
          <Stack spacing={2.5}>
            {/* NAME FIELD (Register only) */}
            {view === "register" && (
              <TextField
                fullWidth
                label="Full Name"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {/* EMAIL FIELD */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              size="small"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {/* PASSWORD FIELD (Login/Register only) */}
            {view !== "forgot" && (
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                size="small"
                required
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

            {/* FORGOT PASSWORD LINK (Login only) */}
            {view === "login" && (
              <Box sx={{ textAlign: "right", mt: -1 }}>
                <Link
                  component="button"
                  type="button"
                  variant="caption"
                  onClick={() => setView("forgot")}
                  sx={{ textDecoration: "none", fontWeight: "bold" }}
                >
                  Forgot Password?
                </Link>
              </Box>
            )}

            {/* MAIN BUTTON */}
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

        {/* BOTTOM TOGGLES */}
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
                  onClick={() => setView("register")}
                  sx={{ fontWeight: "bold", cursor: "pointer" }}
                >
                  Register here
                </Link>
              </Typography>
            ) : (
              <Button
                startIcon={<ArrowBack />}
                onClick={() => setView("login")}
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
