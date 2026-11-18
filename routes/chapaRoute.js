// routes/chapaRoute.js
import express from 'express';
import { initiatePayment, verifyPayment, successPayment, processDirectWalkInPayment, getOperatorAudit, getEventOperatorAudit } from '../controllers/chapaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const chapaRouter = express.Router();

chapaRouter.post('/pay', authenticateToken, initiatePayment);
chapaRouter.post('/pay-direct', authenticateToken, processDirectWalkInPayment);
chapaRouter.get('/verify-payment/:id', verifyPayment);
chapaRouter.get('/payment-success', successPayment);
chapaRouter.get('/operator-audit', authenticateToken, getOperatorAudit);
chapaRouter.get('/event-operator-audit', authenticateToken, getEventOperatorAudit);

export default chapaRouter;
