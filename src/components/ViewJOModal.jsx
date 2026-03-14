import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import { Close, Inventory, Person, Engineering } from "@mui/icons-material";

export default function ViewJOModal({ open, handleClose, jo, mode }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && jo?.jo_id) {
      setLoading(true);
      fetch(`http://localhost:3000/api/job-orders/${jo.jo_id}/materials`)
        .then((res) => res.json())
        .then((data) => {
          setMaterials(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching materials:", err);
          setLoading(false);
        });
    }
  }, [open, jo]);

  if (!jo) return null;

  const isDark = mode === "dark";

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Engineering color="primary" /> Job Order Details: #{jo.jo_id}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: isDark ? "#121212" : "#fcfcfc" }}>
        {/* Header Info Section */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                PRODUCTION ITEM
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {jo.item_name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                QUANTITY PRODUCED
              </Typography>
              <Typography variant="h6">{jo.quantity_produced} units</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                HANDLED BY
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Person fontSize="small" color="action" />
                <Typography variant="body1">
                  {jo.handle_by || "Unassigned"}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                STATUS
              </Typography>
              <Box>
                <Chip
                  label={jo.status}
                  size="small"
                  color={jo.status === "Completed" ? "success" : "warning"}
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Inventory fontSize="small" /> Materials Consumed (BOM)
        </Typography>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead
              sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#fafafa" }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Source</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Material Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Qty Used
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    Loading materials...
                  </TableCell>
                </TableRow>
              ) : materials.length > 0 ? (
                materials.map((mat, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip
                        label={mat.source_type}
                        size="small"
                        variant="outlined"
                        color={
                          mat.source_type === "Leftover"
                            ? "secondary"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell fontWeight="medium">
                      {mat.material_name}
                    </TableCell>
                    <TableCell>{mat.category}</TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {mat.used_stock} {mat.unit}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No materials recorded for this Job Order.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Close
        </Button>
        {jo.status !== "Completed" && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              /* Future: Link to Edit */
            }}
          >
            Edit Order
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
