import express from "express"
import { createServiceRequest, updateServiceRequest, getAllRequests, sendMessage, deleteUnavailableDateTime, deleteUnavailableTimeSlot } from "../controllers/serviceRequestController.js"
import { addServiceRequestValidator , updateServiceRequestValidator } from "../validators/addServiceRequestValidator.js"
import { validateRequest } from "../middlewares/validateRequest.js";
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

router.route("/service-request").post(authenticateToken,authorizePermissions(["SVC_REQUEST"]),upload.single("attachment"), addServiceRequestValidator, validateRequest, createServiceRequest)
router.route("/service-request").get(authenticateToken,authorizePermissions(["SVC_REQUEST"]), getAllRequests)
router.route("/service-request/:id").put(authenticateToken,authorizePermissions(["SVC_REQUEST"]), upload.single("attachment"), updateServiceRequestValidator,validateRequest, updateServiceRequest)
router.route("/service-request/send-message").post(authenticateToken,authorizePermissions(["SVC_REQUEST"]),sendMessage)
router.route("/service-request/request-dates/:id").delete(authenticateToken,authorizePermissions(["SVC_REQUEST"]),deleteUnavailableDateTime)
router.route("/service-request/time-slot/:id").delete(authenticateToken,authorizePermissions(["SVC_REQUEST"]),deleteUnavailableTimeSlot)

export default router;
