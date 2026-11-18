import * as authService from '../services/auth.service.js'; // ES6 named import

// controllers/auth.controller.js
import dotenv from "dotenv";
dotenv.config();

import pool from "../config/db.config.js";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  sha256,
  newJti,
  normalizeEmail,
  decodeAccessToken,
} from "../utils/auth.util.js";
import { createCaptcha, verifyCaptcha } from "../utils/captcha.util.js";
import {
  checkAccountLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../middlewares/loginSecurity.js";

// Cookie options for the refresh token
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true in prod, false in dev
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRY || "30d") * 1000,
};

// Options used ONLY when clearing the cookie on logout.
// Must NOT include maxAge — a positive maxAge would prevent deletion.
// Express's clearCookie internally sets expires=epoch-0 when maxAge is absent.
const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

const toUserDto = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  created_at: row.created_at,
});


// ── GET /api/public/captcha ────────────────────────────────────────────────
export const getCaptcha = (req, res) => {
  try {
    const { token, code, expiresAt } = createCaptcha();
    const noise1X1 = Math.floor(Math.random() * 100) + 10;
    const noise1Y1 = Math.floor(Math.random() * 30) + 5;
    const noise1X2 = Math.floor(Math.random() * 100) + 10;
    const noise1Y2 = Math.floor(Math.random() * 30) + 5;
    const noise2X1 = Math.floor(Math.random() * 100) + 10;
    const noise2Y1 = Math.floor(Math.random() * 30) + 5;
    const noise2X2 = Math.floor(Math.random() * 100) + 10;
    const noise2Y2 = Math.floor(Math.random() * 30) + 5;
    const rotation = (Math.random() * 10 - 5).toFixed(2);

    const svg = `<svg width="160" height="50" xmlns="http://www.w3.org/2000/svg">
  <rect width="160" height="50" fill="#f3f4f6" stroke="#d1d5db" rx="4"/>
  <line x1="${noise1X1}" y1="${noise1Y1}" x2="${noise1X2}" y2="${noise1Y2}" stroke="#9ca3af" stroke-width="1"/>
  <line x1="${noise2X1}" y1="${noise2Y1}" x2="${noise2X2}" y2="${noise2Y2}" stroke="#9ca3af" stroke-width="1"/>
  <text x="80" y="32" font-family="Courier New, monospace" font-size="22" font-weight="bold"
        text-anchor="middle" fill="#1f2937"
        transform="rotate(${rotation} 80 25)" letter-spacing="6">${code}</text>
</svg>`;

    const svgBase64 = Buffer.from(svg).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return res.json({ token, imageUrl, expiresAt });
  } catch (err) {
    console.error('getCaptcha error:', err);
    return res.status(500).json({ message: 'Failed to generate captcha' });
  }
};

// ── POST /api/public/login ─────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { password, captchaToken, captchaAnswer } = req.body;
    let email = req.body.email;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    email = normalizeEmail(email);

    // ── 1. Server-side CAPTCHA verification ──────────────────────────────────
    const captchaResult = verifyCaptcha(captchaToken, captchaAnswer);
    if (!captchaResult.valid) {
      return res.status(400).json({
        message: captchaResult.reason || 'Invalid captcha. Please try again.',
        captchaInvalid: true,
      });
    }

    // ── 2. Account lockout check ─────────────────────────────────────────────
    const lockoutStatus = checkAccountLockout(email);
    if (lockoutStatus.locked) {
      const remainingMin = Math.ceil(lockoutStatus.remainingMs / 60000);
      return res.status(429).json({
        message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`,
        locked: true,
        retryAfter: Math.ceil(lockoutStatus.remainingMs / 1000),
      });
    }

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (!rows.length) {
      // Record failure even for non-existent accounts (prevents username enumeration
      // timing attacks by always doing the same work)
      const { delayMs } = recordFailedAttempt(email);
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const ok = await comparePassword(password, user.password);

    if (!ok) {
      // ── 3. Record failed attempt + apply progressive delay ────────────────
      const { delayMs, locked, remainingMs } = recordFailedAttempt(email);
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
      if (locked) {
        const remainingMin = Math.ceil(remainingMs / 60000);
        return res.status(429).json({
          message: `Account locked after too many failed attempts. Try again in ${remainingMin} minute(s).`,
          locked: true,
          retryAfter: Math.ceil(remainingMs / 1000),
        });
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ── 4. Successful login: reset failure counter ───────────────────────────
    resetFailedAttempts(email);

    // rotate + issue fresh pair
    const jti = newJti();
    const refreshToken = signRefreshToken({ userId: user.user_id, jti });
    const refreshHash = sha256(refreshToken);

    await pool.query(
      `INSERT INTO refresh_tokens2 (user_id, jti, token_hash, revoked, expires_at)
       VALUES ($1,$2,$3,false, NOW() + (regexp_replace($4, '[^0-9]+', '', 'g') || ' seconds')::interval)`,
      [
        user.user_id,
        jti,
        refreshHash,
        parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRY || "30d"),
      ]
    );

    const accessToken = signAccessToken({
      sub: user.user_id,
      email: user.email,
      role: user.role,
    });

    res
      .cookie("rt", refreshToken, refreshCookieOptions)
      .json({ user: toUserDto(user), accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const refresh = async (req, res) => {
  try {
    // Accept from cookie first; allow body fallback for mobile clients
    const token = req.cookies?.rt || req.body?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const jti = payload.jti;
    const userId = payload.sub;

    // Check DB record exists and matches the presented token (hash)
    const { rows } = await pool.query(
      "SELECT * FROM refresh_tokens2 WHERE jti = $1 AND user_id = $2 LIMIT 1",
      [jti, userId]
    );
    if (!rows.length) return res.status(401).json({ message: "Not found" });

    const dbTok = rows[0];
    if (dbTok.revoked) return res.status(401).json({ message: "Revoked" });

    const matches = dbTok.token_hash === sha256(token);
    if (!matches) return res.status(401).json({ message: "Mismatch" });

    // Rotation: revoke current, create a new one
    await pool.query(
      "UPDATE refresh_tokens2 SET revoked = true, replaced_by_jti = $1 WHERE jti = $2",
      [/* will set after create */ null, jti]
    );

    // Create new pair
    const newId = newJti();
    const newRefresh = signRefreshToken({ userId, jti: newId });
    const newHash = sha256(newRefresh);

    await pool.query(
      `INSERT INTO refresh_tokens2 (user_id, jti, token_hash, revoked, previous_jti, expires_at)
       VALUES ($1,$2,$3,false,$4, NOW() + (regexp_replace($5, '[^0-9]+', '', 'g') || ' seconds')::interval)`,
      [
        userId,
        newId,
        newHash,
        jti,
        parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRY || "30d"),
      ]
    );

    // Now wire replaced_by_jti for the old one
    await pool.query(
      "UPDATE refresh_tokens2 SET replaced_by_jti = $1 WHERE jti = $2",
      [newId, jti]
    );

    // Get fresh user data for payload
    const { rows: urows } = await pool.query(
      "SELECT user_id, email, fname, created_at FROM users WHERE user_id = $1",
      [userId]
    );
    const user = urows[0];

    const accessToken = signAccessToken({
      sub: user.user_id,
      email: user.email,
      role: user.role,
    });

    res
      .cookie("rt", newRefresh, refreshCookieOptions)
      .json({ user: toUserDto(user), accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Refresh failed" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.rt || req.body?.refreshToken;

    // ── 1. Revoke the access token JTI so it cannot be replayed ─────────────
    // The public axiosInstance always attaches the current access token in the
    // Authorization header, so we can extract its JTI from here.
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = decodeAccessToken(authHeader.slice(7));
        if (decoded?.jti) {
          await pool.query(
            `INSERT INTO revoked_access_tokens (jti, expires_at)
             VALUES ($1, to_timestamp($2))
             ON CONFLICT (jti) DO NOTHING`,
            [decoded.jti, decoded.exp]
          );
        }
      } catch (_) {
        // Non-fatal — still proceed to clear the refresh token
      }
    }

    if (!token) {
      // No refresh token present — clear cookie and return
      res.clearCookie("rt", clearCookieOptions);
      return res.status(204).send();
    }

    // ── 2. Revoke the refresh token in the DB ────────────────────────────────
    try {
      const payload = verifyRefreshToken(token);
      await pool.query("UPDATE refresh_tokens2 SET revoked = true WHERE jti = $1", [
        payload.jti,
      ]);
    } catch {
      // Token may already be invalid/expired — proceed to clear cookie regardless
    }

    res.clearCookie("rt", clearCookieOptions);
    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
};

export const me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json({ user: toUserDto(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/**
 * Utility: convert strings like "15m", "30d", "3600" to seconds for DB expiry.
 * This is a simple helper; you could also decode exp from JWT and store that exact timestamp.
 */
function parseExpiryToSeconds(input) {
  // numeric (assume seconds)
  if (/^\d+$/.test(input)) return input;

  const m = /^(\d+)\s*([smhd])$/.exec(input);
  if (!m) return "2592000"; // default 30 days
  const n = Number(m[1]);
  const unit = m[2];
  const map = { s: 1, m: 60, h: 3600, d: 86400 };
  return String(n * map[unit]);
}


// ✅ Request password reset
export const requestPasswordReset = async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  email = normalizeEmail(email);
  try {
    await authService.sendPasswordResetEmail(email);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Could not send reset email" });
  }
};

// ✅ Reset password
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  try {
    await authService.resetPassword(token, newPassword);
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: error.message || "Could not reset password" });
  }
};
