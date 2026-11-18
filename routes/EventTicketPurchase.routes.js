import express from 'express';
import * as eventTicketPurchaseController from '../controllers/eventTicketPurchase.controller.js';
import { eventInfoValidator } from '../validators/eventInfoValidator.js';
import { validateRequest } from "../middlewares/validateRequest.js";
const router = express.Router();

// Route to purchase a ticket
//router.post('/event-ticket-purchase', eventTicketPurchaseController.purchaseTicket);
router.post('/create-free-ticket', eventInfoValidator, validateRequest, eventTicketPurchaseController.createFreeTicketHandler);
router.get('/events/:eventId/ticketType', eventTicketPurchaseController.getTicketTypesByEvent)
router.get('/booking-event-confirmation/:tx_ref', eventTicketPurchaseController.getEventBookingConfirmation);
// GET /tickets/:tx_ref/pdf
router.get("/event/tickets/:tx_ref/pdf", eventTicketPurchaseController.downloadTicketPDF);
export default router;
