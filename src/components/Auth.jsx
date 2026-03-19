import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Inventory,
} from "@mui/icons-material";

const THEME_ORANGE = "#f2994a";

export default function Auth({ mode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const isDark = mode === "dark";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", isLogin ? "Login" : "Sign Up", formData);
    // Add your Auth API call logic here
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: isDark ? "#121212" : "#f4f7fe",
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 400,
          p: 4,
          borderRadius: 4,
          bgcolor: isDark ? "#1e1e1e" : "#fff",
          backgroundImage: "none",
        }}
      >
        {/* LOGO AREA */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              bgcolor: THEME_ORANGE,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              mb: 1.5,
              boxShadow: "0 4px 12px rgba(242, 153, 74, 0.3)",
            }}
          >
            <Inventory fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: 1 }}>
            KIMWIN
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 2 }}
          >
            Inventory Management
          </Typography>
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {isLogin ? "Welcome Back!" : "Create Account"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isLogin
            ? "Please enter your details to sign in."
            : "Fill in the details to get started."}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {!isLogin && (
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                variant="outlined"
                size="small"
                required
                value={formData.name}
                onChange={handleChange}
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
              variant="outlined"
              size="small"
              required
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              variant="outlined"
              size="small"
              required
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="inherit" />
                      ) : (
                        <Visibility fontSize="inherit" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {isLogin && (
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Link
                  href="#"
                  variant="caption"
                  sx={{
                    color: THEME_ORANGE,
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{
                py: 1.2,
                bgcolor: THEME_ORANGE,
                color: "#000",
                fontWeight: "bold",
                fontSize: "0.9rem",
                borderRadius: 2,
                "&:hover": { bgcolor: "#d8853a" },
                boxShadow: "0 4px 14px rgba(242, 153, 74, 0.4)",
              }}
            >
              {isLogin ? "Sign In" : "Register"}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.disabled">
            OR
          </Typography>
        </Divider>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              component="button"
              variant="body2"
              onClick={() => setIsLogin(!isLogin)}
              sx={{
                color: THEME_ORANGE,
                fontWeight: "bold",
                textDecoration: "none",
                cursor: "pointer",
                border: "none",
                bgcolor: "transparent",
              }}
            >
              {isLogin ? "Create account" : "Sign in here"}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
