const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwtSecret");

const ALLOWED_ROLES = ["manufacturer", "supervisor", "worker"];

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
        "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        [name, email, hashed, role]
    );

    res.json({ message: "Registered" });
};

exports.login = async (req, res) => {
    const { email, password, role: selectedRole } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);

    if (rows.length === 0) return res.status(401).json({ message: "Invalid" });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Wrong password" });

    if (selectedRole && user.role !== selectedRole) {
        return res.status(401).json({ message: "Role does not match account" });
    }

    const token = jwt.sign(
        { id: Number(user.id), role: user.role },
        JWT_SECRET
    );

    res.json({ token, role: user.role, userId: Number(user.id) });
};

exports.getMe = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const [rows] = await db.query("SELECT id, name, email, role, work_threshold FROM users WHERE id=?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    
    res.json({ data: rows[0] });
};

exports.updateThreshold = async (req, res) => {
    if (!req.user || !req.user.id || req.user.role !== 'worker') {
        return res.status(403).json({ message: "Only workers can update threshold" });
    }
    
    const { work_threshold } = req.body;
    let newThreshold = parseInt(work_threshold, 10);
    
    if (isNaN(newThreshold) || newThreshold < 1) {
        return res.status(400).json({ message: "Threshold must be a valid positive number" });
    }
    
    await db.query("UPDATE users SET work_threshold = ? WHERE id = ?", [newThreshold, req.user.id]);
    res.json({ message: "Threshold updated successfully" });
};