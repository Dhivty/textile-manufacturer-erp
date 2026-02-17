const express = require("express");
const router = express.Router();
const productionController = require("../controllers/productionController");

router.post("/", productionController.addProduction);
router.get("/:job_id", productionController.getProductionByJob);

module.exports = router;