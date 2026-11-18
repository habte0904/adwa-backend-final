import express from 'express';
import {
  createEventTicketType,
  getEventTicketTypes,
  updateEventTicketType,
  deleteEventTicketType
} from '../controllers/eventTicketType.controller.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

// Create ticket type for event
router.post('/', authenticateToken,authorizePermissions(["EVT_REPORT"]),createEventTicketType);

// Get all ticket types for an event
router.get('/:event_id', authenticateToken,authorizePermissions(["EVT_REPORT"]),getEventTicketTypes);

// Update ticket type
router.put('/:ticket_id', authenticateToken,authorizePermissions(["EVT_REPORT"]), updateEventTicketType);

// Delete ticket type
router.delete('/:ticket_id', authenticateToken,authorizePermissions(["EVT_REPORT"]), deleteEventTicketType);

export default router;
