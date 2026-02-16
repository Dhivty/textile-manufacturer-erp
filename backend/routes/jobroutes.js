const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobcontroller");

router.post("/jobs", jobController.createJob);
router.get("/jobs", jobController.getAllJobs);
router.get("/jobs/:id", jobController.getJobById);
router.put("/jobs/:id/status", jobController.updateJobStatus);
router.delete("/jobs/:id", jobController.deleteJob);

module.exports = router;
