import express from 'express';
import {
  getFacilities,
  getVenues,
  getServiceCategories,
  createFacility,
  updateFacility,
  deleteFacility,
  getFrontendFacilities 
} from '../controllers/serviceFacilityController.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/service-letters/");
  },
  filename: function (req, file, cb) {
    // Use original name or add extension to random name
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

const router = express.Router();
//authenticateToken,authorizePermissions(["SVC_CATEGORY"]),
// Routes
router.get('/facilities', authenticateToken,authorizePermissions(["SVC_MGMT"]),getFacilities);
router.get('/facilities/front', getFrontendFacilities );
router.get('/venues', authenticateToken,authorizePermissions(["SVC_MGMT"]),getVenues);
router.get('/service-categories',authenticateToken,authorizePermissions(["SVC_MGMT"]), getServiceCategories);
router.post('/facilities', authenticateToken, authorizePermissions(["SVC_MGMT"]), upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), createFacility);
router.put('/facilities/:id', authenticateToken, authorizePermissions(["SVC_MGMT"]), upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), updateFacility);
router.delete('/facilities/:id', authenticateToken,authorizePermissions(["SVC_MGMT"]),deleteFacility);

export default router;
