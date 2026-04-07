const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const materialController = require("../controllers/materialController");

router.post("/", authMiddleware, roleMiddleware(["manufacturer"]), materialController.addMaterial);
router.delete("/:id", authMiddleware, roleMiddleware(["manufacturer"]), materialController.deleteMaterial);
router.get(
    "/low-stock",
    authMiddleware,
    roleMiddleware(["manufacturer", "supervisor"]),
    materialController.getLowStock
);
router.get("/", materialController.getMaterials);
router.post("/issue", materialController.issueMaterial);

module.exports = router;