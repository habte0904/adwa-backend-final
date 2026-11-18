// middlewares/feedbackRateLimit.js
// Rate limiting for the public feedback submission endpoint.
// Prevents automated bots and scripts from flooding the survey database.

import rateLimit from 'express-rate-limit';

/**
 * Per-IP rate limiter for the feedback POST endpoint.
 * Allows a maximum of 10 submissions per IP address per 15-minute window.
 * Returns HTTP 429 with a JSON error body when the limit is exceeded.
 */
export const feedbackSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per IP within the window
  standardHeaders: true,     // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,      // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use the real client IP, accounting for reverse proxies
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: 'Too many feedback submissions. Please wait 15 minutes before submitting again.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60), // minutes
    });
  },
});

