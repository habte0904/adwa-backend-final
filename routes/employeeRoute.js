import express from "express";
import { addUser, getUserById, getAllUsers, deleteUser, updateUser, resetUser, changePassword } from "../controllers/employeeController.js";
import { addUserValidator } from "../validators/addUserValidator.js";
import { updateUserValidator } from "../validators/addUserValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js";    
const router = express.Router();

router.route("/admin/users").get(authenticateToken,authorizePermissions(["STAFF_MGMT","ACTIVITY_LOGS"]),getAllUsers).post(authenticateToken,authorizePermissions(["STAFF_MGMT"]),addUserValidator, validateRequest, addUser);
router.route("/admin/users/:id").get(authenticateToken,authorizePermissions(["STAFF_MGMT",]),getUserById).delete(authenticateToken,authorizePermissions(["STAFF_MGMT"]),deleteUser).put(authenticateToken,authorizePermissions(["STAFF_MGMT"]),updateUserValidator, validateRequest, updateUser);
router.route("/admin/users/reset/:id").put(authenticateToken,authorizePermissions(["STAFF_MGMT"]),resetUser);
router.route("/user/change-password/:id").put(authenticateToken,authorizePermissions(["STAFF_MGMT"]),changePassword);


export default router;

