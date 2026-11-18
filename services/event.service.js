import db from '../config/db.config.js';

// Get all events with analytics (future-proof, dynamic)
export async function getAllEventsService() {
  // This query assumes you have event, event_ticket_types, event_bought_tickets, event_info tables
  // and that ticket types and bought tickets are related by event_id
  const events = await db.query(`
    SELECT e.*, ei.no_of_attendee, 
      COALESCE(json_agg(DISTINCT ett.*) FILTER (WHERE ett.event_id IS NOT NULL), '[]') AS ticketsSold,
      COALESCE(json_agg(DISTINCT bt.*) FILTER (WHERE bt.event_id IS NOT NULL), '[]') AS boughtTickets,
      COALESCE(SUM(bt.count * ett.price), 0) AS totalPaid
    FROM event e
    LEFT JOIN event_info ei ON ei.event_id = e.event_id
    LEFT JOIN event_ticket_types ett ON ett.event_id = e.event_id
    LEFT JOIN event_bought_tickets bt ON bt.event_id = e.event_id
    GROUP BY e.event_id, ei.no_of_attendee
    ORDER BY e.date DESC
  `);
  // Parse JSON fields for ticketsSold and boughtTickets
  return events.rows.map(ev => ({
    ...ev,
    ticketsSold: typeof ev.ticketsSold === 'string' ? JSON.parse(ev.ticketsSold) : ev.ticketsSold,
    boughtTickets: typeof ev.boughtTickets === 'string' ? JSON.parse(ev.boughtTickets) : ev.boughtTickets,
    totalPaid: Number(ev.totalPaid) || 0,
    no_of_attendee: Number(ev.no_of_attendee) || 0,
  }));
}

// Get single event by ID (with analytics)
export async function getEventByIdService(eventId) {
  const events = await db.query(`
    SELECT e.*, ei.no_of_attendee, 
      COALESCE(json_agg(DISTINCT ett.*) FILTER (WHERE ett.event_id IS NOT NULL), '[]') AS ticketsSold,
      COALESCE(json_agg(DISTINCT bt.*) FILTER (WHERE bt.event_id IS NOT NULL), '[]') AS boughtTickets,
      COALESCE(SUM(bt.count * ett.price), 0) AS totalPaid
    FROM event e
    LEFT JOIN event_info ei ON ei.event_id = e.event_id
    LEFT JOIN event_ticket_types ett ON ett.event_id = e.event_id
    LEFT JOIN event_bought_tickets bt ON bt.event_id = e.event_id
    WHERE e.event_id = $1
    GROUP BY e.event_id, ei.no_of_attendee
    ORDER BY e.date DESC
  `, [eventId]);
  if (!events.rows.length) return null;
  const ev = events.rows[0];
  return {
    ...ev,
    ticketsSold: typeof ev.ticketsSold === 'string' ? JSON.parse(ev.ticketsSold) : ev.ticketsSold,
    boughtTickets: typeof ev.boughtTickets === 'string' ? JSON.parse(ev.boughtTickets) : ev.boughtTickets,
    totalPaid: Number(ev.totalPaid) || 0,
    no_of_attendee: Number(ev.no_of_attendee) || 0,
  };
}
