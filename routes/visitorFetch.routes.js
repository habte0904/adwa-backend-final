import express from "express";
import { fetchVisitors } from "../controllers/visitorFetch.controller.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const router = express.Router();

router.route("/visitors-fetch").get(authenticateToken,authorizePermissions(["VISITOR"]), fetchVisitors);


export default router;


