const db = require("../config/db");

exports.getAlerts = async () => {
    const [rows] = await db.query("SELECT * FROM raw_materials");

    return rows.map(m => {
        const percentage = (m.quantity_available / m.quantity_received) * 100;

        let level = "OK";
        if (percentage <= 25) level = "CRITICAL";
        else if (percentage <= 50) level = "WARNING";

        return {
            material_id: m.material_id,
            yarn_type: m.yarn_type,
            quantity_available: m.quantity_available,
            percentage: percentage.toFixed(1),
            level
        };
    }).filter(m => m.level !== "OK");
};