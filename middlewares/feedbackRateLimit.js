
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Resolves the real client IP, honouring common reverse-proxy headers.
 * Uses ipKeyGenerator to safely normalise IPv6 addresses and prevent
 * IPv6-based rate-limit bypass (ERR_ERL_KEY_GEN_IPV6).
 */
const resolveIp = (req) => {
  const raw =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';
  return ipKeyGenerator(raw);
};

// ---------------------------------------------------------------------------
// Feedback submission limiter
// Max 5 submissions per IP per 15-minute window.
// Reduced from the previous limit of 10 to tighten the window against
// semi-automated scripts that rotate IP addresses slowly.
// ---------------------------------------------------------------------------
export const feedbackSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 submissions per IP
  standardHeaders: true,     // emit `RateLimit-*` headers (RFC 6585)
  legacyHeaders: false,      // disable `X-RateLimit-*`
  keyGenerator: resolveIp,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error:
        'Too many feedback submissions from this IP address. ' +
        'Please wait 15 minutes before trying again.',
      retryAfterMinutes: Math.ceil(options.windowMs / 1000 / 60),
    });
  },
});

// ---------------------------------------------------------------------------
// Feedback read limiter
// Protects GET /feedback and similar listing endpoints from enumeration
// or DoS via rapid polling. 60 reads per IP per 15-minute window is
// generous for legitimate clients and still throttles abusive scrapers.
// ---------------------------------------------------------------------------
export const feedbackReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,                   // max 60 reads per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveIp,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: 'Too many requests. Please slow down and try again later.',
      retryAfterMinutes: Math.ceil(options.windowMs / 1000 / 60),
    });
  },
});

// ---------------------------------------------------------------------------
// Contact form limiter
// Max 5 contact-form submissions per IP per 15-minute window.
// Prevents automated spam campaigns from flooding the inbox.
// ---------------------------------------------------------------------------
export const contactSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 contact requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveIp,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error:
        'Too many contact requests from this IP address. ' +
        'Please wait 15 minutes before submitting again.',
      retryAfterMinutes: Math.ceil(options.windowMs / 1000 / 60),
    });
  },
});
