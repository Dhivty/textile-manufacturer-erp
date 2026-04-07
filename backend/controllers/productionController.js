const db = require("../config/db");

exports.listPendingVerification = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                p.production_id,
                p.job_id,
                j.client_name,
                j.design_name,
                p.quantity_completed,
                p.worker_name,
                p.worker_id,
                p.production_date
             FROM production p
             INNER JOIN jobs j ON j.job_id = p.job_id
             WHERE p.verified = 0
             ORDER BY p.production_date DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error("listPendingVerification:", error);
        res.status(500).json({
            message: error.message || "Server error"
        });
    }
};

exports.verifyProductionEntry = async (req, res) => {
    try {
        const productionId = parseInt(req.params.production_id, 10);
        if (Number.isNaN(productionId)) {
            return res.status(400).json({ message: "Invalid production id" });
        }

        const [rows] = await db.query(
            `SELECT production_id, verified FROM production WHERE production_id = ?`,
            [productionId]
        );
        if (!rows.length) {
            return res.status(404).json({ message: "Production entry not found" });
        }
        if (rows[0].verified) {
            return res.status(400).json({ message: "Already verified" });
        }

        await db.query(
            `UPDATE production
             SET verified = 1, verified_at = CURRENT_TIMESTAMP, verified_by = ?
             WHERE production_id = ?`,
            [req.user.id, productionId]
        );
        res.json({ message: "Production verified" });
    } catch (error) {
        console.error("verifyProductionEntry:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.addProduction = async (req, res) => {
    try {
        const { job_id, loom_number, quantity_completed } = req.body;
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!job_id || quantity_completed == null) {
            return res.status(400).json({ message: "Job ID and quantity required" });
        }

        const newQuantity = Number(quantity_completed);
        if (Number.isNaN(newQuantity) || newQuantity <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number" });
        }

        const [jobResults] = await db.query(
            "SELECT saree_count, status FROM jobs WHERE job_id = ?",
            [job_id]
        );

        if (jobResults.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const totalRequired = Number(jobResults[0].saree_count);
        const jobStatus = jobResults[0].status;

        const [jobTotalRows] = await db.query(
            "SELECT COALESCE(SUM(quantity_completed), 0) AS total_done FROM production WHERE job_id = ?",
            [job_id]
        );
        const totalDone = Number(jobTotalRows[0].total_done) || 0;

        if (totalDone + newQuantity > totalRequired) {
            return res.status(400).json({
                message: "Production exceeds job target quantity"
            });
        }

        let workerName = req.body.worker_name || null;
        let workerDbId = null;
        let verified = 0;
        let verifiedAt = null;
        let verifiedBy = null;

        const roleLower = String(role || "").toLowerCase();

        if (roleLower === "worker") {
            if (jobStatus !== "In Production") {
                return res.status(400).json({ message: "Job is not in production" });
            }

            let jaPick = null;
            const aidRaw = req.body.assignment_id;
            if (aidRaw != null && aidRaw !== "") {
                const aid = parseInt(aidRaw, 10);
                const [jrs] = await db.query(
                    `SELECT worker_id, assigned_quantity FROM job_assignments WHERE id = ? AND job_id = ?`,
                    [aid, job_id]
                );
                if (!jrs.length) {
                    return res.status(400).json({ message: "Invalid worker slot (assignment) for this job" });
                }
                jaPick = jrs[0];
            } else {
                const [jrs] = await db.query(
                    `SELECT id, worker_id, assigned_quantity FROM job_assignments WHERE job_id = ? ORDER BY id`,
                    [job_id]
                );
                if (!jrs.length) {
                    return res.status(403).json({ message: "No worker assignments for this job" });
                }
                if (jrs.length === 1) {
                    jaPick = jrs[0];
                } else {
                    const own = jrs.filter((r) => Number(r.worker_id) === Number(userId));
                    if (own.length === 1) {
                        jaPick = own[0];
                    } else {
                        return res.status(400).json({
                            message:
                                "Pick the job line that shows the worker name (multiple people on this job)."
                        });
                    }
                }
            }
            workerDbId = jaPick.worker_id;

            const allotment =
                jaPick.assigned_quantity != null
                    ? Number(jaPick.assigned_quantity)
                    : totalRequired;

            const [mineRows] = await db.query(
                `SELECT COALESCE(SUM(quantity_completed), 0) AS s
                 FROM production WHERE job_id = ? AND worker_id = ?`,
                [job_id, workerDbId]
            );
            const mineDone = Number(mineRows[0].s) || 0;
            if (mineDone + newQuantity > allotment + 1e-6) {
                return res.status(400).json({
                    message: `Exceeds assigned target for this slot (${allotment} sarees)`
                });
            }

            const [[u]] = await db.query("SELECT name FROM users WHERE id = ?", [workerDbId]);
            workerName = u ? u.name : workerName;
        } else if (roleLower === "supervisor") {
            verified = 1;
            verifiedAt = new Date();
            verifiedBy = userId;
            if (!workerName) {
                workerName = "Supervisor";
            }
        }

        await db.query(
            `INSERT INTO production
             (job_id, loom_number, worker_name, quantity_completed, worker_id, verified, verified_at, verified_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                job_id,
                loom_number || null,
                workerName,
                newQuantity,
                workerDbId,
                verified,
                verifiedAt,
                verifiedBy
            ]
        );

        res.json({ message: "Production recorded successfully" });
    } catch (error) {
        console.error("Production Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getProductionByJob = async (req, res) => {
    try {
        const { job_id } = req.params;

        const [rows] = await db.query("SELECT * FROM production WHERE job_id = ?", [job_id]);

        res.json(rows);
    } catch (error) {
        console.error("getProductionByJob:", error);

        res.status(500).json({
            message: "Server error in production fetch"
        });
    }
};
