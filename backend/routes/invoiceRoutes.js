const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const c = require("../controllers/invoiceController");

router.get("/:job_id/download", auth, role(["manufacturer"]), c.downloadInvoice);
router.post("/preview", auth, role(["manufacturer"]), c.previewInvoice);
router.post("/generate", auth, role(["manufacturer"]), c.generateInvoice);
router.get("/", auth, role(["manufacturer"]), c.getInvoices);

module.exports = router;
