const express = require("express");
const cors = require("cors");
const path = require("path");
try {
    require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch (_) {
    /* optional */
}
require("./config/db");
const ensureSchema = require("./config/ensureSchema");


const authRoutes = require("./routes/authRoutes");
const materialRoutes = require("./routes/materialRoutes");
const jobRoutes = require("./routes/jobroutes");
const productionRoutes = require("./routes/productionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const materialRequestRoutes = require("./routes/materialRequestRoutes");
const leaveRoutes = require("./routes/leaveRoutes");


const app = express();
const reportRoutes = require("./routes/reportRoutes");


app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname,'..', "public")));

console.log("authRoutes:", authRoutes);
console.log("materialRoutes:", materialRoutes);
console.log("jobRoutes:", jobRoutes);
console.log("productionRoutes:", productionRoutes);
console.log("invoiceRoutes:", invoiceRoutes);
console.log("reportRoutes",reportRoutes)
app.use("/api/leaves", leaveRoutes);


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/material-requests", materialRequestRoutes);

// Keep API responses JSON even for missing endpoints.
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: "API route not found" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error handler caught:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"..", "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
ensureSchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("ensureSchema failed:", err);
        process.exit(1);
    });