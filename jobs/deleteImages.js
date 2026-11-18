import fs from "fs/promises";
import path from "path";
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });




const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // <--- must be string
  database: process.env.DB_NAME
});

export default pool;


function extractFileName(value) {
  if (!value) return null;

  try {
    const url = new URL(value); // Try parse as URL
    return path.basename(url.pathname);
  } catch {
    return path.basename(value); // Fallback to path
  }
}

// Recursive function to get all files in a directory + subdirs
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
    })
  );
  return files.flat();
}

async function cleanupFiles() {
  try {
    const fileColumns = [
      { table: "advertisements", column: "image_url", type: "text" },
      { table: "advertisements", column: "animation", type: "json", jsonKey: "images" }, 
      { table: "event", column: "image_path", type: "text" },
      { table: "facilities", column: "img_path", type: "text" },
      { table: "image_galleries", column: "file_url", type: "text" },
      { table: "journey_timeline", column: "image_url", type: "text" },
      { table: "page_content", column: "background_image", type: "text" },
      { table: "partners", column: "logo_url", type: "text" },
      { table: "users", column: "profile_image", type: "text" },
      { table: "service_facility", column: "image", type: "text" },
      { table: "museum_info", column: "setting_value", type: "text" },
       { table: "service_requests", column: "file", type: "text" },
      
    ];

    const validFiles = new Set();

    // Collect valid files from DB
    for (const { table, column, type, jsonKey } of fileColumns) {
      const res = await pool.query(
        `SELECT ${column} FROM ${table} WHERE ${column} IS NOT NULL`
      );

      res.rows.forEach(row => {
        const value = row[column];

        if (type === "text") {
          // Handle plain string column
          const filename = extractFileName(value);
          if (filename) validFiles.add(filename);

        } else if (type === "json" && jsonKey) {
          // Handle JSON column with images key
          try {
            const data = typeof value === "object" ? value : JSON.parse(value);
            if (Array.isArray(data[jsonKey])) {
              data[jsonKey].forEach(url => {
                const filename = extractFileName(url);
                if (filename) validFiles.add(filename);
              });
            }
          } catch (e) {
            console.warn(`Skipping invalid JSON in ${table}.${column}`, e);
          }
        }
      });
    }

    const uploadDir = "../uploads";

    // Get all files recursively
    const files = await getAllFiles(uploadDir);

    // Delete orphaned files
    for (const filePath of files) {
      const filename = path.basename(filePath);
      if (!validFiles.has(filename)) {
        await fs.unlink(filePath);
        console.log(`Deleted orphan file: ${filePath}`);
      }
    }

    console.log("Cleanup completed ✅");
  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    pool.end();
  }
}

cleanupFiles();
