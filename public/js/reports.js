async function loadReports() {
    const token = sessionStorage.getItem("token");

    try {
        const res = await fetch("/api/reports", {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const data = await res.json();

        // ===== STATUS TABLE =====
        const statusTable = document.getElementById("status-table");
        statusTable.innerHTML = "";

        if (data.status && data.status.length) {
            data.status.forEach(s => {
                statusTable.innerHTML += `
                    <tr>
                        <td>${s.status}</td>
                        <td>${s.count}</td>
                    </tr>
                `;
            });
        } else {
            statusTable.innerHTML = `<tr><td colspan="2">No data</td></tr>`;
        }

        // ===== CLIENT TABLE =====
        const clientTable = document.getElementById("clients-table");
        clientTable.innerHTML = "";

        if (data.clients && data.clients.length) {
            data.clients.forEach(c => {
                clientTable.innerHTML += `
                    <tr>
                        <td>${c.client_name}</td>
                        <td>${c.total}</td>
                    </tr>
                `;
            });
        } else {
            clientTable.innerHTML = `<tr><td colspan="2">No data</td></tr>`;
        }

        // ===== REVENUE =====
        document.getElementById("revenue-box").textContent =
            "Total Revenue: ₹" + (data.revenue || 0);

    } catch (e) {
        console.error(e);
        document.getElementById("status-table").innerHTML =
            `<tr><td colspan="2">Error loading</td></tr>`;
    }
}

loadReports();