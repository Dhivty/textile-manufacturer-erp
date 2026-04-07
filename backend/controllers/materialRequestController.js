const db = require("../config/db");

// 🔹 Supervisor creates request
exports.createRequest = async (req, res) => {
    let { job_id, material_id, quantity, new_material_name } = req.body;
    const requested_by = req.user.id;

    try {
        if (new_material_name) {
            const [ex] = await db.query(`SELECT material_id FROM raw_materials WHERE yarn_type = ?`, [new_material_name]);
            if (ex.length > 0) {
                material_id = ex[0].material_id;
            } else {
                const [ins] = await db.query(
                    `INSERT INTO raw_materials (yarn_type, quantity_received, quantity_available, threshold) VALUES (?, 0, 0, 10)`,
                    [new_material_name]
                );
                material_id = ins.insertId;
            }
        }

        await db.query(
            `INSERT INTO material_requests 
            (job_id, material_id, quantity, requested_by) 
            VALUES (?, ?, ?, ?)`,
            [job_id, material_id, quantity, requested_by]
        );

        res.json({ message: "Request created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 Manufacturer views requests
exports.getRequests = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                mr.*,
                j.design_name AS job_name,
                rm.yarn_type AS material_name
            FROM material_requests mr
            LEFT JOIN jobs j ON mr.job_id = j.job_id
            LEFT JOIN raw_materials rm ON mr.material_id = rm.material_id
            ORDER BY mr.created_at DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 Approve request
exports.approveRequest = async (req, res) => {
    const { id } = req.params;
    const approved_by = req.user.id;

    try {
        const [rows] = await db.query(
            "SELECT * FROM material_requests WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Request not found" });
        }

        const reqData = rows[0];

        const [material] = await db.query(
            "SELECT quantity_available FROM raw_materials WHERE material_id = ?",
            [reqData.material_id]
        );

        const reqQty = Number(reqData.quantity);
        const available = Number(material[0].quantity_available);

        console.log("Requested:", reqQty);
        console.log("Available:", available);

        if (available < reqQty) {
            return res.status(400).json({ message: "Not enough stock" });
        }

        // reduce stock
        await db.query(
            `UPDATE raw_materials 
             SET quantity_available = quantity_available - ? 
             WHERE material_id = ?`,
            [reqQty, reqData.material_id]
        );

        // update request
        await db.query(
            `UPDATE material_requests 
             SET status = 'approved', approved_by = ? 
             WHERE id = ?`,
            [approved_by, id]
        );

        res.json({ message: "Approved successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 Reject request
exports.rejectRequest = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            `UPDATE material_requests 
             SET status = 'rejected' 
             WHERE id = ?`,
            [id]
        );

        res.json({ message: "Rejected successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.addMaterial = async (req, res) => {
    const { material_name, quantity_available, threshold } = req.body;

    try {
        await db.query(
            `INSERT INTO raw_materials (material_name, quantity_available, threshold)
             VALUES (?, ?, ?)`,
            [material_name, quantity_available, threshold]
        );

        res.json({ message: "Material added" });

    } catch (err) {
        res.status(500).json({ message: "Error adding material" });
    }
};