import {
  AppBar,
  Toolbar,
  TextField,
  InputAdornment,
  Box,
  IconButton,
  Badge,
  Avatar,
  Typography,
} from "@mui/material";
import {
  Search,
  NotificationsNone,
  KeyboardArrowDown,
} from "@mui/icons-material";

// Accept 'mode' as a prop to handle dynamic styling if needed
export default function Header({ mode }) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        // Use theme tokens instead of hex codes
        backgroundColor: "background.paper",
        color: "text.primary",
        width: { sm: "calc(100% - 240px)" },
        ml: { sm: "240px" },
        // Adjust border color based on mode
        borderBottom: "1px solid",
        borderColor: mode === "light" ? "#eee" : "#333",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <TextField
          size="small"
          placeholder="Search anything here"
          variant="outlined"
          sx={{
            width: 400,
            "& fieldset": { border: "none" },
            // Search bar should be slightly different from the header background
            backgroundColor:
              mode === "light" ? "#f9f9f9" : "rgba(255, 255, 255, 0.05)",
            borderRadius: 2,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton>
            <Badge variant="dot" color="error">
              <NotificationsNone sx={{ color: "text.primary" }} />
            </Badge>
          </IconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
            }}
          >
            <Avatar
              src="https://i.pravatar.cc/150?u=samsad"
              sx={{ width: 32, height: 32 }}
            />
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" fontWeight="bold">
                Samsad
              </Typography>
            </Box>
            <KeyboardArrowDown
              fontSize="small"
              sx={{ color: "text.secondary" }}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
