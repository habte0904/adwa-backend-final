import axios from "axios";
import { query } from "../config/db.config.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds, will multiply for exponential backoff
const POSTS_LIMIT = 10; // number of posts per request

export const fetchFacebookPosts = async () => {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
        console.warn("Missing FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN in .env");
        return [];
    }

    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const response = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
                params: {
                    access_token: accessToken,
                    fields: "id,message,created_time,full_picture,permalink_url",
                    limit: POSTS_LIMIT,
                },
                timeout: 15000, // 15 seconds
            });

            if (!response.data || !response.data.data) {
                console.warn("No data returned from Facebook API.");
                return [];
            }

            return response.data.data.map(post => ({
                social_id: post.id,
                title: post.message ? post.message.split("\n")[0].substring(0, 100) : "Social Media Update",
                content: post.message || "",
                image_url: post.full_picture,
                published_at: post.created_time,
                external_link: post.permalink_url,
                source: "facebook"
            }));

        } catch (error) {
            attempt++;

            // Retry on timeout or server errors
            if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED" ||
                (error.response && error.response.status >= 500)) {
                console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY * attempt}ms...`);
                await new Promise(res => setTimeout(res, RETRY_DELAY * attempt));
            } else {
                console.error("Facebook API Error:", error.response?.data || error.message);
                return [];
            }
        }
    }

    console.error("Failed to fetch Facebook posts after maximum retries.");
    return [];
};


export const syncSocialMedia = async () => {
    const posts = await fetchFacebookPosts();

    let newPostsSynced = 0;

    for (const post of posts) {
        try {
            const existing = await query("SELECT id FROM news WHERE social_id = $1", [post.social_id]);

            if (!existing || existing.length === 0) {
                await query(`
                    INSERT INTO news (title, title_am, content, content_am, image_url, published_at, source, social_id, external_link, status, category)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published','Social Media')
                `, [
                    post.title,
                    post.title,
                    post.content,
                    post.content,
                    post.image_url,
                    post.published_at,
                    post.source,
                    post.social_id,
                    post.external_link
                ]);
                newPostsSynced++;
            } else {
            }
        } catch (error) {
            console.error(`Failed to sync post ${post.social_id}:`, error.message);
        }
    }
};


