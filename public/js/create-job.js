document.getElementById("create-job-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!data.client_name || !data.design_name || !data.saree_count || !data.deadline) {
        alert("All fields are required");
        return;
    }

    try {
        await apiRequest("POST", "/jobs", data);
        alert("Job Created Successfully");
        e.target.reset();
        window.location.href = "index.html";
    } catch (err) {
        alert(err.message || "Error creating job");
    }
});
