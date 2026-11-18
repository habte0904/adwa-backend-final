import express from "express"
import { feedbackController } from "../controllers/visitorfeedbackController.js";
import { feedbackSubmitLimiter } from "../middlewares/feedbackRateLimit.js"

const router = express.Router()

// Survey routes
router.get("/surveys", feedbackController.getSurveys.bind(feedbackController))
router.get("/surveys/:id", feedbackController.getSurveyById.bind(feedbackController))
router.get("/surveys/:surveyId/stats", feedbackController.getSurveyStats.bind(feedbackController))

// Feedback routes
// feedbackSubmitLimiter: max 10 submissions per IP per 15 minutes (Finding 3 fix)
router.post("/feedback", feedbackSubmitLimiter, feedbackController.submitFeedback.bind(feedbackController))
router.get("/feedback", feedbackController.getFeedbackResponses.bind(feedbackController))

export default router
