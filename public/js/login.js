document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("userId", data.userId);

        if (data.role === "manufacturer") {
            window.location.href = "dashboard.html";
        } else if (data.role === "supervisor") {
            window.location.href = "supervisor-dashboard.html";
        } else if (data.role === "worker") {
            window.location.href = "worker-dashboard.html";
        }
    } else {
        document.getElementById("errorMsg").innerText = data.message;
    }
});
