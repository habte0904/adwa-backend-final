import express from 'express';
import { addUnavailableDateTime, updateSlot, getUnavailableDateTime, deleteUnavailableDateTime, deleteUnavailableTimeSlot, updateUnavailableDateTime, insertTimeslots } from '../controllers/scheduleController.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

router.route('/admin/schedule/:venue_id').post(authenticateToken,authorizePermissions(["TSCHED_MGMT", "EVT_SCHED"]),addUnavailableDateTime);
router.route('/admin/schedule/:venue_id').get(getUnavailableDateTime);
router.route('/admin/schedule/:id').delete(authenticateToken,authorizePermissions(["TSCHED_MGMT", "EVT_SCHED"]),deleteUnavailableDateTime);
router.route('/admin/schedule/time-slot/:id').delete(authenticateToken,authorizePermissions(["TSCHED_MGMT", "EVT_SCHED"]),deleteUnavailableTimeSlot);
router.route('/admin/schedule/:id').put(authenticateToken,authorizePermissions(["TSCHED_MGMT", "EVT_SCHED"]),updateUnavailableDateTime);
router.route('/admin/schedule/timeslot/:id').post(authenticateToken,authorizePermissions(["TSCHED_MGMT", "EVT_SCHED"]),insertTimeslots).put(authenticateToken,authorizePermissions(["TSCHED_MGMT", "EVT_SCHED"]),updateSlot);

export default router;
