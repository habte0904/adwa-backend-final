// utils/auth.util.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * Hash a user's password using bcrypt.
 */
export const hashPassword = async (plain) => {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
};

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PUBLIC AUTHENTICATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Public/frontend authentication uses:
 *
 *   JWT_ACCESS_SECRET
 *   JWT_REFRESH_SECRET
 *
 * Do not use these functions for admin authentication.
 */

/**
 * Create a public access token.
 *
 * Every access token receives a unique JTI.
 * The JTI allows an individual access token to be revoked
 * when the user logs out.
 */
export const signAccessToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
    }
  );
};

/**
 * Verify a public access token.
 *
 * This verifies:
 *   - JWT signature
 *   - JWT expiration
 *
 * Uses JWT_ACCESS_SECRET.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Create a public refresh token.
 *
 * Refresh tokens are JWTs and contain a JTI so they can be
 * tracked and rotated in the database.
 */
export const signRefreshToken = ({ userId, jti }) => {
  return jwt.sign(
    {
      sub: userId,
      jti,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || "30d",
    }
  );
};

/**
 * Verify a public refresh token.
 *
 * Uses JWT_REFRESH_SECRET.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN AUTHENTICATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Admin authentication uses a separate JWT secret from the public frontend.
 *
 * Admin access-token signing is performed in:
 *
 *   controllers/authController.js
 *
 * using:
 *
 *   ACCESS_TOKEN_SECRET
 *
 * Therefore the admin middleware must verify using the same secret.
 */

/**
 * Verify an admin access token.
 *
 * Admin access tokens are created by authController.js using:
 *
 *   process.env.ACCESS_TOKEN_SECRET
 *
 * This verifies:
 *   - JWT signature
 *   - JWT expiration
 */
export const verifyAdminAccessToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TOKEN DECODING
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Decode an access token WITHOUT verifying its signature.
 *
 * This is useful during logout because the access token may
 * already be expired. We can still extract its JTI and exp
 * claims and record the token as revoked.
 *
 * IMPORTANT:
 * Do NOT use this function for authentication or authorization.
 * Protected endpoints must use a verification function.
 */
export const decodeAccessToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * REFRESH TOKEN HASHING / JTI
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * SHA-256 hash of a refresh token.
 *
 * Only the hash should be stored in the database,
 * rather than the raw refresh token.
 */
export const sha256 = (str) => {
  return crypto
    .createHash("sha256")
    .update(str, "utf8")
    .digest("hex");
};

/**
 * Generate a unique JWT ID.
 *
 * Used for refresh-token rotation and tracking.
 */
export const newJti = () => {
  return crypto.randomUUID();
};


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EMAIL NORMALIZATION
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Normalize email addresses.
 *
 * General normalization:
 * - Removes leading/trailing whitespace
 * - Converts the address to lowercase
 *
 * Gmail-specific normalization:
 * - Removes dots from the local part
 * - Removes everything after '+'
 * - Converts googlemail.com to gmail.com
 *
 * Example:
 *
 *   John.Smith+test@gmail.com
 *
 * becomes:
 *
 *   johnsmith@gmail.com
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") {
    return email;
  }

  let normalized = email.trim().toLowerCase();

  const parts = normalized.split("@");

  if (parts.length === 2) {
    let [localPart, domain] = parts;

    // Google/Gmail-specific normalization
    if (domain === "gmail.com" || domain === "googlemail.com") {
      localPart = localPart.replace(/\./g, "");
      localPart = localPart.split("+")[0];

      normalized = `${localPart}@gmail.com`;
    }
  }

  return normalized;
};
