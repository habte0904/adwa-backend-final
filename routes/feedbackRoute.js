import express from "express";
import * as feedbackController from "../controllers/feedbackController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

// Get all responses
router.get("/responses",authenticateToken,authorizePermissions(["FEEDBACK"]), feedbackController.getResponses);

// Get survey statistics
router.get("/stats", authenticateToken,authorizePermissions(["FEEDBACK"]),feedbackController.getStats);

// Get all questions
router.get("/questions", authenticateToken,authorizePermissions(["FEEDBACK"]),feedbackController.getQuestions);

// Add a new question
router.post("/questions", authenticateToken,authorizePermissions(["FEEDBACK"]),feedbackController.addQuestion);

// Update a question
router.put("/questions/:id", authenticateToken,authorizePermissions(["FEEDBACK"]),feedbackController.updateQuestion);

// Delete a question
router.delete("/questions/:id", authenticateToken,authorizePermissions(["FEEDBACK"]),feedbackController.deleteQuestion);

// Update survey status
router.put("/survey", authenticateToken,authorizePermissions(["FEEDBACK"]),feedbackController.updateSurveyStatus);

export default router;
