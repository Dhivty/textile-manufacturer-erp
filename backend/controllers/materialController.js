const db = require("../config/db");

exports.addMaterial = async (req, res) => {
    try {
        const { material_name, quantity_available, threshold } = req.body;

        // Check if material already exists
        const [existing] = await db.query(
            "SELECT * FROM raw_materials WHERE yarn_type = ?",
            [material_name]
        );

        if (existing.length > 0) {
            await db.query(
                `UPDATE raw_materials 
                 SET quantity_received = quantity_received + ?, 
                     quantity_available = quantity_available + ?,
                     threshold = ?
                 WHERE material_id = ?`,
                [quantity_available, quantity_available, threshold, existing[0].material_id]
            );
            res.json({ message: "Material updated successfully" });
        } else {
            await db.query(
                `INSERT INTO raw_materials 
                (yarn_type, quantity_received, quantity_available, threshold)
                VALUES (?, ?, ?, ?)`,
                [
                    material_name,
                    quantity_available,
                    quantity_available,
                    threshold
                ]
            );
            res.json({ message: "Material added" });
        }

    } catch (err) {
        console.error("ERROR:", err); // 🔥 MUST HAVE
        res.status(500).json({ message: err.message });
    }
};
exports.getMaterials = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM raw_materials");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        material_id,
        yarn_type AS material_name,
        quantity_available,
        threshold
      FROM raw_materials
      WHERE quantity_available < threshold
      ORDER BY quantity_available ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("[ getLowStock ]", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.issueMaterial = async (req, res) => {
  const { job_id, material_id, quantity_issued } = req.body;
  if (!job_id || !material_id || !quantity_issued)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const [results] = await db.query(
      "SELECT quantity_available FROM raw_materials WHERE material_id = ?",
      [material_id]
    );
    if (results.length === 0)
      return res.status(404).json({ message: "Material not found" });
    if (results[0].quantity_available < quantity_issued)
      return res.status(400).json({ message: "Insufficient stock" });

    await db.query(
      "UPDATE raw_materials SET quantity_available = quantity_available - ? WHERE material_id = ?",
      [quantity_issued, material_id]
    );
    await db.query(
      "INSERT INTO material_issues (job_id, material_id, quantity_issued) VALUES (?, ?, ?)",
      [job_id, material_id, quantity_issued]
    );
    res.json({ message: "Material issued successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteMaterial = async (req, res) => {
    try {
        const id = req.params.id;

        await db.query(
            "DELETE FROM raw_materials WHERE material_id = ?",
            [id]
        );

        res.json({ message: "Deleted" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting material" });
    }
};