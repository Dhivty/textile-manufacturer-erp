document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Registration successful");
        window.location.href = "login.html";
    } else {
        document.getElementById("errorMsg").innerText = data.message;
    }
});