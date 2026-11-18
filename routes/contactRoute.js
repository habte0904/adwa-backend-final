import express from 'express';
import { sendContactMail } from '../controllers/contactController.js';
import { contactSubmitLimiter } from '../middlewares/feedbackRateLimit.js';

const router = express.Router();

// Contact form submission
// contactSubmitLimiter: max 5 submissions per IP per 15 minutes (anti-spam)
router.post('/contact', contactSubmitLimiter, sendContactMail);

export default router;
