// middlewares/loginSecurity.js
// Implements:
//  1. IP-based rate limiting on the login endpoint
//  2. Account-level lockout after N consecutive failed attempts
//  3. Detection & rejection of parallel/concurrent login attempts from same IP

const LOGIN_WINDOW_MS = 15 * 60 * 1000;  // 15-minute sliding window
const MAX_REQUESTS_PER_WINDOW = 5;       // max 5 login attempts per IP in window
const MAX_FAILURES_BEFORE_LOCKOUT = 5;   // lock account after 5 consecutive bad passwords
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15-minute lockout
const PROGRESSIVE_DELAY_BASE_MS = 1000;  // 1-second base delay per failure
const PARALLEL_REQUEST_TIMEOUT_MS = 5000; // consider requests "parallel" if within 5 s

// In-memory stores (replace with Redis in production for horizontal scaling)
const ipRequestLog = new Map();    // ip -> { count, windowStart }
const accountFailures = new Map(); // email/username -> { failures, lockedUntil, lastFailure }
const activeRequests = new Map();  // ip -> timestamp of most-recent in-flight request

/**
 * Clean up stale entries to prevent memory leaks.
 * Called internally; can also be called by a periodic job.
 */
export const cleanupStaleEntries = () => {
  const now = Date.now();
  for (const [ip, record] of ipRequestLog.entries()) {
    if (now - record.windowStart > LOGIN_WINDOW_MS) ipRequestLog.delete(ip);
  }
  for (const [key, record] of accountFailures.entries()) {
    if (record.lockedUntil && now > record.lockedUntil + LOCKOUT_DURATION_MS) {
      accountFailures.delete(key);
    }
  }
  for (const [ip, ts] of activeRequests.entries()) {
    if (now - ts > PARALLEL_REQUEST_TIMEOUT_MS * 2) activeRequests.delete(ip);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupStaleEntries, 5 * 60 * 1000);

/**
 * Get the real IP, respecting X-Forwarded-For if behind a proxy.
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. IP-based rate limiter middleware
// ──────────────────────────────────────────────────────────────────────────────
export const ipRateLimiter = (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();

  let record = ipRequestLog.get(ip);
  if (!record || now - record.windowStart > LOGIN_WINDOW_MS) {
    // Start a fresh window
    record = { count: 1, windowStart: now };
  } else {
    record.count += 1;
  }
  ipRequestLog.set(ip, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((LOGIN_WINDOW_MS - (now - record.windowStart)) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      message: `Too many login attempts from this IP. Please wait ${Math.ceil(retryAfterSec / 60)} minute(s) and try again.`,
      retryAfter: retryAfterSec,
    });
  }

  next();
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. Parallel request detector middleware
//    Blocks a second in-flight request from the same IP if a prior one is
//    still being processed (within PARALLEL_REQUEST_TIMEOUT_MS).
// ──────────────────────────────────────────────────────────────────────────────
export const parallelRequestBlocker = (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();

  const lastTs = activeRequests.get(ip);
  if (lastTs && now - lastTs < PARALLEL_REQUEST_TIMEOUT_MS) {
    return res.status(429).json({
      message: 'A login request is already in progress from your connection. Please wait.',
    });
  }

  // Mark this request as in-flight
  activeRequests.set(ip, now);

  // Clear the in-flight marker when the response finishes
  res.on('finish', () => activeRequests.delete(ip));
  res.on('close', () => activeRequests.delete(ip));

  next();
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. Account lockout helpers (called from the controller, not middleware)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Check if an account is currently locked out.
 * @param {string} accountKey  email or username (normalised to lowercase)
 * @returns {{ locked: boolean, remainingMs?: number }}
 */
export const checkAccountLockout = (accountKey) => {
  const key = accountKey.toLowerCase();
  const record = accountFailures.get(key);
  if (!record) return { locked: false };

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return { locked: true, remainingMs: record.lockedUntil - Date.now() };
  }
  return { locked: false };
};

/**
 * Record a failed login attempt for an account.
 * Applies progressive delay and triggers lockout when threshold is exceeded.
 * @param {string} accountKey
 * @returns {{ delayMs: number, locked: boolean, remainingMs?: number }}
 */
export const recordFailedAttempt = (accountKey) => {
  const key = accountKey.toLowerCase();
  const now = Date.now();

  let record = accountFailures.get(key) || { failures: 0, lockedUntil: null, lastFailure: null };

  // If a previous lockout has expired, reset the counter
  if (record.lockedUntil && now > record.lockedUntil) {
    record = { failures: 0, lockedUntil: null, lastFailure: null };
  }

  record.failures += 1;
  record.lastFailure = now;

  if (record.failures >= MAX_FAILURES_BEFORE_LOCKOUT) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    accountFailures.set(key, record);
    return { delayMs: 0, locked: true, remainingMs: LOCKOUT_DURATION_MS };
  }

  accountFailures.set(key, record);

  // Progressive delay: 1s, 2s, 3s, 4s per failure
  const delayMs = (record.failures - 1) * PROGRESSIVE_DELAY_BASE_MS;
  return { delayMs, locked: false };
};

/**
 * Reset the failure counter on a successful login.
 * @param {string} accountKey
 */
export const resetFailedAttempts = (accountKey) => {
  accountFailures.delete(accountKey.toLowerCase());
};

