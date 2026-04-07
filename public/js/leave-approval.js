async function loadLeaves() {
    const data = await apiRequest("GET", "/leaves");

    const tbody = document.getElementById("leave-table");
    tbody.innerHTML = "";

    data.forEach(l => {
        const actions =
            l.status === "pending"
                ? `
                <button onclick="approve(${l.id})">Approve</button>
                <button onclick="reject(${l.id})">Reject</button>
                `
                : l.status;

        tbody.innerHTML += `
        <tr>
            <td>${l.name}</td>
            <td>${l.from_date}</td>
            <td>${l.to_date}</td>
            <td>${l.reason}</td>
            <td>${l.status}</td>
            <td>${actions}</td>
        </tr>
        `;
    });
}

async function approve(id) {
    await apiRequest("PUT", `/leaves/${id}/approve`);
    loadLeaves();
}

async function reject(id) {
    await apiRequest("PUT", `/leaves/${id}/reject`);
    loadLeaves();
}

loadLeaves();