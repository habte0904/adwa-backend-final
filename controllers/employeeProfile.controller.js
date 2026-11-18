import asyncHandler from "express-async-handler";
import pool from "../config/db.config.js";
import bcrypt from "bcryptjs";
import { validateImageFile } from '../utils/imageValidation.js'
import { normalizeEmail } from "../utils/auth.util.js";
// Utility for DB query
const dbQuery = async (sql, values = []) => {
  const result = await pool.query(sql, values);
  return result;
};

// Get current employee profile
export const getProfile = asyncHandler(async (req, res) => {
  const user_id = req.user?.user_id || req.user?.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });
  const sql = `SELECT u.user_id, u.fname, u.lname, u.email, u.phone_no, u.gender, u.username, u.profile_image, u.created_at, e.status, e.department, e.role_id FROM users u JOIN employee e ON u.user_id = e.user_id WHERE u.user_id = $1`;
  const result = await dbQuery(sql, [user_id]);
  if (result.rows.length === 0) return res.status(404).json({ message: "Profile not found" });
  const profile = result.rows[0];
  // Get role_name from roles table
  let role_name = "";
  if (profile.role_id) {
    const roleRes = await dbQuery("SELECT name FROM roles WHERE role_id = $1", [profile.role_id]);
    role_name = roleRes.rows[0]?.name || "";
  }
  // Format created_at as readable date
  profile.date_joined = profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  delete profile.created_at;
  profile.role_name = role_name;
  // Ensure all fields are defined for frontend
  Object.keys(profile).forEach((k) => {
    if (profile[k] === null || profile[k] === undefined) profile[k] = "";
  });
  res.status(200).json(profile);
});

// Update employee profile (info + image)
export const updateProfile = asyncHandler(async (req, res) => {

  const user_id = req.user?.user_id || req.user?.id;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });
  const { fname, lname, phone_no, gender } = req.body;
  const email = normalizeEmail(req.body.email);
  if (req.body.email) {
    const emailCheck = await dbQuery(`SELECT COUNT(*) FROM users WHERE email = $1 AND user_id != $2`, [req.body.email, user_id])
    if (parseInt(emailCheck.rows[0].count) > 0) {
      res.status(400).json({ error: "Email already registerd!" })
      return
    }
  }

  // let profile_image = null;
  // if (req.file) {
  //   profile_image = req.file.path;
  // }
  let profile_image = null
  //background_image = req.file ? `${process.env.BACKEND_BASEURL}/${req.file.path.replace(/\\/g, '/')}` : req.body.background_image || null;
  if (req.file) {
    const filePath = await validateImageFile(req.file);
    if (!filePath) {
      return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    profile_image = filePath
  }
  // Build update query dynamically but safely
  let fields = ["fname", "lname", "phone_no", "email", "gender"];
  let values = [fname || "", lname || "", phone_no || "", email || "", gender || "", user_id];
  let setStr = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  if (profile_image) {
    setStr += `, profile_image = $${fields.length + 1}`;
    values.splice(fields.length, 0, profile_image);
  }
  const sql = `UPDATE users SET ${setStr} WHERE user_id = $${values.length}`;
  await dbQuery(sql, values);
  res.status(200).json({ message: "Profile updated successfully" });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const user_id = req.user?.id;
  const { oldPassword, newPassword } = req.body;
  if (!user_id) return res.status(401).json({ message: "Unauthorized" });
  // Check old password
  const userRes = await dbQuery("SELECT password FROM users WHERE user_id = $1", [user_id]);
  if (userRes.rows.length === 0) return res.status(404).json({ message: "User not found" });
  const valid = await bcrypt.compare(oldPassword, userRes.rows[0].password);
  if (!valid) return res.status(400).json({ message: "Old password incorrect" });
  const hashed = await bcrypt.hash(newPassword, 10);
  await dbQuery("UPDATE users SET password = $1 WHERE user_id = $2", [hashed, user_id]);
  res.status(200).json({ message: "Password changed successfully" });
});

