const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "erperp",
    database: process.env.DB_NAME || "textile_erp"
});

console.log("MySQL Pool Created");

// Simple error logging
db.getConnection()
    .then(connection => {
        console.log("Database connected successfully");
        connection.release();
    })
    .catch(err => {
        console.error("Database connection failed:", err.message);
    });

module.exports = db;