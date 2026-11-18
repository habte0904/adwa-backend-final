import asyncHandler from "express-async-handler";
import { createOrder } from "../services/createOrderService.js";
import { createCheckoutUrl } from "../services/checkoutService.js";
import pool from "../config/db.config.js";
import { generateUniqueUUID } from "../utils/generateUUID.js";
import { generateTicketQR } from "../utils/qrGenerator.js";
import { sendTicketEmail } from "../utils/emailService2.js";
import { queryOrder } from "../services/queryOrderService.js";
import { generateEventTicketPDF } from "../utils/pdfGenerator.js";

import dotenv from "dotenv";
import fetch from "node-fetch";
import { format } from "date-fns";
dotenv.config();





export const initiatePayment = asyncHandler(async (req, res) => {
    const { event_id, email, full_name, phone_no, ticketTypes, walkin } = req.body;

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

        const orderResult = await createOrder("Event ticket", Number(totalAmount).toFixed(2), "event");
        const tx_ref = orderResult.prepayId;

        // Step 3: Save metadata into pending_payments
        await client.query(
            `INSERT INTO pending_payments (tx_ref, meta,merch_order_id, status, notify_received) VALUES ($1, $2, $3, $4, $5)`,
            [
                tx_ref,
                JSON.stringify({ event_id, email, full_name, phone_no, ticketTypes, totalTickets, totalAmount }),
                orderResult.merchantOrderId,
                "PENDING",
                false,
            ]
        );

        await client.query("COMMIT");

        const checkoutUrl = createCheckoutUrl(orderResult.prepayId);



        return res.json({
            checkout_url: checkoutUrl,
            tx_ref,
            success: true
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("initiatePayment failed:", error);
        throw new Error(error.message);
    } finally {
        client.release();
    }

});









async function processSuccessfulEventPayment(merch_order_id, payment_order_id, client) {
    // 1️⃣ Update payment status
    await client.query(
        `UPDATE pending_payments
         SET status = 'PAID',
             notify_received = true,
             payment_order_id = $1
         WHERE merch_order_id = $2`,
        [payment_order_id, merch_order_id]
    );

    const tx_ref_result = await client.query(
        `SELECT tx_ref FROM pending_payments WHERE merch_order_id = $1 LIMIT 1`,
        [merch_order_id]
    );
    const tx_ref = tx_ref_result.rows[0]?.tx_ref;

    if (!tx_ref) throw new Error("No pending payment found for this transaction.");

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

    // Check for duplicate
    const { rows: existingRows } = await client.query(
        `SELECT event_booking_id FROM event_info WHERE event_booking_id = $1`,
        [event_booking_id]
    );
    if (existingRows.length > 0) {
        return { success: true, alreadyProcessed: true };
    }

    // Step 3: Insert into event_info
    await client.query(
        `INSERT INTO event_info
      (event_booking_id, event_id, full_name, email, phone_no, ticket_no, paid_amount, bought_at, attendance, walkin, merch_order_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'Confirmed', 'no', $8)`,
        [event_booking_id, event_id, full_name, email, phone_no, totalTickets, totalAmount, merch_order_id]
    );

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
         VALUES ($1, $2, $3, $4)`,
                [type_id, event_booking_id, "valid", ticket.ticket_id]
            );

            const ticket_type_res = await client.query(
                `SELECT type FROM event_ticket_types WHERE ticket_id = $1`,
                [ticket.ticket_id]
            );

            const qrCode = await generateTicketQR(type_id, email, event_booking_id, visit_date);
            const pdf = await generateEventTicketPDF({
                event_title,
                type_id,
                ticket_id: ticket_type_res.rows[0].type,
                email,
                visit_date,
                start_time: eventRows[0].start_time,
                end_time: eventRows[0].end_time,
                location: event_location,
                qrCode,
                status: 'valid'
            });
            pdfBuffers.push(pdf);
        }
    }

    // Step 5: Remove from pending payments
    await client.query(`DELETE FROM pending_payments WHERE tx_ref = $1`, [tx_ref]);

    // Send tickets
    await sendTicketEmail(email, pdfBuffers);

    return { success: true };
}

export const checkEventPaymentStatus = asyncHandler(async (req, res) => {
    const { merch_order_id } = req.params;
    const client = await pool.connect();

    try {
        // 1. Check if the payment exists in our final table first
        const { rows: existingBooking } = await client.query(
            `SELECT * FROM event_info WHERE merch_order_id = $1 LIMIT 1`,
            [merch_order_id]
        );

        if (existingBooking.length > 0) {
            return res.status(200).json({ status: "SUCCESS", message: "Payment already processed.", event_booking_id: existingBooking[0].event_booking_id });
        }

        // 2. Check pending payments
        const { rows: pendingResult } = await client.query(
            `SELECT * FROM pending_payments WHERE merch_order_id = $1 LIMIT 1`,
            [merch_order_id]
        );

        if (pendingResult.length === 0) {
            return res.status(404).json({ status: "NOT_FOUND", message: "Transaction not found." });
        }

        // 3. Query Telebirr
        console.log(`Querying Telebirr for event order: ${merch_order_id}`);
        const teleResult = await queryOrder(merch_order_id);

        if (teleResult.success && teleResult.orderStatus === "PAY_SUCCESS") {
            await client.query("BEGIN");
            await processSuccessfulEventPayment(merch_order_id, teleResult.paymentOrderId, client);
            await client.query("COMMIT");

            // Look up the event_booking_id (which is tx_ref)
            const { rows: finalBooking } = await client.query(
                `SELECT event_booking_id FROM event_info WHERE merch_order_id = $1 LIMIT 1`,
                [merch_order_id]
            );

            return res.status(200).json({
                status: "SUCCESS",
                message: "Payment verified successfully.",
                event_booking_id: finalBooking[0]?.event_booking_id
            });
        } else {
            return res.status(200).json({
                status: teleResult.tradeStatus || "PENDING",
                message: `Current payment status: ${teleResult.tradeStatus || "Waiting for payment"}`
            });
        }
    } catch (error) {
        if (client) await client.query("ROLLBACK");
        console.error("checkEventPaymentStatus failed:", error);
        res.status(500).json({ status: "ERROR", message: error.message });
    } finally {
        if (client) client.release();
    }
});

export const telebirrNotify = asyncHandler(async (req, res) => {
    const client = await pool.connect();
    const walkin = false;
    try {
        const {
            sign,
            sign_type,
            trade_status,
            merch_order_id,
            payment_order_id,
            total_amount
        } = req.body;

        // Note: Signature verification could be added here similar to standard telebirr controller

        if (trade_status === "Completed") {
            await client.query("BEGIN");
            await processSuccessfulEventPayment(merch_order_id, payment_order_id, client);
            await client.query("COMMIT");
            return res.status(200).json({ success: true, message: "Booking confirmed" });
        } else if (trade_status === "Failure") {
            await client.query(
                `UPDATE pending_payments SET status = 'FAILED', notify_received = true WHERE merch_order_id = $1`,
                [merch_order_id]
            );
        }

        res.status(200).json({ message: "SUCCESS" });

    } catch (err) {
        if (client) await client.query("ROLLBACK");
        console.error("Notify error:", err);
        res.status(500).send("ERROR");
    } finally {
        client.release();
    }
});





