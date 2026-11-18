import express from "express"
const router = express.Router();
import * as bookingController from "../controllers/booking.controller.js"
router.get('/booking-confirmation/:chapa_tx_ref', bookingController.getBookingConfirmation);

export default router;
