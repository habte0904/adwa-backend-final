import asyncHandler from "express-async-handler";
import { createOrder } from "../services/createOrderService.js";
import { createCheckoutUrl } from "../services/checkoutService.js";
import pool from "../config/db.config.js";
import { generateUniqueUUID } from "../utils/generateUUID.js";
import { generateTicketQR } from "../utils/qrGenerator.js";
import { generateTicketPDF } from "../utils/pdfGenerator.js";
import { sendTicketEmail } from "../utils/emailService2.js";
import config from "../config/config.js";
import { queryOrder } from "../services/queryOrderService.js";

import dotenv from "dotenv";
import fetch from "node-fetch";
import { format } from "date-fns";
dotenv.config();

import crypto from "crypto";
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

export const initiatePayment = asyncHandler(async (req, res) => {

  const { visit_date, email, title, ticketTypes, isGroup, group, services } = req.body;
  const client = await pool.connect();
  let totalAmount = 0;

  try {
    await client.query("BEGIN");

    // ADD: Validate currency consistency before processing
    const currencyValidation = await validateCurrencyConsistency(ticketTypes, client);
    if (!currencyValidation.isValid) {
      throw new Error(currencyValidation.error);
    }

    // Calculate total with discounts
    const { totalETB, breakdown } = await calculateAmountByCurrencyWithDiscounts(ticketTypes, { isGroup, group });
    totalAmount = totalETB;

    // Ensure unit_price and discount_percent are included in ticketTypes
    const ticketTypesWithPricing = ticketTypes.map(ticket => {
      const discount = ticket.discount_percent || 0;
      const unit_price = ticket.price - (ticket.price * discount / 100);
      return {
        ...ticket,
        unit_price,
        discount_percent: discount
      };
    });

    // Step 1 & 2: Create order (includes getting token)
    const orderResult = await createOrder(title, totalAmount);

    const tx_ref = orderResult.prepayId

    await client.query(
      `INSERT INTO pending_payments (tx_ref, merch_order_id, status, notify_received,meta) VALUES ($1, $2, $3, $4, $5)`,
      [
        tx_ref,
        orderResult.merchantOrderId,
        "PENDING",
        false,
        JSON.stringify({
          email,
          visit_date,
          ticketTypes: ticketTypesWithPricing,
          isGroup,
          group,
          services,
          discount_breakdown: breakdown,
          totalAmount: totalAmount
        })
      ]
    );
    await client.query("COMMIT")

    // Step 3: Generate checkout URL
    const checkoutUrl = createCheckoutUrl(orderResult.prepayId);

    console.log("=== CHECKOUT URL DEBUG ===");
    console.log("prepay_id  :", orderResult.prepayId);
    console.log("merchantOrderId:", orderResult.merchantOrderId);
    console.log("checkout_url:", checkoutUrl);
    console.log("=========================");

    res.json({
      tx_ref: orderResult.prepayId,
      checkout_url: checkoutUrl,
    });

    // return { checkout_url: checkoutUrl, tx_ref: orderResult.prepayId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("initiatePayment failed:", error);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});









async function processSuccessfulPayment(merch_order_id, payment_order_id, client) {
  // 1️⃣ Update payment status
  console.log("in process payment")
  await client.query(
    `UPDATE pending_payments
         SET status = 'PAID',
             notify_received = true,
             payment_order_id = $1
         WHERE merch_order_id = $2`,
    [payment_order_id, merch_order_id]
  );

  const tx_ref_result = await client.query(
    `SELECT * FROM pending_payments WHERE merch_order_id = $1 LIMIT 1`,
    [merch_order_id]
  );
  const tx_ref = tx_ref_result.rows[0]?.tx_ref;

  if (!tx_ref) throw new Error("No pending payment found for this transaction.");

  // Check if booking already exists
  const { rows: existingBookingRows } = await client.query(
    `SELECT ticket_booking_id FROM bought_ticket WHERE chapa_tx_ref = $1`,
    [tx_ref]
  );

  if (existingBookingRows.length > 0) {
    return { success: true, alreadyProcessed: true };
  }

  // Fetch metadata from pending payments
  const { rows: metaRows } = await client.query(
    `SELECT meta FROM pending_payments WHERE tx_ref = $1`,
    [tx_ref]
  );

  if (metaRows.length === 0) throw new Error("No metadata found for this tx_ref.");

  const meta = metaRows[0].meta;

  // Validate currency consistency
  const currencyValidation = await validateCurrencyConsistency(meta.ticketTypes, client);
  if (!currencyValidation.isValid) {
    throw new Error(`Payment processing failed: ${currencyValidation.error}`);
  }

  const ticket_booking_id = await generateUniqueUUID("bought_ticket", "ticket_booking_id", client);

  const email = meta.email;
  const visit_date = meta.visit_date;
  const ticketTypes = meta.ticketTypes;
  const isGroup = meta.isGroup;
  const group = meta.group;
  const services = meta.services || [];
  const discount_breakdown = Array.isArray(meta.discount_breakdown) ? meta.discount_breakdown : [];
  let group_id = null;
  let totalTickets = 0;
  const pdfBuffers = [];

  // Process tickets
  for (const ticket of ticketTypes) {
    const { rows } = await client.query(
      `SELECT type, price FROM ticket_types WHERE ticket_id = $1 LIMIT 1`,
      [ticket.ticket_id]
    );
    ticket.type = rows[0]?.type || "Unknown";
    ticket.price = Number(rows[0]?.price || 0);

    const breakdown = discount_breakdown.find(
      d => String(d.ticket_id) === String(ticket.ticket_id)
    );
    if (breakdown) {
      ticket.quantity = breakdown.quantity;
      ticket.discount_percent = breakdown.discount_percent_applied || 0;
      ticket.unit_price = breakdown.discounted_unit_price ?? (ticket.price * (1 - ticket.discount_percent / 100));
    } else {
      ticket.quantity = ticket.quantity || 1;
      ticket.discount_percent = ticket.discount_percent || 0;
      ticket.unit_price = ticket.unit_price ?? (ticket.price * (1 - ticket.discount_percent / 100));
    }
  }

  // Create group if needed
  if (isGroup && group) {
    group_id = await generateUniqueUUID("booking_groups", "group_id", client);
    await client.query(
      `INSERT INTO booking_groups (group_id, group_name, group_leader_email, total_members)
           VALUES ($1, $2, $3, $4)`,
      [group_id, group.group_name, group.group_leader_email, group.total_members]
    );
  }

  // Insert booking
  await client.query(
    `INSERT INTO bought_ticket
       (ticket_booking_id, visit_date, email, paid_amount, total_tickets, group_id, status, chapa_tx_ref, discount_breakdown, merch_order_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, $8, $9)`,
    [
      ticket_booking_id,
      visit_date,
      email,
      meta.paid_amount || 0, // Should use the amount from meta or notification
      0,
      group_id,
      tx_ref,
      discount_breakdown.length ? JSON.stringify(discount_breakdown) : null,
      merch_order_id
    ]
  );

  if (isGroup && group) {
    for (const ticket of ticketTypes) {
      await client.query(
        `UPDATE ticket_types SET daily_limit = daily_limit - $1 WHERE ticket_id = $2`,
        [ticket.quantity, ticket.ticket_id]
      );

      for (let i = 0; i < ticket.quantity; i++) {
        const type_id = await generateUniqueUUID("bought_ticket_types", "type_id", client);
        await client.query(
          `INSERT INTO bought_ticket_types
                 (type_id, ticket_booking_id, ticket_id, unit_price, discount_percent, status)
                 VALUES ($1, $2, $3, $4, $5, 'valid')`,
          [type_id, ticket_booking_id, ticket.ticket_id, ticket.unit_price, ticket.discount_percent]
        );
      }
    }
    const groupResult = await client.query(
      `SELECT ticket_booking_id FROM bought_ticket WHERE group_id = $1`,
      [group_id]
    );

    const allTicketBookingIds = groupResult.rows.map(row => row.ticket_booking_id);

    const ticketResult = await client.query(
      `SELECT tbt.ticket_booking_id, tbt.type_id, tbt.ticket_id, tt.type, 
                tbt.status, tbt.unit_price, tbt.discount_percent
         FROM bought_ticket_types tbt
         JOIN ticket_types tt ON tbt.ticket_id = tt.ticket_id
         WHERE tbt.ticket_booking_id = ANY($1)`,
      [allTicketBookingIds]
    );

    const qrCode = await generateTicketQR(ticketResult.rows[0].type_id, email, group_id, visit_date);
    const pdf = await generateTicketPDF({
      group: true,
      ticket_booking_id,
      email,
      visit_date,
      qrCode,
      type_id: ticketResult.rows[0].type_id,
      book: ticket_booking_id,
      total_members: group.total_members,
      ticketTypes,
    });

    pdfBuffers.push(pdf);
    totalTickets = group.total_members;
  } else {
    for (const ticket of ticketTypes) {
      await client.query(
        `UPDATE ticket_types SET daily_limit = daily_limit - $1 WHERE ticket_id = $2`,
        [ticket.quantity, ticket.ticket_id]
      );

      for (let i = 0; i < ticket.quantity; i++) {
        const type_id = await generateUniqueUUID("bought_ticket_types", "type_id", client);
        await client.query(
          `INSERT INTO bought_ticket_types
                 (type_id, ticket_booking_id, ticket_id, unit_price, discount_percent, status)
                 VALUES ($1, $2, $3, $4, $5, 'valid')`,
          [type_id, ticket_booking_id, ticket.ticket_id, ticket.unit_price, ticket.discount_percent]
        );

        const qrCode = await generateTicketQR(type_id, email, ticket_booking_id, visit_date);
        const pdf = await generateTicketPDF({
          type: ticket.type,
          type_id,
          ticket_id: ticket.ticket_id,
          book: ticket_booking_id,
          email,
          visit_date,
          qrCode,
        });
        pdfBuffers.push(pdf);
        totalTickets++;
      }
    }
  }

  // Insert services
  for (const item of services) {
    const bought_service_id = await generateUniqueUUID("bought_services", "id", client);
    await client.query(
      `INSERT INTO bought_services (id, ticket_booking_id, service_id, quantity)
           VALUES ($1, $2, $3, $4)`,
      [bought_service_id, ticket_booking_id, item.service_id, item.quantity || 1]
    );
  }

  // Update total tickets and paid amount if necessary
  await client.query(
    `UPDATE bought_ticket SET total_tickets = $1, paid_amount = $2 WHERE ticket_booking_id = $3`,
    [totalTickets, meta.totalAmount || 0, ticket_booking_id]
  );

  // Remove pending payment
  await client.query(`DELETE FROM pending_payments WHERE tx_ref = $1`, [tx_ref]);

  // Send email
  await sendTicketEmail(email, pdfBuffers);

  return { success: true };
}

export const checkPaymentStatus = asyncHandler(async (req, res) => {
  const { merch_order_id } = req.params;
  const client = await pool.connect();

  try {
    // 1. Check if the payment exists in our final table first
    const { rows: existingBooking } = await client.query(
      `SELECT * FROM bought_ticket WHERE merch_order_id = $1 LIMIT 1`,
      [merch_order_id]
    );

    if (existingBooking.length > 0) {
      return res.status(200).json({ status: "SUCCESS", message: "Payment already processed." });
    }

    // 2. Check pending payments
    const { rows: pendingResult } = await client.query(
      `SELECT * FROM pending_payments WHERE merch_order_id = $1 LIMIT 1`,
      [merch_order_id]
    );

    if (pendingResult.length === 0) {
      return res.status(404).json({ status: "NOT_FOUND", message: "Transaction not found." });
    }

    const pending = pendingResult[0];

    // 3. Query Telebirr if status is still PENDING
    console.log(`Querying Telebirr for order: ${merch_order_id}`);
    const teleResult = await queryOrder(merch_order_id);
    
    console.log("in check payment begi process before if")
    console.log(teleResult)
    if (teleResult.success && teleResult.orderStatus === "PAY_SUCCESS") {
      console.log("in check payment begi process")
      await client.query("BEGIN");
      await processSuccessfulPayment(merch_order_id, teleResult.paymentOrderId, client);
      await client.query("COMMIT");

      return res.status(200).json({ status: "SUCCESS", message: "Payment verified successfully." });
    } else {
      return res.status(200).json({
        status: teleResult.tradeStatus || "PENDING",
        message: `Current payment status: ${teleResult.tradeStatus || "Waiting for payment"}`
      });
    }
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("checkPaymentStatus failed:", error);
    res.status(500).json({ status: "ERROR", message: error.message });
  } finally {
    if (client) client.release();
  }
});

export const telebirrNotify = asyncHandler(async (req, res) => {
   console.log("Callback request body in notify", req.body)

 console.log("call back request end===============")
  const client = await pool.connect();

  try {
    const {
      sign,
      sign_type,
      trade_status,
      merch_order_id,
      payment_order_id,
      total_amount
    } = req.body;
    console.log("merch order id in notify= ",merch_order_id)

    // 1️⃣ Rebuild sign string (exclude sign & sign_type)
    const payload = { ...req.body };
    delete payload.sign;
    delete payload.sign_type;

    const signString = Object.keys(payload)
      .sort()
      .map(k => `${k}=${payload[k]}`)
      .join("&");

    // 2️⃣ Verify signature
    const isValid = crypto
      .createVerify("SHA256")
      .update(signString)
      .verify(
        {
          key: config.TELEBIRR_PUBLIC_KEY,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        },
        sign,
        "base64"
      );

    if (!isValid) {
      return res.status(400).send("INVALID SIGNATURE");
    }
    console.log("After the payment validation")
    // 3️⃣ Update payment status if completed
    if (trade_status === "Completed") {
      await client.query("BEGIN");
      const result = await processSuccessfulPayment(merch_order_id, payment_order_id, client);
      await client.query("COMMIT");
      return res.status(200).json({ success: true });
    } else if (trade_status === "Failure") {
      await client.query(
        `UPDATE pending_payments SET status = 'FAILED', notify_received = true WHERE merch_order_id = $1`,
        [merch_order_id]
      );
    }
    console.log("out of notify")
    res.status(200).json({ message: "SUCCESS" });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("Notify error:", err);
    res.status(500).send("ERROR");
  } finally {
    if (client) client.release();
  }
});





