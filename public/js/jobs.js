let currentJobTab = "Pending";

function setJobTab(tab) {
    currentJobTab = tab;
    loadJobs();
}

async function loadJobs() {
    try {
        const jobs = await apiRequest(
            "GET",
            `/jobs?status=${encodeURIComponent(currentJobTab)}`
        );

        const tbody = document.querySelector("#job-table tbody");
        tbody.innerHTML = "";

        if (!jobs.length) {
            tbody.innerHTML =
                '<tr><td colspan="5">No data available</td></tr>';
            return;
        }

        jobs.forEach((job) => {
            let action = "—";

            if (job.status === "Completed") {
                action = `<button type="button" onclick="generateInvoice(${job.job_id})">Generate Invoice</button>`;
            } else if (job.status === "Invoiced") {
                action = `<button type="button" onclick="downloadInvoicePdf(${job.job_id})">Download Invoice</button> <span style="color:green">✔ Done</span>`;
            }

            const row = `
            <tr>
                <td>${job.job_id}</td>
                <td>${job.client_name}</td>
                <td>${job.design_name}</td>
                <td>${job.status}</td>
                <td>${action}</td>
            </tr>
        `;
            tbody.innerHTML += row;
        });
    } catch (err) {
        console.error(err);
        alert(err.message || "Failed to load jobs");
    }
}

async function generateInvoice(job_id) {
    try {
        await apiRequest("POST", "/invoice/generate", { job_id });
        await apiRequest("PUT", `/jobs/${job_id}/status`, { status: "Invoiced" });
        alert("Invoice Generated Successfully");
        loadJobs();
    } catch (err) {
        alert(err.message || "Error generating invoice");
    }
}

async function downloadInvoicePdf(job_id) {
    const token = sessionStorage.getItem("token");
    try {
        const res = await fetch(`/api/invoice/${job_id}/download`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
            const data = ct.includes("application/json") ? await res.json() : {};
            alert(data.message || `Download failed (${res.status})`);
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-job-${job_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert("Download failed");
    }
}

loadJobs();
