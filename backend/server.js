const express = require("express");
const cors = require("cors");
require("./config/db");

const authRoutes = require("./routes/authRoutes");
console.log("Auth routes loaded");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Textile ERP Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
app.post("/test-register", (req, res) => {
  res.send("Test register works");
});
app.get("/hello", (req, res) => {
  res.send("HELLO ROUTE WORKS");
});
const materialRoutes = require("./routes/materialRoutes");
app.use("/api/materials", materialRoutes);