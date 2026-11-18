import pool from '../config/db.config.js';
import { v4 as uuidv4 } from 'uuid';
import qr from 'qrcode';

// Create Ticket Type
// Create Ticket Type
async function createTicketType(ticketData) {
  const sql = `
    INSERT INTO ticket_types
    (currency, type, description, price, feature,daily_limit, daily_limit_orig, status, type_am, features_am, description_am)
    VALUES ($1, $2, $3, $4, $5, $6, $7,$8, $9, $10, $11)
    RETURNING ticket_id
  `;
  const values = [
    ticketData.currency,
    ticketData.type,
    ticketData.description,
    ticketData.price,
    ticketData.feature,
    ticketData.daily_limit,
    ticketData.daily_limit,
    ticketData.status,
    ticketData.type_am,
    ticketData.features_am,
    ticketData.description_am
  ];
  const result = await pool.query(sql, values);
  return result.rows[0].ticket_id;
}

// Get All Ticket Types
async function getAllTicketTypes() {
  const sql = 'SELECT ticket_id,currency,type,price,description,feature,daily_limit_orig as daily_limit,status,step, type_am, features_am, description_am FROM ticket_types  where is_deleted=false';
  const result = await pool.query(sql);
  return result.rows;
}

// Get All Ticket Types
async function getTicketTypesFront() {
  // Reset all ticket types if needed
    await pool.query(`
      UPDATE ticket_types
      SET daily_limit = daily_limit_orig,
          last_reset_date = CURRENT_DATE
      WHERE last_reset_date <> CURRENT_DATE
    `);

  const sql = 'SELECT ticket_id,currency,type,price,description,feature,daily_limit,status,step, type_am, features_am, description_am FROM ticket_types  where is_deleted=false and status=$1';
  const result = await pool.query(sql,['Active']);
  return result.rows;
}

// Update Ticket Type
async function updateTicketType(id, ticketData) {
  const sql = `
    UPDATE ticket_types
    SET currency = $1, type = $2, price = $3, description = $4, feature = $5, daily_limit_orig = $6, status = $7,
     type_am = $9, features_am = $10, description_am = $11 
    WHERE ticket_id = $8
  `;
  const values = [
    ticketData.currency,
    ticketData.type,
    ticketData.price,
    ticketData.description,
    ticketData.feature,
    ticketData.daily_limit,
    ticketData.status,
    id, 
    ticketData.type_am,
    ticketData.features_am,
    ticketData.description_am
  ];
  const result = await pool.query(sql, values);
  return { affectedRows: result.rowCount };
}

// Delete Ticket Type
async function deleteTicketType(ticketId) {
  //const sql = 'DELETE FROM ticket_types WHERE ticket_id = $1';
  const sql = 'UPDATE ticket_types SET is_deleted = true WHERE ticket_id = $1';
  const result = await pool.query(sql, [ticketId]);
  return result.rowCount > 0 ? { message: 'Ticket type deleted successfully' } : null;
}

// Get All Services
async function getAllServices() {
  const sql = 'SELECT * FROM services';
  const result = await pool.query(sql);
  return result.rows;
}

// Test DB Connection
async function testDbConnection() {
  const result = await pool.query('SELECT 1');
  return result;
}

// Create Order and Tickets
async function createOrderAndTickets(userId, tickets, payment_reference, services) {
  const totalAmount = await calculateTotal(tickets, services);

  const orderSql = `
    INSERT INTO orders (user_id, total_amount, payment_status, payment_reference, created_at) 
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id
  `;
  const orderResult = await pool.query(orderSql, [userId, totalAmount, 'pending', payment_reference]);
  const orderId = orderResult.rows[0].id;

  for (const item of tickets) {
    for (let i = 0; i < item.quantity; i++) {
      const code = uuidv4();
      const qrCode = await qr.toDataURL(code);
      const ticketSql = `
        INSERT INTO tickets (ticket_type_id, order_id, qr_code, status, issued_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await pool.query(ticketSql, [item.ticket_type_id, orderId, qrCode, 'valid']);
    }
  }

  if (services?.length > 0) {
    for (const serviceId of services) {
      const serviceSql = `
        INSERT INTO order_services (order_id, service_id) VALUES ($1, $2)
      `;
      await pool.query(serviceSql, [orderId, serviceId]);
    }
  }

  return { orderId, totalAmount };
}

// Calculate Total
const calculateTotal = async (tickets, services = []) => {
  let total = 0;

  for (const ticket of tickets) {
    const result = await pool.query(
      'SELECT * FROM ticket_types WHERE id = $1 LIMIT 1',
      [ticket.ticket_type_id]
    );
    const ticketType = result.rows[0];
    if (!ticketType) throw new Error(`Ticket type ID ${ticket.ticket_type_id} not found`);
    total += Number(ticketType.price) * (ticket.quantity || 1);
  }

  for (const serviceId of services) {
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1 LIMIT 1',
      [serviceId]
    );
    const service = result.rows[0];
    if (!service) throw new Error(`Service ID ${serviceId} not found`);
    total += Number(service.price);
  }

  return total;
};

// Get User Orders
async function getUserOrders(userId) {
  const sql = `
    SELECT o.*, t.id AS ticket_id, t.qr_code, t.status AS ticket_status, tt.name AS ticket_name 
    FROM orders o 
    JOIN tickets t ON o.id = t.order_id 
    JOIN ticket_types tt ON t.ticket_type_id = tt.id 
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
  `;
  const result = await pool.query(sql, [userId]);
  return result.rows;
}

export async function getAllUserTickets(email) {
    try {
        // Normal tickets
        const { rows: normalTickets } = await pool.query(
            `SELECT * FROM bought_ticket WHERE email = $1 ORDER BY visit_date DESC`,
            [email]
        );

        // Event bookings
        const { rows: eventBookings } = await pool.query(
            `SELECT * FROM event_info WHERE email = $1 ORDER BY bought_at DESC`,
            [email]
        );

        // For each event booking, fetch event tickets
        const eventTickets = [];
        for (const booking of eventBookings) {
            const { rows: tickets } = await pool.query(
                `SELECT tbt.*, ett.type, ett.price
                 FROM event_bought_tickets tbt
                 JOIN event_ticket_types ett ON tbt.ticket_id = ett.ticket_id
                 WHERE tbt.event_booking_id = $1`,
                [booking.event_booking_id]
            );
            eventTickets.push({
                booking,
                tickets
            });
        }

        return {
            normalTickets,
            eventTickets
        };
    } catch (error) {
        throw error;
    }
}

// Get Order Details
async function getOrderDetails(orderId) {
  try {
    const orderResult = await pool.query(
      'SELECT id, payment_reference, total_amount, created_at FROM orders WHERE id = $1',
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) return null;

    const ticketsResult = await pool.query(`
      SELECT 
        t.id, t.qr_code, t.status, 
        tt.name AS ticket_type, tt.price AS ticket_price
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.order_id = $1
    `, [orderId]);

    const servicesResult = await pool.query(`
      SELECT 
        s.id, s.name, s.price
      FROM order_services os
      JOIN services s ON os.service_id = s.id
      WHERE os.order_id = $1
    `, [orderId]);

    return {
      orderId: order.id,
      payment_reference: order.payment_reference,
      total_amount: parseFloat(order.total_amount),
      created_at: order.created_at,
      tickets: ticketsResult.rows,
      services: servicesResult.rows
    };
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    throw error;
  }
}

export default {
  createTicketType,
  testDbConnection,
  getAllTicketTypes,
  getTicketTypesFront,
  updateTicketType,
  deleteTicketType,
  createOrderAndTickets,
  getUserOrders,
  getAllUserTickets,
  getOrderDetails,
  getAllServices
};
