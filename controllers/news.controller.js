import db from "../config/db.config.js";
import dotenv from "dotenv"
import { validateDocumentImageFile } from "../utils/imageValidation.js";
import axios from"axios"
dotenv.config()
// Helper function to verify Turnstile token
async function verifyCaptcha(token) {
  try {
    const secret = process.env.TURNSTILE_SECRET;
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret,
        response: token
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data.success;
  } catch (err) {
    console.error("Captcha verification error:", err);
    return false;
  }
}


// List all published news (with pagination & category filter)
export const listNews = async (req, res) => {
  const { page = 1, limit = 10, category, admin } = req.query;
  const offset = (page - 1) * limit;
  let query;
  let params = [];
  if (admin === 'true') {
    // Admin: get all news regardless of status
    query = 'SELECT * FROM news';
    if (category) {
      query += ' WHERE category = $1';
      query += ' ORDER BY updated_at DESC LIMIT $2 OFFSET $3';
      params.push(category, limit, offset);
    } else {
      query += ' ORDER BY updated_at DESC LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }
  } else {
    // Public: only published news
    query = `SELECT * FROM news WHERE status='published'`;
    if (category) {
      query += ` AND category = $1`;
      query += ` ORDER BY published_at DESC LIMIT $2 OFFSET $3`;
      params.push(category, limit, offset);
    } else {
      query += ` ORDER BY updated_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }
  }
  const result = await db.query(query, params);
  res.json(result.rows);
};

// Get single news (with comments)
export const getNews = async (req, res) => {
  const { id } = req.params;
  const news = await db.query('SELECT * FROM news WHERE id = $1', [id]);
  if (!news.rows.length) return res.status(404).json({ error: 'Not found' });
  const comments = await db.query('SELECT * FROM comments WHERE news_id = $1 ORDER BY created_at DESC', [id]);
  res.json({ ...news.rows[0], comments: comments.rows });
};

// List comments for a news item
export const listComments = async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT * FROM comments WHERE news_id = $1 ORDER BY created_at DESC`,
    [id]
  );
  res.json(result.rows);
};

// Add comment
export const addComment = async (req, res) => {
  const { id } = req.params;
  
  const { name, comment, captchaToken  } = req.body;
   // Verify captcha
  const isHuman = await verifyCaptcha(captchaToken);
  if (!isHuman) {
    return res.status(400).json({ message: "Captcha verification failed" });
  }

  const result = await db.query(
    `INSERT INTO comments (news_id, name, comment) VALUES ($1, $2, $3) RETURNING *`,
    [id, name, comment]
  );
  res.status(201).json(result.rows[0]);
};

// Admin: Create news
export const createNews = async (req, res) => {
  let { title, title_am, content, content_am, category, status, published_at } = req.body;
   // Handle file
      let image_url = null;
     if(req.file){
      const filePath=await validateDocumentImageFile(req.file);
      if(!filePath){
         return res.status(400).json({ error: "Invalid image file uploaded." });
      }
      image_url=`${process.env.BACKEND_BASEURL}/${filePath}`
     } 
  if (!published_at) {
    published_at = new Date();
  }
  const result = await db.query(
    `INSERT INTO news (title, title_am, content, content_am, image_url, category, status, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [title, title_am, content, content_am, image_url, category, status, published_at]
  );
  res.status(201).json(result.rows[0]);
};

// Admin: Update news
export const updateNews = async (req, res) => {
  const { id } = req.params;
  let { title, title_am, content, content_am, image_url, category, status, published_at } = req.body;
  if (!published_at) {
    published_at = new Date();
  }

   if(req.file){
      const filePath=await validateDocumentImageFile(req.file);
      if(!filePath){
         return res.status(400).json({ error: "Invalid image file uploaded." });
      }
      image_url=`${process.env.BACKEND_BASEURL}/${filePath}`
     } 

  const result = await db.query(
    `UPDATE news SET title=$1, title_am=$2, content=$3, content_am=$4, image_url=$5, category=$6, status=$7, published_at=$8, updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [title, title_am, content, content_am, image_url, category, status, published_at, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
};

// Admin: Delete news
export const deleteNews = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM news WHERE id=$1', [id]);
  res.json({ success: true });
};

// Admin: Delete news
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM comments WHERE id=$1', [id]);
  res.json({ success: true });
};
