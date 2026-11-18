import Router from "express";

import { initiatePayment, telebirrNotify, checkEventPaymentStatus } from "../controllers/eventTeleController.js";

const router = Router();

router.post("/event/initiate/telebirr", initiatePayment);
router.get("/event/status/telebirr/:merch_order_id", checkEventPaymentStatus);



/**
 * Payment Notification Callback
 * POST /api/payment/notify
 * This is where TeleBirr will send payment status updates
 */
router.post("/event/telebirr/notify", telebirrNotify);
export default router;
