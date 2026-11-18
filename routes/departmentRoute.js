import express from "express"
import { addDepartment,updateDepartment,getAllDepartment,deleteDepartment } from "../controllers/departmentController.js"
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const departmentRouter = express.Router();

departmentRouter.route("/admin/department").get(authenticateToken,authorizePermissions(["DPT"]),getAllDepartment).post(authenticateToken,authorizePermissions(["DPT"]),addDepartment);
departmentRouter.route("/admin/department/:id").put(authenticateToken,authorizePermissions(["DPT"]),updateDepartment).delete(authenticateToken,authorizePermissions(["DPT"]),deleteDepartment);

export default departmentRouter;