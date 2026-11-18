import express from 'express';
import { getServiceReportDashboard } from '../controllers/serviceReportDashboard.controller.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js";    

const router = express.Router();
// GET /api/service-report-dashboard
router.get('/', authenticateToken,authorizePermissions(["SVC_REPORT"]), getServiceReportDashboard);

export default router;
