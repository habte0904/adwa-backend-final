import axios from 'axios';
import pool from '../config/db.config.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { format } from "date-fns";
dotenv.config();

const CHAPA_URL = process.env.CHAPA_URL;
const CHAPA_AUTH = process.env.CHAPA_AUTH;
const CALLBACK_URL = `${process.env.BACKEND_URL_PROD}/chapa/verify-payment/`;
const RETURN_URL = `${process.env.ADMIN_URL_PROD}/portal/ticket-management/walk-in-payment`;

let tx_ref = null;

const config = {
  headers: {
    Authorization: `Bearer ${CHAPA_AUTH}`
  }
};

// Calculate amount & detect currency from DB
const calculateAmountByCurrency = async (ticketDetails) => {
  let totalAmount = 0;
  let currency = null;

  for (const item of ticketDetails) {
    const { type, quantity } = item;

    const result = await pool.query(
      'SELECT price, currency FROM ticket_types WHERE type = $1',
      [type]
    );

    if (result.rows.length === 0) throw new Error(`Invalid ticket type: ${type}`);

    const { price, currency: dbCurrency } = result.rows[0];

    // Ensure all tickets use the same currency
    if (currency && currency !== dbCurrency) {
      throw new Error("Mixed currencies in ticket selection are not supported.");
    }

    currency = dbCurrency;
    totalAmount += price * quantity;
  }

  return { totalAmount: totalAmount.toFixed(2), currency };
};

// Generate unique tx_ref
const generateUniqueTxRef = async () => {
  while (true) {
    const txRef = `tx-adwamuseum-${crypto.randomUUID()}`;
    const exists = await pool.query(
      'SELECT 1 FROM bought_ticket WHERE ticket_booking_id = $1',
      [txRef]
    );
    if (exists.rowCount === 0) return txRef;
  }
};

// Generate short, easy-to-type, and unique typeId
const generateUniqueTypeId = async () => {
  while (true) {
    const shortId = `T-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const exists = await pool.query(
      'SELECT 1 FROM bought_ticket_types WHERE type_id = $1',
      [shortId]
    );
    if (exists.rowCount === 0) return shortId;
  }
};

export const initiatePayment = async (req, res) => {
  try {
    const { email = "adwavictory@adwa.com", ticket_info, visit_date } = req.body;


    // Calculate amount and currency directly from DB
    const { totalAmount, currency } = await calculateAmountByCurrency(ticket_info);

    tx_ref = await generateUniqueTxRef();

    const getEthiopiaDate = () => {
      const now = new Date();
      const ethiopiaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      return format(now, "yyyy-MM-dd");
    };
    const finalVisitDate = visit_date || getEthiopiaDate();

    const paymentPayload = {
      amount: totalAmount,
      currency,
      email,
      tx_ref,
      callback_url: `${CALLBACK_URL}${tx_ref}`,
      return_url: `${RETURN_URL}/${tx_ref}`,
      customization: {
        title: "Adwa Victory",
        description: `Visit`
      },
    };

    const chapaRes = await axios.post(CHAPA_URL, paymentPayload, config);
    const checkoutUrl = chapaRes.data.data.checkout_url;

    // Save pending payment
    await pool.query(`
      INSERT INTO pending_payments_staff 
      (tx_ref, email, visit_date, ticket_info, amount, currency)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [tx_ref, email, finalVisitDate, JSON.stringify(ticket_info), totalAmount, currency]);

    res.status(200).json({ checkout_url: checkoutUrl, tx_ref });
  } catch (err) {
    if (err.response) {
      console.error("Chapa Init Error:", err.response.data); // 👈 real reason
    } else {
      console.error("Chapa Init Error:", err.message);
    }
    // console.error("Chapa Init Error:", err);
    res.status(500).json({ error: "Payment initiation failed." });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const txRef = req.params.id;

    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      config
    );

    const status = response.data.data.status;
    if (status !== "success") {
      return res.status(400).json({ error: "Payment not successful." });
    }

    const exists = await pool.query(
      'SELECT 1 FROM bought_ticket WHERE ticket_booking_id = $1',
      [txRef]
    );
    if (exists.rowCount > 0) {
      return res.status(200).json({ message: "Payment already verified", tx_ref: txRef });
    }

    const pending = await pool.query(
      'SELECT * FROM pending_payments_staff WHERE tx_ref = $1',
      [txRef]
    );
    if (pending.rows.length === 0) {
      return res.status(404).json({ error: "No pending payment found." });
    }

    const data = pending.rows[0];
    const ticketInfo = typeof data.ticket_info === "string" ? JSON.parse(data.ticket_info) : data.ticket_info;
    const totalTickets = ticketInfo.reduce((acc, item) => acc + item.quantity, 0);

    await pool.query(
      `INSERT INTO bought_ticket 
        (ticket_booking_id, visit_date, email, paid_amount, total_tickets, walkin) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [txRef, data.visit_date, data.email, data.amount, totalTickets, 'yes']
    );

    // Decrement daily_limit and insert bought_ticket_types
    for (const { type, quantity } of ticketInfo) {
      const ticketIdRes = await pool.query(`SELECT ticket_id FROM ticket_types WHERE type = $1`, [type]);
      const ticketId = ticketIdRes.rows[0].ticket_id;

      await pool.query(
        `UPDATE ticket_types
         SET daily_limit = daily_limit - $1
         WHERE ticket_id = $2`,
        [quantity, ticketId]
      );

      for (let i = 0; i < quantity; i++) {
        const typeId = await generateUniqueTypeId();
        await pool.query(
          `INSERT INTO bought_ticket_types (type_id, ticket_booking_id, ticket_id, status) 
           VALUES ($1, $2, $3, 'valid')`,
          [typeId, txRef, ticketId]
        );
      }
    }

    await pool.query('DELETE FROM pending_payments_staff WHERE tx_ref = $1', [txRef]);
    res.status(200).json({ message: "Payment verified successfully!" });
  } catch (err) {
    console.error("Verification Error:", err.message);
    res.status(500).json({ error: "Payment verification failed." });
  }
};

export const successPayment = (req, res) => {
  res.status(200).json({ message: "Payment successful!", tx_ref });
};



//new method

export const processDirectWalkInPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { ticket_info, visit_date } = req.body;
    let email = req.body.email || "adwavictory@adwa.com";

    // Use operator username if available (from auth middleware)
    if (req.user && (req.user.username || req.user.email)) {
      email = req.user.username || req.user.email;
    }

    // Calculate amount and currency directly from DB
    const { totalAmount, currency } = await calculateAmountByCurrency(ticket_info);

    const tx_ref = await generateUniqueTxRef();

    const getEthiopiaDate = () => {
      const now = new Date();
      // const ethiopiaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); //Unused variable
      return format(now, "yyyy-MM-dd");
    };
    const finalVisitDate = visit_date || getEthiopiaDate();
    const totalTickets = ticket_info.reduce((acc, item) => acc + item.quantity, 0);

    await client.query('BEGIN');

    // Insert directly into bought_ticket
    await client.query(
      `INSERT INTO bought_ticket 
        (ticket_booking_id, visit_date, email, paid_amount, total_tickets, walkin) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tx_ref, finalVisitDate, email, totalAmount, totalTickets, 'yes']
    );

    // Decrement daily_limit and insert bought_ticket_types
    for (const { type, quantity } of ticket_info) {
      const ticketIdRes = await client.query(`SELECT ticket_id, price FROM ticket_types WHERE type = $1`, [type]);
      if (ticketIdRes.rows.length === 0) {
        throw new Error(`Ticket type not found: ${type}`);
      }
      const { ticket_id: ticketId, price } = ticketIdRes.rows[0];

      await client.query(
        `UPDATE ticket_types
         SET daily_limit = daily_limit - $1
         WHERE ticket_id = $2`,
        [quantity, ticketId]
      );

      for (let i = 0; i < quantity; i++) {
        const typeId = await generateUniqueTypeId();

        await client.query(
          `INSERT INTO bought_ticket_types (type_id, ticket_booking_id, ticket_id, status, unit_price) 
           VALUES ($1, $2, $3, 'valid', $4)`,
          [typeId, tx_ref, ticketId, price]
        );
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: "Ticket generated successfully!",
      tx_ref,
      status: "success",
      checkout_url: `${RETURN_URL}/${tx_ref}`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Direct Payment Error:", err.message);
    res.status(500).json({ error: "Failed to generate ticket.", details: err.message });
  } finally {
    client.release();
  }
};

// ... existing methods ...

export const getOperatorAudit = async (req, res) => {
  try {
    const { username, startDate, endDate } = req.query;

    let query = `
      SELECT 
        bt.email as username, 
        bt.visit_date, 
        tt.type as ticket_type,
        btt.unit_price,
        count(btt.type_id) as quantity
      FROM bought_ticket bt
      JOIN bought_ticket_types btt ON bt.ticket_booking_id = btt.ticket_booking_id
      JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
      WHERE bt.walkin = 'yes'
    `;

    const params = [];
    let paramIndex = 1;

    // Filter Logic
    if (username) {
      query += ` AND bt.email ILIKE $${paramIndex++}`;
      params.push(`%${username}%`);
    }

    if (startDate && endDate) {
      query += ` AND bt.visit_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND bt.visit_date = $${paramIndex++}`;
      params.push(startDate);
    }
    // Default to last 30 days if NO filters provided
    else if (!username) {
      query += ` AND bt.visit_date >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    query += `
      GROUP BY bt.email, bt.visit_date, tt.type, btt.unit_price
      ORDER BY bt.visit_date DESC
    `;

    const { rows } = await pool.query(query, params);

    // Group by username + date
    const grouped = {};
    rows.forEach(row => {
      // Create a unique key for grouping
      const key = `${row.username}-${row.visit_date}`;

      if (!grouped[key]) {
        grouped[key] = {
          username: row.username,
          date: row.visit_date,
          totalAmount: 0,
          details: []
        };
      }

      const income = parseFloat(row.unit_price || 0) * parseInt(row.quantity || 0);
      grouped[key].totalAmount += income;

      grouped[key].details.push({
        ticketType: row.ticket_type,
        count: parseInt(row.quantity),
        income: income,
        unitPrice: row.unit_price
      });
    });

    // Convert to array
    const responseData = Object.values(grouped);

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Operator Audit Error:", error);
    res.status(500).json({ message: "Error fetching audit logs" });
  }
};

export const getEventOperatorAudit = async (req, res) => {
  try {
    const { username, startDate, endDate } = req.query;

    let query = `
      SELECT 
        ei.email as username, 
        ei.bought_at as date,
        ett.type as ticket_type,
        ett.price as unit_price,
        count(ebt.type_id) as quantity
      FROM event_info ei
      JOIN event_bought_tickets ebt ON ei.event_booking_id = ebt.event_booking_id
      JOIN event_ticket_types ett ON ebt.ticket_id = ett.ticket_id
      WHERE ei.walkin = 'yes'
    `;

    const params = [];
    let paramIndex = 1;

    if (username) {
      query += ` AND ei.email ILIKE $${paramIndex++}`;
      params.push(`%${username}%`);
    }

    if (startDate && endDate) {
      query += ` AND ei.bought_at::date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND ei.bought_at::date = $${paramIndex++}`;
      params.push(startDate);
    }
    else if (!username) {
      query += ` AND ei.bought_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    query += `
      GROUP BY ei.email, ei.bought_at, ett.type, ett.price
      ORDER BY ei.bought_at DESC
    `;

    const { rows } = await pool.query(query, params);

    const grouped = {};
    rows.forEach(row => {
      const dateStr = format(new Date(row.date), "yyyy-MM-dd");
      const key = `${row.username}-${dateStr}`;

      if (!grouped[key]) {
        grouped[key] = {
          username: row.username,
          date: dateStr,
          totalAmount: 0,
          details: []
        };
      }

      const income = parseFloat(row.unit_price || 0) * parseInt(row.quantity || 0);
      grouped[key].totalAmount += income;

      grouped[key].details.push({
        ticketType: row.ticket_type,
        count: parseInt(row.quantity),
        income: income,
        unitPrice: row.unit_price
      });
    });

    res.status(200).json(Object.values(grouped));

  } catch (error) {
    console.error("Event Operator Audit Error:", error);
    res.status(500).json({ message: "Error fetching event audit logs" });
  }
};
