// utils/captcha.util.js
// Server-side CAPTCHA utility using HMAC-signed tokens.
// The server generates a CAPTCHA code, signs it with a secret,
// and returns a token. The client must return the token + plain answer.
// The server verifies the answer matches the token (without storing state).

import crypto from 'crypto';

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || process.env.JWT_ACCESS_SECRET || 'adwa_captcha_secret_key_2024';
const CAPTCHA_TTL_SECONDS = 5 * 60; // 5 minutes

/**
 * Generate a random numeric captcha code.
 * @param {number} length
 * @returns {string}
 */
const generateCode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % digits.length];
  }
  return code;
};

/**
 * Create a signed CAPTCHA token embedding the code + expiry.
 * Format: base64(JSON payload).HMAC-SHA256
 * @returns {{ token: string, code: string, expiresAt: number }}
 */
export const createCaptcha = () => {
  const code = generateCode(6);
  const expiresAt = Math.floor(Date.now() / 1000) + CAPTCHA_TTL_SECONDS;

  const payload = Buffer.from(JSON.stringify({ code, expiresAt })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payload)
    .digest('hex');

  return { token: `${payload}.${sig}`, code, expiresAt };
};

/**
 * Verify a CAPTCHA token + user-supplied answer.
 * Returns { valid: true } or { valid: false, reason: string }
 * @param {string} token  - opaque token returned by createCaptcha
 * @param {string} answer - what the user typed
 */
export const verifyCaptcha = (token, answer) => {
  if (!token || !answer) {
    return { valid: false, reason: 'Missing captcha token or answer' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Malformed captcha token' };
  }

  const [payload, sig] = parts;

  // Verify HMAC signature (constant-time comparison)
  const expectedSig = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payload)
    .digest('hex');

  const sigBuffer = Buffer.from(sig, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  let sigsMatch = false;
  try {
    sigsMatch = sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return { valid: false, reason: 'Invalid captcha token signature' };
  }

  if (!sigsMatch) {
    return { valid: false, reason: 'Captcha token signature mismatch' };
  }

  // Decode payload
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'Captcha token decode error' };
  }

  // Check expiry
  if (Math.floor(Date.now() / 1000) > parsed.expiresAt) {
    return { valid: false, reason: 'Captcha has expired. Please refresh and try again.' };
  }

  // Compare answer (case-insensitive, trimmed)
  if (answer.trim().toLowerCase() !== parsed.code.toLowerCase()) {
    return { valid: false, reason: 'Incorrect captcha answer' };
  }

  return { valid: true };
};

