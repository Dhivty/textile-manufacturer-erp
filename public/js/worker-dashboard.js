function unpackAssignmentsPayload(raw) {
    if (Array.isArray(raw)) {
        return { jobs: raw, floorAccount: false };
    }
    if (raw && Array.isArray(raw.assignments)) {
        return { jobs: raw.assignments, floorAccount: !!raw.floorAccount };
    }
    return { jobs: [], floorAccount: false };
}

async function loadProfile() {
    try {
        const res = await apiRequest("GET", "/auth/me");
        if (res && res.data) {
            const currentEl = document.getElementById("current-threshold");
            if (currentEl) {
                currentEl.innerText = res.data.work_threshold;
            }
        }
    } catch (e) {
        console.error("Failed to load profile:", e);
    }
}

async function updateWorkThreshold() {
    const input = document.getElementById("new-threshold");
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) {
        alert("Please enter a valid positive number.");
        return;
    }
    try {
        await apiRequest("PUT", "/auth/threshold", { work_threshold: val });
        alert("Threshold updated successfully.");
        await loadProfile();
        input.value = "";
    } catch (e) {
        console.error(e);
        alert(e.message || "Failed to update threshold");
    }
}


async function loadAssignedJobs() {
    const token = sessionStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const raw = await apiRequest("GET", "/jobs/my-assignments");
        const { jobs } = unpackAssignmentsPayload(raw);

        const tbody = document.getElementById("worker-jobs-table");
        if (!tbody) return;

        tbody.innerHTML = "";

        const filteredJobs = jobs.filter(job => {
            console.log("Job status:", job.job_status);
            return job.job_status !== "completed";
        });

        if (!filteredJobs.length) {
            tbody.innerHTML = `<tr><td colspan="9">No jobs assigned</td></tr>`;
            return;
        }

        filteredJobs.forEach((job) => {
            if (job.job_status === "Pending" || job.job_status === "pending") return;
            const yourTarget =
                job.assigned_quantity != null ? job.assigned_quantity : job.saree_count;
            const slotCell = `<td>${job.slot_worker_name || "—"}</td>`;
            const aidArg =
                job.assignment_id == null ? "null" : Number(job.assignment_id);
            tbody.innerHTML += `
                <tr>
                    <td>${job.job_id}</td>
                    <td>${job.client_name}</td>
                    <td>${job.design_name}</td>
                    <td>${job.saree_count}</td>
                    <td>${yourTarget}</td>
                    ${slotCell}
                    <td>${job.job_status === 'assigned' ? 'In Production' : job.job_status === 'pending_verification' ? 'Waiting for Approval' : job.job_status}</td>
                    <td>
                        ${
                            job.job_status === "pending_verification" || job.your_assignment_completed_at
                                ? `<span style="color:orange; font-weight:bold;">Waiting for Approval</span>`
                                : job.job_status === "completed"
                                    ? `<span style="color:green; font-weight:bold;">Completed</span>`
                                    : job.job_status === "assigned"
                                        ? `<button type="button" onclick="markJobPendingVerification(${job.job_id}, ${aidArg})">Mark as Completed</button>`
                                        : `<span style="color:gray;">Pending</span>`
                        }
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("loadAssignedJobs error:", err);
        alert(err.message || "Failed to load assigned jobs");
    }
}

async function markJobPendingVerification(jobId, assignmentId) {
    if (!confirm("Mark this job as completed? It will be sent to supervisor for approval.")) {
        return;
    }
    try {
        const body = {};
        if (assignmentId != null && assignmentId !== "null") {
            body.assignment_id = Number(assignmentId);
        }
        await apiRequest("PUT", `/jobs/mark-complete/${jobId}`, body);
        await loadAssignedJobs();
    } catch (err) {
        console.error("markJobPendingVerification error:", err);
        alert(err.message || "Failed to mark job complete");
    }
}

window.markJobPendingVerification = markJobPendingVerification;
window.updateWorkThreshold = updateWorkThreshold;

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadAssignedJobs();
});
