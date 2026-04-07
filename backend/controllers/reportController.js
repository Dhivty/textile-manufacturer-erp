const db = require("../config/db");

exports.getReports = async (req, res) => {
    try {

        // JOB STATUS
        const [status] = await db.query(`
            SELECT status, COUNT(*) as count
            FROM jobs
            GROUP BY status
        `);

        // TOP CLIENTS
        const [clients] = await db.query(`
            SELECT client_name, COUNT(*) as total
            FROM jobs
            GROUP BY client_name
            ORDER BY total DESC
            LIMIT 5
        `);

        // TOTAL REVENUE
        const [[revenue]] = await db.query(`
            SELECT SUM(total_cost) as total FROM invoices
        `);

        res.json({
            status,
            clients,
            revenue: revenue.total || 0
        });

    } catch (err) {
        console.error("Report Error:", err);
        res.status(500).json({ message: "Error fetching reports" });
    }
};