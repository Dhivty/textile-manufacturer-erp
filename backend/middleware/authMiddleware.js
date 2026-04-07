const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwtSecret");

module.exports = function (req, res, next) {
    const authHeader = req.headers.authorization || req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.split(" ")[1] || authHeader.trim();

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const id = Number(decoded.id);
        req.user = {
            ...decoded,
            id: Number.isFinite(id) ? id : decoded.id
        };
        next();
    } catch (err) {
        console.error("[ authMiddleware ] JWT verify failed:", err.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};
