import { query } from '../config/db.config.js';
import { generateTicketQR } from '../utils/qrGenerator.js';

export const getBookingDetails = async (merch_order_id) => {
  try {
    if (!merch_order_id) {
      console.error('Invalid merch_order_id:', merch_order_id);
      return null;
    }

    const bookingResult = await query(
      `SELECT * FROM bought_ticket 
       WHERE merch_order_id = $1 OR ticket_booking_id = $1 
       LIMIT 1`,
      [merch_order_id]
    );
    if (bookingResult.length === 0) return null;

    const booking = bookingResult[0];

    const { ticket_booking_id, email, visit_date, group_id, discount_breakdown } = booking;

    let tickets = [];
    let services = [];

    // -------- GROUP BOOKING --------
    if (group_id) {
      const groupResult = await query(
        `SELECT ticket_booking_id FROM bought_ticket WHERE group_id = $1`,
        [group_id]
      );

      const allTicketBookingIds = groupResult.map(row => row.ticket_booking_id);

      const ticketResult = await query(
        `SELECT tbt.ticket_booking_id, tbt.type_id, tbt.ticket_id, tt.type, 
                tbt.status, tbt.unit_price, tbt.discount_percent
         FROM bought_ticket_types tbt
         JOIN ticket_types tt ON tbt.ticket_id = tt.ticket_id
         WHERE tbt.ticket_booking_id = ANY($1)`,
        [allTicketBookingIds]
      );
      // Single QR for the group
      const group_qr_code = await generateTicketQR(
        ticketResult[0].type_id, // unique enough for QR
        email,
        group_id,
        visit_date
      );

      // Aggregate tickets per type with quantity and paid amount
      // Aggregate tickets per type with quantity and paid amount
      const aggregatedTickets = Object.values(
        ticketResult.reduce((acc, t) => {
          if (!acc[t.ticket_id]) {
            // Count how many tickets of this type exist in the group
            const quantity = ticketResult.filter(tr => tr.ticket_id === t.ticket_id).length;
            const unit_price = t.unit_price;
            const discount_percent = t.discount_percent || 0;
            acc[t.ticket_id] = {
              type: t.type,
              ticket_id: t.ticket_id,
              unit_price,
              discount_percent,
              quantity,
              paid_amount: unit_price * (1 - discount_percent / 100) * quantity
            };
          }
          return acc;
        }, {})
      );


      tickets = [{
        type_id: ticketResult[0].type_id,
        status: ticketResult[0].status,
        group_id,
        email,
        qr_code: group_qr_code,
        total_members: booking.total_tickets,
        ticketTypes: Object.values(aggregatedTickets)
      }];

      // Services
      const serviceResult = await query(
        `SELECT s.id AS service_id, s.name, bs.quantity, s.price
         FROM bought_services bs
         JOIN services s ON s.id = bs.service_id
         WHERE bs.ticket_booking_id = $1`,
        [ticket_booking_id]
      );

      services = serviceResult.map(row => ({
        ...row,
        subtotal: row.price * row.quantity
      }));
    }
    // -------- SINGLE BOOKING --------
    else {
      const ticketResult = await query(
        `SELECT tbt.type_id, tbt.ticket_id, tt.type, tbt.status,
                tbt.unit_price, tbt.discount_percent
         FROM bought_ticket_types tbt
         JOIN ticket_types tt ON tbt.ticket_id = tt.ticket_id
         WHERE tbt.ticket_booking_id = $1`,
        [ticket_booking_id]
      );
      tickets = await Promise.all(ticketResult.map(async (ticket) => {
        const qr_code = await generateTicketQR(
          ticket.type_id,
          email,
          ticket_booking_id,
          visit_date
        );

        const quantity = discount_breakdown?.[ticket.ticket_id]?.quantity || 1;
        const unit_price = ticket.unit_price;
        const discount_percent = ticket.discount_percent || 0;
        const paid_amount = unit_price * (1 - discount_percent / 100) * quantity;

        return {
          ...ticket,
          qr_code,
          quantity,
          unit_price,
          discount_percent,
          paid_amount
        };
      }));

      // Services
      const serviceResult = await query(
        `SELECT s.id AS service_id, s.name, bs.quantity, s.price
         FROM bought_services bs
         JOIN services s ON s.id = bs.service_id
         WHERE bs.ticket_booking_id = $1`,
        [ticket_booking_id]
      );

      services = serviceResult.map(row => ({
        ...row,
        subtotal: row.price * row.quantity
      }));
    }

    return {
      ticket_booking_id,
      email,
      visit_date,
      group_id: group_id || null,
      is_group: !!group_id,
      tickets,
      services,
      total_tickets: tickets.reduce((sum, t) => {
        if (t.ticketTypes) return sum + t.ticketTypes.reduce((s, tt) => s + tt.quantity, 0);
        return sum + (t.quantity || 1);
      }, 0)
    };

  } catch (error) {
    console.error('Error in getBookingDetails:', error);
    throw error;
  }
};


