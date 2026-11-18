import * as eventTicketPurchaseService from '../services/eventTicketPurchase.service.js';
import { generateEventTicketPDF } from '../utils/pdfGenerator.js';
import { generateTicketQR } from '../utils/qrGenerator.js';
import pool from '../config/db.config.js';
export async function purchaseTicket(req, res) {
  try {
    const ticketData = req.body;
    const purchaseResult = await eventTicketPurchaseService.createTicketPurchase(ticketData);

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

export async function initiatePaymentHandler(req, res) {
  try {
    const result = await eventTicketPurchaseService.initiatePayment(req.body);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Payment initiation failed", error: e.message });
  }
}

export async function webhookHandler(req, res) {
  return eventTicketPurchaseService.handleChapaWebhook(req, res);
}

export async function getPaymentStatusHandler(req, res) {
  return eventTicketPurchaseService.getPaymentStatus(req, res);
}

export async function getTicketTypesByEvent(req, res) {
  try {
    const { eventId } = req.params;
    const ticketTypes = await eventTicketPurchaseService.fetchTicketTypes(eventId);
    res.json({ success: true, ticketTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch ticket types" });
  }
};


export const getEventBookingConfirmation = async (req, res) => {
  const { tx_ref } = req.params;
  const merch_order_id = tx_ref

  try {
    const bookingDetails = await eventTicketPurchaseService.getEventBookingDetails(merch_order_id);

    if (!bookingDetails) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json({ data: bookingDetails });
  } catch (error) {
    console.error('Error fetching booking confirmation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export async function downloadTicketPDF(req, res) {
  try {
    const tx_ref = req.params.tx_ref;

    // 1. Fetch booking info - check both ID columns for flexibility
    const { rows: bookingRows } = await pool.query(
      `SELECT * FROM event_info 
       WHERE event_booking_id = $1 OR merch_order_id = $1 
       LIMIT 1`,
      [tx_ref]
    );
    if (bookingRows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const booking = bookingRows[0];
    const internal_booking_id = booking.event_booking_id;

    // 2. Fetch event details (same query as handleChapaWebhook)
    const { rows: eventRows } = await pool.query(
      `SELECT ei.*, vs.venue AS location, vs.venue_am AS location_am
       FROM event ei
       JOIN venue_schedule vs ON ei.venue_id = vs.venue_id
       WHERE ei.event_id = $1
       LIMIT 1`,
      [booking.event_id]
    );
    if (eventRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    const event = eventRows[0];
    const visit_date = event.date;
    const event_title = event.title;
    const event_location = event.location || event.venue || null;

    // 3. Fetch individual tickets using the internal ID
    const { rows: ticketRows } = await pool.query(
      `SELECT ebt.type_id, ebt.ticket_id, ebt.status, ett.type
       FROM event_bought_tickets ebt
       JOIN event_ticket_types ett ON ebt.ticket_id = ett.ticket_id
       WHERE ebt.event_booking_id = $1`,
      [internal_booking_id]
    );
    if (ticketRows.length === 0) {
      return res.status(404).json({ message: "No tickets found for this booking" });
    }

    // 4. Generate one PDF buffer per ticket
    const pdfBuffers = [];
    for (const ticket of ticketRows) {
      // Use internal_booking_id for QR to match email/verification
      const qrCode = await generateTicketQR(ticket.type_id, booking.email, internal_booking_id, visit_date);
      const pdf = await generateEventTicketPDF({
        event_title,
        type_id: ticket.type_id,
        ticket_id: ticket.type,
        email: booking.email,
        visit_date,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event_location,
        qrCode,
        status: ticket.status
      });
      pdfBuffers.push(pdf);
    }

    // 5. Combine all PDF buffers into one multi-page PDF
    const { PDFDocument: PDFLib } = await import('pdf-lib');
    const mergedPdf = await PDFLib.create();

    for (const buf of pdfBuffers) {
      const srcDoc = await PDFLib.load(buf);
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    res.setHeader('Content-Disposition', `attachment; filename=Event_Tickets_${tx_ref}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.end(Buffer.from(mergedBytes));

  } catch (error) {
    console.error("PDF generation failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "PDF generation failed", error: error.message });
    }
  }
}

export const createFreeTicketHandler = async (req, res) => {
  try {
    const result = await eventTicketPurchaseService.createFreeTicket(req.body);
    return res.json(result);
  } catch (e) {
    // Return specific error message for duplicates or validation errors
    if (e.message.includes("already booked") || e.message.includes("one ticket")) {
      console.warn("Free ticket validation failed:", e.message); // Clean log
      return res.status(400).json({ message: e.message, success: false });
    }
    console.error("Free ticket creation failed:", e); // Full log for unexpected errors
    return res.status(500).json({ message: "Free ticket creation failed", error: e.message, success: false });
  }
};
