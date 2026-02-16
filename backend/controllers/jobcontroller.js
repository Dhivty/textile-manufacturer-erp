const connection = require("../config/db");

// Allowed status flow
const statusFlow = {
    "Pending": "In Production",
    "In Production": "Completed",
    "Completed": "Invoiced"
};

// CREATE JOB
exports.createJob = (req, res) => {
    const { client_name, design_name, saree_count, deadline } = req.body;

    if (!client_name || !design_name || !saree_count || !deadline) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (saree_count <= 0) {
        return res.status(400).json({ message: "Saree count must be positive" });
    }

    const query = `
        INSERT INTO jobs (client_name, design_name, saree_count, deadline, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(
        query,
        [client_name, design_name, saree_count, deadline, "Pending"],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Job created successfully", jobId: result.insertId });
        }
    );
};

// GET ALL JOBS
exports.getAllJobs = (req, res) => {
    connection.query("SELECT * FROM jobs", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// GET SINGLE JOB
exports.getJobById = (req, res) => {
    const jobId = req.params.id;

    connection.query("SELECT * FROM jobs WHERE job_id = ?", [jobId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }
        res.json(results[0]);
    });
};

// UPDATE JOB STATUS WITH FLOW CONTROL
exports.updateJobStatus = (req, res) => {
    const jobId = req.params.id;
    const { status } = req.body;

    connection.query("SELECT status FROM jobs WHERE job_id = ?", [jobId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const currentStatus = results[0].status;
        const nextAllowedStatus = statusFlow[currentStatus];

        if (status !== nextAllowedStatus) {
            return res.status(400).json({
                message: `Invalid status transition. Allowed: ${currentStatus} → ${nextAllowedStatus}`
            });
        }

        connection.query(
            "UPDATE jobs SET status = ? WHERE job_id = ?",
            [status, jobId],
            (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: "Job status updated successfully" });
            }
        );
    });
};

// DELETE JOB
exports.deleteJob = (req, res) => {
    const jobId = req.params.id;

    connection.query("DELETE FROM jobs WHERE job_id = ?", [jobId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Job deleted successfully" });
    });
};
