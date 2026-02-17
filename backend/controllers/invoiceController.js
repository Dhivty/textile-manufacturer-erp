const db = require("../config/db");

exports.generateInvoice = (req, res) => {
  const { job_id } = req.body;

  // 1️⃣ Get total production
  db.query(
    "SELECT SUM(quantity_completed) AS total_produced FROM production WHERE job_id = ?",
    [job_id],
    (err, productionResult) => {
      if (err) return res.status(500).json(err);

      const totalProduced = Number(productionResult[0].total_produced) || 0;

      if (totalProduced === 0) {
        return res.status(400).json({ message: "No production found for this job" });
      }

      // 2️⃣ Calculate Costs
      const materialCostPerUnit = 50;
      const labourCostPerUnit = 30;

      const materialCost = totalProduced * materialCostPerUnit;
      const labourCost = totalProduced * labourCostPerUnit;
      const totalCost = materialCost + labourCost;

      // 3️⃣ Insert Invoice
      db.query(
        `INSERT INTO invoices 
        (job_id, total_produced, material_cost, labour_cost, total_cost) 
        VALUES (?, ?, ?, ?, ?)`,
        [job_id, totalProduced, materialCost, labourCost, totalCost],
        (err, result) => {
          if (err) return res.status(500).json(err);

          res.json({
            message: "Invoice generated successfully",
            invoice_id: result.insertId,
            totalProduced,
            materialCost,
            labourCost,
            totalCost
          });
        }
      );
    }
  );
};