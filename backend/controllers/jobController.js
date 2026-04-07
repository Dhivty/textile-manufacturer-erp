const db = require("../config/db");

const ST = {
    PENDING: "Pending",
    IN_PRODUCTION: "In Production",
    PENDING_VERIFICATION: "Pending Verification",
    COMPLETED: "Completed",
    INVOICED: "Invoiced"
};

function ok(res, data, message) {
    const payload = { success: true, data };
    if (message) payload.message = message;
    return res.json(payload);
}

function fail(res, status, message) {
    return res.status(status).json({ success: false, message });
}

// CREATE JOB (manufacturer) → Pending
exports.createJob = async (req, res) => {
    try {
        const { client_name, design_name, saree_count, deadline } = req.body;

        if (!client_name || !design_name || !saree_count || !deadline) {
            return fail(res, 400, "All fields are required");
        }

        if (saree_count <= 0) {
            return fail(res, 400, "Saree count must be positive");
        }

        const [result] = await db.query(
            `INSERT INTO jobs
             (client_name, design_name, saree_count, deadline, status)
             VALUES (?, ?, ?, ?, ?)`,
            [client_name, design_name, saree_count, deadline, ST.PENDING]
        );

        return ok(res, { jobId: result.insertId }, "Job created successfully");
    } catch (error) {
        console.error("Create Job Error:", error);
        return fail(res, 500, "Server error");
    }
};

// GET /jobs?status=... (manufacturer / supervisor)
exports.getAllJobs = async (req, res) => {
    try {
        let { status } = req.query;
        if (status === "pending_verification") status = "Pending Verification";
        if (status === "assigned") status = "In Production";
        if (status === "completed") status = "Completed";

        const whereClause = status ? "WHERE j.status = ?" : "";
        const params = status ? [status] : [];

        const [rows] = await db.query(
            `
            SELECT
                j.job_id,
                j.client_name,
                j.design_name,
                j.saree_count,
                j.status,
                COALESCE(GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', '), 'Not Assigned') AS worker_name,
                COALESCE(MAX(ja.loom_number), 'Not Assigned') AS loom_number,
                (SELECT COALESCE(SUM(p2.quantity_completed), 0) FROM production p2 WHERE p2.job_id = j.job_id) AS quantity_completed,
                (SELECT COALESCE(SUM(CASE WHEN p3.verified = 1 THEN p3.quantity_completed ELSE 0 END), 0) FROM production p3 WHERE p3.job_id = j.job_id) AS verified_quantity_completed,
                COALESCE(
                    NULLIF(
                        GROUP_CONCAT(
                            DISTINCT CONCAT(
                                IFNULL(NULLIF(TRIM(rm.yarn_type), ''), 'Material'),
                                ' (',
                                mi.quantity_issued,
                                ')'
                            )
                            SEPARATOR ' | '
                        ),
                        ''
                    ),
                    'Not assigned'
                ) AS material_assigned
            FROM jobs j
            LEFT JOIN job_assignments ja ON j.job_id = ja.job_id
            LEFT JOIN users u ON ja.worker_id = u.id
            LEFT JOIN material_issues mi ON j.job_id = mi.job_id
            LEFT JOIN raw_materials rm ON mi.material_id = rm.material_id
            ${whereClause}
            GROUP BY j.job_id, j.client_name, j.design_name, j.saree_count, j.status
            `,
            params
        );

        return ok(res, rows);

    } catch (err) {
        console.error(err);
        return fail(res, 500, "Error fetching jobs");
    }
};

/** Supervisor: workers available for assignments (list all workers, enforce via threshold on assignment). */
exports.listWorkers = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.name, u.email, u.work_threshold
             FROM users u
             WHERE u.role = 'worker'
             ORDER BY u.name`
        );

        if (rows.length > 0) {
            const ids = rows.map(r => r.id);
            const [aw] = await db.query(
                `SELECT 
                    ja.worker_id,
                    COALESCE(SUM(ja.assigned_quantity), 0) - COALESCE(SUM(p_sums.p_sum), 0) AS remaining_work
                 FROM job_assignments ja
                 INNER JOIN jobs j ON j.job_id = ja.job_id
                 LEFT JOIN (
                     SELECT job_id, worker_id, SUM(quantity_completed) AS p_sum
                     FROM production
                     GROUP BY job_id, worker_id
                 ) p_sums ON p_sums.job_id = ja.job_id AND p_sums.worker_id = ja.worker_id
                 WHERE ja.worker_id IN (?)
                   AND j.status = 'In Production'
                   AND ja.completed_at IS NULL
                 GROUP BY ja.worker_id`,
                [ids]
            );
            const awMap = {};
            for (const r of aw) awMap[r.worker_id] = Number(r.remaining_work) || 0;
            for (const r of rows) r.activeWork = awMap[r.id] || 0;
        }

        return ok(res, rows);
    } catch (error) {
        console.error("listWorkers:", error);
        return fail(res, 500, "Server error");
    }
};

/**
 * POST { job_id, material_id, required_quantity, loom_number?,
 *        assignments?: { worker_id, quantity }[],
 *        workers?: number[] }
 * Per-worker quantities must sum to job saree_count (or pass workers[] only for equal split).
 */
exports.assignWorkers = async (req, res) => {
    const { job_id, workers, assignments, loom_number, material_id, required_quantity } = req.body;
    const jobId = parseInt(job_id, 10);
    const materialId = parseInt(material_id, 10);
    const requiredQty = Number(required_quantity);

    if (Number.isNaN(jobId)) {
        return fail(res, 400, "job_id is required");
    }
    if (Number.isNaN(materialId)) {
        return fail(res, 400, "material_id is required");
    }
    if (Number.isNaN(requiredQty) || requiredQty <= 0) {
        return fail(res, 400, "required_quantity must be greater than zero");
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [[jobFull]] = await conn.query(
            "SELECT job_id, status, saree_count FROM jobs WHERE job_id = ?",
            [jobId]
        );
        if (!jobFull) {
            await conn.rollback();
            return fail(res, 404, "Job not found");
        }
        if (jobFull.status !== ST.PENDING) {
            await conn.rollback();
            return fail(res, 400, `Job must be "${ST.PENDING}" to assign workers (current: ${jobFull.status})`);
        }

        const targetTotal = Number(jobFull.saree_count);
        let pairs = [];

        if (Array.isArray(assignments) && assignments.length > 0) {
            for (const a of assignments) {
                const wid = parseInt(a.worker_id, 10);
                const q = Number(a.quantity != null ? a.quantity : a.assigned_quantity);
                if (Number.isNaN(wid) || Number.isNaN(q) || q <= 0) {
                    await conn.rollback();
                    return fail(res, 400, "Each assignment needs worker_id and a positive quantity");
                }
                pairs.push({ workerId: wid, qty: q });
            }
        } else if (Array.isArray(workers) && workers.length > 0) {
            const rawIds = workers.map((w) => parseInt(w, 10)).filter((w) => !Number.isNaN(w));
            const n = rawIds.length;
            const base = Math.floor(targetTotal / n);
            let rem = Math.round(targetTotal - base * n);
            for (const wid of rawIds) {
                let q = base;
                if (rem > 0) {
                    q += 1;
                    rem -= 1;
                }
                pairs.push({ workerId: wid, qty: q });
            }
        } else {
            await conn.rollback();
            return fail(res, 400, "Provide assignments[] or workers[]");
        }

        const workerIds = pairs.map((p) => p.workerId);
        const uniqueIds = [...new Set(workerIds)];
        if (uniqueIds.length !== pairs.length) {
            await conn.rollback();
            return fail(res, 400, "Each worker can only appear once in assignments");
        }

        const sumQty = pairs.reduce((s, p) => s + p.qty, 0);
        if (Math.abs(sumQty - targetTotal) > 0.001) {
            await conn.rollback();
            return fail(
                res,
                400,
                `Per-worker quantities must sum to job target (${targetTotal}), currently ${sumQty}`
            );
        }

        const [workersFound] = await conn.query(
            `SELECT id, work_threshold FROM users WHERE role = 'worker' AND id IN (?)`,
            [uniqueIds]
        );
        if (workersFound.length !== uniqueIds.length) {
            await conn.rollback();
            return fail(res, 400, "One or more workers are invalid");
        }
        
        // Map fetched workers
        const workerMap = {};
        for(const w of workersFound) {
            workerMap[w.id] = { threshold: Number(w.work_threshold) || 100 };
        }

        // Active work query string
        const [activeWorkRows] = await conn.query(
            `SELECT 
                ja.worker_id,
                COALESCE(SUM(ja.assigned_quantity), 0) - COALESCE(SUM(p_sums.p_sum), 0) AS remaining_work
             FROM job_assignments ja
             INNER JOIN jobs j ON j.job_id = ja.job_id
             LEFT JOIN (
                 SELECT job_id, worker_id, SUM(quantity_completed) AS p_sum
                 FROM production
                 GROUP BY job_id, worker_id
             ) p_sums ON p_sums.job_id = ja.job_id AND p_sums.worker_id = ja.worker_id
             WHERE ja.worker_id IN (?)
               AND j.status = ?
               AND ja.completed_at IS NULL
             GROUP BY ja.worker_id`,
            [uniqueIds, ST.IN_PRODUCTION]
        );

        for (const rw of activeWorkRows) {
            if (workerMap[rw.worker_id]) {
                workerMap[rw.worker_id].activeWork = Number(rw.remaining_work) || 0;
            }
        }

        const exceededWorkers = [];
        for (const p of pairs) {
            const wData = workerMap[p.workerId];
            const activeWork = wData.activeWork || 0;
            if (activeWork + p.qty > wData.threshold) {
                exceededWorkers.push(`Worker ID ${p.workerId} threshold exceeded (Active: ${activeWork}, Newing: ${p.qty}, Max: ${wData.threshold})`);
            }
        }

        if (exceededWorkers.length > 0) {
            await conn.rollback();
            return fail(res, 400, "Threshold limits crossed: " + exceededWorkers.join(" | "));
        }

        const [[material]] = await conn.query(
            `SELECT material_id, quantity_available
             FROM raw_materials
             WHERE material_id = ?
             FOR UPDATE`,
            [materialId]
        );
        if (!material) {
            await conn.rollback();
            return fail(res, 404, "Material not found");
        }

        if (Number(material.quantity_available) < requiredQty) {
            await conn.query(
                `INSERT INTO material_requests (job_id, material_id, quantity, status, requested_by)
                 VALUES (?, ?, ?, 'pending', ?)`,
                [jobId, materialId, requiredQty, req.user.id]
            );
            await conn.commit();
            return ok(res, null, "Material not available, request created");
        }

        await conn.query(
            `UPDATE raw_materials
             SET quantity_available = quantity_available - ?
             WHERE material_id = ?`,
            [requiredQty, materialId]
        );

        const assignmentValues = pairs.map((p) => [
            jobId,
            p.workerId,
            req.user.id,
            loom_number ? String(loom_number).trim() : null,
            p.qty
        ]);
        await conn.query(
            `INSERT INTO job_assignments (job_id, worker_id, assigned_by, loom_number, assigned_quantity)
             VALUES ?
             ON DUPLICATE KEY UPDATE
                assigned_by = VALUES(assigned_by),
                loom_number = VALUES(loom_number),
                assigned_quantity = VALUES(assigned_quantity),
                completed_at = NULL`,
            [assignmentValues]
        );

        await conn.query(
            `INSERT INTO material_issues (job_id, material_id, quantity_issued) VALUES (?, ?, ?)`,
            [jobId, materialId, requiredQty]
        );

        await conn.query(`UPDATE jobs SET status = ? WHERE job_id = ?`, [ST.IN_PRODUCTION, jobId]);

        await conn.commit();
        return ok(
            res,
            { job_id: jobId, workers_assigned: pairs.length },
            "Workers assigned successfully"
        );
    } catch (error) {
        await conn.rollback();
        console.error("assignWorkers:", error);
        return fail(res, 500, "Server error");
    } finally {
        conn.release();
    }
};

async function queryAssignedJobsForWorker(workerIdInt) {
    const [rows] = await db.query(
        `
        SELECT
            ja.id AS assignment_id,
            j.job_id,
            j.client_name,
            j.design_name,
            j.saree_count,
            CASE j.status
                WHEN 'In Production' THEN 'assigned'
                WHEN 'Pending Verification' THEN 'pending_verification'
                WHEN 'Completed' THEN 'completed'
                ELSE j.status
            END AS job_status,
            ja.assigned_quantity,
            ja.completed_at AS your_assignment_completed_at,
            uw.name AS slot_worker_name,
            COALESCE(pl.logged, 0) AS your_quantity_logged
        FROM jobs j
        INNER JOIN job_assignments ja
            ON j.job_id = ja.job_id AND ja.worker_id = ?
        INNER JOIN users uw ON uw.id = ja.worker_id
        LEFT JOIN (
            SELECT job_id, worker_id, SUM(quantity_completed) AS logged
            FROM production
            GROUP BY job_id, worker_id
        ) pl ON pl.job_id = j.job_id AND pl.worker_id = ja.worker_id
        ORDER BY
            CASE j.status
                WHEN 'In Production' THEN 0
                WHEN 'Pending Verification' THEN 1
                ELSE 2
            END,
            j.job_id ASC
        `,
        [workerIdInt]
    );
    return rows;
}

/** All assignment rows (shared shop-floor login sees jobs assigned to any worker user). */
async function queryFloorAssignments() {
    const [rows] = await db.query(
        `
        SELECT
            ja.id AS assignment_id,
            j.job_id,
            j.client_name,
            j.design_name,
            j.saree_count,
            j.status AS job_status,
            ja.assigned_quantity,
            ja.completed_at AS your_assignment_completed_at,
            uw.name AS slot_worker_name,
            COALESCE(pl.logged, 0) AS your_quantity_logged
        FROM job_assignments ja
        INNER JOIN jobs j ON j.job_id = ja.job_id
        INNER JOIN users uw ON uw.id = ja.worker_id
        LEFT JOIN (
            SELECT job_id, worker_id, SUM(quantity_completed) AS logged
            FROM production
            GROUP BY job_id, worker_id
        ) pl ON pl.job_id = ja.job_id AND pl.worker_id = ja.worker_id
        ORDER BY
            CASE j.status
                WHEN 'In Production' THEN 0
                WHEN 'Pending Verification' THEN 1
                ELSE 2
            END,
            j.job_id ASC,
            ja.id ASC
        `
    );
    return rows;
}

exports.getMyAssignedJobs = async (req, res) => {
    const r = String(req.user.role || "").toLowerCase();
    if (r !== "worker") {
        return fail(res, 403, "Workers only");
    }
    const workerIdInt = Number(req.user.id);
    if (!Number.isFinite(workerIdInt)) {
        return fail(res, 400, "Invalid session user");
    }
    try {
        const rows = await queryAssignedJobsForWorker(workerIdInt);
        return ok(res, { assignments: rows, floorAccount: false });
    } catch (err) {
        console.error("[getMyAssignedJobs] error:", err);
        return fail(res, 500, err.message || "Error fetching assigned jobs");
    }
};

/**
 * GET assigned jobs for a worker (supervisor: any id; worker: only own id)
 */
exports.getAssignedJobs = async (req, res) => {
    const worker_id = req.params.worker_id;

    const workerIdInt = parseInt(worker_id, 10);
    if (Number.isNaN(workerIdInt)) {
        return fail(res, 400, "Invalid worker_id");
    }
    const sessionUserId = Number(req.user.id);
    const roleLower = String(req.user.role || "").toLowerCase();
    if (roleLower === "worker" && sessionUserId !== workerIdInt) {
        return fail(res, 403, "Forbidden");
    }

    try {
        const rows = await queryAssignedJobsForWorker(workerIdInt);
        return ok(res, rows);
    } catch (err) {
        console.error("[getAssignedJobs] error:", err);
        return fail(
            res,
            500,
            err.message || "Error fetching assigned jobs"
        );
    }
};

/** Worker: marks an assignment slot complete (assignment_id when multiple workers on the job). */
exports.markWorkerComplete = async (req, res) => {
    const jobId = parseInt(req.params.job_id, 10);
    if (Number.isNaN(jobId)) {
        return fail(res, 400, "Invalid job_id");
    }

    const assignmentId =
        req.body && req.body.assignment_id != null && req.body.assignment_id !== ""
            ? parseInt(req.body.assignment_id, 10)
            : NaN;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let assignRows;
        if (Number.isFinite(assignmentId)) {
            [assignRows] = await conn.query(
                "SELECT id, completed_at FROM job_assignments WHERE id = ? AND job_id = ? LIMIT 1 FOR UPDATE",
                [assignmentId, jobId]
            );
        } else {
            const [slots] = await conn.query(
                "SELECT id, completed_at, worker_id FROM job_assignments WHERE job_id = ? ORDER BY id FOR UPDATE",
                [jobId]
            );
            if (slots.length === 1) {
                assignRows = [slots[0]];
            } else {
                [assignRows] = await conn.query(
                    "SELECT id, completed_at FROM job_assignments WHERE job_id = ? AND worker_id = ? LIMIT 1 FOR UPDATE",
                    [jobId, req.user.id]
                );
            }
        }

        if (assignRows.length === 0) {
            await conn.rollback();
            return fail(
                res,
                403,
                Number.isFinite(assignmentId)
                    ? "Invalid assignment for this job"
                    : "Use Mark Complete on the row for your worker slot, or pass assignment_id when several workers share this job"
            );
        }
        if (assignRows[0].completed_at != null) {
            await conn.rollback();
            return fail(res, 400, "This assignment slot is already marked complete");
        }

        const [[job]] = await conn.query("SELECT job_id, status FROM jobs WHERE job_id = ? FOR UPDATE", [jobId]);
        if (!job) {
            await conn.rollback();
            return fail(res, 404, "Job not found");
        }
        if (job.status !== ST.IN_PRODUCTION) {
            await conn.rollback();
            return fail(res, 400, `Job must be "${ST.IN_PRODUCTION}" to mark complete (current: ${job.status})`);
        }

        await conn.query(
            `UPDATE job_assignments SET completed_at = CURRENT_TIMESTAMP WHERE id = ? AND job_id = ?`,
            [assignRows[0].id, jobId]
        );

        const [[counts]] = await conn.query(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS done
             FROM job_assignments
             WHERE job_id = ?`,
            [jobId]
        );
        const total = Number(counts.total) || 0;
        const done = Number(counts.done) || 0;
        if (total > 0 && done >= total) {
            await conn.query(`UPDATE jobs SET status = ? WHERE job_id = ?`, [ST.PENDING_VERIFICATION, jobId]);
        }

        await conn.commit();
        return ok(
            res,
            null,
            done >= total
                ? "All workers finished; job is pending supervisor verification"
                : "Your part is marked complete"
        );
    } catch (error) {
        await conn.rollback();
        console.error("markWorkerComplete:", error);
        return fail(res, 500, "Server error");
    } finally {
        conn.release();
    }
};

/**
 * Supervisor verify: Pending Verification → Completed
 * Body: { verified: true, remarks?: string }
 */
exports.verifyJob = async (req, res) => {
    try {
        const jobId = parseInt(req.params.job_id, 10);
        if (Number.isNaN(jobId)) {
            return fail(res, 400, "Invalid job_id");
        }

        const { verified, remarks } = req.body;
        if (verified !== true) {
            return fail(res, 400, "verified must be true to complete verification");
        }

        const [[job]] = await db.query("SELECT job_id, status FROM jobs WHERE job_id = ?", [jobId]);
        if (!job) {
            return fail(res, 404, "Job not found");
        }
        if (job.status !== ST.PENDING_VERIFICATION) {
            return fail(res, 400, `Job must be "${ST.PENDING_VERIFICATION}" (current: ${job.status})`);
        }

        const [existingV] = await db.query(
            "SELECT id FROM job_verification WHERE job_id = ?",
            [jobId]
        );
        if (existingV.length > 0) {
            return fail(res, 400, "Job already verified");
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query(
                `INSERT INTO job_verification (job_id, verified_by, status, remarks)
                 VALUES (?, ?, 'approved', ?)`,
                [jobId, req.user.id, remarks || null]
            );
            await conn.query(
                `UPDATE production
                 SET verified = 1,
                     verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP),
                     verified_by = COALESCE(verified_by, ?)
                 WHERE job_id = ? AND verified = 0`,
                [req.user.id, jobId]
            );
            await conn.query(`UPDATE jobs SET status = ? WHERE job_id = ?`, [ST.COMPLETED, jobId]);
            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }

        console.log("Supervisor verified job:", jobId, "→ Completed");

        return ok(res, null, "Job verified and marked Completed");
    } catch (error) {
        console.error("verifyJob:", error);
        return fail(res, 500, "Server error");
    }
};

exports.getProductionProgress = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                j.job_id,
                j.client_name,
                j.design_name,
                j.saree_count,
                COALESCE(SUM(CASE WHEN p.verified = 1 THEN p.quantity_completed ELSE 0 END), 0) AS total_done,
                ROUND(
                    (COALESCE(SUM(CASE WHEN p.verified = 1 THEN p.quantity_completed ELSE 0 END), 0)
                        / NULLIF(j.saree_count, 0)) * 100,
                    2
                ) AS progress
            FROM jobs j
            LEFT JOIN production p ON j.job_id = p.job_id
            GROUP BY j.job_id, j.client_name, j.design_name, j.saree_count
        `);
        res.json(rows);
    } catch (error) {
        console.error("Production progress error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;

        const [results] = await db.query("SELECT * FROM jobs WHERE job_id = ?", [jobId]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.json(results[0]);
    } catch (error) {
        console.error("Get Job Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Manufacturer only: Completed → Invoiced (no other transitions)
 */
exports.updateJobStatus = async (req, res) => {
    try {
        const jobId = req.params.id;
        const { status } = req.body;

        if (status !== ST.INVOICED) {
            return res.status(400).json({
                message: "Only transition to Invoiced is allowed here; use workflow for other statuses"
            });
        }

        const [results] = await db.query("SELECT status FROM jobs WHERE job_id = ?", [jobId]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const currentStatus = results[0].status;
        if (currentStatus !== ST.COMPLETED) {
            return res.status(400).json({
                message: `Invalid status: job must be "${ST.COMPLETED}" before invoicing (current: ${currentStatus})`
            });
        }

        await db.query("UPDATE jobs SET status = ? WHERE job_id = ?", [status, jobId]);

        res.json({ message: "Job status updated successfully" });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;

        await db.query("DELETE FROM jobs WHERE job_id = ?", [jobId]);

        res.json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error("Delete Job Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
