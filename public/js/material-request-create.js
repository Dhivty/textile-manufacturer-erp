let materialsCache = [];

async function loadDropdowns() {
    try {
        const jobs = await apiRequest("GET", "/jobs"); 
        const jobSelect = document.getElementById("job_id");
        jobs.forEach(j => {
            const opt = document.createElement("option");
            opt.value = j.job_id;
            opt.textContent = `${j.client_name} - ${j.design_name}`;
            jobSelect.appendChild(opt);
        });

        const materials = await apiRequest("GET", "/materials");
        materialsCache = materials;
        const matSelect = document.getElementById("material_id");
        materials.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.material_id;
            opt.textContent = `${m.yarn_type} (Available Qty: ${m.quantity_available})`;
            matSelect.insertBefore(opt, matSelect.lastElementChild);
        });
    } catch (e) {
        console.error(e);
    }
}

function handleMaterialChange() {
    const v = document.getElementById("material_id").value;
    const n = document.getElementById("new_material_name");
    if (v === "other") {
        n.style.display = "inline-block";
        n.required = true;
    } else {
        n.style.display = "none";
        n.required = false;
        n.value = "";
    }
}
window.handleMaterialChange = handleMaterialChange;

document.addEventListener("DOMContentLoaded", loadDropdowns);

document.getElementById("request-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const jobId = parseInt(document.getElementById("job_id").value, 10);
    const materialIdStr = document.getElementById("material_id").value;
    const newMatName = document.getElementById("new_material_name").value.trim();
    const quantity = parseFloat(document.getElementById("quantity").value);

    let materialId = null;

    if (materialIdStr !== "other") {
        materialId = parseInt(materialIdStr, 10);
        const mat = materialsCache.find(m => m.material_id === materialId);
        if (mat && quantity > Number(mat.quantity_available)) {
            alert("Insufficient material");
            return;
        }
    } else {
        if (!newMatName) {
            alert("Please provide the new material name");
            return;
        }
    }

    const data = {
        job_id: jobId,
        material_id: materialId,
        quantity: quantity,
        new_material_name: newMatName
    };

    try {
        await apiRequest("POST", "/material-requests", data);
        alert("Request sent to manufacturer");
        e.target.reset();
    } catch (err) {
        alert(err.message);
    }
});