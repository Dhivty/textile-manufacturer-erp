function getRole() {
    return sessionStorage.getItem("role"); // ✅ FIXED
}

function protectPage(allowedRoles) {
    const role = getRole();

    if (!role || !allowedRoles.includes(role)) {
        alert("Access denied");
        window.location.href = "login.html";
    }
}

function logout() {
    sessionStorage.clear(); // ✅ FIXED
    window.location.href = "login.html";
}