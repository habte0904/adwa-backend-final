import express from "express"
import { adminFeedbackController } from "../controllers/adminFeedbackController.js"

const router = express.Router()

// Get feedback responses with filtering and pagination
router.route("/responses").get(adminFeedbackController.getFeedbackResponses)

// Get response statistics
router.route("/responses/stats").get(adminFeedbackController.getResponseStats)

// Delete a response
router.route("/responses/:id").delete(adminFeedbackController.deleteResponse)

// Export responses
router.route("/responses/export").get(adminFeedbackController.exportResponses)

export default router