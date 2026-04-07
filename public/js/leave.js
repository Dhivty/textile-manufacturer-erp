document.getElementById("leave-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        from_date: document.getElementById("from_date").value,
        to_date: document.getElementById("to_date").value,
        reason: document.getElementById("reason").value
    };

    try {
        await apiRequest("POST", "/leaves", data);
        alert("Leave applied");

        e.target.reset();
        loadMyLeaves();

    } catch (err) {
        alert(err.message);
    }
});

// 🔥 LOAD WORKER LEAVE HISTORY
async function loadMyLeaves() {
    try {
        const data = await apiRequest("GET", "/leaves/my");

        const tbody = document.getElementById("leave-history");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="4">No leave requests</td></tr>`;
            return;
        }

        data.forEach(l => {
            let statusColor = "black";

            if (l.status === "approved") statusColor = "green";
            if (l.status === "rejected") statusColor = "red";
            if (l.status === "pending") statusColor = "orange";

            tbody.innerHTML += `
                <tr>
                    <td>${l.from_date}</td>
                    <td>${l.to_date}</td>
                    <td>${l.reason}</td>
                    <td style="color:${statusColor};font-weight:bold">
                        ${l.status}
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

loadMyLeaves();