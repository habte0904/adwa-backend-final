import pool from "../config/db.config.js";
import QRCode from 'qrcode';
import { logActivity } from "../services/activityLog.service.js";
import { format } from "date-fns";



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
      'SELECT * FROM event_info WHERE event_booking_id = $1',
      [tx_ref]
    );

    if (boughtTicketResult.rowCount === 0) {
      const details = JSON.stringify({ tx_ref, status: 'Failed', reason: 'Ticket booking not found' });
      logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
      return res.status(404).json({ error: 'Ticket booking not found' });
    }

    const boughtTicket = boughtTicketResult.rows[0];

    // Join event_bought_tickets with event_ticket_types to get type name
    const boughtTypesResult = await pool.query(
      `SELECT btt.ticket_id, tt.type FROM event_bought_tickets btt
             LEFT JOIN event_ticket_types tt ON btt.ticket_id = tt.ticket_id
             WHERE btt.event_booking_id = $1`,
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
      ticket_booking_id: boughtTicket.event_booking_id,
      visit_date: boughtTicket.bought_at,
      full_name: boughtTicket.full_name,
      email: boughtTicket.email,
      phone_no: boughtTicket.phone_no,
      paid_amount: boughtTicket.paid_amount,
      total_tickets: boughtTicket.ticket_no,
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
        'UPDATE event_info SET is_logged = true WHERE event_booking_id = $1',
        [tx_ref]
      );
    }

    return res.status(200).json(detail);

  } catch (error) {
    console.error('Error fetching payment detail:', error);

    // Log failure activity
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
      'SELECT * FROM event_info WHERE event_booking_id = $1',
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
    // Query to get today's walk-in tickets only
    const result = await pool.query(`
            SELECT 
                event_booking_id,
                email,
                ticket_no,
                paid_amount,
                to_char(bought_at, 'YYYY-MM-DD') as visit_date
            FROM event_info
            WHERE 
                walkin = 'yes' AND
                bought_at::date = CURRENT_DATE
           
        
            `);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No walk-in registrations found for today.' });
    }


    // Format the response
    const recentTickets = result.rows.map(ticket => ({
      ticket_booking_id: ticket.event_booking_id,
      email: ticket.email,
      total_tickets: ticket.ticket_no,
      paid_amount: ticket.paid_amount,
      visit_date: ticket.visit_date,//new Date().toISOString().split('T')[0], // YYYY-MM-DD
      created_at: ticket.created_at
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
  const action = is_walkin ? 'Validate Walk-in Ticket' : 'Validate Ticket';
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

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let ticketData = null;
      let isWalkInTicket = false;
      let notFoundReason = 'Ticket not found';

      if (is_walkin) {
        // --- WALK-IN MODE ---
        const walkInQuery = `
            SELECT 
              bt.event_booking_id,
              bt.event_id,
              to_char(bt.bought_at, 'YYYY-MM-DD') as visit_date,
              bt.email,
              bt.full_name,
              bt.phone_no,
              bt.paid_amount,
              bt.ticket_no,
              e.date as event_date,
              e.start_time,
              e.end_time,
              e.title as event_title,
              vs.venue,
              bt.walkin
            FROM event_info bt
            JOIN event e ON bt.event_id = e.event_id
            JOIN venue_schedule vs ON e.venue_id = vs.venue_id
            WHERE bt.event_booking_id = $1 AND bt.walkin = 'yes';
          `;
        const walkInRes = await client.query(walkInQuery, [ticket_code]);

        if (walkInRes.rowCount > 0) {
          ticketData = walkInRes.rows[0];
          isWalkInTicket = true;

          const statusRes = await client.query(`SELECT status FROM event_bought_tickets WHERE event_booking_id = $1`, [ticket_code]);
          if (statusRes.rowCount === 0) {
            ticketData.status = 'invalid';
          } else {
            const hasValid = statusRes.rows.some(r => r.status.toLowerCase() === 'valid');
            ticketData.status = hasValid ? 'valid' : 'invalid';
          }

        } else {
          const publicRes = await client.query(`SELECT 1 FROM event_bought_tickets WHERE type_id = $1`, [ticket_code]);
          if (publicRes.rowCount > 0) {
            await client.query('ROLLBACK');
            const reason = "Public tickets cannot be validated in Walk-in mode. Please uncheck 'Is Walk-in Ticket'.";
            logActivity({ userId, userName, role, department, action: action + ' (Failed)', details: JSON.stringify({ ...detailsBase, reason }) });
            return res.json({ validity: false, reason });
          }

          await client.query('ROLLBACK');
          logActivity({ userId, userName, role, department, action: action + ' (Failed)', details: JSON.stringify({ ...detailsBase, reason: notFoundReason }) });
          return res.json({ validity: false, reason: notFoundReason });
        }

      } else {
        // --- PUBLIC MODE ---
        // Enhanced query:
        // 1. Supports lookup by type_id (QR code) OR event_booking_id (Booking Reference)
        // 2. Uses LEFT JOIN for venue_schedule to prevent "Ticket not found" if venue data is missing
        const publicQuery = `
            SELECT 
              bt.event_booking_id,
              bt.event_id,
              to_char(bt.bought_at, 'YYYY-MM-DD') as visit_date,
              bt.email,
              bt.full_name,
              bt.phone_no,
              bt.paid_amount,
              bt.ticket_no,
              btt.type_id as ticket_type_id,
              tt.type as ticket_type,
              btt.status,
              e.date as event_date,
              e.start_time,
              e.end_time,
              e.title as event_title,
              vs.venue,
              bt.walkin
            FROM event_bought_tickets btt
            JOIN event_info bt ON btt.event_booking_id = bt.event_booking_id
            LEFT JOIN event_ticket_types tt ON btt.ticket_id = tt.ticket_id
            JOIN event e ON bt.event_id = e.event_id
            LEFT JOIN venue_schedule vs ON e.venue_id = vs.venue_id
            WHERE (btt.type_id::text = $1 OR btt.event_booking_id = $1)
            FOR UPDATE OF btt;
          `;
        const publicRes = await client.query(publicQuery, [ticket_code]);

        if (publicRes.rowCount > 0) {
          ticketData = publicRes.rows[0];
          // Ensure venue is handled if null (though it shouldn't be for valid events)
          if (!ticketData.venue) ticketData.venue = "Unknown Venue";

          if (ticketData.walkin === 'yes') {
            await client.query('ROLLBACK');
            const reason = "Walk-in tickets must be validated with 'Is Walk-in Ticket' checked.";
            logActivity({ userId, userName, role, department, action: action + ' (Failed)', details: JSON.stringify({ ...detailsBase, reason }) });
            return res.json({ validity: false, reason });
          }

        } else {
          // Check if it's a walk-in booking ID but validated in Public mode
          const walkInCheck = await client.query(`SELECT 1 FROM event_info WHERE event_booking_id = $1 AND walkin = 'yes'`, [ticket_code]);
          if (walkInCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            const reason = "Walk-in Booking IDs must be validated with 'Is Walk-in Ticket' checked.";
            logActivity({ userId, userName, role, department, action: action + ' (Failed)', details: JSON.stringify({ ...detailsBase, reason }) });
            return res.json({ validity: false, reason });
          }

          // Check if it exists but as a Walk-in Ticket Code
          const walkInTicketCheck = await client.query(`SELECT 1 FROM event_info WHERE event_booking_id = $1 AND walkin = 'yes'`, [ticket_code]);
          if (walkInTicketCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            const reason = "Walk-in tickets must be validated with 'Is Walk-in Ticket' checked.";
            logActivity({ userId, userName, role, department, action: action + ' (Failed)', details: JSON.stringify({ ...detailsBase, reason }) });
            return res.json({ validity: false, reason });
          }

          await client.query('ROLLBACK');
          logActivity({ userId, userName, role, department, action: action + ' (Failed)', details: JSON.stringify({ ...detailsBase, reason: notFoundReason }) });
          return res.json({ validity: false, reason: notFoundReason });
        }
      }

      if (!ticketData) {
        await client.query('ROLLBACK');
        return res.json({ validity: false, reason: notFoundReason });
      }

      const now = new Date();
      const today = format(new Date(), "yyyy-MM-dd");
      const currentTimeInSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const [startHour, startMin, startSec] = ticketData.start_time.split(':').map(Number);
      const [endHour, endMin, endSec] = ticketData.end_time.split(':').map(Number);

      const startTimeInSec = startHour * 3600 + startMin * 60 + startSec;
      const endTimeInSec = endHour * 3600 + endMin * 60 + endSec;

      const ticketDate = new Date(ticketData.event_date).toLocaleDateString('en-CA');

      const formatTo12Hour = (time24) => {
        let [hour, min, sec] = time24.split(':').map(Number);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${min.toString().padStart(2, '0')} ${ampm}`;
      }

      const startTime12 = formatTo12Hour(ticketData.start_time);
      const endTime12 = formatTo12Hour(ticketData.end_time);

      let invalidReason = null;

      if (ticketData.status === 'invalid') {
        invalidReason = 'Ticket already used/invalid';
      } else if ((!is_walkin || check_date) && ticketDate !== today) {
        invalidReason = 'Ticket for a different date';
      } else if (currentTimeInSec < startTimeInSec) {
        invalidReason = 'Event has not started yet';
      } else if (currentTimeInSec > endTimeInSec) {
        invalidReason = 'Event has ended';
      }

      if (invalidReason) {
        await client.query('ROLLBACK');

        logActivity({
          userId, userName, role, department,
          action: action + ' (Failed)',
          details: JSON.stringify({ ...detailsBase, reason: invalidReason, ticketData })
        });

        return res.json({
          validity: false,
          reason: invalidReason,
          event: {
            title: ticketData.event_title,
            start_time: startTime12,
            end_time: endTime12,
            location: ticketData.venue,
            date: ticketDate
          },
          ...ticketData,
          validated_at: now.toISOString()
        });
      }

      const typesQuery = `
        SELECT 
          tt.type as name,
          COUNT(*) as count,
          SUM(CASE WHEN btt.status = 'valid' THEN 1 ELSE 0 END) as valid_count
        FROM event_bought_tickets btt
        LEFT JOIN event_ticket_types tt ON btt.ticket_id = tt.ticket_id
        WHERE btt.event_booking_id = $1
        GROUP BY tt.type;
      `;
      const typesResult = await client.query(typesQuery, [ticketData.event_booking_id]);

      if (isWalkInTicket) {
        await client.query(`UPDATE event_bought_tickets SET status = 'invalid' WHERE event_booking_id = $1`, [ticketData.event_booking_id]);
      } else {
        await client.query(`UPDATE event_bought_tickets SET status = 'invalid' WHERE type_id = $1`, [ticketData.ticket_type_id]);
      }

      await client.query('COMMIT');

      logActivity({
        userId, userName, role, department,
        action: action + ' (Success)',
        details: JSON.stringify({ ...detailsBase, ticketData, types: typesResult.rows })
      });

      res.json({
        validity: true,
        message: 'Ticket is valid',
        event: {
          title: ticketData.event_title,
          start_time: startTime12,
          end_time: endTime12,
          location: ticketData.venue,
          date: ticketDate,
        },
        ...ticketData,
        types: typesResult.rows,
        validated_at: now.toISOString()
      });

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


const getTodayEvents = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

    /*const now = new Date()
    const today = now.toISOString().split("T")[0]*/
    const currentTime = now.toTimeString().split(" ")[0] // HH:MM:SS

    const query = `
      SELECT event_id, title, date,
             TO_CHAR(start_time::time, 'HH12:MI AM') AS start_time,
             TO_CHAR(end_time::time, 'HH12:MI AM') AS end_time
      FROM event
      WHERE date = $1
        AND end_time > $2 AND is_deleted = false
      ORDER BY start_time
    `
    const { rows } = await pool.query(query, [today, currentTime])

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch today's events" })
  }
}



const getEventTickets = async (req, res) => {
  const { event_id } = req.params

  try {
    const query = `
      SELECT *
      FROM event_ticket_types
      WHERE event_id = $1
        AND status = 'active'
    `
    const { rows } = await pool.query(query, [event_id])
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch ticket types" })
  }
}
export { validateTicket, getTodayEvents, getEventTickets, sendWalkInPaymentDetail, sendWalkInPaymentQr, getRecentWalkInTickets };

