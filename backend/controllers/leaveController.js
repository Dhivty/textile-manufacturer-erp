const db = require("../config/db");

// WORKER → APPLY
exports.applyLeave = async (req, res) => {
    const { reason, from_date, to_date } = req.body;

    try {
        await db.query(
            `INSERT INTO leave_requests 
            (worker_id, reason, from_date, to_date)
            VALUES (?, ?, ?, ?)`,
            [req.user.id, reason, from_date, to_date]
        );

        res.json({ message: "Leave applied successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// MANUFACTURER → VIEW ALL
exports.getLeaves = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT lr.*, u.name 
            FROM leave_requests lr
            JOIN users u ON lr.worker_id = u.id
            ORDER BY lr.created_at DESC
        `);

        res.json(rows);

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// APPROVE
exports.approveLeave = async (req, res) => {
    const { id } = req.params;

    await db.query(
        "UPDATE leave_requests SET status='approved', approved_by=? WHERE id=?",
        [req.user.id, id]
    );

    res.json({ message: "Approved" });
};

// REJECT
exports.rejectLeave = async (req, res) => {
    const { id } = req.params;

    await db.query(
        "UPDATE leave_requests SET status='rejected' WHERE id=?",
        [id]
    );

    res.json({ message: "Rejected" });
};
exports.getMyLeaves = async (req, res) => {
    const worker_id = req.user.id;

    const [rows] = await db.query(
        "SELECT * FROM leave_requests WHERE worker_id=? ORDER BY created_at DESC",
        [worker_id]
    );

    res.json(rows);
};