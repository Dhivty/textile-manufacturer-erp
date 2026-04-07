const db = require("./db");

async function columnExists(tableName, columnName) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tableName, columnName]
    );
    return rows[0].c > 0;
}

async function indexExists(tableName, indexName) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [tableName, indexName]
    );
    return rows[0].c > 0;
}

async function tryExec(sql, ignoreCodes = ["ER_DUP_KEYNAME", "ER_DUP_FIELDNAME", "ER_CANT_DROP_FIELD_OR_KEY"]) {
    try {
        await db.query(sql);
    } catch (err) {
        if (ignoreCodes.includes(err.code)) return;
        if (err.code === "ER_FK_DUP_NAME" || err.errno === 1826) return;
        if (String(err.message).includes("Duplicate")) return;
        console.warn("[ ensureSchema ]", err.code || err.message, sql.slice(0, 80));
    }
}

/**
 * Users: support manufacturer / supervisor / worker (migrate admin→manufacturer, staff→worker).
 */
async function ensureUserRoles() {
    await tryExec("ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL DEFAULT 'worker'");
    try {
        await db.query("UPDATE users SET role = 'worker' WHERE role = 'staff'");
        await db.query("UPDATE users SET role = 'manufacturer' WHERE role = 'admin'");
    } catch (err) {
        console.warn("[ ensureSchema ] user role migration:", err.message);
    }
    
    if (!(await columnExists("users", "work_threshold"))) {
        await tryExec(
            "ALTER TABLE users ADD COLUMN work_threshold INT NOT NULL DEFAULT 100",
            ["ER_DUP_FIELDNAME"]
        );
    }
}

/** Shared shop-floor tablet: sees every job_assignment row. Set SHARED_FLOOR_WORKER_EMAIL in backend/.env to that worker's email. */
async function ensureUserFloorAccount() {
    if (!(await columnExists("users", "floor_account"))) {
        await tryExec(
            "ALTER TABLE users ADD COLUMN floor_account TINYINT(1) NOT NULL DEFAULT 0",
            ["ER_DUP_FIELDNAME"]
        );
    }
    const email = process.env.SHARED_FLOOR_WORKER_EMAIL;
    if (email && String(email).trim()) {
        try {
            await db.query(
                `UPDATE users SET floor_account = 1 WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))`,
                [String(email).trim()]
            );
        } catch (err) {
            console.warn("[ ensureSchema ] SHARED_FLOOR_WORKER_EMAIL:", err.message);
        }
    }
    const floorId = process.env.SHARED_FLOOR_WORKER_ID;
    if (floorId != null && String(floorId).trim() !== "") {
        const id = parseInt(String(floorId).trim(), 10);
        if (Number.isFinite(id)) {
            try {
                await db.query(`UPDATE users SET floor_account = 1 WHERE id = ?`, [id]);
            } catch (err) {
                console.warn("[ ensureSchema ] SHARED_FLOOR_WORKER_ID:", err.message);
            }
        }
    }

    try {
        const [[wc]] = await db.query(
            `SELECT COUNT(*) AS c FROM users WHERE LOWER(TRIM(role)) = 'worker'`
        );
        if (wc && Number(wc.c) === 1) {
            await db.query(`UPDATE users SET floor_account = 1 WHERE LOWER(TRIM(role)) = 'worker'`);
            console.log(
                "[ ensureSchema ] Single worker account: floor_account enabled (sees all job slots)"
            );
        }
    } catch (err) {
        console.warn("[ ensureSchema ] worker count / floor_account:", err.message);
    }
}

/**
 * Jobs: VARCHAR status + migrate legacy "New" → "Pending"
 */
async function ensureJobStatusColumn() {
    await tryExec(
        "ALTER TABLE jobs MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Pending'",
        ["ER_BAD_FIELD_ERROR"]
    );
    try {
        await db.query("UPDATE jobs SET status = 'Pending' WHERE status = 'New'");
    } catch (err) {
        console.warn("[ ensureSchema ] job status migration:", err.message);
    }
}

async function ensureJobAssignments() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS job_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            worker_id INT NOT NULL,
            assigned_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_job_worker (job_id, worker_id),
            KEY idx_ja_job (job_id),
            KEY idx_ja_worker (worker_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await tryExec(
        `ALTER TABLE job_assignments
         ADD CONSTRAINT fk_ja_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE`
    );
    await tryExec(
        `ALTER TABLE job_assignments
         ADD CONSTRAINT fk_ja_worker FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE`
    );
    await tryExec(
        `ALTER TABLE job_assignments
         ADD CONSTRAINT fk_ja_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL`
    );

    if (!(await columnExists("job_assignments", "loom_number"))) {
        await tryExec(
            "ALTER TABLE job_assignments ADD COLUMN loom_number VARCHAR(50) NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }
    if (!(await columnExists("job_assignments", "completed_at"))) {
        await tryExec(
            "ALTER TABLE job_assignments ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }
    if (!(await columnExists("job_assignments", "assigned_quantity"))) {
        await tryExec(
            "ALTER TABLE job_assignments ADD COLUMN assigned_quantity DECIMAL(10,2) NULL DEFAULT NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }
}

async function ensureProductionTable() {
    const [rows] = await db.query(
        `SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production' AND NON_UNIQUE = 0
         GROUP BY INDEX_NAME`
    );
    for (const row of rows) {
        if (row.INDEX_NAME === "PRIMARY") continue;
        if (String(row.cols) === "job_id") {
            await tryExec(
                `ALTER TABLE production DROP INDEX \`${row.INDEX_NAME}\``,
                ["ER_CANT_DROP_FIELD_OR_KEY", "ER_DROP_INDEX_FK"]
            );
        }
    }

    if (!(await columnExists("production", "worker_id"))) {
        await tryExec(
            "ALTER TABLE production ADD COLUMN worker_id INT NULL DEFAULT NULL",
            ["ER_DUP_FIELDNAME"]
        );
        await tryExec(
            "ALTER TABLE production ADD KEY idx_production_worker (worker_id)",
            ["ER_DUP_KEYNAME"]
        );
        await tryExec(
            `ALTER TABLE production
             ADD CONSTRAINT fk_production_worker FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE SET NULL`,
            ["ER_DUP_KEYNAME", "ER_CANT_CREATE_TABLE", "ER_FK_DUP_NAME", "ER_DUP_FIELDNAME"]
        );
    }

    if (!(await columnExists("production", "verified"))) {
        await tryExec(
            "ALTER TABLE production ADD COLUMN verified TINYINT(1) NOT NULL DEFAULT 1",
            ["ER_DUP_FIELDNAME"]
        );
    }
    if (!(await columnExists("production", "verified_at"))) {
        await tryExec(
            "ALTER TABLE production ADD COLUMN verified_at TIMESTAMP NULL DEFAULT NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }
    if (!(await columnExists("production", "verified_by"))) {
        await tryExec(
            "ALTER TABLE production ADD COLUMN verified_by INT NULL DEFAULT NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }
    await tryExec(
        `ALTER TABLE production
         ADD CONSTRAINT fk_production_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL`,
        ["ER_DUP_KEYNAME", "ER_CANT_CREATE_TABLE", "ER_FK_DUP_NAME", "ER_DUP_FIELDNAME"]
    );
}

async function ensureJobVerification() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS job_verification (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            verified_by INT NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'approved',
            remarks TEXT NULL,
            verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_jv_job (job_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await tryExec(
        `ALTER TABLE job_verification
         ADD CONSTRAINT fk_jv_job FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE`
    );
    await tryExec(
        `ALTER TABLE job_verification
         ADD CONSTRAINT fk_jv_user FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE CASCADE`
    );
}

async function ensureMaterialRequestsTables() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS material_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NULL,
            material_id INT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending',
            requested_by INT NULL,
            approved_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_job_id (job_id),
            KEY idx_material_id (material_id),
            KEY idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    if (!(await columnExists("material_requests", "requested_by"))) {
        await tryExec(
            "ALTER TABLE material_requests ADD COLUMN requested_by INT NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }
    if (!(await columnExists("material_requests", "approved_by"))) {
        await tryExec(
            "ALTER TABLE material_requests ADD COLUMN approved_by INT NULL",
            ["ER_DUP_FIELDNAME"]
        );
    }

    if (!(await columnExists("raw_materials", "threshold"))) {
        await tryExec(
            "ALTER TABLE raw_materials ADD COLUMN threshold DECIMAL(10,2) NOT NULL DEFAULT 100",
            ["ER_DUP_FIELDNAME"]
        );
    }

    if (!(await indexExists("material_requests", "idx_job_id"))) {
        await tryExec("CREATE INDEX idx_job_id ON material_requests (job_id)");
    }
    if (!(await indexExists("material_requests", "idx_material_id"))) {
        await tryExec("CREATE INDEX idx_material_id ON material_requests (material_id)");
    }
    if (!(await indexExists("material_requests", "idx_status"))) {
        await tryExec("CREATE INDEX idx_status ON material_requests (status)");
    }

    await tryExec(
        `ALTER TABLE material_requests
         ADD CONSTRAINT fk_material_requests_job
         FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE RESTRICT`
    );
    await tryExec(
        `ALTER TABLE material_requests
         ADD CONSTRAINT fk_material_requests_material
         FOREIGN KEY (material_id) REFERENCES raw_materials(material_id) ON DELETE RESTRICT`
    );
}

/**
 * Ensures schema for jobs workflow, material_requests, and role column.
 */
async function ensureSchema() {
    await ensureUserRoles();
    await ensureUserFloorAccount();
    await ensureJobStatusColumn();
    await ensureJobAssignments();
    await ensureJobVerification();
    await ensureMaterialRequestsTables();
    await ensureProductionTable();

    console.log(
        "[ ensureSchema ] jobs workflow / users / material_requests / production checked (set SHARED_FLOOR_WORKER_EMAIL or SHARED_FLOOR_WORKER_ID in backend/.env for one shared worker login)"
    );
}

module.exports = ensureSchema;
