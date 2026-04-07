const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const productionController = require("../controllers/productionController");
const db = require("../config/db");

router.get(
    "/pending-verification",
    authMiddleware,
    roleMiddleware(["supervisor"]),
    productionController.listPendingVerification
);

router.put(
    "/entries/:production_id/verify",
    authMiddleware,
    roleMiddleware(["supervisor"]),
    productionController.verifyProductionEntry
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware(["supervisor", "worker"]),
    productionController.addProduction
);

router.get(
    "/jobs/production-dashboard",
    authMiddleware,
    roleMiddleware(["manufacturer", "supervisor"]),
    async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT
                    j.job_id,
                    j.client_name,
                    j.design_name,
                    j.saree_count,
                    COALESCE(GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', '), 'Not Assigned') AS worker_name,
                    (SELECT COALESCE(SUM(p2.quantity_completed), 0) FROM production p2 WHERE p2.job_id = j.job_id) AS quantity_completed,
                    COALESCE(MAX(ja.loom_number), 'Not Assigned') AS loom_number

                FROM jobs j
                LEFT JOIN job_assignments ja
                    ON j.job_id = ja.job_id
                LEFT JOIN users u
                    ON ja.worker_id = u.id
                GROUP BY j.job_id, j.client_name, j.design_name, j.saree_count
            `);

            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error fetching dashboard" });
        }
    }
);

router.get(
    "/:job_id",
    authMiddleware,
    roleMiddleware(["supervisor", "worker", "manufacturer"]),
    productionController.getProductionByJob
);

module.exports = router;
