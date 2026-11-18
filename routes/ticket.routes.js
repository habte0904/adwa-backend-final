import {Router} from 'express';
import { validateTicket,sendWalkInTicketTypes,sendWalkInPaymentDetail,sendWalkInPaymentQr,getRecentWalkInTickets } from '../controllers/ticket.controller.js';
import {authenticateToken} from '../middlewares/authMiddleware.js';
import {authorizePermissions} from '../middlewares/authorizePermissions.js';
import { getTicketActivityDashboard } from '../controllers/ticketDashboard.controller.js'
const ticketRouter = Router();

ticketRouter.get('/dashboard/activity', authenticateToken,authorizePermissions(["TCKT_DASHBOARD"]),getTicketActivityDashboard)
ticketRouter.post('/validateTicket',authenticateToken,authorizePermissions(["VALIDATE_TCKT"]), validateTicket);
ticketRouter.get('/walkInTicket/recent',authenticateToken,authorizePermissions(["WALKIN_REG"]), getRecentWalkInTickets);
ticketRouter.get('/ticket_types', authenticateToken,authorizePermissions(["WALKIN_REG"]),sendWalkInTicketTypes);
ticketRouter.get('/walkInTicket/payment_detail/:tx_ref', authenticateToken,authorizePermissions(["WALKIN_REG"]),sendWalkInPaymentDetail)
ticketRouter.get('/walkInTicket/payment_qr/:tx_ref', authenticateToken,authorizePermissions(["WALKIN_REG"]),sendWalkInPaymentQr)


export default ticketRouter;
