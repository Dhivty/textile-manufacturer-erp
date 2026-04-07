async function loadProductionDashboard() {
    try {
        const jobs = await apiRequest("GET", `/jobs?status=In Production`);
        console.log("[production-dashboard] /jobs response:", jobs);

        const tbody = document.querySelector("#production-table tbody");
        tbody.innerHTML = "";

        if (!jobs.length) {
            tbody.innerHTML =
                '<tr><td colspan="6">No data available</td></tr>';
            return;
        }

        for (const job of jobs) {

            // ✅ DEFINE productionData FIRST
            const productionData = await apiRequest("GET", `/production/${job.job_id}`);

            const totalDone = productionData.reduce(
                (sum, p) => sum + Number(p.quantity_completed),
                0
            );

            // Assigned workers come from job list (job_assignments); production rows may not exist yet.
            const workerName =
                job.worker_name &&
                job.worker_name !== "Not Assigned"
                    ? job.worker_name
                    : productionData.find((p) => p.worker_name)?.worker_name ||
                      "Not Assigned";

            const materialLabel =
                job.material_assigned ||
                job.issue_number ||
                "Not assigned";

            const target = Number(job.saree_count) || 0;
            const progress =
                target > 0
                    ? `${totalDone} / ${target} (${((totalDone / target) * 100).toFixed(1)}%)`
                    : `${totalDone} / —`;

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${job.job_id}</td>
                <td>${job.client_name}</td>
                <td>${job.design_name}</td>
                <td>${progress}</td>
                <td>${workerName}</td>
                <td>${materialLabel}</td>
            `;

            tbody.appendChild(tr);
        }

    } catch (err) {
        console.error(err);
        alert(err.message || "Failed to load production dashboard");
    }
}


loadProductionDashboard();
