import pool from '../config/db.config.js';


// Create Ticket Type for Event
async function createEventTicketType(ticketData) {
  const sql = `
    INSERT INTO event_ticket_types
    (event_id, type, price, description, feature, ticket_limit, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ticket_id
  `;
  const values = [
    ticketData.event_id,
    ticketData.type,
    ticketData.price,
    ticketData.description,
    ticketData.feature,
    ticketData.ticket_limit,
    ticketData.status
  ];
  const result = await pool.query(sql, values);
  return result.rows[0].ticket_id;
}

// Get All Ticket Types for an Event
async function getEventTicketTypes(event_id) {
  const sql = 'SELECT * FROM event_ticket_types WHERE event_id = $1';
  const result = await pool.query(sql, [event_id]);
  return result.rows;
}

// Update Ticket Type
async function updateEventTicketType(ticket_id, ticketData) {
  const sql = `
    UPDATE event_ticket_types
    SET type = $1, price = $2, description = $3, feature = $4, ticket_limit = $5, status = $6
    WHERE ticket_id = $7
  `;
  const values = [
    ticketData.type,
    ticketData.price,
    ticketData.description,
    ticketData.feature,
    ticketData.ticket_limit,
    ticketData.status,
    ticket_id
  ];
  const result = await pool.query(sql, values);
  return { affectedRows: result.rowCount };
}

// Delete Ticket Type
async function deleteEventTicketType(ticket_id) {
  const sql = 'DELETE FROM event_ticket_types WHERE ticket_id = $1';
  const result = await pool.query(sql, [ticket_id]);
  return result.rowCount > 0 ? { message: 'Ticket type deleted successfully' } : null;
}

export default {
  createEventTicketType,
  getEventTicketTypes,
  updateEventTicketType,
  deleteEventTicketType
};
