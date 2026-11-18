import pool from "../../config/db.config.js";
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { format } from "date-fns";
dotenv.config();
const CHAPA_URL = process.env.CHAPA_URL;
const CHAPA_AUTH = process.env.CHAPA_AUTH;
const CALLBACK_URL = `${process.env.BACKEND_URL_PROD}/verify-payment/service-request/pay`;
const RETURN_URL = `${process.env.FRONTEND_URL_PROD}/serviceConfirmation`;
const config = {
  headers: {
    Authorization: `Bearer ${CHAPA_AUTH}`
  }
};
// Calculate total payment
export const calculateTotalPayment = async (request_id) => {
  const sql = `
     WITH timeslot_minutes AS (
      SELECT 
          rd.request_id,
          SUM(EXTRACT(EPOCH FROM (rt.end_time - rt.start_time)) / 60) AS minutes
      FROM request_dates rd
      JOIN request_timeslot rt ON rd.id = rt.request_date_id
      GROUP BY rd.request_id, rd.date
    ),
    full_day_minutes AS (
      SELECT 
          rd.request_id,
          24 * 60 AS minutes
      FROM request_dates rd
      LEFT JOIN request_timeslot rt ON rd.id = rt.request_date_id
      WHERE rt.id IS NULL
    ),
    all_minutes AS (
      SELECT * FROM timeslot_minutes
      UNION ALL
      SELECT * FROM full_day_minutes
    )
    SELECT 
        sr.id AS request_id,
        sf.price,
        sf.currency,
        COALESCE(SUM(a.minutes), 0) AS total_minutes,
        COALESCE(SUM(a.minutes), 0) * sf.price AS total_price
    FROM service_requests sr
    JOIN service_facility sf
        ON sf.category_id = (SELECT sc.id FROM service_category sc WHERE sc.category = sr.category)
      AND sf.venue_id = (SELECT v.venue_id FROM venue_schedule v WHERE v.venue = sr.venue)
    LEFT JOIN all_minutes a ON sr.id = a.request_id
    WHERE sr.id = $1 and sf.is_deleted = false
    GROUP BY sr.id, sf.price, sf.currency;
  `;
  const result = await pool.query(sql, [request_id]);
  if (result.rowCount === 0) {
    throw new Error(`Invalid request_id: ${request_id}`);
  }
  const data = result.rows[0];
  return {
    request_id: data.request_id,
    price_per_minute: data.price,
    total_minutes: data.total_minutes,
    total_price: data.total_price,
    currency: data.currency
  };
};
// Generate unique tx_ref
const generateUniqueTxRef = async () => {
  while (true) {
    const txRef = `tx-adwamuseum-${crypto.randomUUID()}`;
    const exists = await pool.query(
      'SELECT 1 FROM service_requests WHERE tx_ref = $1',
      [txRef]
    );
    if (exists.rowCount === 0) return txRef;
  }
};
// Validate service request
export const validateServiceRequest = async (req, res) => {
  const { request_id } = req.params;
  try {
    const querySqlVal = `
    SELECT id, email, status, approved_at
      FROM service_requests
      WHERE id = $1 AND status = 'approved' AND email = $2 AND paid = false
    `;
    const queryValRes = await pool.query(querySqlVal, [request_id, req.user.email]);
    if (queryValRes.rowCount === 0) {
      return res.status(404).json({
        error: "No approved service request found with the provided ID for this user"
      });
    }
    const request = queryValRes.rows[0];
    await initiatePayment(request_id, req.user.email, res);
    return;
  } catch (err) {
    console.error("error svcReqController", err);
    return res.status(500).json({ error: "Server error" });
  }
};
// Initiate payment
export const initiatePayment = async (id, email, res) => {
  try {
    const paymentDetail = await calculateTotalPayment(id);
    const tx_ref = await generateUniqueTxRef();
    // Insert pending record
    await pool.query(
      `INSERT INTO pending_table_service (request_id, email, tx_ref, amount, currency) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, email, tx_ref, paymentDetail.total_price, paymentDetail.currency]
    );
    const paymentPayload = {
      amount: paymentDetail.total_price,
      currency: paymentDetail.currency,
      email,
      tx_ref,
      callback_url: `${CALLBACK_URL}/${id}/${tx_ref}`,
      return_url: `${RETURN_URL}/${tx_ref}`,


    };
    const chapaRes = await axios.post(CHAPA_URL, paymentPayload, config);
    const checkoutUrl = chapaRes.data.data.checkout_url;
    return res.status(200).json({ checkout_url: checkoutUrl, tx_ref });
  } catch (err) {
    console.error("Chapa Init Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment initiation failed." });
  }
};
// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { id, tx_ref } = req.params;
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      config
    );
    const status = response.data.data.status;
    if (status !== "success") {
      return res.status(400).json({ error: "Payment not successful." });
    }
    // Check pending table
    const pending = await pool.query(
      `SELECT * FROM pending_table_service WHERE request_id = $1 AND tx_ref = $2`,
      [id, tx_ref]
    );
    if (pending.rowCount === 0) {
      return res.status(404).json({ error: "No matching pending payment found" });
    }
    const amount = pending.rows[0].amount;
    // Update service request to paid
    await pool.query(
      `UPDATE service_requests SET paid = true,tx_ref=$1 WHERE id = $2`,
      [tx_ref, id]
    );
    // Delete pending record
    await pool.query(
      `DELETE FROM pending_table_service WHERE tx_ref = $1`,
      [tx_ref]
    );

    res.status(200).json({ message: "Payment verified successfully!", tx_ref });
  } catch (err) {
    console.error("Verification Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment verification failed." });
  }
};
// Success route
export const successPayment = (req, res) => {
  const { tx_ref } = req.params;
  res.status(200).json({ message: "Payment successful!", tx_ref });
};
// Verify payment by tx_ref only (useful when user is redirected to frontend return_url)
export const verifyPaymentByTxRef = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    // Find pending record with this tx_ref
    const pendingRes = await pool.query(`SELECT * FROM pending_table_service WHERE tx_ref = $1`, [tx_ref]);
    if (pendingRes.rowCount === 0) {
      return res.status(404).json({ error: "No matching pending payment found" });
    }
    const pending = pendingRes.rows[0];
    const request_id = pending.request_id;
    // Verify with Chapa
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, config);
    const status = response.data?.data?.status;
    if (status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful.' });
    }
    // Update service_request to paid
    await pool.query(`UPDATE service_requests SET paid = true, tx_ref = $1 WHERE id = $2`, [tx_ref, request_id]);
    // Remove pending record
    await pool.query(`DELETE FROM pending_table_service WHERE tx_ref = $1`, [tx_ref]);
    return res.status(200).json({ message: 'Payment verified successfully', tx_ref });
  } catch (err) {
    console.error('verifyPaymentByTxRef error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Payment verification failed.' });
  }
};
