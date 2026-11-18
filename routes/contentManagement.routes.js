import express from "express";
import {
  getAllContent,
  updatePageContent,
  updateMissionVisionValue,
  updateJourneyTimeline,
  updateImageGallery,
  updateSocialMediaLink,
  updatePartner,
  updateMuseumInfo,
  deleteImg,
  deletePartner,
  deleteValues
} from "../controllers/contentManagement.controller.js";
import multer from "multer";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

// the multer configuration to accept the multiform data
const upload = multer({ dest: "uploads/content-images/" });

// GET all content (for ContentManagementPage)
router.get("/", getAllContent);

// UPDATE endpoints
router.post("/page-content", authenticateToken,authorizePermissions(["CMS"]),upload.single("backgroundImage"),updatePageContent);
router.post("/mission-vision-value",  authenticateToken,authorizePermissions(["CMS"]), updateMissionVisionValue);
router.delete("/mission-vision-value/:id",  authenticateToken,authorizePermissions(["CMS"]), deleteValues);
router.post("/journey-timeline",  authenticateToken,authorizePermissions(["CMS"]), updateJourneyTimeline);
router.post("/image-gallery",  authenticateToken,authorizePermissions(["CMS"]), upload.single("images"),updateImageGallery);
router.post("/social-media-link",  authenticateToken,authorizePermissions(["CMS"]), updateSocialMediaLink);
router.post("/partner",  authenticateToken,authorizePermissions(["CMS"]), upload.single("logo_url"),updatePartner);
router.delete("/partner/:id",  authenticateToken,authorizePermissions(["CMS"]), deletePartner)
router.post("/museum-info",  authenticateToken,authorizePermissions(["CMS"]), upload.single("logo"),updateMuseumInfo);
router.delete("/image-gallery/:id",  authenticateToken,authorizePermissions(["CMS"]), deleteImg);

export default router;
