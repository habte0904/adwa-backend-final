// authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.config.js';
import { activityLogger } from '../utils/activityLogger.js';
import nodemailer from 'nodemailer';

/** SHA-256 hash helper — only the hash is written to the DB */
const sha256 = (str) =>
  crypto.createHash('sha256').update(str, 'utf8').digest('hex');

// Rate limiting map for OTP attempts
const otpAttemptsMap = new Map();
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Generate OTP code (6 digits)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EVT_SMTP_HOST,
    port: process.env.EVT_SMTP_PORT,
    secure: process.env.EVT_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EVT_SMTP_USER,
      pass: process.env.EVT_SMTP_PASS,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otpCode) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Adwa Victory Memorial Staff Portal" <${process.env.EVT_SMTP_USER}>`,
      to: email,
      subject: 'Your Adwa Victory Memorial Portal Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #d97706;">Adwa Victory Memorial Staff Portal</h2>
          </div>
          <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 20px; border-radius: 8px;">
            <h3 style="color: #92400e; margin-top: 0;">Two-Factor Authentication</h3>
            <p style="color: #92400e; font-size: 16px;">
              Your verification code is:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d97706; background-color: #fef3c7; padding: 10px 20px; border-radius: 6px;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #92400e; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Adwa Victory Memorial Staff Portal</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// Generate tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.user_id,
      username: user.username,
      department: user.department,
      roleId: user.role_id,
      roleName: user.roleName,
      jti: crypto.randomUUID(), // unique ID so we can revoke this token on logout
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.user_id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_LIFETIME,
    }
  );
};

const login = async (req, res) => {
  const { username, password } = req.body;

  const action = 'Login';
  let details = {
    username,
    description: 'Tried to login',
  };

  try {
    const result = await pool.query(
      'SELECT * FROM users u JOIN employee e ON u.user_id = e.user_id WHERE u.username = $1 and e.status = $2',
      [username, 'Active']
    );
    const user = result.rows[0];

    if (!user) {
      details.description = 'Tried to login with invalid username';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      details.description = 'Tried to login with invalid password';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user email and role info
    const empRes = await pool.query(
      `SELECT role_id, department FROM employee WHERE user_id = $1`,
      [user.user_id]
    );

    user.department = empRes.rows[0].department;
    const role_id = empRes.rows[0].role_id;
    if (!role_id) {
      details.description = 'Tried to login with no role';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(403).json({ error: 'User does not have a role assigned' });
    }
    user.role_id = role_id;

    const roleNameRes = await pool.query('SELECT name FROM roles WHERE role_id = $1', [
      user.role_id,
    ]);
    user.roleName = roleNameRes.rows[0]?.name || 'Unknown Role';

    // Generate OTP and store in database
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clean up any existing OTPs for this email
    await pool.query(
      'DELETE FROM email_verifications WHERE email = $1',
      [user.email]
    );

    // Store new OTP
    await pool.query(
      'INSERT INTO email_verifications (email, code, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
      [user.email, otpCode, expiresAt]
    );

    // Send OTP email to the user's actual email
    const emailSent = await sendOTPEmail(user.email, otpCode);

    if (!emailSent) {
      details.description = 'Failed to send OTP email';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    details.description = 'Login successful, OTP sent for 2FA';
    req.user = {
      id: user.user_id,
      username: user.username,
      roleName: user.roleName,
      department: user.department,
    };
    activityLogger(req, { action: action + ' (2FA Required)', details });

    return res.json({
      twoFactorRequired: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const verify2FA = async (req, res) => {
  const { username, password, code } = req.body;

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Rate limiting check
  const now = Date.now();
  const attemptsInfo = otpAttemptsMap.get(ip) || { count: 0, lockoutUntil: 0 };

  if (now < attemptsInfo.lockoutUntil) {
    return res.status(429).json({ error: 'Too many OTP verification attempts. Please try again later.' });
  }

  const action = '2FA Verification';
  let details = {
    username,
    description: 'Tried to verify 2FA code',
  };

  try {
    // First get user data to fetch their email
    const userResult = await pool.query(
      'SELECT * FROM users u JOIN employee e ON u.user_id = e.user_id WHERE u.username = $1 and e.status = $2',
      [username, 'Active']
    );
    const user = userResult.rows[0];

    if (!user) {
      details.description = 'User not found during 2FA verification';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid user' });
    }

    if (!password) {
      details.description = 'Password missing during 2FA verification';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Password is required for verification' });
    }

    // Verify password as additional authentication mechanism
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      attemptsInfo.count += 1;
      if (attemptsInfo.count >= MAX_OTP_ATTEMPTS) {
        attemptsInfo.lockoutUntil = now + OTP_LOCKOUT_TIME;
      }
      otpAttemptsMap.set(ip, attemptsInfo);

      details.description = 'Invalid password during 2FA verification';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find valid OTP using the user's email
    const otpResult = await pool.query(
      'SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [user.email, code]
    );

    if (otpResult.rows.length === 0) {
      attemptsInfo.count += 1;
      if (attemptsInfo.count >= MAX_OTP_ATTEMPTS) {
        attemptsInfo.lockoutUntil = now + OTP_LOCKOUT_TIME;
      }
      otpAttemptsMap.set(ip, attemptsInfo);

      details.description = 'Invalid or expired verification code';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Get role info
    const empRes = await pool.query(
      `SELECT role_id, department FROM employee WHERE user_id = $1`,
      [user.user_id]
    );
    user.department = empRes.rows[0].department;
    user.role_id = empRes.rows[0].role_id;

    const roleNameRes = await pool.query('SELECT name FROM roles WHERE role_id = $1', [
      user.role_id,
    ]);
    user.roleName = roleNameRes.rows[0]?.name || 'Unknown Role';

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store only the SHA-256 hash of the refresh token so a DB dump is useless
    const refreshHash = sha256(refreshToken);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.user_id, refreshHash]
    );

    // Clean up used OTP
    await pool.query(
      'DELETE FROM email_verifications WHERE email = $1',
      [user.email]
    );

    // Reset rate limit on success
    otpAttemptsMap.delete(ip);

    details.description = '2FA verification successful';
    req.user = {
      id: user.user_id,
      username: user.username,
      roleName: user.roleName,
      department: user.department,
    };
    activityLogger(req, { action: action + ' (Successful)', details });

    // Set HttpOnly cookie for refresh token (Finding 1 fix & Zero-Storage Auth)
    res.cookie('admin_rt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      accessToken,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const resend2FA = async (req, res) => {
  const { username, password } = req.body;

  const action = 'Resend 2FA Code';
  let details = {
    username,
    description: 'Requested to resend 2FA code',
  };

  try {
    // Check if user exists and is active
    const userResult = await pool.query(
      'SELECT * FROM users u JOIN employee e ON u.user_id = e.user_id WHERE u.username = $1 and e.status = $2',
      [username, 'Active']
    );
    const user = userResult.rows[0];

    if (!user) {
      details.description = 'User not found for resending 2FA';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid user' });
    }

    if (!password) {
      details.description = 'Password missing during 2FA resend';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Password is required' });
    }

    // Verify password as additional authentication mechanism
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      details.description = 'Invalid password during 2FA resend';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clean up any existing OTPs for this email
    await pool.query(
      'DELETE FROM email_verifications WHERE email = $1',
      [user.email]
    );

    // Store new OTP
    await pool.query(
      'INSERT INTO email_verifications (email, code, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
      [user.email, otpCode, expiresAt]
    );

    // Send OTP email to the user's actual email
    const emailSent = await sendOTPEmail(user.email, otpCode);

    if (!emailSent) {
      details.description = 'Failed to resend OTP email';
      activityLogger(req, { action: action + ' (Failed)', details });
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }

    details.description = '2FA code resent successfully';
    req.user = {
      id: user.user_id,
      username: user.username,
      roleName: user.roleName,
      department: user.department,
    };
    activityLogger(req, { action: action + ' (Successful)', details });

    return res.json({
      success: true,
      message: 'New verification code sent to your email'
    });

  } catch (error) {
    console.error('Resend 2FA error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.admin_rt || req.body?.token;
    if (!token) {
      activityLogger(req, {
        action: 'Logout (Failed)',
        details: { description: 'No refresh token found during logout' },
      });
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // ── 1. Revoke the access token so it cannot be replayed ──────────────────
    // The axios interceptor on the admin frontend always attaches the current
    // access token in the Authorization header, so we can extract its JTI here.
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.decode(authHeader.slice(7)); // decode without verifying — it may be expired
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

    // ── 2. Delete the refresh token (looked up by its hash) ──────────────────
    const refreshHash = sha256(token);
    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE token_hash = $1 RETURNING *',
      [refreshHash]
    );

    if (result.rowCount === 0) {
      // Token not in DB — still clear the cookie so the browser forgets it
      activityLogger(req, {
        action: 'Logout (Partial)',
        details: { description: 'Refresh token not found in DB (already invalidated?)' },
      });
    } else {
      activityLogger(req, {
        action: 'Logout (Successful)',
        details: { description: 'Successfully logged out' },
      });
    }

    res.clearCookie('admin_rt', { path: '/' });
    res.json({ success: true, message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
};

// Refresh method — also rotates the refresh token on every call
const refresh = async (req, res) => {
  const token = req.cookies?.admin_rt || req.body?.token;
  if (!token) return res.sendStatus(401);

  // Look up by hash so we never store the raw token in the DB
  const incomingHash = sha256(token);
  const dbToken = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [incomingHash]
  );
  if (dbToken.rowCount === 0) return res.sendStatus(403); // not in DB or already rotated

  let payload;
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return res.sendStatus(403); // expired or tampered
  }

  try {
    // Fetch fresh user + employee data for the new access token claims
    const result = await pool.query(
      'SELECT u.*, e.department, e.role_id FROM users u JOIN employee e ON u.user_id = e.user_id WHERE u.user_id = $1 AND e.status = $2',
      [payload.id, 'Active']
    );
    const user = result.rows[0];
    if (!user) return res.sendStatus(403);

    const roleNameRes = await pool.query('SELECT name FROM roles WHERE role_id = $1', [user.role_id]);
    user.roleName = roleNameRes.rows[0]?.name || 'Unknown Role';

    // ── Token rotation ────────────────────────────────────────────────────────
    // Delete the used refresh token and issue a brand-new one.
    // If someone tries to reuse the old token they will get a 403.
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [incomingHash]);

    const newRefreshToken = generateRefreshToken(user);
    const newRefreshHash  = sha256(newRefreshToken);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.user_id, newRefreshHash]
    );

    const newAccessToken = generateAccessToken(user);

    // Send new refresh token as an HttpOnly cookie
    res.cookie('admin_rt', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken: newAccessToken,
      user: {
        user_id: user.user_id,
        username: user.username,
        department: user.department,
        role_id: user.role_id,
        roleName: user.roleName,
      },
    });
  } catch (dbErr) {
    console.error('Refresh DB error:', dbErr);
    return res.sendStatus(500);
  }
};

export { login, refresh, logout, verify2FA, resend2FA };
