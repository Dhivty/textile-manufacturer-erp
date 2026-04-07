const API_BASE = "/api";

async function apiRequest(method, url, body = null) {
    const token = sessionStorage.getItem("token");

    const fullUrl = API_BASE + url;
    const res = await fetch(fullUrl, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: body ? JSON.stringify(body) : null
    });

    const ct = res.headers.get("content-type") || "";
    let payload = null;
    try {
        payload = ct.includes("application/json") ? await res.json() : await res.text();
    } catch (_) {
        payload = null;
    }

    if (!res.ok) {

        console.error("[apiRequest] Failed:", {
            method,
            url,
            fullUrl,
            status: res.status,
            contentType: ct,
            payload
        });

        if (payload && typeof payload === "object" && payload.message) {
            throw new Error(payload.message);
        }
        if (typeof payload === "string" && payload.trim()) {
            // If server returned HTML (e.g., "Cannot POST ..."), show a short snippet.
            throw new Error(payload.replace(/\s+/g, " ").slice(0, 160));
        }
        throw new Error(`API error (${res.status})`);
    }

    if (payload && typeof payload === "object" && payload.success === false) {
        throw new Error(payload.message || "Request failed");
    }
    if (payload && typeof payload === "object" && payload.success === true && "data" in payload) {
        return payload.data;
    }
    return payload;
}