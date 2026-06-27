import React, { useState, useEffect } from "react";
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
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  TablePagination,
  Grid,
  Checkbox,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterListOff,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CheckCircleOutline,
  CheckBoxOutlineBlank,
  Print,
} from "@mui/icons-material";
import AddSupplierModal from "./AddSupplierModal";
import EditSupplierModal from "./EditSupplierModal";
import PrintSuppliersModal from "./PrintSuppliersModal";

export default function Suppliers({ mode, user }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionEnabled, setIsSelectionEnabled] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const canModify =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1" ||
    user?.user_level === 2 ||
    user?.user_level === "2" ||
    user?.user_level === 3 ||
    user?.user_level === "3" ||
    user?.user_level === 6 ||
    user?.user_level === "6";

  const canViewActionColumn =
    user?.user_level === 0 ||
    user?.user_level === "0" ||
    user?.user_level === 1 ||
    user?.user_level === "1" ||
    user?.user_level === 2 ||
    user?.user_level === "2" ||
    user?.user_level === 3 ||
    user?.user_level === "3" ||
    user?.user_level === 6 ||
    user?.user_level === "6";

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isDark = mode === "dark";

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers`);
      const data = await response.json();
      setSuppliers(data);
      setSelectedIds([]);
    } catch (error) {
      showSnackbar("Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.supplier_id).includes(searchQuery) ||
      s.contact_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paginatedSuppliers = filteredSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} supplier(s)?`,
      )
    )
      return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/suppliers/${id}`,
          { method: "DELETE", credentials: "include" },
        );
        if (res.ok) successCount++;
      }
      if (successCount > 0) {
        showSnackbar(
          `${successCount} supplier(s) deleted successfully`,
          "info",
        );
        fetchSuppliers();
      }
    } catch (error) {
      showSnackbar("Error during bulk delete", "error");
    }
  };

  const isAllSelectedOnPage =
    paginatedSuppliers.length > 0 &&
    paginatedSuppliers.every((s) => selectedIds.includes(s.supplier_id));

  const handleSelectAllRows = (event) => {
    if (event.target.checked) {
      const idsOnPage = paginatedSuppliers.map((s) => s.supplier_id);
      setSelectedIds((prev) => [...new Set([...prev, ...idsOnPage])]);
    } else {
      const idsOnPage = paginatedSuppliers.map((s) => s.supplier_id);
      setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          mb: 3,
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Suppliers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage supplier information and contact details
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ width: { xs: "100%", sm: "auto" }, alignItems: "center" }}
        >
          {selectedIds.length > 0 && canModify && isSelectionEnabled && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: "bold",
                textTransform: "none",
                px: 3,
                flexShrink: 0,
              }}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={handleMenuOpen}
            endIcon={isMenuOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            size="small"
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
              flexShrink: 0,
              borderColor: "#ef7d14",
              color: "#ef7d14",
              "&:hover": {
                borderColor: "#d66e0f",
                backgroundColor: isDark
                  ? "rgba(239, 125, 20, 0.08)"
                  : "#fff5ee",
              },
            }}
          >
            Actions
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            disableScrollLock
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                overflow: "visible",
                "& .MuiMenuItem-root": {
                  borderRadius: 1,
                  mx: 0.5,
                  my: 0.25,
                  px: 2,
                  py: 1,
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  gap: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {/* PRINT / EXPORT — opens the modal */}
            <MenuItem
              onClick={() => {
                setOpenPrintModal(true);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <Print fontSize="small" sx={{ color: "#ef7d14" }} />
              </ListItemIcon>
              <ListItemText>Print / Export</ListItemText>
            </MenuItem>

            {/* SELECT ROWS — stays open */}
            {canModify && (
              <MenuItem
                onClick={() => {
                  setIsSelectionEnabled((prev) => {
                    if (prev) setSelectedIds([]);
                    return !prev;
                  });
                }}
                sx={{ color: isSelectionEnabled ? "#ef7d14" : "text.primary" }}
              >
                <ListItemIcon>
                  {isSelectionEnabled ? (
                    <CheckCircleOutline
                      fontSize="small"
                      sx={{ color: "#ef7d14" }}
                    />
                  ) : (
                    <CheckBoxOutlineBlank
                      fontSize="small"
                      sx={{ color: "#ef7d14" }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {isSelectionEnabled ? "Selection On" : "Select Rows"}
                </ListItemText>
              </MenuItem>
            )}

            {canModify && <Divider sx={{ my: 0.5 }} />}

            {/* ADD SUPPLIER — closes menu */}
            {canModify && (
              <MenuItem
                onClick={() => {
                  setOpenAddModal(true);
                  handleMenuClose();
                }}
                sx={{
                  bgcolor: "#ef7d14",
                  color: "#fff",
                  "&:hover": { bgcolor: "#d66e0f" },
                }}
              >
                <ListItemIcon>
                  <Add fontSize="small" sx={{ color: "#fff" }} />
                </ListItemIcon>
                <ListItemText>Add Supplier</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, p: { xs: 1, sm: 2 } }}
      >
        <Grid container spacing={2} sx={{ mb: 3, px: { xs: 1, sm: 0 } }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, ID, contact, or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {searchQuery && (
            <Grid item xs={12}>
              <Button
                startIcon={<FilterListOff />}
                onClick={handleResetFilters}
                color="inherit"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Reset Filters
              </Button>
            </Grid>
          )}
        </Grid>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.02)" : "action.hover",
                  }}
                >
                  <TableRow>
                    {canModify && isSelectionEnabled && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selectedIds.length > 0 && !isAllSelectedOnPage
                          }
                          checked={isAllSelectedOnPage}
                          onChange={handleSelectAllRows}
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Supplier Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Address</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Contact No.
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Other Details
                    </TableCell>
                    {canViewActionColumn && (
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Action
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedSuppliers.map((row) => (
                    <TableRow
                      key={row.supplier_id}
                      hover
                      selected={selectedIds.includes(row.supplier_id)}
                    >
                      {canModify && isSelectionEnabled && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(row.supplier_id)}
                            onChange={() => handleSelectRow(row.supplier_id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>#{row.supplier_id}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: "180px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {row.supplier_name}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: "200px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          color: "text.secondary",
                          fontSize: "0.85rem",
                        }}
                      >
                        {row.address || "—"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.contact_no || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: "200px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          color: "text.secondary",
                          fontSize: "0.85rem",
                        }}
                      >
                        {row.other_details || "—"}
                      </TableCell>

                      {canViewActionColumn && (
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                setSelectedItem(row);
                                setOpenEditModal(true);
                              }}
                            >
                              <Edit fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {paginatedSuppliers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          5 +
                          (canModify && isSelectionEnabled ? 1 : 0) +
                          (canViewActionColumn ? 1 : 0)
                        }
                        align="center"
                        sx={{ py: 3 }}
                      >
                        No suppliers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={filteredSuppliers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      <AddSupplierModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        onSaveSuccess={() => {
          fetchSuppliers();
          showSnackbar("Supplier added successfully!", "success");
        }}
        mode={mode}
      />

      {selectedItem && (
        <EditSupplierModal
          open={openEditModal}
          handleClose={() => {
            setOpenEditModal(false);
            setSelectedItem(null);
          }}
          supplierData={selectedItem}
          onSaveSuccess={() => {
            fetchSuppliers();
            showSnackbar("Supplier updated successfully!", "info");
          }}
          mode={mode}
        />
      )}

      <PrintSuppliersModal
        open={openPrintModal}
        handleClose={() => setOpenPrintModal(false)}
        suppliers={filteredSuppliers}
        selectedIds={selectedIds}
        hasSelection={isSelectionEnabled && selectedIds.length > 0}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
