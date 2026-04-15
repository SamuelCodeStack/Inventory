import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for routing
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  useTheme,
  alpha,
} from "@mui/material";
import { ArrowForward, Inventory2, ListAlt } from "@mui/icons-material";

export default function Dashboard({ mode }) {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const theme = useTheme();
  const isDark = mode === "dark";

  // Dynamic colors based on mode
  const paperBg = isDark ? "#1b1b1b" : theme.palette.background.paper;
  const headerText = isDark ? "#ffffff" : theme.palette.text.primary;
  const borderColor = isDark ? alpha("#fff", 0.1) : theme.palette.divider;

  const fetchData = async () => {
    try {
      const invRes = await fetch(`${import.meta.env.VITE_API_URL}/inventory`);
      const poRes = await fetch(
        `${import.meta.env.VITE_API_URL}/purchase-orders`,
      );
      const invData = await invRes.json();
      const poData = await poRes.json();

      setInventory(invData.filter((item) => item.status !== "In Stock"));
      setOrders(
        poData.filter(
          (po) => po.status === "Pending" || po.status === "Job Order",
        ),
      );
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Out of Stock":
        return { color: "#ff4d4d", bgcolor: alpha("#ff4d4d", 0.15) };
      case "Low Stock":
        return { color: "#ffa726", bgcolor: alpha("#ffa726", 0.15) };
      case "Job Order":
        return { color: "#29b6f6", bgcolor: alpha("#29b6f6", 0.15) };
      case "Pending":
        return { color: "#ffa726", bgcolor: alpha("#ffa726", 0.15) };
      default:
        return { color: "#66bb6a", bgcolor: alpha("#66bb6a", 0.15) };
    }
  };

  const commonTableCellStyle = {
    color: theme.palette.text.primary,
    borderColor: borderColor,
    fontSize: "0.875rem",
  };

  const RenderStockTable = () => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Item Name", "Current Qty", "Status"].map((head) => (
              <TableCell
                key={head}
                sx={{
                  fontWeight: 800,
                  color: headerText,
                  borderColor: borderColor,
                }}
              >
                {head}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {inventory.slice(0, 5).map((item) => {
            const style = getStatusStyle(item.status);
            return (
              <TableRow key={item.id} hover>
                <TableCell sx={commonTableCellStyle}>{item.name}</TableCell>
                <TableCell sx={commonTableCellStyle}>
                  {item.quantity} {item.uom}
                </TableCell>
                <TableCell sx={{ borderColor: borderColor }}>
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      borderRadius: "6px",
                      color: style.color,
                      bgcolor: style.bgcolor,
                      border: "none",
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const RenderOrdersTable = () => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["PO Number", "Company", "Delivery", "Status"].map((head) => (
              <TableCell
                key={head}
                sx={{
                  fontWeight: 800,
                  color: headerText,
                  borderColor: borderColor,
                }}
              >
                {head}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.slice(0, 5).map((order) => {
            const style = getStatusStyle(order.status);
            const formattedDate = order.date
              ? new Date(order.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "N/A";
            return (
              <TableRow key={order.id} hover>
                <TableCell
                  sx={{
                    ...commonTableCellStyle,
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                  }}
                >
                  {order.poNo}
                </TableCell>
                <TableCell sx={commonTableCellStyle}>
                  {order.company || "N/A"}
                </TableCell>
                <TableCell
                  sx={{
                    ...commonTableCellStyle,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {formattedDate}
                </TableCell>
                <TableCell sx={{ borderColor: borderColor }}>
                  <Chip
                    label={order.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      borderRadius: "6px",
                      color: style.color,
                      bgcolor: style.bgcolor,
                      border: "none",
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        mt: 8,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Operational summary and critical alerts.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: `1px solid ${borderColor}`,
              background: paperBg,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Inventory2 sx={{ color: "#ffa726" }} />
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: headerText }}
              >
                Inventory Attention
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                component={Link}
                to="/inventory" // Routes to your Inventory.jsx path
                size="small"
                endIcon={<ArrowForward />}
                sx={{ fontWeight: 700, color: "text.secondary" }}
              >
                More
              </Button>
            </Stack>
            <RenderStockTable />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: `1px solid ${borderColor}`,
              background: paperBg,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <ListAlt sx={{ color: "#29b6f6" }} />
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: headerText }}
              >
                Active Orders
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                component={Link}
                to="/purchase-order" // Routes to your PurchaseOrder.jsx path
                size="small"
                endIcon={<ArrowForward />}
                sx={{ fontWeight: 700, color: "text.secondary" }}
              >
                More
              </Button>
            </Stack>
            <RenderOrdersTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
