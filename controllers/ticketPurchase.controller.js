import * as ticketPurchaseService from '../services/ticketPurchase.service.js';

export async function purchaseTicket(req, res) {

  try {
    const ticketData = req.body;
    const purchaseResult = await ticketPurchaseService.createTicketPurchase(ticketData);

    if (purchaseResult) {
      res.status(201).json({
        message: 'Ticket purchase successful',
        data: purchaseResult
      });
    } else {
      res.status(400).json({
        message: 'Ticket purchase failed',
      });
    }
  } catch (error) {
    console.error('Error creating ticket purchase:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}


