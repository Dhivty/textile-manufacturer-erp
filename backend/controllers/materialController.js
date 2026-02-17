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


// Issue material to a job
exports.issueMaterial = (req, res) => {
  const { job_id, material_id, quantity_issued } = req.body;

  if (!job_id || !material_id || !quantity_issued) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Step 1: Check if material exists and get available stock
  db.query(
    "SELECT quantity_available FROM raw_materials WHERE material_id = ?",
    [material_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0) {
        return res.status(404).json({ message: "Material not found" });
      }

      const availableStock = results[0].quantity_available;

      // Step 2: Check if stock is sufficient
      if (availableStock < quantity_issued) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      // Step 3: Deduct stock
      db.query(
        "UPDATE raw_materials SET quantity_available = quantity_available - ? WHERE material_id = ?",
        [quantity_issued, material_id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Step 4: Insert record into material_issues
          db.query(
            "INSERT INTO material_issues (job_id, material_id, quantity_issued) VALUES (?, ?, ?)",
            [job_id, material_id, quantity_issued],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              // Optional: Update job status to 'In Production'
              db.query(
                "UPDATE jobs SET status = 'In Production' WHERE job_id = ?",
                [job_id],
                () => {}
              );

              res.json({ message: "Material issued successfully" });
            }
          );
        }
      );
    }
  );
};