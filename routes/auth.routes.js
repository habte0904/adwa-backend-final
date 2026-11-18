import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  ipRateLimiter,
  parallelRequestBlocker,
} from '../middlewares/loginSecurity.js';

const router = express.Router();

// ── Captcha (no rate limiting needed — it only returns an image) ──
router.get('/captcha', authController.getCaptcha);

// ── Login: enforce IP rate limit + block parallel requests ──
router.post('/login', ipRateLimiter, parallelRequestBlocker, authController.login);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

router.post('/resend-verification-code', userController.requestVisitorRegistration);
export default router;

