import express from "express"
import fs from "fs"
import {
  createServiceRequest, updateServiceRequest, addUnavailableDateTime, getReserveRequest,
  getSpecificRequest, deleteServiceRequest, deleteUnavailableDateTime, deleteUnavailableTimeSlot,
  deleteUnavailableTimeSlotVenue, deleteUnavailableDateTimeVenue, uploadPaymentSlip
} from "../controllers/userServiceRequest.js"
import { addServiceRequestValidatorUser, updateServiceRequestValidatorUser } from "../validators/addServiceRequestValidator.js"
import { validateRequest } from "../middlewares/validateRequest.js";
import { getUnavailableDateTime } from '../controllers/scheduleController.js';
import { requireAuth } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/service-letters/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

const slipStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/payment-slips/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});
const uploadSlip = multer({ storage: slipStorage });

const router = express.Router();

router.route("/user/service-request").post(requireAuth, upload.single("attachment"), addServiceRequestValidatorUser, validateRequest, createServiceRequest)
router.route("/user/service-request").get(requireAuth, getSpecificRequest)
router.route("/user/service-request/:id").put(requireAuth, upload.single("attachment"), updateServiceRequestValidatorUser, validateRequest, updateServiceRequest)
router.route("/user/service-request/:id").delete(requireAuth, deleteServiceRequest)
router.route("/user/service-request/request-dates/:id").delete(requireAuth, deleteUnavailableDateTime)
router.route("/user/service-request/time-slot/:id").delete(requireAuth, deleteUnavailableTimeSlot)
router.route('/user/schedule/:venue_id').get(requireAuth, getUnavailableDateTime);
router.route("/user/service-request/reserve/:tx_ref").get(requireAuth, getReserveRequest)
router.route("/user/schedule/:venue_id").post(requireAuth, addUnavailableDateTime)
router.route("/user/schedule/:id").delete(requireAuth, deleteUnavailableDateTimeVenue)
router.route("/user/service-request/upload-slip/:id").post(requireAuth, uploadSlip.single("paymentSlip"), uploadPaymentSlip)
router.route("/user/schedule/time-slot/:id").delete(requireAuth, deleteUnavailableTimeSlotVenue)

export default router;
