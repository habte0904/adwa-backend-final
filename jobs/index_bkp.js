import cron from "node-cron";
import { syncSocialMedia } from "../services/socialMedia.service.js";
import { backupDatabase } from "./backupDatabase.js";

export const initJobs = () => {

    // ── Social media sync — every hour (at the top of each hour) ─────────────
    cron.schedule("0 * * * *", async () => {
        try {
            await syncSocialMedia();
        } catch (error) {
            console.error("Cron job error:", error.message);
        }
    });

    // ── Database backup — every day at midnight ───────────────────────────────
    cron.schedule("0 0 * * *", async () => {
        try {
            await backupDatabase();
        } catch (error) {
            console.error("[Backup] Cron job error:", error.message);
        }
    });
};
