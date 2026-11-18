import {Router} from 'express';
import { validateTicket,getTodayEvents,getEventTickets,sendWalkInPaymentDetail,sendWalkInPaymentQr,getRecentWalkInTickets } from '../controllers/eventTicketController.js';
import {authenticateToken} from '../middlewares/authMiddleware.js';
import {authorizePermissions} from '../middlewares/authorizePermissions.js';
const evtTicketRouter = Router();


evtTicketRouter.post('/event/validateTicket',authenticateToken,authorizePermissions(["EVT_VAL"]), validateTicket);
evtTicketRouter.get('/event/walkInTicket/recent',authenticateToken,authorizePermissions(["EVT_WALKIN"]), getRecentWalkInTickets);

evtTicketRouter.get('/event/walkInTicket/payment_detail/:tx_ref', authenticateToken,authorizePermissions(["EVT_WALKIN"]),sendWalkInPaymentDetail)
evtTicketRouter.get('/event/walkInTicket/payment_qr/:tx_ref', authenticateToken,authorizePermissions(["EVT_WALKIN"]),sendWalkInPaymentQr)

evtTicketRouter.get("/event/today", authenticateToken,authorizePermissions(["EVT_WALKIN"]),getTodayEvents)

// Get ticket types for a specific event
evtTicketRouter.get("/event/:event_id/ticket_types",authenticateToken,authorizePermissions(["EVT_WALKIN"]), getEventTickets)

export default evtTicketRouter;