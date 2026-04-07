async function loadAlerts() {
    try {
        const data = await apiRequest("GET", "/materials/low-stock");
        const div = document.getElementById("alerts");

        if (!data.length) {
            div.innerHTML = "<p>No low-stock materials.</p>";
            return;
        }

        div.innerHTML = data.map(m => `
            <div class="alert-card">
                <h3>${m.material_name}</h3>
                <p><strong>Available:</strong> ${m.quantity_available}</p>
                <p><strong>Threshold:</strong> ${m.threshold}</p>
            </div>
        `).join("");

    } catch (err) {
        console.error(err);
        document.getElementById("alerts").innerHTML =
            "<p>Error loading alerts</p>";
    }
}

loadAlerts();