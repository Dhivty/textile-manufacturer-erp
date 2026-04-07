function invoiceAuthHeaders() {
    const t = sessionStorage.getItem("token");
    const h = { "Content-Type": "application/json" };
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
}

function invoiceAuthHeadersGet() {
    const t = sessionStorage.getItem("token");
    const h = {};
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
}

async function preview() {
    const job_id = document.getElementById("jobId").value;

    const res = await fetch("/api/invoice/preview", {
        method: "POST",
        headers: invoiceAuthHeaders(),
        body: JSON.stringify({ job_id })
    });

    const data = await res.json();

    document.getElementById("previewBox").innerHTML = `
        <div class="card">
            <p><strong>Quantity:</strong> ${data.qty}</p>
            <p><strong>Material Cost:</strong> ₹${data.materialCost}</p>
            <p><strong>Labour Cost:</strong> ₹${data.labourCost}</p>
            <p><strong>Total:</strong> ₹${data.total}</p>
        </div>
    `;
}

async function generate() {
    const job_id = document.getElementById("jobId").value;

    await fetch("/api/invoice/generate", {
        method: "POST",
        headers: invoiceAuthHeaders(),
        body: JSON.stringify({ job_id })
    });

    alert("Invoice created");
    load();
}

async function load() {
    const res = await fetch("/api/invoice", {
        headers: invoiceAuthHeadersGet()
    });

    const data = await res.json();

    const tbody = document.getElementById("list");

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="2">No invoices</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(i => `
        <tr>
            <td>${i.job_id}</td>
            <td>₹${i.total_cost}</td>
        </tr>
    `).join("");
}

load();