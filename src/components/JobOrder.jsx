import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Print,
  CheckCircleOutline,
  Recycling,
  Visibility,
  Inventory,
} from "@mui/icons-material";
import CreateJOModal from "./CreateJOModal";
import ViewJOModal from "./ViewJOModal";

const THEME_ORANGE = "#f2994a";

export default function JobOrder({ mode }) {
  const [jobOrders, setJobOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States
  const [completionOpen, setCompletionOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedJO, setSelectedJO] = useState(null);
  const [joMaterials, setJoMaterials] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [finalQty, setFinalQty] = useState(""); // New state for produced quantity

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const printRef = useRef();
  const isDark = mode === "dark";

  const showMessage = (msg, sev = "success") =>
    setSnackbar({ open: true, message: msg, severity: sev });

  const fetchJobOrders = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/job-orders");
      const data = await response.json();
      setJobOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage("Could not load Job Orders", "error");
    }
  };

  useEffect(() => {
    fetchJobOrders();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `JobOrder_Report_${new Date().toLocaleDateString()}`,
  });

  const handleOpenView = (jo) => {
    setSelectedJO(jo);
    setViewOpen(true);
  };

  const handleOpenCompletion = async (jo) => {
    setSelectedJO(jo);
    setRemarks("");
    setFinalQty(""); // Reset quantity input
    try {
      const res = await fetch(
        `http://localhost:3000/api/job-orders/${jo.jo_id}/materials`,
      );
      const data = await res.json();
      setJoMaterials(data.map((m) => ({ ...m, leftover_qty: 0 })));
      setCompletionOpen(true);
    } catch (error) {
      showMessage("Failed to load materials", "error");
    }
  };

  const submitCompletion = async () => {
    if (!finalQty || parseFloat(finalQty) <= 0) {
      return showMessage("Please enter a valid produced quantity", "error");
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/job-orders/${selectedJO.jo_id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            remarks: remarks,
            produced_qty: parseFloat(finalQty), // Send final quantity to backend
            leftovers: joMaterials.filter((m) => m.leftover_qty > 0),
          }),
        },
      );

      if (response.ok) {
        showMessage("Job Order Completed!");
        setCompletionOpen(false);
        fetchJobOrders();
      } else {
        const err = await response.json();
        showMessage(err.error, "error");
      }
    } catch (error) {
      showMessage("Connection error", "error");
    }
  };

  const getStatusColor = (status) => {
    if (status === "Completed") return "success";
    if (status === "In Progress") return "warning";
    return "default";
  };

  const filteredJO = jobOrders.filter((jo) =>
    jo.item_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* HEADER SECTION */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Job Order
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard / Job Order
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => handlePrint()}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsModalOpen(true)}
            sx={{
              bgcolor: THEME_ORANGE,
              color: "#000",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#d8853a" },
            }}
          >
            Create JO
          </Button>
        </Stack>
      </Box>

      {/* MAIN TABLE */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: 2, backgroundImage: "none" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Job Order List
          </Typography>
          <TextField
            size="small"
            placeholder="Search item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

        <Table>
          <TableHead
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover" }}
          >
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>JO ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Produced Qty
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJO.map((row) => (
              <TableRow key={row.jo_id} hover>
                <TableCell sx={{ color: THEME_ORANGE, fontWeight: "bold" }}>
                  JO-{row.jo_id}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {row.item_name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={
                      row.status === "Completed"
                        ? row.quantity_produced
                        : "-- / --"
                    }
                    size="small"
                    variant={row.status === "Completed" ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.status}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Usage">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenView(row)}
                        sx={{
                          color: "#2ecc71",
                          bgcolor: "rgba(46, 204, 113, 0.1)",
                        }}
                      >
                        <Visibility fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    {row.status !== "Completed" && (
                      <Tooltip title="Finalize JO">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenCompletion(row)}
                          sx={{
                            color: "#f2994a",
                            bgcolor: "rgba(242, 153, 74, 0.1)",
                          }}
                        >
                          <CheckCircleOutline fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        color: "#e74c3c",
                        bgcolor: "rgba(231, 76, 60, 0.1)",
                      }}
                    >
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- HIDDEN PRINT TEMPLATE --- */}
      <Box sx={{ display: "none" }}>
        <Box
          ref={printRef}
          sx={{
            p: "15mm",
            bgcolor: "white",
            color: "black",
            width: "210mm",
            "& *": { color: "black !important" },
          }}
        >
          <style>{`
            @media print {
              @page { size: A4; margin: 10mm; }
              body { background-color: white !important; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
              th { background-color: #f5f5f5 !important; font-weight: bold; }
            }
          `}</style>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: "#1a237e !important" }}
          >
            KIMWIN CORPORATION
          </Typography>
          <Typography variant="h6">Job Order Production Report</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Generated: {new Date().toLocaleString()}
          </Typography>
          <Divider sx={{ mb: 3, borderColor: "black !important" }} />
          <table>
            <thead>
              <tr>
                <th>JO ID</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredJO.map((row) => (
                <tr key={row.jo_id}>
                  <td>JO-{row.jo_id}</td>
                  <td>{row.item_name}</td>
                  <td>
                    {row.status === "Completed" ? row.quantity_produced : "--"}
                  </td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Box
            sx={{ mt: 10, display: "flex", justifyContent: "space-between" }}
          >
            <Typography variant="caption">
              Prepared by: ____________________
            </Typography>
            <Typography variant="caption">
              Verified by: ____________________
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* FINALIZE JO MODAL */}
      <Dialog
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircleOutline color="success" /> Finalize JO-{selectedJO?.jo_id}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ bgcolor: isDark ? "#1e1e1e" : "#f9f9f9" }}
        >
          {/* Item Info Section */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Inventory sx={{ color: THEME_ORANGE }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Item to Produce:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedJO?.item_name}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            1. Total Quantity Produced:
          </Typography>
          <TextField
            fullWidth
            type="number"
            size="small"
            placeholder="Enter total items made..."
            value={finalQty}
            onChange={(e) => setFinalQty(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            2. Record Leftovers/Scrap from BOM:
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Leftover Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {joMaterials.map((mat, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {mat.material_name} ({mat.unit})
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0"
                        onChange={(e) => {
                          const updated = [...joMaterials];
                          updated[idx].leftover_qty =
                            parseFloat(e.target.value) || 0;
                          setJoMaterials(updated);
                        }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            3. Final Remarks:
          </Typography>
          <TextField
            fullWidth
            label="Production Remarks"
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompletionOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={submitCompletion}
          >
            Confirm & Complete
          </Button>
        </DialogActions>
      </Dialog>

      <ViewJOModal
        open={viewOpen}
        handleClose={() => setViewOpen(false)}
        jo={selectedJO}
        mode={mode}
      />
      <CreateJOModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        mode={mode}
        onSaveSuccess={fetchJobOrders}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
