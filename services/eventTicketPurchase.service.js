import pool from "../config/db.config.js";
import { generateUniqueUUID } from "../utils/generateUUID.js";
import { generateTicketQR } from "../utils/qrGenerator.js";
import { generateEventTicketPDF } from "../utils/pdfGenerator.js";
import { sendTicketEmail } from "../utils/emailService2.js";
import { createChapaPaymentURL, verifyChapaPayment } from "./chapa.service.js";
import dotenv from 'dotenv';
dotenv.config();

export async function createTicketPurchase(ticketData) {
  const { visit_date, email, ticketTypes, isGroup, group, services } = ticketData;

  const client = await pool.connect();
  let totalTickets = 0;
  let totalAmount = 0;
  const ticketPriceMap = [];
  const generatedQRCodes = [];

  try {
    await client.query("BEGIN");

    const ticket_booking_id = await generateUniqueUUID('bought_ticket', 'ticket_booking_id', client);

    if (isGroup && group) {
      group_id = await generateUniqueUUID('booking_groups', 'group_id', client);
      await client.query(
        `INSERT INTO booking_groups (group_id, group_name, group_leader_email, total_members)
         VALUES ($1, $2, $3, $4)`,
        [group_id, group.group_name, group.group_leader_email, group.total_members]
      );
    }

    await client.query(
      `INSERT INTO bought_ticket 
       (ticket_booking_id, visit_date, email, paid_amount, total_tickets, group_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ticket_booking_id, visit_date, email, 0, 0, group_id]
    );

    for (const ticket of ticketTypes) {
      const { rows: ticketDataRows } = await client.query(
        `SELECT price FROM ticket_types WHERE ticket_id = $1`,
        [ticket.ticket_id]
      );

      if (!ticketDataRows.length) {
        throw new Error(`Ticket type with ID ${ticket.ticket_id} not found.`);
      }

      let price = parseFloat(ticketDataRows[0].price);
      const quantity = ticket.quantity;

      if (isGroup && group) {
        const { rows: discountRows } = await client.query(
          `SELECT discount_percent FROM group_discounts 
           WHERE ticket_id = $1 AND min_group_size <= $2
           ORDER BY min_group_size DESC LIMIT 1`,
          [ticket.ticket_id, group.total_members]
        );
        if (discountRows.length) {
          const discountRate = parseFloat(discountRows[0].discount_percent);
          price = price - (price * (discountRate / 100));
        }
      }

      totalTickets += quantity;
      totalAmount += price * quantity;

      for (let i = 0; i < quantity; i++) {
        const type_id = await generateUniqueUUID('bought_ticket_types', 'type_id', client);
        await client.query(
          `INSERT INTO bought_ticket_types (type_id, ticket_booking_id, ticket_id, quantity, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [type_id, ticket_booking_id, ticket.ticket_id, 1, 'valid']
        );

        const qrCodeDataURL = await generateTicketQR(
          type_id,
          email,
          ticket_booking_id,
          visit_date
        );

        generatedQRCodes.push({
          type_id,
          ticket_id: ticket.ticket_id,
          qrCode: qrCodeDataURL
        });
      }

      ticketPriceMap.push({
        ticket_id: ticket.ticket_id,
        quantity,
        price
      });
    }

    // Handle services
    const serviceItems = services || [];
    const serviceSummary = [];

    for (const item of serviceItems) {
      const { rows } = await client.query(
        `SELECT price, name FROM services WHERE id = $1`,
        [item.service_id]
      );

      if (!rows.length) {
        throw new Error(`Service with ID ${item.service_id} not found.`);
      }

      const unitPrice = parseFloat(rows[0].price);
      const quantity = item.quantity || 1;
      const serviceTotal = unitPrice * quantity;

      totalAmount += serviceTotal;

      const bought_service_id = await generateUniqueUUID('bought_services', 'id', client);
      await client.query(
        `INSERT INTO bought_services (id, ticket_booking_id, service_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [bought_service_id, ticket_booking_id, item.service_id, quantity]
      );

      serviceSummary.push({
        service_id: item.service_id,
        name: rows[0].name,
        quantity,
        unit_price: unitPrice,
        subtotal: serviceTotal
      });
    }

    if (isGroup && group && totalTickets !== group.total_members) {
      throw new Error(`Group booking mismatch: total_members = ${group.total_members}, but selected tickets = ${totalTickets}`);
    }

    await client.query(
      `UPDATE bought_ticket 
       SET paid_amount = $1, total_tickets = $2 
       WHERE ticket_booking_id = $3`,
      [totalAmount, totalTickets, ticket_booking_id]
    );

    const pdfBuffers = [];
    for (const qr of generatedQRCodes) {
      const pdf = await generateTicketPDF({
        type_id: qr.type_id,
        ticket_id: qr.ticket_id,
        email,
        visit_date,
        qrCode: qr.qrCode
      });
      pdfBuffers.push(pdf);
    }

    await sendTicketEmail(email, pdfBuffers);
    await client.query("COMMIT");

    return {
      success: true,
      message: 'Ticket purchase successful',
      ticket_booking_id,
      group_id: group_id || null,
      tickets: ticketPriceMap.map(ticket => ({
        ticket_id: ticket.ticket_id,
        quantity: ticket.quantity,
        unit_price: ticket.price,
        subtotal: ticket.quantity * ticket.price
      })),
      services: serviceSummary,
      total_amount: totalAmount,
      qrCodes: generatedQRCodes
    };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction failed:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
}


// ===============================
// 1) INITIATE PAYMENT
// ===============================
// ===============================
// 1) INITIATE PAYMENT
// ===============================
export async function initiatePayment(ticketData) {
  const { event_id, email, full_name, phone_no, ticketTypes, walkin } = ticketData;

  const client = await pool.connect();
  let totalTickets = 0;
  let totalAmount = 0;

  try {
    await client.query("BEGIN");

    // Step 1: Calculate total tickets & amount
    for (const ticket of ticketTypes) {
      const { rows: ticketDataRows } = await client.query(
        `SELECT price FROM event_ticket_types WHERE ticket_id = $1`,
        [ticket.ticket_id]
      );

      if (!ticketDataRows.length) {
        throw new Error(`Ticket type with ID ${ticket.ticket_id} not found.`);
      }

      const price = parseFloat(ticketDataRows[0].price);
      const quantity = ticket.quantity;

      totalTickets += quantity;
      totalAmount += price * quantity;
    }

    // Step 2: Generate transaction reference
    const tx_ref = await generateUniqueUUID("pending_payments", "tx_ref", client);

    // Step 3: Save metadata into pending_payments
    await client.query(
      `INSERT INTO pending_payments (tx_ref, meta) VALUES ($1, $2)`,
      [
        tx_ref,
        JSON.stringify({ event_id, email, full_name, phone_no, ticketTypes, totalTickets, totalAmount })
      ]
    );

    await client.query("COMMIT");

    let checkout_url = null;

    if (!walkin) {
      // Step 4: Create Chapa Payment ONLY if not walk-in
      const chapaRes = await createChapaPaymentURL({
        email,
        amount: totalAmount,
        tx_ref,
        return_url: `${process.env.FRONTEND_URL_PROD}/eventConfirmation/${tx_ref}`,
        meta: {
          event_id,
          email,
          full_name,
          phone_no,
          ticketTypes
        },
      });
      checkout_url = chapaRes.checkout_url;
    }

    return {
      checkout_url,
      tx_ref,
      success: true
    };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("initiatePayment failed:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
}


// ===============================
// 2) HANDLE CHAPA WEBHOOK
// ===============================
export async function handleChapaWebhook(req, res) {
  try {

    const tx_ref = req.body.tx_ref;
    const walkin = req.body.walkin; // 👈 incoming flag

    let verified;
    if (walkin) {
      // Bypass verification for walk-in
      verified = { status: "success" };
    } else {
      verified = await verifyChapaPayment(tx_ref);
    }

    if (!verified || verified.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Step 1: Fetch metadata
      const { rows: metaRows } = await client.query(
        `SELECT meta FROM pending_payments WHERE tx_ref = $1`,
        [tx_ref]
      );

      if (metaRows.length === 0) {
        throw new Error("No metadata found for this tx_ref.");
      }

      const meta = metaRows[0].meta;
      const { event_id, email, full_name, phone_no, ticketTypes, totalTickets, totalAmount } = meta;

      // Step 2: Create unique booking id
      const event_booking_id = tx_ref;
      const pdfBuffers = [];

      try {
        // Step 3: Insert into event_info
        await client.query(
          `INSERT INTO event_info
          (event_booking_id, event_id, full_name, email, phone_no, ticket_no, paid_amount, bought_at, attendance, walkin)
          VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),'Confirmed',$8)`,
          [event_booking_id, event_id, full_name, email, phone_no, totalTickets, totalAmount, walkin ? "yes" : "no"]
        );
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.warn("🟡 Duplicate tx_ref detected:", tx_ref);
          await client.rollback();
          client.release();
          return res.status(200).json({ success: true, message: "Already processed" });
        } else {
          throw err;
        }
      }

      const { rows: eventRows } = await client.query(
        `SELECT ei.*, vs.venue AS location, vs.venue_am AS location_am
         FROM event ei
         JOIN venue_schedule vs ON ei.venue_id = vs.venue_id
         WHERE ei.event_id = $1
         LIMIT 1`,
        [event_id]
      );

      if (eventRows.length === 0) {
        throw new Error(`No event found with id ${event_id}`);
      }

      const visit_date = eventRows[0].date;
      const event_title = eventRows[0].title;
      const event_location = eventRows[0].location || eventRows[0].venue || null;

      // Step 4: Insert into event_bought_tickets
      for (const ticket of ticketTypes) {
        await client.query(
          `UPDATE event_ticket_types
          SET ticket_limit = ticket_limit - $1
          WHERE event_id = $2
            AND ticket_id = $3`,
          [ticket.quantity, event_id, ticket.ticket_id]
        );

        for (let i = 0; i < ticket.quantity; i++) {
          const type_id = await generateUniqueUUID("event_bought_tickets", "type_id", client);

          await client.query(
            `INSERT INTO event_bought_tickets (type_id, event_booking_id, status, ticket_id)
             VALUES ($1,$2,$3,$4)`,
            [type_id, event_booking_id, "valid", ticket.ticket_id] // 👈 Always valid (even for walkin)
          );

          if (!walkin) {
            // Only generate tickets if NOT walk-in
            const ticket_type = await client.query(
              `SELECT type FROM event_ticket_types WHERE ticket_id = $1`,
              [ticket.ticket_id]
            );

            const qrCode = await generateTicketQR(type_id, email, event_booking_id, visit_date);
            const pdf = await generateEventTicketPDF({
              event_title,
              type_id,
              ticket_id: ticket_type.rows[0].type,
              email,
              visit_date,
              start_time: eventRows[0].start_time,
              end_time: eventRows[0].end_time,
              location: event_location,
              qrCode
            });
            pdfBuffers.push(pdf);
          }
        }
      }

      // Step 5: Remove from pending payments
      await client.query(`DELETE FROM pending_payments WHERE tx_ref = $1`, [tx_ref]);

      // Only send tickets if not walk-in
      if (!walkin) {
        await sendTicketEmail(email, pdfBuffers);
      }

      await client.query("COMMIT");

      return res.status(200).json({ success: true, message: "Booking confirmed" });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Webhook error:", err);
      return res.status(500).json({ success: false });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("Webhook failed:", e);
    return res.status(500).json({ success: false });
  }
}



export async function getPaymentStatus(req, res) {
  const { tx_ref } = req.query;
  try {
    const result = await verifyChapaPayment(tx_ref);
    if (result.status === "success") {
      return res.json({ status: "paid" });
    } else {
      return res.json({ status: "failed" });
    }
  } catch (e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}

export async function fetchTicketTypes(eventId) {
  const { rows } = await pool.query(
    `SELECT ticket_id, type, price, description, feature,ticket_limit,type_am,description_am,features_am as feature_am 
     FROM event_ticket_types 
     WHERE event_id = $1 AND status = 'active' AND is_deleted = false`,
    [eventId]
  );

  // Transform into front-end format
  return rows.map((row) => ({
    id: row.ticket_id, // e.g., "General Admission" → "general_admission"
    name: row.type,
    name_am: row.type_am,

    price: Number(row.price),
    currency: "ETB",
    description: row.description,
    description_am: row.description_am,

    features: row.feature ? row.feature.split(",") : [],
    features_am: row.feature_am ? row.feature_am.split(",") : [],
    ticket_limit: row.ticket_limit, // keep DB id for backend usage
  }));
};

export const getEventBookingDetails = async (merch_order_id) => {
  if (!merch_order_id) return null;

  // 1. Get booking info - check both ID columns
  const bookingRes = await pool.query(
    `SELECT * FROM event_info 
     WHERE merch_order_id = $1 OR event_booking_id = $1 
     LIMIT 1`,
    [merch_order_id]
  );
  if (bookingRes.rowCount === 0) return null;

  const booking = bookingRes.rows[0];
  const tx_ref = booking.event_booking_id;
  // 2. Get aggregated tickets (for summary)
  const ticketSummaryRes = await pool.query(
    `SELECT ett.ticket_id,
            ett.type,
            ett.type_am,
            ett.price,
            COUNT(tbt.ticket_id) AS quantity
     FROM event_bought_tickets tbt
     JOIN event_ticket_types ett ON tbt.ticket_id = ett.ticket_id
     WHERE tbt.event_booking_id = $1
     GROUP BY ett.ticket_id, ett.type, ett.price,ett.type_am`,
    [tx_ref]
  );

  const ticketSummary = ticketSummaryRes.rows.map((row) => ({
    ticket_id: row.ticket_id,
    type: row.type,
    type_am: row.type_am,
    price: row.price,
    quantity: parseInt(row.quantity, 10),
  }));

  // 3. Get individual tickets (for QR codes) + type_id
  const ticketDetailRes = await pool.query(
    `SELECT tbt.ticket_id, tbt.type_id, ett.type, ett.type_am,ett.price
     FROM event_bought_tickets tbt
     JOIN event_ticket_types ett ON tbt.ticket_id = ett.ticket_id
     WHERE tbt.event_booking_id = $1`,
    [tx_ref]
  );


  const tickets = await Promise.all(
    ticketDetailRes.rows.map(async (ticket, idx) => {
      // embed type_id in QR payload

      const type_id = ticket.type_id;

      const qr_code = await generateTicketQR(
        type_id,
        booking.email,
        `${tx_ref}-${idx + 1}`,
        booking.bought_at
      );

      return {
        ...ticket,
        qr_code,
        status: "valid",
      };
    })
  );

  // 4. Get event info
  const eventRes = await pool.query(
    `SELECT ei.*, vs.venue AS location,vs.venue_am as location_am
     FROM event ei
     JOIN venue_schedule vs ON ei.venue_id = vs.venue_id
     WHERE ei.event_id = $1
     LIMIT 1`,
    [booking.event_id]
  );

  const event = eventRes.rows[0] || {};

  return {
    ticket_booking_id: booking.event_booking_id,
    email: booking.email,
    visit_date: booking.bought_at,
    tickets,              // individual tickets with QR codes and type_id
    ticketSummary,        // grouped summary
    services: [],
    total_tickets: tickets.length,
    event,
    totalPaid: booking.paid_amount,
  };
};


export const createFreeTicket = async (ticketData) => {
  const { event_id, email, full_name, phone_no, ticketTypes } = ticketData;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Validate Event is Free
    const eventRes = await client.query(`SELECT is_free, title, date FROM event WHERE event_id = $1`, [event_id]);
    if (eventRes.rowCount === 0) throw new Error("Event not found");
    const event = eventRes.rows[0];

    // Check strict equality for boolean true or string 'true'
    if (event.is_free !== true && event.is_free !== 'true') {
      throw new Error("This event is not free");
    }

    // 2. Validate Ticket Quantity (Max 1 for free events)
    let totalTickets = 0;
    for (const t of ticketTypes) {
      totalTickets += t.quantity;
    }
    if (totalTickets > 1) {
      throw new Error("You can only get one ticket for a free event");
    }

    // 3. User Restriction (Optional: Check if email already booked for this event)
    const existingBooking = await client.query(
      `SELECT event_booking_id FROM event_info WHERE event_id = $1 AND email = $2`,
      [event_id, email]
    );
    if (existingBooking.rowCount > 0) {
      throw new Error("You have already booked a ticket for this event");
    }

    // 4. Generate Booking ID (simulate tx_ref)
    const event_booking_id = `FREE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 5. Insert into event_info
    await client.query(
      `INSERT INTO event_info
      (event_booking_id, event_id, full_name, email, phone_no, ticket_no, paid_amount, bought_at, attendance, walkin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'Confirmed', 'no')`,
      [event_booking_id, event_id, full_name, email, phone_no, totalTickets, 0.00]
    );

    const visit_date = event.date;
    const event_title = event.title;
    const pdfBuffers = [];
    const generatedQRCodes = [];

    // 6. Process Ticket
    for (const ticket of ticketTypes) {
      // Check/Update Stock
      const stockRes = await client.query(
        `UPDATE event_ticket_types
         SET ticket_limit = ticket_limit - $1
         WHERE event_id = $2 AND ticket_id = $3 AND ticket_limit >= $1
         RETURNING type`,
        [ticket.quantity, event_id, ticket.ticket_id]
      );

      if (stockRes.rowCount === 0) {
        throw new Error(`Ticket type ${ticket.ticket_id} is sold out or unavailable`);
      }
      const ticketTypeLabel = stockRes.rows[0].type;

      // Create Ticket Record
      const type_id = await generateUniqueUUID("event_bought_tickets", "type_id", client);

      await client.query(
        `INSERT INTO event_bought_tickets (type_id, event_booking_id, status, ticket_id)
         VALUES ($1, $2, $3, $4)`,
        [type_id, event_booking_id, "valid", ticket.ticket_id]
      );

      // Generate QR & PDF
      const qrCode = await generateTicketQR(type_id, email, event_booking_id, visit_date);
      const pdf = await generateEventTicketPDF({
        event_title,
        type_id,
        ticket_id: ticketTypeLabel,
        email,
        visit_date,
        qrCode
      });

      pdfBuffers.push(pdf);
      generatedQRCodes.push({ type_id, qrCode });
    }

    // 7. Send Email
    await sendTicketEmail(email, pdfBuffers);

    await client.query("COMMIT");

    return {
      success: true,
      booking_id: event_booking_id,
      ticket_id: generatedQRCodes[0].type_id,
      message: "Free ticket generated successfully"
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

