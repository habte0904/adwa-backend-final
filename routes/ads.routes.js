import express from "express";
import * as adsController from "../controllers/ads.controller.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

// NOTE: no "/api" prefix here — app.js will mount this router under "/api"
router.get("/ads", adsController.getAllAds);
router.get("/ads/:id", authenticateToken,authorizePermissions(["AD"]), adsController.getAdById);
router.post("/ads", authenticateToken,authorizePermissions(["AD"]), adsController.createAd);
router.put("/ads/:id", authenticateToken,authorizePermissions(["AD"]), adsController.updateAd);
router.delete("/ads/:id", authenticateToken,authorizePermissions(["AD"]), adsController.deleteAd);

export default router;