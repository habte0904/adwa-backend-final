import pool from "../config/db.config.js";
import { generateUniqueUUID } from "../utils/generateUUID.js";
import { generateTicketQR } from "../utils/qrGenerator.js";
import { generateTicketPDF } from "../utils/pdfGenerator.js";
import { sendTicketEmail } from "../utils/emailService2.js";
import { createChapaPaymentURL, verifyChapaPayment } from "./chapa.service.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { format } from "date-fns";
dotenv.config();

// ADD: Currency validation function
async function validateCurrencyConsistency(ticketTypes, client = pool) {
  if (!ticketTypes || ticketTypes.length === 0) {
    return { isValid: true, error: null };
  }

  // Get all ticket details with currencies
  const ticketIds = ticketTypes.map(t => t.ticket_id);
  const { rows } = await client.query(
    `SELECT ticket_id, currency FROM ticket_types WHERE ticket_id = ANY($1)`,
    [ticketIds]
  );

  if (rows.length === 0) {
    throw new Error("No valid ticket types found");
  }

  // Check if all tickets have the same currency
  const currencies = [...new Set(rows.map(row => row.currency))];

  if (currencies.length > 1) {
    const currencyList = currencies.join(', ');
    return {
      isValid: false,
      error: `Cannot mix different currencies in a single purchase. Found currencies: ${currencyList}. All tickets must have the same currency type.`
    };
  }

  return { isValid: true, error: null };
}



// ADD: helper to fetch discounts once per purchase
async function getDiscountsForTickets(ticketIds, client = pool) {
  if (!ticketIds.length) return {};
  const { rows } = await client.query(
    `SELECT ticket_id, min_group_size, discount_percent
       FROM group_discounts
      WHERE ticket_id = ANY($1)
      ORDER BY ticket_id, min_group_size ASC`,
    [ticketIds]
  );
  const map = {};
  for (const r of rows) {
    if (!map[r.ticket_id]) map[r.ticket_id] = [];
    map[r.ticket_id].push({
      min_group_size: Number(r.min_group_size),
      discount_percent: Number(r.discount_percent),
    });
  }
  return map;
}

// ADD: compute best discount percent given participant count
function bestDiscountPercent(discountArr, participantCount) {
  if (!discountArr || !discountArr.length) return 0;
  let best = 0;
  for (const d of discountArr) {
    if (participantCount >= d.min_group_size && d.discount_percent > best) {
      best = d.discount_percent;
    }
  }
  return best;
}

// ADD: discount-aware currency calculator (keeps original calculateAmountByCurrency untouched)
async function calculateAmountByCurrencyWithDiscounts(
  ticketDetails,
  { isGroup, group }
) {
  let totalETB = 0;
  const breakdown = [];
  const ticketIds = [
    ...new Set(ticketDetails.map((t) => Number(t.ticket_id))),
  ].filter(Boolean);
  const discountMap = await getDiscountsForTickets(ticketIds);

  for (const item of ticketDetails) {
    const ticketId = Number(item.ticket_id);
    const qty = Number(item.quantity) || 0;
    if (!qty) continue;

    const result = await pool.query(
      "SELECT price, currency FROM ticket_types WHERE ticket_id = $1",
      [ticketId]
    );
    if (!result.rows.length)
      throw new Error(`Invalid ticket type: ${ticketId}`);
    const { price, currency } = result.rows[0];

    // Determine participant count base (group total if group else per-ticket quantity)
    const participantCount =
      isGroup && group?.total_members ? Number(group.total_members) : qty;
    const percent = bestDiscountPercent(
      discountMap[ticketId],
      participantCount
    );
    const discountedUnit = percent ? price * (1 - percent / 100) : price;
    const lineBase = price * qty;
    const lineDiscount = (price - discountedUnit) * qty;
    const lineTotal = discountedUnit * qty;

    // Convert AFTER discount so customer pays reduced amount
    const convertedAmount = lineTotal
    totalETB += convertedAmount;

    breakdown.push({
      ticket_id: ticketId,
      quantity: qty,
      base_unit_price: Number(price),
      discount_percent_applied: percent,
      discounted_unit_price: discountedUnit,
      base_line_total: lineBase,
      line_discount_amount: lineDiscount,
      final_line_total: lineTotal,
      currency,
    });
  }

  return {
    totalETB: Number(totalETB.toFixed(2)),
    breakdown,
  };
}

export async function createTicketPurchase(ticketData) {
  const { visit_date, email, ticketTypes, isGroup, group, services } =
    ticketData;
  const client = await pool.connect();
  let group_id = null;
  let totalTickets = 0;
  let totalAmount = 0;
  const ticketPriceMap = [];
  const generatedQRCodes = [];

  try {
    await client.query("BEGIN");

    // ADD: Validate currency consistency before processing
    const currencyValidation = await validateCurrencyConsistency(ticketTypes, client);
    if (!currencyValidation.isValid) {
      throw new Error(currencyValidation.error);
    }

    const ticket_booking_id = await generateUniqueUUID(
      "bought_ticket",
      "ticket_booking_id",
      client
    );

    if (isGroup && group) {
      group_id = await generateUniqueUUID("booking_groups", "group_id", client);
      await client.query(
        `INSERT INTO booking_groups (group_id, group_name, group_leader_email, total_members)
         VALUES ($1, $2, $3, $4)`,
        [
          group_id,
          group.group_name,
          group.group_leader_email,
          group.total_members,
        ]
      );
    }

    await client.query(
      `INSERT INTO bought_ticket 
       (ticket_booking_id, visit_date, email, paid_amount, total_tickets, group_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ticket_booking_id, visit_date, email, 0, 0, group_id]
    );

    // FETCH all discounts once (ADD)
    const discountMap = await getDiscountsForTickets(
      ticketTypes.map((t) => t.ticket_id),
      client
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
      const quantity = Number(ticket.quantity);

      // UPDATED: apply discount whether group or large single purchase
      const participantCount =
        isGroup && group?.total_members
          ? Number(group.total_members)
          : quantity;
      const percent = bestDiscountPercent(
        discountMap[ticket.ticket_id],
        participantCount
      );
      if (percent) {
        price = price * (1 - percent / 100);
      }

      totalTickets += quantity;
      totalAmount += price * quantity;

      for (let i = 0; i < quantity; i++) {
        const type_id = await generateUniqueUUID(
          "bought_ticket_types",
          "type_id",
          client
        );
        await client.query(
          `INSERT INTO bought_ticket_types (type_id, ticket_booking_id, ticket_id, quantity, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [type_id, ticket_booking_id, ticket.ticket_id, 1, "valid"]
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
          qrCode: qrCodeDataURL,
        });
      }

      ticketPriceMap.push({
        ticket_id: ticket.ticket_id,
        quantity,
        price,
        discount_percent_applied: percent || 0,
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

      const bought_service_id = await generateUniqueUUID(
        "bought_services",
        "id",
        client
      );
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
        subtotal: serviceTotal,
      });
    }

    if (isGroup && group && totalTickets !== group.total_members) {
      throw new Error(
        `Group booking mismatch: total_members = ${group.total_members}, but selected tickets = ${totalTickets}`
      );
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
        qrCode: qr.qrCode,
      });
      pdfBuffers.push(pdf);
    }

    await sendTicketEmail(email, pdfBuffers);
    await client.query("COMMIT");

    return {
      success: true,
      message: "Ticket purchase successful",
      ticket_booking_id,
      group_id: group_id || null,
      tickets: ticketPriceMap.map((ticket) => ({
        ticket_id: ticket.ticket_id,
        quantity: ticket.quantity,
        unit_price: ticket.price,
        subtotal: ticket.quantity * ticket.price,
      })),
      services: serviceSummary,
      total_amount: totalAmount,
      qrCodes: generatedQRCodes,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction failed:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
}


