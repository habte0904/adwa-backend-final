import {Router} from "express"
import {addRole, getRoles,updateRole,deleteRole} from "../controllers/roleController.js"
import {authenticateToken} from "../middlewares/authMiddleware.js"
import {authorizePermissions} from "../middlewares/authorizePermissions.js"
const roleRoute=Router()

roleRoute.post("/addRole",authenticateToken,authorizePermissions(["ROLE_MGMT"]),addRole)

roleRoute.get("/getRoles",authenticateToken,authorizePermissions(["ROLE_MGMT","STAFF_MGMT","ACTIVITY_LOGS"]),getRoles)
roleRoute.put("/updateRole/:id",authenticateToken,authorizePermissions(["ROLE_MGMT"]), updateRole)
roleRoute.delete("/deleteRole/:id", authenticateToken,authorizePermissions(["ROLE_MGMT"]),deleteRole)

export default roleRoute