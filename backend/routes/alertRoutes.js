const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getAlerts } = require("../services/alertServices");

router.get("/", auth, role(["manufacturer"]), async (req, res) => {
    const alerts = await getAlerts();
    res.json(alerts);
});

module.exports = router;