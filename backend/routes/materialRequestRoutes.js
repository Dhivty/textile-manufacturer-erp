// backend/routes/materialRequestRoutes.js
// Approve: PUT /api/material-requests/:id/approve
// Reject:  PUT /api/material-requests/:id/reject

const express = require("express");
const router = express.Router();

const controller = require("../controllers/materialRequestController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware(["supervisor"]), controller.createRequest);

router.get("/", authMiddleware, roleMiddleware(["manufacturer", "supervisor"]), controller.getRequests);

router.put("/:id/approve", authMiddleware, roleMiddleware(["manufacturer"]), controller.approveRequest);
router.put("/:id/reject", authMiddleware, roleMiddleware(["manufacturer"]), controller.rejectRequest);

module.exports = router;
