import cron from "node-cron";
import { syncSocialMedia } from "../services/socialMedia.service.js";
import pool from "../config/db.config.js";

export const initJobs = () => {

    // Sync social media content every hour
    cron.schedule("0 * * * *", async () => {
        try {
            await syncSocialMedia();
        } catch (error) {
            console.error("Cron job error:", error.message);
        }
    });

    // Run immediately on startup
    syncSocialMedia().catch(error => console.error("Initial sync failed:", error.message));

    // Purge expired rows from revoked_access_tokens every hour.
    // Expired tokens are already rejected by jwt.verify before the revocation
    // check is reached, so removing them is safe and keeps the table small.
    cron.schedule("30 * * * *", async () => {
        try {
            const result = await pool.query(
                "DELETE FROM revoked_access_tokens WHERE expires_at < NOW()"
            );
            if (result.rowCount > 0) {
                console.log(`[cleanup] Purged ${result.rowCount} expired revoked access token(s).`);
            }
        } catch (error) {
            console.error("[cleanup] revoked_access_tokens purge failed:", error.message);
        }
    });
};

