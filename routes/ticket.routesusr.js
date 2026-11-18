import express from 'express';
import * as ticketController from '../controllers/ticketControllerUsr.js';
import {authenticateToken} from '../middlewares/authMiddleware.js'
import { authorizePermissions } from '../middlewares/authorizePermissions.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
const router = express.Router();

// // Route to create a new ticket
// router.post('/tickets/types',ticketController.createTicketType);

// //route to get all ticket types
// router.get('/tickets/types', ticketController.getTicketTypes);

// //route to Update Ticket Type
// router.put('/tickets/types/:id', ticketController.updateTicketType);

// // route to delete a ticket type
//  router.delete('/tickets/types/:id', ticketController.deleteTicketType);

//accourding to the  group table

router.post('/tickets/types', authenticateToken,authorizePermissions(["TCKT_TYPES"]),ticketController.createTicketType);
router.get('/tickets/types', ticketController.getTicketTypes);
router.get('/tickets/types/front', ticketController.getTicketTypesFront);
router.put('/tickets/types/:id', authenticateToken,authorizePermissions(["TCKT_TYPES"]),ticketController.updateTicketType);
router.delete('/tickets/types/:id', authenticateToken,authorizePermissions(["TCKT_TYPES"]),ticketController.deleteTicketType);
router.get('/orders/:chapa_tx_ref/download-pdf', ticketController.downloadTicketPDF);
router.get('/my-tickets', requireAuth, ticketController.getMyTickets);


// route 
// router.post('/tickets/service', ticketController.createService);
// router.get('/tickets/service', ticketController.getAllServices);
// router.get('/tickets/service/:id', ticketController.getServiceById);
// router.put('/tickets/service/:id', serviceController.updateService);
// router.delete('/tickets/service/:id', ticketController.deleteService);


// test database connection
router.get('/testDbConnection', async (req, res) => {
    try {
        const result = await ticketController.testDbConnection();
        res.status(200).json({ message: 'Database connection successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

router.post('/orders', ticketController.createOrderAndTickets);
router.get('/orders/:orderId', ticketController.getOrderDetails);
router.get('/orders/:orderId/download-pdf', ticketController.downloadTicketPDF);
router.get('/email/:orderId', ticketController.emailTicket);

router.get('/orders/user', ticketController.getUserOrders);



export default router;
