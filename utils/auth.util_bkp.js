// utils/auth.util.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const hashPassword = async (plain) => {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
};

export const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  });
};

// We sign refresh tokens as JWTs too, and rotate them.
// Each has a JTI so we can track/revoke in DB.
export const signRefreshToken = ({ userId, jti }) => {
  return jwt.sign({ sub: userId, jti }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "30d",
  });
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// For storing only a hash of the refresh token (safer if DB leaks)
export const sha256 = (str) =>
  crypto.createHash("sha256").update(str, "utf8").digest("hex");

export const newJti = () => crypto.randomUUID();

// Standardizes email to prevent duplicate accounts via alias tricks (like Gmail dot and plus tricks)
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  let normalized = email.trim().toLowerCase();
  
  const parts = normalized.split('@');
  if (parts.length === 2) {
    let [localPart, domain] = parts;
    
    // Google/Gmail specific normalization
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      localPart = localPart.replace(/\./g, ''); // Remove all dots
      localPart = localPart.split('+')[0];      // Ignore everything after '+'
      normalized = `${localPart}@gmail.com`;    // Standardize domain to gmail.com
    }
  }
  return normalized;
};

