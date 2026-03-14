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
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Print,
  CheckCircleOutline,
  Recycling,
  Visibility,
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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const componentRef = useRef();
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
    contentRef: componentRef,
    documentTitle: `JobOrder_Report_${new Date().toLocaleDateString()}`,
  });

  const handleOpenView = (jo) => {
    setSelectedJO(jo);
    setViewOpen(true);
  };

  const handleOpenCompletion = async (jo) => {
    setSelectedJO(jo);
    setRemarks("");
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
    try {
      const response = await fetch(
        `http://localhost:3000/api/job-orders/${selectedJO.jo_id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            remarks: remarks,
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

  return (
    <Box
      sx={{ p: 4, mt: 8, bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Job Order Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track production and stock usage
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
            Active Production
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

        <Box ref={componentRef}>
          <Table size="small">
            <TableHead
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "action.hover",
              }}
            >
              <TableRow>
                <TableCell>JO ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell>Handled By</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right" className="no-print">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobOrders
                .filter((jo) =>
                  jo.item_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                )
                .map((row) => (
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
                      <Chip label={row.quantity_produced} size="small" />
                    </TableCell>
                    <TableCell>{row.handle_by}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        size="small"
                        color={getStatusColor(row.status)}
                      />
                    </TableCell>
                    <TableCell align="right" className="no-print">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        {/* VIEW ACTION */}
                        <Tooltip title="View Usage">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenView(row)}
                          >
                            <Visibility fontSize="inherit" />
                          </IconButton>
                        </Tooltip>

                        {row.status !== "Completed" && (
                          <Tooltip title="Finalize JO">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenCompletion(row)}
                            >
                              <CheckCircleOutline fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton size="small" color="error">
                          <Delete fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>

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
          <Recycling color="success" /> Finalize JO-{selectedJO?.jo_id}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ bgcolor: isDark ? "#1e1e1e" : "#f9f9f9" }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Record Leftovers/Scrap from BOM:
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

      {/* MODALS */}
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

      {/* Completion Dialog omitted for brevity but keeps your state logic... */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
