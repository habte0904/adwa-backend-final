import express from 'express';
import { getAllEvents, getEventById } from '../controllers/event.controller.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

// Get all events
router.get('/', authenticateToken,authorizePermissions(["EVT_REPORT"]), getAllEvents);
// (Optional) Get event by ID
router.get('/:id', authenticateToken,authorizePermissions(["EVT_REPORT"]),getEventById);

export default router;
