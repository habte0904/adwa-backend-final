

import express from "express"
import helmet from "helmet"

import dotenv from "dotenv"
import employeeRouter from "./routes/employeeRoute.js";
import errorHandler from "./middlewares/errorHandler.js";
import visitorRouter from "./routes/visitorRoute.js";
import { staffRoute } from "./routes/staffRoute.js"
import roleRoute from "./routes/rolemngRoute.js"
import cors from "cors"
import authRoute from "./routes/authRoute.js";
import navRouter from "./routes/navigationRoute.js";
import logRouter from "./routes/activityLog.routes.js";
import ticketRouter from "./routes/ticket.routes.js";
import chapaRouter from "./routes/chapaRoute.js";
//import ticketPurchaseRouter from "./routes/ticketPurchase.route.js";
import ticketScheduler from "./routes/scheduleRoute.js";
import ticketPurchaseRoutes from './routes/ticketPurchase.route.js';
import ticketRouterUsr from "./routes/ticket.routesusr.js"

import bookingRouter from "./routes/booking.routes.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import venueRouter from "./routes/venueRoute.js";
import departmentRouter from "./routes/departmentRoute.js";
import eventTicketRouter from "./routes/eventCRUDRoute.js"
import eventRoutes from './routes/event.routes.js';
import eventTicketTypeRoutes from './routes/eventTicketType.routes.js';
import evtTicketRouter from './routes/eventTicketRoutes.js'
import eventPurchaseRouter from './routes/EventTicketPurchase.routes.js'
import empProfileRouter from './routes/employeeProfile.routes.js'
import contentManagementRoutes from "./routes/contentManagement.routes.js";
import contactRoute from "./routes/contactRoute.js"
import serviceRequest from "./routes/serviceRequestRoute.js"
import serviceFacilityRoutes from "./routes/serviceFacilityRoutes.js";
import eventCategoryRoutes from "./routes/eventCategory.routes.js";
import serviceCategoryRoutes from "./routes/serviceCategory.routes.js";
import serviceReportDashboardRouter from "./routes/serviceReportDashboard.routes.js";
import uploadRoutes from "./routes/upload.routes.js"
import advertisementRoutes from "./routes/ads.routes.js"
import groupDiscountRouter from './routes/groupDiscount.routes.js'
import userServiceFetch from "./routes/userServiceFetch.js"
import svcReqUserRouter from "./routes/serviceRequestUser/svcReqRoute.js"
import priceQuoteRouter from "./routes/priceQuote.routes.js"
import visitorFetchRoutes from "./routes/visitorFetch.routes.js"
import cookieParser from 'cookie-parser';
import visitorFeedbackRoutes from './routes/visitorfeedbackRoutes.js';
import kioskSurveyRoute from "./routes/kioskSurveyRoute.js";
import adminFeedbackRoutes from "./routes/adminFeedbackRoutes.js"
import feedbackRoute from "./routes/feedbackRoute.js"
import publicNews from "./routes/news.route.js"
import adminNews from "./routes/admin.news.routes.js"
import telebirrRoute from "./routes/telebirrRoute.js";
import { initJobs } from "./jobs/index.js";
import eventTeleRoute from "./routes/eventTeleRoute.js";

dotenv.config()
const app = express()

// Initialize background jobs
initJobs();
const PORT = process.env.PORT || 5000


const allowedOrigins = ["https://adwavictorymemorial.gov.et"];


// ── Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'"],
        styleSrc:       ["'self'", "'unsafe-inline'"],
        imgSrc:         ["'self'", "data:", "blob:"],
        connectSrc:     ["'self'"],
        fontSrc:        ["'self'", "data:"],
        objectSrc:      ["'none'"],
        frameAncestors: ["'none'"],       // prevents clickjacking
        baseUri:        ["'self'"],
        formAction:     ["'self'"],
      },
    },
    // Keep false: /uploads serves images to cross-origin React apps
    crossOriginEmbedderPolicy: false,
    // Allow the admin/frontend SPAs to be loaded from other local ports in dev
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // allow non-browser tools (e.g., Postman)
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // 👈 explicitly echo origin
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

//app.use("/uploads", express.static("uploads"));
app.use("/api/uploads", express.static("uploads"));

//app.use(cors())
app.use(cookieParser());
app.use(express.json())
app.use("/api", authRoute)
app.use("/api", employeeRouter);
app.use("/api/visitor", visitorRouter);
app.use("/api/staff", staffRoute)
app.use("/api", roleRoute)
app.use("/api", navRouter)
app.use("/api/activity-logs", logRouter);
app.use("/api", ticketRouter);
app.use("/api/chapa", chapaRouter);
app.use("/api", ticketScheduler)
app.use('/api', ticketPurchaseRoutes);
app.use("/api", ticketRouterUsr)

app.use("/api", bookingRouter)
app.use("/api/public", authRouter)
app.use("/api", userRouter)
app.use("/api", venueRouter);
app.use("/api", departmentRouter)
app.use("/api", eventTicketRouter);
app.use('/api/events', eventRoutes);
app.use('/api/event-ticket-types', eventTicketTypeRoutes);
app.use("/api", evtTicketRouter)
app.use("/api", eventPurchaseRouter)
app.use("/api/employee", empProfileRouter)
app.use("/api/content-management", contentManagementRoutes);
app.use("/api", contactRoute)
app.use("/api", serviceRequest);
app.use("/api", serviceFacilityRoutes);
app.use("/api", eventCategoryRoutes);
app.use("/api", serviceCategoryRoutes);
app.use("/api/service-report-dashboard", serviceReportDashboardRouter);
app.use("/api", uploadRoutes);
app.use("/api", advertisementRoutes);
app.use('/api/group-discounts', groupDiscountRouter)
app.use("/api", userServiceFetch);
app.use("/api", svcReqUserRouter);
app.use("/api", priceQuoteRouter)
app.use("/api", visitorFetchRoutes)
app.use('/api', kioskSurveyRoute);
app.use('/api', visitorFeedbackRoutes);
app.use("/api", adminFeedbackRoutes)
app.use("/api/feedback", feedbackRoute)
app.use("/api", publicNews)
app.use("/api", adminNews)
app.use("/api", telebirrRoute);
app.use("/api", eventTeleRoute);
//app.use(ticketPurchaseRouter);

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
