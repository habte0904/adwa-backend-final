
import express from "express";
import { getRoleNavigationByUserId } from "../controllers/navigationController.js";

const navRouter = express.Router();

navRouter.get("/navigation/:user_id", getRoleNavigationByUserId);

export default navRouter;
