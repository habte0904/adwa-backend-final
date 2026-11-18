import express from "express";
import { registerVisitor, getAllVisitors, getVisitorById, updateVisitor,deleteVisitor } from "../controllers/visitorController.js";
import { addVisitorValidator } from "../validators/addUserValidator.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { updateVisitorValidator } from "../validators/addUserValidator.js";

const router = express.Router();

router.route("/register").post(addVisitorValidator, validateRequest, registerVisitor);
router.route("/").get(getAllVisitors);
router.route("/:id").get(getVisitorById).put(updateVisitorValidator, validateRequest, updateVisitor).delete(deleteVisitor);

export default router;
