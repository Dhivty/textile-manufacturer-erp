const db = require("../config/db");

// Add production entry
exports.addProduction = (req, res) => {
  const { job_id, loom_number, worker_name, quantity_completed } = req.body;

  if (!job_id || !quantity_completed) {
    return res.status(400).json({ message: "Job ID and quantity required" });
  }

  // Step 1: Get job's total required saree_count
  db.query(
    "SELECT saree_count FROM jobs WHERE job_id = ?",
    [job_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      if (results.length === 0)
        return res.status(404).json({ message: "Job not found" });

      const totalRequired = results[0].saree_count;

      // Step 2: Get already completed quantity
      db.query(
        "SELECT SUM(quantity_completed) AS total_done FROM production WHERE job_id = ?",
        [job_id],
        (err, results2) => {
          if (err) return res.status(500).json({ error: err.message });

          const totalDone = Number(results2[0].total_done) || 0;
          const newQuantity = Number(quantity_completed);
          const totalRequired = Number(results[0].saree_count);

            if (totalDone + newQuantity > totalRequired) {
                 return res.status(400).json({
                    message: "Production exceeds required quantity"
                 });
                }

          // Step 3: Insert production record
          db.query(
            "INSERT INTO production (job_id, loom_number, worker_name, quantity_completed) VALUES (?, ?, ?, ?)",
            [job_id, loom_number, worker_name, quantity_completed],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              // Step 4: If production completed fully → mark job completed
              if (totalDone + quantity_completed === totalRequired) {
                db.query(
                  "UPDATE jobs SET status = 'Completed' WHERE job_id = ?",
                  [job_id]
                );
              }

              res.json({ message: "Production recorded successfully" });
            }
          );
        }
      );
    }
  );
};

// Get production details by job
exports.getProductionByJob = (req, res) => {
  const { job_id } = req.params;

  db.query(
    "SELECT * FROM production WHERE job_id = ?",
    [job_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json(results);
    }
  );
};