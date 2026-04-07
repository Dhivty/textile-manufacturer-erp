const db = require("../config/db");
const PDFDocument = require("pdfkit");

exports.previewInvoice = async (req, res) => {
    const { job_id } = req.body;

    try {
        const [[job]] = await db.query("SELECT * FROM jobs WHERE job_id = ?", [job_id]);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const qty = job.saree_count || 0;
        const materialCost = qty * 50;
        const labourCost = qty * 30;

        res.json({
            qty,
            materialCost,
            labourCost,
            total: materialCost + labourCost
        });
    } catch (err) {
        console.error("[ previewInvoice ]", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.generateInvoice = async (req, res) => {
    const { job_id } = req.body;

    try {
        const [[job]] = await db.query("SELECT * FROM jobs WHERE job_id = ?", [job_id]);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.status !== "Completed") {
            return res.status(400).json({
                message: "Job must be Completed before generating an invoice"
            });
        }

        const [existing] = await db.query(
            "SELECT invoice_id FROM invoices WHERE job_id = ?",
            [job_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Invoice already exists for this job" });
        }

        const qty = job.saree_count;
        const material_cost = qty * 50;
        const labour_cost = qty * 30;
        const total_cost = material_cost + labour_cost;
        const job_charge = qty * 120;
        const profit = job_charge - total_cost;

        await db.query(
            `
            INSERT INTO invoices
            (job_id, labour_cost, material_cost, total_cost, job_charge, profit)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [job_id, labour_cost, material_cost, total_cost, job_charge, profit]
        );

        res.json({ message: "Invoice generated" });
    } catch (err) {
        console.error("[ generateInvoice ]", err);
        res.status(500).json({ message: "Error generating invoice" });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM invoices");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.downloadInvoice = async (req, res) => {
    const job_id = parseInt(req.params.job_id, 10);
    if (Number.isNaN(job_id)) {
        return res.status(400).json({ message: "Invalid job id" });
    }

    try {
        const [[job]] = await db.query("SELECT * FROM jobs WHERE job_id = ?", [job_id]);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const [invRows] = await db.query(
            "SELECT * FROM invoices WHERE job_id = ? ORDER BY invoice_id DESC LIMIT 1",
            [job_id]
        );
        if (invRows.length === 0) {
            return res.status(404).json({ message: "No invoice for this job" });
        }

        const inv = invRows[0];

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="invoice-job-${job_id}.pdf"`
        );

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        doc.fontSize(18).text("Textile ERP — Invoice", { underline: true });
        doc.moveDown();
        doc.fontSize(11);
        doc.text(`Job ID: ${job.job_id}`);
        doc.text(`Client: ${job.client_name}`);
        doc.text(`Design: ${job.design_name}`);
        doc.text(`Saree count: ${job.saree_count}`);
        doc.text(`Job status: ${job.status}`);
        doc.moveDown();
        doc.text("Costs", { underline: true });
        doc.text(`Material cost: ₹${Number(inv.material_cost).toFixed(2)}`);
        doc.text(`Labour cost: ₹${Number(inv.labour_cost).toFixed(2)}`);
        doc.text(`Total cost: ₹${Number(inv.total_cost).toFixed(2)}`);
        doc.moveDown();
        doc.text(`Job charge: ₹${Number(inv.job_charge).toFixed(2)}`);
        doc.text(`Profit: ₹${Number(inv.profit).toFixed(2)}`);
        doc.moveDown();
        doc.text(`Invoice ID: ${inv.invoice_id}`);
        doc.text(`Issued: ${inv.created_at || ""}`);

        doc.end();
    } catch (err) {
        console.error("[ downloadInvoice ]", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error generating PDF" });
        }
    }
};
