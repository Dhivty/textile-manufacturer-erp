const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const jobController = require("../controllers/jobController");
const db = require("../config/db");

// ================= ASSIGN WORKERS =================
// Mounted at /api/jobs
router.post(
    "/assign-workers",
    authMiddleware,
    roleMiddleware(["supervisor"]),
    jobController.assignWorkers
);

// ================= WORKERS LIST =================
router.get(
    "/workers",
    authMiddleware,
    roleMiddleware(["supervisor"]),
    jobController.listWorkers
);

// ================= WORKER DASHBOARD =================
router.get(
    "/my-assignments",
    authMiddleware,
    roleMiddleware(["worker"]),
    jobController.getMyAssignedJobs
);

router.get(
    "/assigned/:worker_id",
    authMiddleware,
    roleMiddleware(["worker", "supervisor"]),
    jobController.getAssignedJobs
);

// Worker marks job complete → Pending Verification
router.put(
  "/mark-complete/:job_id",
  authMiddleware,
  roleMiddleware(["worker"]),
  jobController.markWorkerComplete
);

// ================= VERIFY JOB =================
router.put(
    "/verify/:job_id",
    authMiddleware,
    roleMiddleware(["supervisor"]),
    jobController.verifyJob
);

// ================= PRODUCTION PROGRESS =================
router.get(
    "/production-progress",
    authMiddleware,
    roleMiddleware(["manufacturer", "supervisor"]),
    jobController.getProductionProgress
);

// ================= DASHBOARD STATS (must be before /:id) =================
router.get(
    "/dashboard/stats",
    authMiddleware,
    roleMiddleware(["manufacturer", "supervisor"]),
    async (req, res) => {
        try {
            const queries = {
                total_jobs: "SELECT COUNT(*) AS total FROM jobs",

                new_jobs: `
                SELECT COUNT(*) AS total FROM jobs
                WHERE status = 'Pending'
            `,

                pending_verification: `
                SELECT COUNT(*) AS total FROM jobs
                WHERE status = 'Pending Verification'
            `,

                in_production:
                    "SELECT COUNT(*) AS total FROM jobs WHERE status='In Production'",

                completed_jobs: `
                SELECT COUNT(*) AS total FROM jobs
                WHERE status IN ('Completed','Invoiced')
            `,

                total_yarn:
                    "SELECT IFNULL(SUM(quantity_available),0) AS total FROM raw_materials",

                monthly_production: `
                SELECT IFNULL(SUM(quantity_completed),0) AS total
                FROM production
                WHERE verified = 1
                AND MONTH(production_date) = MONTH(CURDATE())
                AND YEAR(production_date) = YEAR(CURDATE())
            `,

                total_revenue:
                    "SELECT IFNULL(SUM(total_cost),0) AS total FROM invoices"
            };

            const results = {};

            for (const key in queries) {
                const [data] = await db.query(queries[key]);
                results[key] = data[0].total || 0;
            }

            results.pending_jobs = results.new_jobs;

            res.json(results);
        } catch (error) {
            console.error("Dashboard Stats Error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ================= CRUD =================
router.get(
    "/",
    authMiddleware,
    roleMiddleware(["manufacturer", "supervisor"]),
    jobController.getAllJobs
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware(["manufacturer"]),
    jobController.createJob
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware(["manufacturer", "supervisor", "worker"]),
    jobController.getJobById
);

router.put(
    "/:id/status",
    authMiddleware,
    roleMiddleware(["manufacturer"]),
    jobController.updateJobStatus
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(["manufacturer"]),
    jobController.deleteJob
);

module.exports = router;