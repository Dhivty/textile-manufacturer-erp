let dashMaterialRows = [];

function fmtNum(v) {
    if (v == null || Number.isNaN(Number(v))) return "0";
    const n = Number(v);
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

async function loadDashboard() {
    try {
        const data = await apiRequest("GET", "/jobs/dashboard/stats");

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        set("total-jobs", fmtNum(data.total_jobs));
        set("pending-jobs", fmtNum(data.pending_jobs));
        set("pending-verification", fmtNum(data.pending_verification));
        set("in-production", fmtNum(data.in_production));
        set("completed-jobs", fmtNum(data.completed_jobs));
        set("total-yarn", fmtNum(data.total_yarn));
        set("total-production-month", fmtNum(data.monthly_production));
        set("revenue-generated", "₹" + fmtNum(data.total_revenue));
    } catch (err) {
        console.error(err);
    }
}

async function loadProductionProgress() {
    try {
        const data = await apiRequest("GET", "/jobs/production-progress");

        const tbody = document.getElementById("progress-table");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="4">No data</td></tr>`;
            return;
        }

        data.forEach((row) => {
            const target = Number(row.saree_count) || 0;
            const done = Number(row.total_done) || 0;
            const pctRaw = Number(row.progress);
            const pct = Number.isFinite(pctRaw) ? Math.min(100, Math.max(0, pctRaw)) : 0;
            tbody.innerHTML += `
            <tr>
                <td>${row.job_id}</td>
                <td>${row.client_name || "—"}</td>
                <td>${row.design_name || "—"}</td>
                <td>${target}</td>
                <td>${done}</td>
                <td>
                    <div style="background:#eee;border-radius:5px;min-height:1.5rem">
                        <div style="width:${pct}%;min-width:${pct > 0 ? "2px" : "0"};background:#28a745;color:white;padding:3px;border-radius:5px;text-align:center">
                            ${pct.toFixed(2)}%
                        </div>
                    </div>
                </td>
            </tr>`;
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadLeavesDash() {
    try {
        const data = await apiRequest("GET", "/leaves");
        const tbody = document.getElementById("dash-leave-requests");
        if (!tbody) return;
        tbody.innerHTML = "";
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">No leave requests</td></tr>`;
            return;
        }

        data.forEach(l => {
            const actions = l.status === "pending"
                ? `
                <button onclick="approveLeaveDash(${l.id})">Approve</button>
                <button onclick="rejectLeaveDash(${l.id})">Reject</button>
                `
                : l.status;

            tbody.innerHTML += `
            <tr>
                <td>${l.name}</td>
                <td>${new Date(l.from_date).toLocaleDateString()}</td>
                <td>${new Date(l.to_date).toLocaleDateString()}</td>
                <td>${l.reason}</td>
                <td>${l.status}</td>
                <td>${actions}</td>
            </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading leaves", err);
    }
}

window.approveLeaveDash = async function(id) {
    try {
        await apiRequest("PUT", `/leaves/${id}/approve`);
        loadLeavesDash();
    } catch(err) {
        alert(err.message || "Failed to approve leave");
    }
};

window.rejectLeaveDash = async function(id) {
    try {
        await apiRequest("PUT", `/leaves/${id}/reject`);
        loadLeavesDash();
    } catch(err) {
        alert(err.message || "Failed to reject leave");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadProductionProgress();
    loadLeavesDash();
});
