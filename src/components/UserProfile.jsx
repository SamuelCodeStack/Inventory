import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Save,
  Security,
  Edit,
} from "@mui/icons-material";

export default function UserProfile({ mode, userData, onSave }) {
  const theme = useTheme();
  const isDark = mode === "dark";

  // Match Dashboard layout colors
  const paperBg = isDark ? "#1b1b1b" : theme.palette.background.paper;
  const borderColor = isDark ? alpha("#fff", 0.1) : theme.palette.divider;

  // Track initial state to detect changes
  const [initialProfile, setInitialProfile] = useState({
    fullName: userData?.name || "",
    email: userData?.email || "",
  });

  const [profile, setProfile] = useState({
    fullName: userData?.name || "",
    email: userData?.email || "",
    role: userData?.role || "User",
  });

  // --- PASSWORD LOGIC STATE ---
  const [passwordFields, setPasswordFields] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state if userData prop updates from the parent
  useEffect(() => {
    const data = {
      fullName: userData?.name || "",
      email: userData?.email || "",
      role: userData?.role || "User",
    };
    setProfile(data);
    setInitialProfile({ fullName: data.fullName, email: data.email });
  }, [userData]);

  // Logic to determine if save button should be disabled
  const hasProfileChanges =
    profile.fullName !== initialProfile.fullName ||
    profile.email !== initialProfile.email;

  const hasPasswordChanges =
    showPasswordSection &&
    (passwordFields.newPassword !== "" ||
      passwordFields.confirmPassword !== "");

  const isSaveDisabled = !hasProfileChanges && !hasPasswordChanges;

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    setPasswordFields({ ...passwordFields, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      showPasswordSection &&
      passwordFields.newPassword !== passwordFields.confirmPassword
    ) {
      alert("New passwords do not match!");
      return;
    }
    setShowVerifyModal(true); // Open modal to verify with current password
  };

  const handleConfirmUpdate = async () => {
    setLoading(true);

    try {
      // Inside handleConfirmUpdate
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`, // ✅ Correct path
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Ensure this is present for sessions
          body: JSON.stringify({
            fullName: profile.fullName,
            email: profile.email,
            verifyPassword: verificationPassword,
            newPassword: showPasswordSection
              ? passwordFields.newPassword
              : null,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Profile updated successfully!");
        if (onSave) onSave(data.user);

        // Reset state after success
        setInitialProfile({ fullName: profile.fullName, email: profile.email });
        setVerificationPassword("");
        setShowVerifyModal(false);
        setShowPasswordSection(false);
        setPasswordFields({
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert(data.error || "Update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1400px" }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Account Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Update your personal information and security credentials.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: `1px solid ${borderColor}`,
            background: paperBg,
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: theme.palette.primary.main,
                fontSize: "2.5rem",
                fontWeight: "bold",
              }}
            >
              {profile.fullName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {profile.fullName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                User ID: #
                {userData?.id ? String(userData.id).split(":")[0] : "N/A"}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 5, borderColor: borderColor }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  required
                  value={profile.fullName}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  value={profile.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Assigned Role"
                  value={profile.role}
                  disabled
                  helperText="Contact Admin to change permissions"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Security color="disabled" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid
                item
                xs={12}
                md={6}
                sx={{ display: "flex", alignItems: "center" }}
              >
                {!showPasswordSection ? (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setShowPasswordSection(true)}
                    sx={{ height: "56px", px: 4, borderRadius: 2 }}
                  >
                    Change Security Password
                  </Button>
                ) : (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => setShowPasswordSection(false)}
                    sx={{ height: "56px", fontWeight: "bold" }}
                  >
                    Cancel Password Change
                  </Button>
                )}
              </Grid>

              {showPasswordSection && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 3,
                      border: `1px dashed ${borderColor}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 3,
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Password Update
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          required
                          value={passwordFields.newPassword}
                          onChange={handlePassChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock
                                  sx={{ color: theme.palette.primary.main }}
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          required
                          value={passwordFields.confirmPassword}
                          onChange={handlePassChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2, borderColor: borderColor }} />
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSaveDisabled || loading}
                    startIcon={<Save />}
                    sx={{
                      px: 6,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderRadius: 2,
                      bgcolor: theme.palette.primary.main,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.9),
                      },
                    }}
                  >
                    {loading ? "Updating..." : "Save Account Changes"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* --- VERIFICATION MODAL --- */}
      <Dialog
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Verify Identity</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3, color: "text.secondary" }}>
            To protect your account, please enter your <b>current password</b>{" "}
            to save these changes.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            variant="filled"
            value={verificationPassword}
            onChange={(e) => setVerificationPassword(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowVerifyModal(false)}
            sx={{ fontWeight: "bold" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmUpdate}
            disabled={!verificationPassword || loading}
            sx={{ fontWeight: "bold", px: 3 }}
          >
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
