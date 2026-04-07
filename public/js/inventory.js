async function loadInventory() {
    try {
        const data = await apiRequest("GET", "/materials");

        const tbody = document.getElementById("inventory-table");
        tbody.innerHTML = "";

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5">No materials</td></tr>`;
            return;
        }

        data.forEach((m, index) => {
            const qty = Number(m.quantity_available);
            const threshold = Number(m.threshold);

            const status =
                qty < threshold
                    ? `<span style="color:red;font-weight:bold">LOW</span>`
                    : `<span style="color:green">OK</span>`;

            tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${m.yarn_type}</td>
                <td>${parseInt(m.quantity_available)}</td>
                <td>${parseInt(m.threshold)}</td>
                <td>${status}</td>
                <td>
                <button onclick="deleteMaterial(${m.material_id})">Delete</button>
                </td>
            </tr>`;
        });

    } catch (err) {
        console.error(err);
    }
}

// 🔥 ADD MATERIAL FUNCTION
async function addMaterial() {
    const name = document.getElementById("name").value;
    const qty = document.getElementById("qty").value;
    const threshold = document.getElementById("threshold").value;

    if (!name || !qty || !threshold) {
        alert("Fill all fields");
        return;
    }

    try {
        await apiRequest("POST", "/materials", {
            material_name: name,
            quantity_available: qty,
            threshold: threshold
        });

        alert("Material added");

        // clear inputs
        document.getElementById("name").value = "";
        document.getElementById("qty").value = "";
        document.getElementById("threshold").value = "";

        loadInventory();

    } catch (err) {
        alert(err.message);
    }
}
async function deleteMaterial(id) {
    if (!confirm("Delete material?")) return;

    await apiRequest("DELETE", `/materials/${id}`);
    loadInventory();
}
loadInventory();