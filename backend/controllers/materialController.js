const db = require("../config/db");

// Add new material
exports.addMaterial = (req, res) => {
  const { yarn_type, quantity_received } = req.body;

  db.query(
    "INSERT INTO raw_materials (yarn_type, quantity_received, quantity_available) VALUES (?, ?, ?)",
    [yarn_type, quantity_received, quantity_received],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "Material added successfully" });
    }
  );
};

// Get all materials
exports.getMaterials = (req, res) => {
  db.query("SELECT * FROM raw_materials", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(results);
  });
};