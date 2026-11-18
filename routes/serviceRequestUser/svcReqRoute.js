import express from "express"
import { Router } from "express"
import { validateServiceRequest,verifyPayment,successPayment } from "../../controllers/serviceRequestUser/svcReqController.js";
import { requireAuth} from "../../middlewares/authMiddleware.js"
const route= express.Router();

route.post('/service-request/validate/:request_id', requireAuth, validateServiceRequest)
route.get('/verify-payment/service-request/pay/:id/:tx_ref',  verifyPayment);
route.get('/service-request/payment-success/:tx_ref',  successPayment);

export default route;