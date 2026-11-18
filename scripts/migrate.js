import { query } from "../config/db.config.js";

async function migrate() {
    try {
        console.log("Starting migration: Increasing column lengths in news table...");

        // Change image_url to TEXT as Facebook picture URLs can be very long
        // Also ensuring other social fields are adequate
        await query(`
    

-- 2. Add merchant order ID
ALTER TABLE event_info
ADD COLUMN merch_order_id VARCHAR(64);


    `);

        console.log("Migration completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        process.exit();
    }
}

migrate();

