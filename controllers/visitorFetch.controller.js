// Controller to fetch visitor info (fname, lname, email, phone_no, gender, nationality)
import pool from '../config/db.config.js'


// Utility function for querying PostgreSQL
const dbQuery = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};
// GET /api/visitors/fetch
export const  fetchVisitors = async (req, res) => {
  try {
    const query = `
      SELECT u.fname, u.created_at, u.lname, u.email, u.phone_no, u.gender, v.nationality
      FROM users u
      INNER JOIN visitor v ON v.user_id = u.user_id
    `
    const result = await dbQuery(query)
    res.json({ data: result.rows })
  } catch (err) {
    console.error('Error fetching visitors:', err)
    res.status(500).json({ error: 'Failed to fetch visitors' })
  }
}
