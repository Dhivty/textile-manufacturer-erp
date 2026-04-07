function unpackAssignmentsPayload(raw) {
    if (Array.isArray(raw)) {
        return { jobs: raw, floorAccount: false };
    }
    if (raw && Array.isArray(raw.assignments)) {
        return { jobs: raw.assignments, floorAccount: !!raw.floorAccount };
    }
    return { jobs: [], floorAccount: false };
}

async function loadJobOptions() {
    const role = sessionStorage.getItem("role");
    const sel = document.getElementById("job");
    if (!sel) return;

    sel.innerHTML = '<option value="">— Select job —</option>';

    try {
        if (role === "worker") {
            const raw = await apiRequest("GET", "/jobs/my-assignments");
            const { jobs } = unpackAssignmentsPayload(raw);
            jobs.forEach((j) => {
                if (j.job_status !== "In Production") return;
                const opt = document.createElement("option");
                const allot =
                    j.assigned_quantity != null ? j.assigned_quantity : j.saree_count;
                const logged = j.your_quantity_logged != null ? j.your_quantity_logged : 0;
                const slot = j.slot_worker_name ? ` — ${j.slot_worker_name}` : "";
                if (j.assignment_id != null) {
                    opt.value = `${j.job_id}:${j.assignment_id}`;
                } else {
                    opt.value = String(j.job_id);
                }
                opt.textContent = `#${j.job_id}${slot} — ${j.design_name} (target ${allot}, logged ${logged})`;
                sel.appendChild(opt);
            });
        } else if (role === "supervisor") {
            const jobs = await apiRequest(
                "GET",
                `/jobs?status=${encodeURIComponent("In Production")}`
            );
            jobs.forEach((j) => {
                const opt = document.createElement("option");
                opt.value = j.job_id;
                opt.textContent = `#${j.job_id} — ${j.client_name} / ${j.design_name}`;
                sel.appendChild(opt);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

async function submitProd() {
    const rawVal = document.getElementById("job").value;
    const quantity_completed = document.getElementById("qty").value;

    if (!rawVal) {
        alert("Select a job");
        return;
    }

    let job_id;
    let assignment_id;
    if (rawVal.includes(":")) {
        const parts = rawVal.split(":");
        job_id = parseInt(parts[0], 10);
        assignment_id = parseInt(parts[1], 10);
    } else {
        job_id = parseInt(rawVal, 10);
    }

    const body = {
        job_id,
        quantity_completed: Number(quantity_completed)
    };
    if (Number.isFinite(assignment_id)) {
        body.assignment_id = assignment_id;
    }

    try {
        await apiRequest("POST", "/production", body);
        alert("Production added");
        document.getElementById("qty").value = "";
        await loadJobOptions();
    } catch (e) {
        alert(e.message || "Request failed");
    }
}

document.addEventListener("DOMContentLoaded", loadJobOptions);
