function loadNavbar() {
    const role = sessionStorage.getItem("role"); // ✅ FIXED

    let nav = `<nav>`;

    if (role === "manufacturer") {
        nav += `
        <a href="dashboard.html">Dashboard</a>
        <a href="index.html">Jobs</a>
        <a href="create-job.html">Create Job</a>
        <a href="alerts.html">Alerts</a>
        <a href="invoice.html">Invoice</a>
        <a href="reports.html">Reports</a>
        <a href="material-requests.html">Material Requests</a>
        <a href="leave-approval.html">Leave</a>
        <a href="inventory.html">Inventory</a>
        `;
    }

    if (role === "supervisor") {
        nav += `
        <a href="supervisor-dashboard.html">Dashboard</a>
        <a href="production-dashboard.html">Production</a>
        <a href="material-request-create.html">Material Requests</a>
        <a href="production-entry.html">Production Entry</a>
        <a href="leave.html">Leave</a>
        `;
    }

    if (role === "worker") {
        nav += `
        <a href="worker-dashboard.html">Dashboard</a>
        <a href="production-entry.html">Production Entry</a>
        <a href="leave.html">Leave</a>
        `;
    }

    nav += `<a href="#" onclick="logout()">Logout</a></nav>`;

    document.body.insertAdjacentHTML("afterbegin", nav);
}
function setActiveLink() {
    const links = document.querySelectorAll("nav a");
    const current = window.location.pathname.split("/").pop();

    links.forEach(link => {
        if (link.getAttribute("href") === current) {
            link.style.background = "#364a37";
            link.style.borderRadius = "5px";
        }
    });
}
loadNavbar();
setActiveLink();