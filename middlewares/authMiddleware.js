// middleware/authMiddleware.js

import pool from '../config/db.config.js';
import {  verifyAdminAccessToken } from '../utils/auth.util.js';
import { verifyAccessToken } from '../utils/auth.util.js';
/**
 * Check whether an access-token JTI has been revoked.
 *
 * Returns:
 *   true  -> token has been revoked
 *   false -> token is not revoked
 *
 * Tokens without a JTI are allowed for backwards compatibility
 * with tokens issued before the JTI migration.
 */
async function isJtiRevoked(jti) {
  if (!jti) {
    return false;
  }

  const { rows } = await pool.query(
    `
      SELECT 1
      FROM revoked_access_tokens
      WHERE jti = $1
      LIMIT 1
    `,
    [jti]
  );

  return rows.length > 0;
}

/**
 * Extract a Bearer token from the Authorization header.
 *
 * Expected format:
 *
 * Authorization: Bearer <JWT>
 *
 * Returns:
 *   token string -> if valid Bearer header
 *   null         -> otherwise
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    typeof authHeader !== 'string' ||
    !authHeader.startsWith('Bearer ')
  ) {
    return null;
  }

  const token = authHeader.slice(7).trim();

  return token || null;
}


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin authentication middleware
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Used on most admin-protected routes.
 *
 * Performs:
 *   1. Extract Bearer token
 *   2. Verify JWT signature
 *   3. Verify JWT expiration
 *   4. Check whether JTI was revoked
 *   5. Attach decoded user information to req.user
 */
export const authenticateToken = async (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded =  verifyAdminAccessToken(token);

    /**
     * If this token was revoked during logout,
     * reject it even if the JWT itself is still valid.
     */
    if (await isJtiRevoked(decoded.jti)) {
      return res.sendStatus(401);
    }

    req.user = decoded;

    return next();
  } catch (err) {
    return res.sendStatus(401);
  }
};


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Alternative admin authentication middleware
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Kept for compatibility with routes that currently use authMiddleware.
 */
export async function authMiddleware(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      message: 'No token provided',
    });
  }

  try {
    const decoded =  verifyAdminAccessToken(token);

    /**
     * Check access-token revocation.
     */
    if (await isJtiRevoked(decoded.jti)) {
      return res.status(401).json({
        message: 'Token has been revoked',
      });
    }

    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
}
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Public user authentication middleware
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Used on visitor-facing protected routes.
 *
 * The decoded JWT is reduced to the fields that the public-user
 * application needs.
 */
export const requireAuth = async (req, res, next) => {

  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: 'No token',
      });
    }
 
    /**
     * verifyAccessToken() checks:
     *   - JWT signature
     *   - JWT expiration
     */
    const decoded = verifyAccessToken(token);

    /**
     * Check whether this particular access token was revoked.
     */
    if (await isJtiRevoked(decoded.jti)) {
      return res.status(401).json({
        message: 'Token has been revoked',
      });
    }

    /**
     * Only expose the required user information to downstream
     * public-user routes.
     */
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-based authorization middleware
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Example:
 *
 * router.get(
 *   '/admin',
 *   authenticateToken,
 *   requireRole('admin'),
 *   controller
 * );
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: 'Forbidden',
    });
  }

  return next();
};
