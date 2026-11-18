import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Config ──────────────────────────────────────────────────────────────────
const BACKUP_DIR = path.resolve(__dirname, "../backups");
const MAX_BACKUPS = 30; // Keep the last 30 daily backups (≈1 month)

const {
    DB_USER,
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
} = process.env;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Ensure the backup directory exists.
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`[Backup] Created backup directory: ${BACKUP_DIR}`);
    }
}

/**
 * Build a timestamped filename for the dump.
 * e.g. backup_2026-02-23T18-22-00.sql
 */
function buildFileName() {
    const now = new Date();
    const timestamp = now
        .toISOString()
        .replace(/:/g, "-")   // colons are invalid in Windows filenames
        .replace(/\..+/, ""); // strip milliseconds
    return `backup_${timestamp}.sql`;
}

/**
 * Remove old backups, keeping only the most recent MAX_BACKUPS files.
 */
function pruneOldBackups() {
    const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith("backup_") && f.endsWith(".sql"))
        .map((f) => ({
            name: f,
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
        }))
        .sort((a, b) => b.time - a.time); // newest first

    const toDelete = files.slice(MAX_BACKUPS);
    toDelete.forEach(({ name }) => {
        fs.unlinkSync(path.join(BACKUP_DIR, name));
        console.log(`[Backup] Pruned old backup: ${name}`);
    });
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Runs pg_dump to create a full SQL backup of the database.
 * The dump file is saved to /server/backups/ with a timestamped name.
 */
export async function backupDatabase() {
    ensureBackupDir();

    const fileName = buildFileName();
    const outputPath = path.join(BACKUP_DIR, fileName);

    // pg_dump must be on PATH (installed with PostgreSQL)
    // PGPASSWORD env var avoids interactive password prompt
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d "${DB_NAME}" -F p -f "${outputPath}"`;

    return new Promise((resolve, reject) => {
        const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

        exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Backup] ❌ Failed: ${error.message}`);
                if (stderr) console.error(`[Backup] stderr: ${stderr}`);
                reject(error);
                return;
            }

            const stats = fs.statSync(outputPath);
            const sizeKB = (stats.size / 1024).toFixed(1);


            // Clean up old backups after a successful dump
            pruneOldBackups();

            resolve(outputPath);
        });
    });
}
