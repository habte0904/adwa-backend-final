import express from "express"
import { feedbackController } from "../controllers/visitorfeedbackController.js";
import {
  feedbackSubmitLimiter,
  feedbackReadLimiter,
} from "../middlewares/feedbackRateLimit.js"

const router = express.Router()

// Survey routes
router.get("/surveys", feedbackController.getSurveys.bind(feedbackController))
router.get("/surveys/:id", feedbackController.getSurveyById.bind(feedbackController))
router.get("/surveys/:surveyId/stats", feedbackController.getSurveyStats.bind(feedbackController))

// Feedback routes
// feedbackSubmitLimiter: max 5 submissions per IP per 15 minutes (anti-automation)
// feedbackReadLimiter:   max 60 reads per IP per 15 minutes (anti-enumeration)
router.post("/feedback", feedbackSubmitLimiter, feedbackController.submitFeedback.bind(feedbackController))
router.get("/feedback", feedbackReadLimiter, feedbackController.getFeedbackResponses.bind(feedbackController))

export default router
