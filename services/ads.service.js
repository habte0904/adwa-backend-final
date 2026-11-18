import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

let db = null
try {
  const dbModule = await import("../config/db.config.js")
  db = dbModule.default || dbModule.pool || dbModule.db || dbModule
  if (!db || typeof db.query !== "function") {
    db = null
  }
} catch {
  db = null
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adsFile = path.join(__dirname, "../data/ads.json")

async function ensureFile() {
  try {
    await fs.access(adsFile)
  } catch {
    await fs.writeFile(adsFile, "[]", "utf8")
  }
}

async function readAdsFile() {
  await ensureFile()
  const raw = await fs.readFile(adsFile, "utf8")
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}
async function writeAdsFile(data) {
  await fs.writeFile(adsFile, JSON.stringify(data, null, 2), "utf8")
}

export async function getAll() {
  if (db) {
    const result = await db.query("SELECT * FROM advertisements ORDER BY ad_id DESC")
    return result.rows || result[0] || []
  }
  return await readAdsFile()
}

export async function getById(id) {
  if (db) {
    // use ad_id column only (Postgres table doesn't have "id")
    const result = await db.query("SELECT * FROM advertisements WHERE ad_id = $1 LIMIT 1", [id]);
    return result.rows && result.rows[0] ? result.rows[0] : null;
  }
  const ads = await readAdsFile();
  return ads.find((a) => a.ad_id === id || a.id === id) || null;
}

export async function create(ad) {
  const payload = { ...ad }
  if (payload.animation && typeof payload.animation !== "string") payload.animation = JSON.stringify(payload.animation)

  if (db) {
    const sql = `
      INSERT INTO advertisements
      (title, title_am, image_url, link_url, position, is_active, description, description_am, start_date, end_date, category, discount, animation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `
    const params = [
      payload.title || null,
      payload.title_am || null,
      payload.image_url || null,
      payload.link_url || null,
      payload.position || null,
      payload.is_active ? 1 : 0,
      payload.description || null,
      payload.description_am || null,
      payload.start_date || null,
      payload.end_date || null,
      payload.category || null,
      payload.discount || null,
      payload.animation || null,
    ]
    const result = await db.query(sql, params)
    const inserted = result.rows && result.rows[0] ? result.rows[0] : null
    if (inserted) return inserted
    const insertedId = Date.now().toString()
    return { ...payload, ad_id: insertedId, id: insertedId }
  }

  const ads = await readAdsFile()
  const id = Date.now().toString()
  const newAd = { ...payload, ad_id: id, id }
  ads.push(newAd)
  await writeAdsFile(ads)
  return newAd
}

export async function update(id, ad) {
  const payload = { ...ad };
  if (payload.animation && typeof payload.animation !== "string") payload.animation = JSON.stringify(payload.animation);

  if (db) {
    const allowed = ["title","title_am","image_url","link_url","position","is_active","description","description_am","start_date","end_date","category","discount","animation"];
    const columns = [];
    const params = [];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        params.push(key === "is_active" ? (payload[key] ? 1 : 0) : payload[key]);
        columns.push(`${key} = $${params.length}`);
      }
    }
    if (!columns.length) return null;
    // use ad_id in WHERE clause
    params.push(id);
    const sql = `UPDATE advertisements SET ${columns.join(", ")} WHERE ad_id = $${params.length} RETURNING *`;
    const result = await db.query(sql, params);
    if (result.rows && result.rows.length) return result.rows[0];
    return null;
  }

  const ads = await readAdsFile();
  const idx = ads.findIndex((a) => a.ad_id === id || a.id === id);
  if (idx === -1) return null;
  ads[idx] = { ...ads[idx], ...payload, ad_id: ads[idx].ad_id || id, id: ads[idx].id || id };
  await writeAdsFile(ads);
  return ads[idx];
}

export async function deleteAd(id) {
  if (db) {
    // delete by ad_id only
    const result = await db.query("DELETE FROM advertisements WHERE ad_id = $1", [id]);
    return result.rowCount > 0;
  }
  const ads = await readAdsFile();
  const filtered = ads.filter((a) => a.ad_id !== id && a.id !== id);
  if (filtered.length === ads.length) return false;
  await writeAdsFile(filtered);
  return true;
}

export default {
  getAll,
  getById,
  create,
  update,
  delete: deleteAd,
}