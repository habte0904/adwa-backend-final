import express from 'express';
import { feedbackController } from '../controllers/visitorfeedbackController.js'; // Corrected import

const router = express.Router();

// Kiosk Survey Routes
router.get("/surveys", feedbackController.getSurveys.bind(feedbackController));
router.get("/surveys/:id", feedbackController.getSurveyById.bind(feedbackController));
router.get("/surveys/:surveyId/stats", feedbackController.getSurveyStats.bind(feedbackController));

// Feedback Submission Route
router.post("/feedback", feedbackController.submitFeedback.bind(feedbackController));
router.get("/feedback", feedbackController.getFeedbackResponses.bind(feedbackController));

export default router;