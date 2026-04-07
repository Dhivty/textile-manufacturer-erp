const tableBody = document.getElementById("request-table");
const filterEl = document.getElementById("mr-filter");

let allMaterialRequests = [];

function clientFilterValue() {
    return filterEl ? filterEl.value : "all";
}

function renderMaterialTable() {
    const f = clientFilterValue();
    const data =
        f === "all"
            ? allMaterialRequests
            : allMaterialRequests.filter((r) => r.status === f);

    tableBody.innerHTML = "";

    if (!data.length) {
        tableBody.innerHTML =
            '<tr><td colspan="6">No data available</td></tr>';
        return;
    }

    data.forEach((req) => {
        const row = document.createElement("tr");

        row.innerHTML = `
                <td>${req.id}</td>
                <td>${req.job_name}</td>
                <td>${req.material_name}</td>
                <td>${req.quantity}</td>
                <td>${req.status}</td>
                <td>
                    ${req.status === "pending" ? `
                        <button type="button" onclick="approve(${req.id})">Approve</button>
                        <button type="button" onclick="reject(${req.id})">Reject</button>
                    ` : "—"}
                </td>
            `;

        tableBody.appendChild(row);
    });
}

async function loadRequests() {
    try {
        allMaterialRequests = await apiRequest("GET", "/material-requests");
        renderMaterialTable();
    } catch (err) {
        console.error("loadRequests failed:", err.message, err);
        alert("Error loading requests: " + (err.message || err));
    }
}

async function approve(id) {
    try {
        await apiRequest("PUT", `/material-requests/${id}/approve`);
        alert("Approved");
        loadRequests();
    } catch (err) {
        console.error("approve failed:", err.message, err);
        alert(err.message || String(err));
    }
}

async function reject(id) {
    try {
        await apiRequest("PUT", `/material-requests/${id}/reject`);
        alert("Rejected");
        loadRequests();
    } catch (err) {
        console.error("reject failed:", err.message, err);
        alert(err.message || String(err));
    }
}

if (filterEl) {
    filterEl.addEventListener("change", renderMaterialTable);
}

loadRequests();
