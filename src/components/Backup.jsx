import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  Storage,
  TableChart,
  CloudUpload,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";

export default function Backup({ mode }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleBackup = async (type) => {
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      // Replace with your actual VITE_API_URL
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/backup/${type}`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        setStatus({
          type: "success",
          message: `Successfully backed up to ${type}!`,
        });
      } else {
        throw new Error("Backup failed");
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Failed to connect to backup service.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        pt: 12, // Increases padding at the top to clear the Header
        maxWidth: 1000,
        margin: "0 auto",
        minHeight: "100vh",
        // ADDED: Centering Logic
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ mb: 4, textAlign: "center" }}>
        {" "}
        {/* ADDED: Center Text */}
        <Typography variant="h4" fontWeight={800} gutterBottom>
          System Backup
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Export your PostgreSQL database records to ensure data safety.
        </Typography>
      </Box>

      {/* ADDED: Progress bar when loading */}
      {loading && (
        <Box sx={{ width: "100%", mb: 3, maxWidth: 600 }}>
          <LinearProgress sx={{ borderRadius: 5, height: 8 }} />
        </Box>
      )}

      {status.message && (
        <Box
          sx={{
            p: 2,
            mb: 3,
            width: "100%",
            maxWidth: 600,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor:
              status.type === "success"
                ? alpha("#4caf50", 0.1)
                : alpha("#f44336", 0.1),
            color: status.type === "success" ? "#4caf50" : "#f44336",
            border: `1px solid ${status.type === "success" ? "#4caf50" : "#f44336"}`,
          }}
        >
          {status.type === "success" ? <CheckCircle /> : <ErrorOutline />}
          <Typography variant="body2" fontWeight={600}>
            {status.message}
          </Typography>
        </Box>
      )}

      <Grid
        container
        spacing={3}
        justifyContent="center" // ADDED: Centers cards in the grid
      >
        {/* Local Excel Option */}
        <Grid item xs={12} sm={10} md={6}>
          {" "}
          {/* UPDATED: responsive widths */}
          <Card
            sx={{
              height: "100%",
              borderRadius: 4,
              transition: "0.3s",
              "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <TableChart sx={{ fontSize: 60, color: "#66bb6a" }} />
                <Typography variant="h6" fontWeight={700}>
                  Excel Export
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Convert PostgreSQL tables into .xlsx format. Best for manual
                  reporting and local storage.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  onClick={() => handleBackup("excel")}
                  sx={{
                    bgcolor: "#66bb6a",
                    "&:hover": { bgcolor: "#43a047" },
                    py: 1.5,
                    fontWeight: 700,
                  }}
                >
                  Download Excel
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Cloud Sync Option */}
        <Grid item xs={12} sm={10} md={6}>
          {" "}
          {/* UPDATED: responsive widths */}
          <Card
            sx={{
              height: "100%",
              borderRadius: 4,
              transition: "0.3s",
              "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <CloudUpload sx={{ fontSize: 60, color: "#29b6f6" }} />
                <Typography variant="h6" fontWeight={700}>
                  Cloud Sync
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload a compressed SQL dump directly to remote storage. Best
                  for disaster recovery.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  onClick={() => handleBackup("cloud")}
                  sx={{
                    bgcolor: "#29b6f6",
                    "&:hover": { bgcolor: "#039be5" },
                    py: 1.5,
                    fontWeight: 700,
                  }}
                >
                  Sync to Cloud
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
