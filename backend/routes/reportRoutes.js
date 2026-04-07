const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const controller = require("../controllers/reportController");

router.get("/", auth, role(["manufacturer"]), controller.getReports);

module.exports = router;