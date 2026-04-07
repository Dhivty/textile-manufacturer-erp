// update-status.js
const API_BASE = "/api";
document.getElementById('update-status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE}/jobs/${data.job_id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: data.status })
        });
        const resData = await response.json();
        alert(resData.message || 'Status updated');
    } catch (err) {
        alert(err.message || 'Error updating status');
    }
});