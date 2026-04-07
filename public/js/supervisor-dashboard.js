let workersCache = [];
let materialsCache = [];

async function loadWorkers() {
    try {
        workersCache = await apiRequest("GET", "/jobs/workers");
    } catch (e) {
        console.error("loadWorkers", e);
        workersCache = [];
    }
}

function generateWorkerSelect(jobId, index, perWorkerQty) {
    if (!workersCache.length) {
        return `<span>No workers registered.</span>`;
    }
    const opts = workersCache
        .map((w) => {
            const active = w.activeWork || 0;
            const threshold = w.work_threshold || 100;
            const disable = (active + perWorkerQty > threshold) ? "disabled" : "";
            const disableText = disable ? " (Max capacity hit)" : "";
            return `<option value="${w.id}" ${disable}>${w.name} (Load: ${active}/${threshold})${disableText}</option>`;
        })
        .join("");
    return `<select id="worker-sel-${jobId}-${index}" style="min-width:10rem;margin-bottom:0.2rem">
                <option value="">-- Select Worker --</option>
                ${opts}
            </select>`;
}

async function loadMaterials() {
    try {
        materialsCache = await apiRequest("GET", "/materials");
    } catch (e) {
        console.error("loadMaterials", e);
        materialsCache = [];
    }
}

function materialOptionsHtml(selectId) {
    if (!materialsCache.length) {
        return `<span>No materials available.</span>`;
    }
    const opts = materialsCache
        .map((m) => `<option value="${m.material_id}">${m.yarn_type} (qty ${m.quantity_available})</option>`)
        .join("");
    return `<select id="${selectId}" style="min-width:10rem">${opts}</select>`;
}

async function loadNewJobs() {
    try {
        const jobs = await apiRequest(
            "GET",
            `/jobs?status=${encodeURIComponent("Pending")}`
        );
        const tbody = document.querySelector("#new-jobs-table tbody");
        tbody.innerHTML = "";

        if (!jobs.length) {
            tbody.innerHTML =
                '<tr><td colspan="9">No data available</td></tr>';
            return;
        }

        jobs.forEach((job) => {
            const numWorkersId = `num-workers-${job.job_id}`;
            tbody.innerHTML += `
            <tr>
                <td>${job.job_id}</td>
                <td>${job.client_name}</td>
                <td>${job.design_name}</td>
                <td>${job.saree_count}</td>
                <td>
                    <label>Num Workers: 
                        <input type="number" id="${numWorkersId}" min="1" max="10" placeholder="e.g. 2" style="width: 60px;" oninput="initWorkerTargets(${job.job_id})">
                    </label>
                    <div id="workers-${job.job_id}" style="margin-top: 0.5rem"></div>
                </td>
                <td><div id="targets-${job.job_id}" class="worker-targets"></div>
                    <input type="hidden" id="job-target-${job.job_id}" value="${job.saree_count}">
                </td>
                <td>${materialOptionsHtml(`material-${job.job_id}`)}</td>
                <td><input type="number" min="1" step="0.01" id="qty-${job.job_id}" placeholder="Qty"></td>
                <td><button type="button" onclick="submitAssign(${job.job_id})">Assign</button></td>
            </tr>`;
        });
    } catch (e) {
        console.error("loadNewJobs", e);
        alert(e.message || "Failed to load pending jobs");
    }
}

window.initWorkerTargets = function(jobId) {
    const numInput = document.getElementById(`num-workers-${jobId}`);
    const workersWrap = document.getElementById(`workers-${jobId}`);
    const targetsWrap = document.getElementById(`targets-${jobId}`);
    const hiddenTarget = document.getElementById(`job-target-${jobId}`);
    
    if (!numInput || !workersWrap || !targetsWrap || !hiddenTarget) return;

    const num = parseInt(numInput.value, 10);
    const sareeCount = Number(hiddenTarget.value) || 0;

    if (isNaN(num) || num < 1) {
        workersWrap.innerHTML = "";
        targetsWrap.innerHTML = `<span class="hint">Enter number of workers to view inputs.</span>`;
        return;
    }

    const base = Math.floor(sareeCount / num);
    let rem = Math.round(sareeCount - base * num);

    let workersHtml = "";
    let targetsHtml = "";
    let eligibleCount = 0;

    workersCache.forEach((w) => {
        const active = w.activeWork || 0;
        const threshold = w.work_threshold || 100;
        if (active + base <= threshold) eligibleCount++;
    });

    if (eligibleCount < num) {
        alert("No workers available within threshold");
    }

    for (let i = 0; i < num; i++) {
        let q = base;
        if (rem > 0) {
            q += 1;
            rem -= 1;
        }
        workersHtml += `<div>${generateWorkerSelect(jobId, i, q)}</div>`;
        targetsHtml += `<div style="margin-bottom:0.2rem; height: 26px; display:flex; align-items:center;">
                            Qty: <input type="number" min="1" step="1" id="wt-${jobId}-${i}" value="${q}" style="width:4rem; margin-left:0.5rem" readonly>
                        </div>`;
    }

    workersWrap.innerHTML = workersHtml;
    targetsWrap.innerHTML = targetsHtml + `<div style="margin-top:0.35rem;font-size:0.9em"><strong>Must sum to job target: ${sareeCount}</strong></div>`;
};

async function submitAssign(jobId) {
    const numInput = document.getElementById(`num-workers-${jobId}`);
    const materialSel = document.getElementById(`material-${jobId}`);
    const qtyInput = document.getElementById(`qty-${jobId}`);
    const hiddenTarget = document.getElementById(`job-target-${jobId}`);
    
    if (!numInput || !materialSel || !qtyInput || !hiddenTarget) return;

    const num = parseInt(numInput.value, 10);
    if (isNaN(num) || num < 1) {
        alert("Enter a valid number of workers");
        return;
    }

    const assignments = [];
    let sum = 0;
    let thresholdExceeded = false;
    let perWorkerQtyStr = [];

    for (let i = 0; i < num; i++) {
        const wSel = document.getElementById(`worker-sel-${jobId}-${i}`);
        const tSel = document.getElementById(`wt-${jobId}-${i}`);
        if (!wSel || !tSel) continue;
        
        const wid = parseInt(wSel.value, 10);
        const qty = parseFloat(tSel.value, 10);
        
        if (isNaN(wid)) {
            alert(`Please select a worker for row ${i + 1}`);
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            alert(`Please enter a positive quantity for row ${i + 1}`);
            return;
        }

        const wData = workersCache.find(w => w.id === wid);
        if (wData) {
            const active = wData.activeWork || 0;
            const threshold = wData.work_threshold || 100;
            if (active + qty > threshold) {
                thresholdExceeded = true;
            }
        }
        
        assignments.push({ worker_id: wid, quantity: qty });
        sum += qty;
        perWorkerQtyStr.push(qty);
    }
    
    if (thresholdExceeded) {
        alert("Threshold exceeded for one or more selected workers");
        return;
    }

    const jobTarget = Number(hiddenTarget.value) || 0;
    
    if (Math.abs(sum - jobTarget) > 0.001) {
        alert(`Per-worker quantities must sum to the job target (${jobTarget}). Current sum: ${sum}`);
        return;
    }

    const material_id = parseInt(materialSel.value, 10);
    const required_quantity = parseFloat(qtyInput.value);
    if (Number.isNaN(material_id)) {
        alert("Select material");
        return;
    }
    if (Number.isNaN(required_quantity) || required_quantity <= 0) {
        alert("Enter valid required quantity");
        return;
    }

    const mat = materialsCache.find(m => m.material_id === material_id);
    if (mat && required_quantity > Number(mat.quantity_available)) {
        alert("Not enough material");
        return;
    }

    const matName = mat ? mat.yarn_type : "Selected Material";
    const avgQty = perWorkerQtyStr.length > 0 ? (sum / num).toFixed(2) : 0;
    const confirmMsg = `Assign ${num} workers?\nEach will handle ~${avgQty} sarees\nMaterial used: ${matName} ${required_quantity}`;
    
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const result = await apiRequest("POST", "/jobs/assign-workers", {
            job_id: jobId,
            assignments,
            material_id,
            required_quantity
        });
        alert(result.message || "Assignment completed");
        await reloadSupervisorDashboard();
    } catch (e) {
        alert(e.message || String(e));
    }
}

async function loadPendingVerification() {
    try {
        const jobs = await apiRequest(
            "GET",
            `/jobs?status=${encodeURIComponent("pending_verification")}`
        );
        console.log("API:", jobs);
        console.log("Jobs State:", jobs);

        const tbody = document.querySelector("#verify-jobs-table tbody");
        tbody.innerHTML = "";

        if (!jobs.length) {
            tbody.innerHTML =
                '<tr><td colspan="6">No data available</td></tr>';
            return;
        }

        jobs.forEach((job) => {
            tbody.innerHTML += `
            <tr>
                <td><input type="checkbox" id="verify-check-${job.job_id}"></td>
                <td>${job.job_id}</td>
                <td>${job.client_name}</td>
                <td>${job.design_name}</td>
                <td><input type="text" id="remarks-${job.job_id}" placeholder="Optional remarks"></td>
                <td><button type="button" onclick="approveJob(${job.job_id})">Approve</button></td>
            </tr>`;
        });
    } catch (e) {
        console.error("loadPendingVerification", e);
        alert(e.message || "Failed to load verification queue");
    }
}

async function approveJob(jobId) {
    const box = document.getElementById(`verify-check-${jobId}`);
    if (!box || !box.checked) {
        alert("Check the box to confirm verification");
        return;
    }
    const remarksEl = document.getElementById(`remarks-${jobId}`);
    const remarks = remarksEl ? remarksEl.value : "";
    try {
        await apiRequest("PUT", `/jobs/verify/${jobId}`, { verified: true, remarks });
        await reloadSupervisorDashboard();
    } catch (e) {
        alert(e.message || String(e));
    }
}

let allMaterialRows = [];

function materialFilterValue() {
    const el = document.getElementById("supervisor-mr-filter");
    return el ? el.value : "all";
}

function renderSupervisorMaterialTable() {
    const tbody = document.getElementById("supervisor-request-table");
    if (!tbody) return;
    const f = materialFilterValue();
    tbody.innerHTML = "";
    const rows =
        f === "all"
            ? allMaterialRows
            : allMaterialRows.filter((r) => r.status === f);
    if (!rows.length) {
        tbody.innerHTML =
            '<tr><td colspan="5">No data available</td></tr>';
        return;
    }
    rows.forEach((req) => {
        tbody.innerHTML += `
                <tr>
                    <td>${req.id}</td>
                    <td>${req.job_name}</td>
                    <td>${req.material_name}</td>
                    <td>${req.quantity}</td>
                    <td>${req.status}</td>
                </tr>`;
    });
}

async function loadSupervisorMaterialRequests() {
    try {
        allMaterialRows = await apiRequest("GET", "/material-requests");
        renderSupervisorMaterialTable();
    } catch (err) {
        console.error("loadSupervisorMaterialRequests:", err);
        alert("Error loading material requests: " + (err.message || err));
    }
}

async function loadProductionVerificationQueue() {
    const tbody = document.querySelector("#production-verify-table tbody");
    if (!tbody) return;
    try {
        const rows = await apiRequest("GET", "/production/pending-verification");
        tbody.innerHTML = "";
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="7">No pending production entries</td></tr>';
            return;
        }
        rows.forEach((r) => {
            const when = r.production_date
                ? new Date(r.production_date).toLocaleString()
                : "—";
            tbody.innerHTML += `
            <tr>
                <td>${r.production_id}</td>
                <td>${r.job_id}</td>
                <td>${r.client_name} / ${r.design_name}</td>
                <td>${r.quantity_completed}</td>
                <td>${r.worker_name || "—"}</td>
                <td>${when}</td>
                <td><button type="button" onclick="verifyProductionRow(${r.production_id})">Verify</button></td>
            </tr>`;
        });
    } catch (e) {
        console.error(e);
        const msg = (e && e.message) ? String(e.message).replace(/</g, "&lt;") : "Unknown error";
        tbody.innerHTML = `<tr><td colspan="7">Failed to load: ${msg}</td></tr>`;
    }
}

async function verifyProductionRow(productionId) {
    try {
        await apiRequest("PUT", `/production/entries/${productionId}/verify`, {});
        await loadProductionVerificationQueue();
    } catch (e) {
        alert(e.message || String(e));
    }
}

window.verifyProductionRow = verifyProductionRow;

async function reloadSupervisorDashboard() {
    await loadMaterials();
    await loadWorkers();
    await loadNewJobs();
    await loadProductionVerificationQueue();
    await loadPendingVerification();
    await loadSupervisorMaterialRequests();
}

document.addEventListener("DOMContentLoaded", async () => {
    const mf = document.getElementById("supervisor-mr-filter");
    if (mf) {
        mf.addEventListener("change", renderSupervisorMaterialTable);
    }
    await loadWorkers();
    await loadMaterials();
    await reloadSupervisorDashboard();
});
