const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");

router.post("/", materialController.addMaterial);
router.get("/", materialController.getMaterials);

module.exports = router;