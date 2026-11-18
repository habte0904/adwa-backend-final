import Router from "express";

import { initiatePayment, telebirrNotify, checkPaymentStatus } from "../controllers/telebirrController.js";

const router = Router();

router.post("/initiate/telebirr", initiatePayment);
router.get("/status/telebirr/:merch_order_id", checkPaymentStatus);



/**
 * Payment Notification Callback
 * POST /api/payment/notify
 * This is where TeleBirr will send payment status updates
 */
router.post("/telebirr/notify", telebirrNotify);
export default router;
