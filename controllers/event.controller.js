
import pool from '../config/db.config.js';
import eventTicketTypeService from '../services/eventTicketType.service.js';

// Get all events (with updated columns)
export async function getAllEvents(req, res) {
  try {
    const eventsResult = await pool.query(`
      SELECT event_id, title, description, date, start_time, end_time, vs.venue as location, ec.category as category, no_of_attendee, event.status, created_at, updated_at
      FROM event
      inner join event_category ec on event.category_id=ec.id
      inner join venue_schedule vs on  event.venue_id=vs.venue_id
      ORDER BY date DESC, start_time DESC
    `);
    const events = eventsResult.rows;

    // For each event, fetch all ticket types, bought tickets, and payment/attendance summary
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      // Ticket types
      const ticketTypes = await eventTicketTypeService.getEventTicketTypes(event.event_id);
      const ticketsSold = ticketTypes.map(ticket => ({
        type: ticket.type,
        ticket_limit: ticket.ticket_limit,
        price: ticket.price,
        status: ticket.status
      }));

      // Bought tickets breakdown (type, count, status)
      const boughtTicketsResult = await pool.query(
        `SELECT ett.type, ebt.status, COUNT(*) as count
         FROM event_bought_tickets ebt
         JOIN event_ticket_types ett ON ett.ticket_id = ebt.ticket_id
         WHERE ett.event_id = $1
         GROUP BY ett.type, ebt.status`,
        [event.event_id]
      );
      const boughtTickets = boughtTicketsResult.rows.map(row => ({
        type: row.type,
        status: row.status,
        count: parseInt(row.count, 10)
      }));

      // Total paid amount and attendance summary
      const infoResult = await pool.query(
        `SELECT COALESCE(SUM(paid_amount),0) as total_paid, COUNT(*) FILTER (WHERE attendance = 'true') as attended, COUNT(*) as total
         FROM event_info WHERE event_id = $1`,
        [event.event_id]
      );
      const info = infoResult.rows[0];
      const totalPaid = parseFloat(info.total_paid) || 0;
      const attendance = {
        attended: parseInt(info.attended, 10) || 0,
        total: parseInt(info.total, 10) || 0
      };

      return { ...event, ticketsSold, boughtTickets, totalPaid, attendance };
    }));

    res.json(eventsWithDetails);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
}

// Get event by ID (with updated columns)
export async function getEventById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT event_id, title, description, date, start_time, end_time, vs.venue as location, ec.category as category, no_of_attendee, event.status, created_at, updated_at
      FROM event
      inner join event_category ec on event.category_id=ec.id
      inner join venue_schedule vs on  event.venue_id=vs.venue_id
      WHERE event_id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
}
