import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  alpha,
  LinearProgress,
  TextField,
  Divider,
} from "@mui/material";
import {
  FolderSpecial,
  CheckCircle,
  ErrorOutline,
  CloudUpload,
} from "@mui/icons-material";

export default function Backup({ mode }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [backupDir, setBackupDir] = useState(
    () =>
      localStorage.getItem("backup_directory") ||
      "C:/Users/Samuel/Desktop/Backup",
  );

  const handleDirChange = (e) => {
    const newPath = e.target.value;
    setBackupDir(newPath);
    localStorage.setItem("backup_directory", newPath);
  };

  // --- EXPORT ---
  const handleBackupExport = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/backup/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationPath: backupDir }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message:
            data.message || `Successfully exported backups to ${backupDir}`,
        });
      } else {
        throw new Error(data.message || "Backup export sequence failed.");
      }
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err.message || "Failed to connect to the backend backup service.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- IMPORT ---
  const handleBackupImport = async (event, targetTable) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus({ type: "", message: "" });

    const formData = new FormData();
    formData.append("backupFile", file);
    formData.append("targetTable", targetTable);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/backup/import`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message:
            data.message ||
            `Successfully imported dataset into ${targetTable}!`,
        });
      } else {
        throw new Error(
          data.message ||
            `Failed parsing the backup CSV file for ${targetTable}.`,
        );
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Network error processing backup restoration.",
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        pt: 12,
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          System Data Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Securely export snapshots or restore records back into the server
          infrastructure.
        </Typography>
      </Box>

      {/* Directory input */}
      <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 4 }}>
        <TextField
          fullWidth
          label="Server Export Directory Target"
          variant="outlined"
          value={backupDir}
          onChange={handleDirChange}
          helperText="Path evaluated directly on your hosting system environment"
          size="small"
        />
      </Box>

      {/* Loading bar */}
      {loading && (
        <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 3 }}>
          <LinearProgress sx={{ borderRadius: 5, height: 8 }} />
        </Box>
      )}

      {/* Status notice */}
      {status.message && (
        <Box
          sx={{
            p: 2,
            mb: 4,
            width: "100%",
            maxWidth: 600,
            mx: "auto",
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

      {/* Cards */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 4,
          justifyContent: "center",
          alignItems: "stretch",
          maxWidth: 900,
          width: "100%",
          mx: "auto",
        }}
      >
        {/* EXPORT CARD */}
        <Card
          sx={{
            flex: 1,
            width: "100%",
            borderRadius: 4,
            transition: "0.3s",
            display: "flex",
            flexDirection: "column",
            "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
          }}
        >
          <CardContent
            sx={{
              p: 4,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={2} alignItems="center" textAlign="center">
              <FolderSpecial sx={{ fontSize: 60, color: "#ff9100" }} />
              <Typography variant="h6" fontWeight={700}>
                Server Local CSV Export
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minHeight: 40 }}
              >
                Extract historical data points straight to: <br />
                <code style={{ fontSize: "11px", wordBreak: "break-all" }}>
                  {backupDir}
                </code>
              </Typography>
              <Box sx={{ width: "100%", pt: 1 }}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.disabled"
                  sx={{ mb: 1, textAlign: "left" }}
                >
                  • inventory ➔ Inventory.csv
                  <br />
                  &nbsp;&nbsp;Columns: item_id, item_name, category, brand,
                  supplier, unit, quantity, price, minimum_stock, created_at,
                  updated_at
                  <br />
                  <br />
                  • raw_materials ➔ raw_materials.csv
                  <br />
                  &nbsp;&nbsp;Columns: material_id, material_name, category,
                  unit, qty, minimum_stock, created_at, updated_at
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ pt: 3 }}>
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleBackupExport}
                sx={{
                  bgcolor: "#ff9100",
                  "&:hover": { bgcolor: "#ff6d00" },
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                Run Database Export
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* IMPORT CARD */}
        <Card
          sx={{
            flex: 1,
            width: "100%",
            borderRadius: 4,
            transition: "0.3s",
            display: "flex",
            flexDirection: "column",
            "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
          }}
        >
          <CardContent
            sx={{
              p: 4,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Stack
              spacing={2}
              alignItems="center"
              textAlign="center"
              sx={{ width: "100%" }}
            >
              <CloudUpload sx={{ fontSize: 60, color: "#2196f3" }} />
              <Typography variant="h6" fontWeight={700}>
                Import System Database
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a CSV file exported from this system to restore data into
                the target table. The file must match the exact column
                structure.
              </Typography>
              <Divider flexItem sx={{ my: 1 }} />
            </Stack>

            <Stack spacing={2} sx={{ pt: 2, width: "100%" }}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                disabled={loading}
                sx={{
                  bgcolor: "#2196f3",
                  "&:hover": { bgcolor: "#1976d2" },
                  py: 1.2,
                  fontWeight: 700,
                }}
              >
                Import to Inventory
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={(e) => handleBackupImport(e, "inventory")}
                />
              </Button>

              <Button
                variant="outlined"
                component="label"
                fullWidth
                disabled={loading}
                sx={{
                  color: "#2196f3",
                  borderColor: "#2196f3",
                  "&:hover": {
                    borderColor: "#1976d2",
                    bgcolor: alpha("#2196f3", 0.04),
                  },
                  py: 1.2,
                  fontWeight: 700,
                }}
              >
                Import to Raw Materials
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={(e) => handleBackupImport(e, "raw_materials")}
                />
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
