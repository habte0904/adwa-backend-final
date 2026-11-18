import express from "express";
import { addVenue,getAllVenue,getSpecificVenue,updateVenue,deleteVenue, getAllVenueEvent } from "../controllers/venueController.js";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 

const venueRouter = express.Router();


venueRouter.route("/admin/venue").get(authenticateToken,authorizePermissions(["VENUE_MGMT"]),getAllVenue).post(authenticateToken,authorizePermissions(["VENUE_MGMT"]),addVenue);
venueRouter.route("/admin/venue/service-category").get(authenticateToken,authorizePermissions(["VENUE_MGMT"]),getAllVenueEvent)
venueRouter.route("/admin/venue/:venue_id").put(authenticateToken,authorizePermissions(["VENUE_MGMT"]),updateVenue).delete(authenticateToken,authorizePermissions(["VENUE_MGMT"]),deleteVenue);
venueRouter.route("/admin/venue/:venue").get(authenticateToken,authorizePermissions(["VENUE_MGMT"]),getSpecificVenue);

export default venueRouter;