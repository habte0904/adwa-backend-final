import {Router} from "express"
import { handleDashboard,sendLogs } from "../controllers/staffController.js"
const staffRoute =Router()

staffRoute.get("/user/dashboard",handleDashboard)
staffRoute.get("/logs",sendLogs)
staffRoute.get("/logs/:user",sendLogs)
export {staffRoute}
