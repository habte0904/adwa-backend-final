import express from "express";
import { getProfile, updateProfile, changePassword } from "../controllers/employeeProfile.controller.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import multer from "multer";
import { validateRequest } from "../middlewares/validateRequest.js";
import { updateProfileValidator } from "../validators/updateProfileValidator.js";

const router = express.Router();
const upload = multer({ dest: "uploads/profile_images/" });

router.get("/profile", authenticateToken, getProfile);
router.put(
	"/profile",
	authenticateToken,
	upload.single("profile_image"),
	updateProfileValidator,
	validateRequest,
	updateProfile
);
router.patch("/profile/password", authenticateToken, changePassword);

export default router;
