import pool from "../config/db.config.js";
import QRCode from 'qrcode';
import { logActivity } from '../services/activityLog.service.js';
import { format } from "date-fns";




const sendWalkInTicketTypes = async (req, res) => {
  try {
    // Reset all ticket types if needed
    await pool.query(`
      UPDATE ticket_types
      SET daily_limit = daily_limit_orig,
          last_reset_date = CURRENT_DATE
      WHERE last_reset_date <> CURRENT_DATE
    `);

    // Fetch updated tickets
    const ticketRes = await pool.query(
      `SELECT ticket_id, type, price, daily_limit,currency
       FROM ticket_types
       WHERE (status = $1 OR status = $2) AND is_deleted = false`,
      ["active", "Active"]
    );

    const ticketTypes = ticketRes.rows;

    if (ticketTypes.length === 0) {
      return res.status(404).json({ error: "No ticket types found" });
    }

    const ticketInfo = ticketTypes.map((type) => ({
      ticket_type_id: type.ticket_id,
      nameT: type.type,
      price: type.price,
      daily_limit: type.daily_limit,
      quantity: 0,
      currency: type.currency
    }));

    return res.status(200).json(ticketInfo);
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};






const sendWalkInPaymentDetail = async (req, res) => {
  const tx_ref = req.params.tx_ref;

  // Prepare log fields
  const userId = req.user?.user_id || null;
  const userName = req.user?.username || 'Unknown';
  const role = req.user?.roleName || 'Unknown';
  const department = req.user?.department || 'Unknown';
  const action = 'Send Walk-in Payment Detail';

  if (!tx_ref) {
    const details = JSON.stringify({ tx_ref, status: 'Failed', reason: 'Transaction reference is required' });
    logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
    return res.status(400).json({ error: 'Transaction reference is required' });
  }

  try {
    const boughtTicketResult = await pool.query(
      'SELECT * FROM bought_ticket WHERE ticket_booking_id = $1',
      [tx_ref]
    );

    if (boughtTicketResult.rowCount === 0) {
      const details = JSON.stringify({ tx_ref, status: 'Failed', reason: 'Ticket booking not found' });
      logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
      return res.status(404).json({ error: 'Ticket booking not found' });
    }

    const boughtTicket = boughtTicketResult.rows[0];

    // Join bought_ticket_types with ticket_types to get the type name
    const boughtTypesResult = await pool.query(
      `SELECT btt.ticket_id, tt.type FROM bought_ticket_types btt
             LEFT JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
             WHERE btt.ticket_booking_id = $1`,
      [tx_ref]
    );

    // Count occurrences of each ticket type
    const ticketCounts = boughtTypesResult.rows.reduce((acc, row) => {
      const ticket_type = row.type || 'Unknown';
      acc[ticket_type] = (acc[ticket_type] || 0) + 1;
      return acc;
    }, {});

    // Convert to array of objects
    const ticketTypesWithCounts = Object.entries(ticketCounts).map(([name, count]) => ({
      name,
      count
    }));

    const detail = {
      ticket_booking_id: boughtTicket.ticket_booking_id,
      visit_date: boughtTicket.visit_date,
      email: boughtTicket.email,
      paid_amount: boughtTicket.paid_amount,
      total_tickets: boughtTicket.total_tickets,
      status: 'valid',
      types: ticketTypesWithCounts,
      types_string: Object.entries(ticketCounts)
        .map(([name, count]) => `${count}x ${name}`)
        .join(', ')
    };

    // ✅ Only log if is_logged is false
    if (!boughtTicket.is_logged) {
      const detailsLog = JSON.stringify({ ...detail, status: 'Success' });
      logActivity({ userId, userName, role, department, action: action + ' (Success)', details: detailsLog });

      // Mark as logged
      await pool.query(
        'UPDATE bought_ticket SET is_logged = true WHERE ticket_booking_id = $1',
        [tx_ref]
      );
    }

    return res.status(200).json(detail);

  } catch (error) {
    console.error('Error fetching payment detail:', error);

    const details = JSON.stringify({ tx_ref, status: 'Failed', reason: error.message });
    logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });

    return res.status(500).json({ error: 'Internal server error' });
  }
};



const sendWalkInPaymentQr = async (req, res) => {
  const tx_ref = req.params.tx_ref;
  if (!tx_ref) {
    return res.status(400).json({ error: 'Transaction reference is required' });
  }

  try {
    // 1. Verify the ticket exists (optional - remove if not needed)
    const ticketRes = await pool.query(
      'SELECT * FROM bought_ticket WHERE ticket_booking_id = $1',
      [tx_ref]
    );

    if (ticketRes.rowCount === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // 2. Create QR code data as plain string (no JSON.stringify)
    const qrData = tx_ref;

    // 3. Generate QR code as base64 image (encode as plain string)
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // High error correction
      margin: 2,
      width: 400,
      color: {
        dark: '#000000', // QR code color
        light: '#ffffffff'//'#ffffff00' // Transparent background
      }
    });

    // 4. Send response
    res.status(200).json({
      qr_code_base64: qrCodeBase64,
      ticket_booking_id: tx_ref,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h expiry
    });

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};


const getRecentWalkInTickets = async (req, res) => {
  try {
    const userIdentifier = req.user?.username || req.user?.email;

    // Query to get today's walk-in tickets only
    const result = await pool.query(`
            SELECT 
                ticket_booking_id,
                email,
                total_tickets,
                paid_amount,
                tt.currency,
                to_char(visit_date, 'YYYY-MM-DD') as visit_date
            FROM bought_ticket
            LEFT JOIN ticket_types tt ON tt.ticket_id = (
                SELECT ticket_id FROM bought_ticket_types 
                WHERE ticket_booking_id = bought_ticket.ticket_booking_id 
                LIMIT 1
            )
            WHERE 
                walkin = 'yes' AND
                visit_date::date = CURRENT_DATE AND
                email = $1
            `, [userIdentifier]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No walk-in registrations found for today.' });
    }


    // Format the response
    const recentTickets = result.rows.map(ticket => ({
      ticket_booking_id: ticket.ticket_booking_id,
      email: ticket.email,
      total_tickets: ticket.total_tickets,
      paid_amount: ticket.paid_amount,
      visit_date: ticket.visit_date,//new Date().toISOString().split('T')[0], // YYYY-MM-DD
      created_at: ticket.created_at,
      currency: ticket.currency || 'ETB' // Default to ETB if currency is null
    }));

    res.status(200).json(recentTickets);
  } catch (error) {
    console.error('Error fetching today\'s tickets:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s registrations' });
  }
};




const validateTicket = async (req, res) => {
  const { ticket_code, is_walkin, check_date } = req.body;

  // Prepare log fields
  const userId = req.user?.user_id || null;
  const userName = req.user?.username || 'Unknown';
  const role = req.user?.roleName || 'Unknown';
  const department = req.user?.department || 'Unknown';
  const action = is_walkin ? 'Validate Walk-in Ticket (Booking)' : 'Validate Ticket';
  const detailsBase = { ticket_code, is_walkin, check_date };

  if (!ticket_code || typeof ticket_code !== 'string') {
    logActivity({
      userId, userName, role, department,
      action: action + ' (Failed)',
      details: JSON.stringify({ ...detailsBase, reason: 'Invalid ticket_code' })
    });
    return res.status(400).json({
      error: 'Valid ticket code (string) is required'
    });
  }

  const getEthiopiaDate = () => {
    const now = new Date();
    // const ethiopiaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); //Unused variable in original logic, generally stick to server time or specific offset if needed.
    // Assuming server is configured or we use simple YYYY-MM-DD match
    return format(now, "yyyy-MM-dd");
  };

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (is_walkin) {
        // --- Walk-in Validation Logic (By Booking ID) ---

        // 1. Check if booking exists and is a walk-in
        const bookingQuery = `
          SELECT 
            ticket_booking_id,
            to_char(visit_date, 'YYYY-MM-DD') as visit_date,
            email,
            paid_amount,
            total_tickets
          FROM bought_ticket
          WHERE ticket_booking_id = $1 AND walkin = 'yes'
        `;
        const bookingResult = await client.query(bookingQuery, [ticket_code]);

        if (bookingResult.rowCount === 0) {
          await client.query('ROLLBACK');
          logActivity({
            userId, userName, role, department,
            action: action + ' (Failed)',
            details: JSON.stringify({ ...detailsBase, reason: 'Walk-in booking not found' })
          });
          return res.json({ validity: false, message: 'Walk-in booking not found' });
        }

        const bookingData = bookingResult.rows[0];

        // Date Check Logic
        if (check_date) {
          const today = getEthiopiaDate();
          if (bookingData.visit_date !== today) {
            await client.query('ROLLBACK');
            logActivity({
              userId, userName, role, department,
              action: action + ' (Failed)',
              details: JSON.stringify({ ...detailsBase, reason: 'Incorrect visit date', visitDate: bookingData.visit_date, today })
            });
            return res.json({
              validity: false,
              message: `Invalid Visit Date. Ticket is for ${bookingData.visit_date}, but today is ${today}.`
            });
          }
        }

        // 2. Check status of tickets in this booking
        const typesStatusQuery = `
            SELECT type_id, status FROM bought_ticket_types WHERE ticket_booking_id = $1
        `;
        const typesStatusResult = await client.query(typesStatusQuery, [ticket_code]);

        if (typesStatusResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.json({ validity: false, message: 'No tickets found for this booking' });
        }

        const allUsed = typesStatusResult.rows.every(t => t.status === 'invalid');

        if (allUsed) {
          await client.query('ROLLBACK');
          logActivity({
            userId, userName, role, department,
            action: action + ' (Failed)',
            details: JSON.stringify({ ...detailsBase, reason: 'Ticket already used' })
          });
          return res.json({
            validity: false,
            message: 'This ticket has already been used.',
            ...bookingData,
            validated_at: new Date().toISOString()
          });
        }

        // 3. Mark ALL tickets in this booking as used ('invalid')
        await client.query(`UPDATE bought_ticket_types SET status = 'invalid' WHERE ticket_booking_id = $1`, [ticket_code]);

        // 4. Fetch details for response
        const typesQuery = `
          SELECT 
            tt.type as name,
            COUNT(*) as count
          FROM bought_ticket_types btt
          LEFT JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
          WHERE btt.ticket_booking_id = $1
          GROUP BY tt.type;
        `;
        const typesResult = await client.query(typesQuery, [ticket_code]);

        await client.query('COMMIT');

        logActivity({
          userId, userName, role, department,
          action: action + ' (Success)',
          details: JSON.stringify({ ...detailsBase, bookingData })
        });

        return res.json({
          validity: true,
          message: 'Walk-in Ticket is valid',
          ...bookingData,
          types: typesResult.rows,
          validated_at: new Date().toISOString()
        });

      } else {
        // --- Standard Validation Logic (By Ticket Code / type_id) ---

        // 1. Lock ticket row
        const lockQuery = `
            SELECT * FROM bought_ticket_types WHERE type_id = $1 FOR UPDATE;
        `;
        const lockResult = await client.query(lockQuery, [ticket_code]);

        // 2. Fetch ticket info
        const ticketQuery = `
            SELECT 
            bt.ticket_booking_id,
            to_char(bt.visit_date, 'YYYY-MM-DD') as visit_date,
            bt.email,
            bt.paid_amount,
            bt.total_tickets,
            bt.walkin,
            btt.type_id as ticket_type_id,
            tt.type as ticket_type,
            btt.status
            FROM bought_ticket_types btt
            JOIN bought_ticket bt ON btt.ticket_booking_id = bt.ticket_booking_id
            LEFT JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
            WHERE btt.type_id = $1;
        `;
        const ticketResult = await client.query(ticketQuery, [ticket_code]);

        // Fallback check
        const ticketResultFrombt = await client.query(
          `SELECT ticket_booking_id, to_char(visit_date, 'YYYY-MM-DD') as visit_date, email, paid_amount, total_tickets, walkin 
            FROM bought_ticket 
            WHERE ticket_booking_id = $1 AND walkin = $2`,
          [ticket_code, 'yes']
        );

        if (ticketResult.rows.length === 0 && ticketResultFrombt.rows.length === 0) {
          await client.query('ROLLBACK');
          logActivity({
            userId, userName, role, department,
            action: action + ' (Failed)',
            details: JSON.stringify({ ...detailsBase, reason: 'Ticket not found' })
          });
          return res.json({ validity: false, message: 'Ticket not found' });
        }

        let ticketData = ticketResult.rows.length > 0 ? ticketResult.rows[0] : ticketResultFrombt.rows[0];

        // CHECK: If this is a walk-in ticket, reject it here (must use checkbox)
        if (ticketData.walkin === 'yes') {
          await client.query('ROLLBACK');
          return res.json({
            validity: false,
            message: 'This is a Walk-in Ticket. Please check "Is Walk-in Ticket?" to validate.'
          });
        }

        // Date Check Logic
        if (check_date) {
          const today = getEthiopiaDate();
          if (ticketData.visit_date !== today) {
            await client.query('ROLLBACK');
            logActivity({
              userId, userName, role, department,
              action: action + ' (Failed)',
              details: JSON.stringify({ ...detailsBase, reason: 'Incorrect visit date', visitDate: ticketData.visit_date, today })
            });
            return res.json({
              validity: false,
              message: `Invalid Visit Date. Ticket is for ${ticketData.visit_date}, but today is ${today}.`
            });
          }
        }

        // 3. Check if ticket is already invalid
        if ((ticketResult.rows.length > 0 && ticketData.status === 'invalid') || (ticketResult.rows.length === 0 && ticketResultFrombt.rows.length === 0)) {
          await client.query('ROLLBACK');
          logActivity({
            userId, userName, role, department,
            action: action + ' (Failed)',
            details: JSON.stringify({ ...detailsBase, reason: 'Ticket invalid', ticketData })
          });
          return res.json({
            validity: false,
            message: 'This ticket is invalid or has already been used.',
            ...ticketData,
            validated_at: new Date().toISOString()
          });
        }

        // 4. Get aggregated ticket types for context
        const typesQuery = `
            SELECT 
            tt.type as name,
            COUNT(*) as count,
            SUM(CASE WHEN btt.status = 'valid' THEN 1 ELSE 0 END) as valid_count
            FROM bought_ticket_types btt
            LEFT JOIN ticket_types tt ON btt.ticket_id = tt.ticket_id
            WHERE btt.ticket_booking_id = $1
            GROUP BY tt.type;
        `;
        const typesResult = await client.query(typesQuery, [ticketData.ticket_booking_id]);

        // 5. Mark ticket as used
        await client.query(`UPDATE bought_ticket_types SET status = 'invalid' WHERE type_id = $1`, [ticket_code]);

        await client.query('COMMIT');

        logActivity({
          userId, userName, role, department,
          action: action + ' (Success)',
          details: JSON.stringify({ ...detailsBase, ticketData })
        });

        res.json({
          validity: true,
          message: 'Ticket is valid',
          ...ticketData,
          types: typesResult.rows,
          validated_at: new Date().toISOString()
        });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('PostgreSQL Ticket Validation Error:', error);

    logActivity({
      userId, userName, role, department,
      action: action + ' (Failed)',
      details: JSON.stringify({ ...detailsBase, reason: 'Internal server error', error: error.message })
    });

    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { validateTicket, sendWalkInTicketTypes, sendWalkInPaymentDetail, sendWalkInPaymentQr, getRecentWalkInTickets };


