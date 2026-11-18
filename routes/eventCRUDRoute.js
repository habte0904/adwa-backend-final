import express from "express";
import multer from "multer";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  sendEventMessage,
  getAllEventsSimple,
  getSpecificEventsSimple
} from "../controllers/eventCRUDController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

// the multer configuration to accept the multiform data
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname + '-' + uniqueSuffix)
  }
  
})

const upload = multer({ storage: storage })

// All routes prefixed with /api
router.get("/manage/getEvents", authenticateToken,authorizePermissions(["EVT_CRUD"]),getAllEvents);
router.post("/manage/createEvents", authenticateToken,authorizePermissions(["EVT_CRUD"]),upload.single("image"), createEvent); // "image" is the field name
router.put("/manage/updateEvents/:event_id",authenticateToken,authorizePermissions(["EVT_CRUD"]), upload.single("image"), updateEvent);
router.delete("/manage/deleteEvents/:event_id", authenticateToken,authorizePermissions(["EVT_CRUD"]),deleteEvent);
router.post("/manage/events/message", authenticateToken,authorizePermissions(["EVT_CRUD"]),sendEventMessage);
router.get("/events/userSide", getAllEventsSimple);
router.get("/events/userSide/:id", getSpecificEventsSimple);

export default router;

