import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.config.js'; // ES6 import
import dotenv from "dotenv"
dotenv.config()
import nodemailer from "nodemailer";



// or if you’re not using ES modules:
// const nodemailer = require("nodemailer");

// ✅ Generate Access Token
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY,
  });
}

// ✅ Generate Refresh Token
function generateRefreshToken(payload) {
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY,
  });
}

// ✅ Save Refresh Token in DB (PostgreSQL uses $1, $2, etc.)
async function saveRefreshToken(userId, token, expiresAt) {
  const sql = `
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
  `;
  await query(sql, [userId, token, expiresAt]);
}

// ✅ Login User
// ...existing code...
export async function loginUser(email, password) {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const results = await query(sql, [email]);

  if (results.length === 0) throw new Error('Invalid email or password');

  const user = results[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) throw new Error('Invalid email or password');

  // FIX: Use user.user_id for tokens and refresh logic
  const payload = { id: user.user_id, email: user.email, role_id: user.role_id };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);
  await saveRefreshToken(user.user_id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
    },
  };
}
// ...existing code...

export async function refreshAccessToken(oldRefreshToken) {

  const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);

  const sql = `SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2`;
  const results = await query(sql, [oldRefreshToken, decoded.id]);
  if (!results.length) {
    throw new Error("Invalid refresh token (not in DB)");
  }

  const payload = { id: decoded.id, email: decoded.email, role_id: decoded.role_id };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Save new refresh, delete old
  await query("DELETE FROM refresh_tokens WHERE token = $1", [oldRefreshToken]);
  const decodedNew = jwt.decode(newRefreshToken);
  const expiresAt = new Date(decodedNew.exp * 1000);
  await saveRefreshToken(decoded.id, newRefreshToken, expiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}



// ✅ Logout User
export async function logoutUser(refreshToken) {
  const sql = 'DELETE FROM refresh_tokens WHERE token = $1';
  await query(sql, [refreshToken]);
}



// Generate password reset token
function generatePasswordResetToken(payload) {
  return jwt.sign(payload, process.env.JWT_RESET_SECRET, { expiresIn: '1h' });
}



export async function sendPasswordResetEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const results = await query(sql, [email]);
  if (results.length === 0) throw new Error('Email not found');
  const user = results[0];

  const token = generatePasswordResetToken({ id: user.user_id, email: user.email, role_id: user.role_id });


  await query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [
    user.id,
    token,
    new Date(Date.now() + 3600 * 1000),
  ]);


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL_PROD}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: `Adwa Victory Memorial ${process.env.EMAIL_USER}`,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
    console.log("Password reset email sent to", email);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send password reset email. " + error.message);
  }
}


// Reset password
export async function resetPassword(token, newPassword) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch {
    throw new Error('Invalid or expired token');
  }

  // Use user_id to match your DB column
  const sql = 'SELECT * FROM users WHERE user_id = $1 AND email = $2';
  const results = await query(sql, [decoded.id, decoded.email]);
  if (results.length === 0) throw new Error('User not found');

  // Hash new password
  const hashed = await bcrypt.hash(newPassword, 10);


  // Update using user_id
  await query('UPDATE users SET password = $1 WHERE user_id = $2', [hashed, decoded.id]);

  // Optionally, delete used token from password_resets table
  
}





