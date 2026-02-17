const express = require("express");
const cors = require("cors");
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const materialRoutes = require("./routes/materialRoutes");
const jobRoutes = require("./routes/jobroutes");
const productionRoutes = require("./routes/productionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api", jobRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/invoice", invoiceRoutes);
// Test Routes
app.get("/", (req, res) => {
  res.send("Textile ERP Backend Running");
});

app.post("/test-register", (req, res) => {
  res.send("Test register works");
});

app.get("/hello", (req, res) => {
  res.send("HELLO ROUTE WORKS");
});

// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});