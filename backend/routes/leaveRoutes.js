const express = require("express");
const router = express.Router();

const controller = require("../controllers/leaveController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, role(["worker", "supervisor"]), controller.applyLeave);

router.get("/my", auth, role(["worker", "supervisor"]), controller.getMyLeaves);

router.get("/", auth, role(["manufacturer"]), controller.getLeaves);

router.put("/:id/approve", auth, role(["manufacturer"]), controller.approveLeave);

router.put("/:id/reject", auth, role(["manufacturer"]), controller.rejectLeave);

module.exports = router;