// authRoute.js
import { Router } from "express"
import dotenv from "dotenv"
import { login, logout, refresh, verify2FA, resend2FA } from "../controllers/authController.js"
import { authenticateToken } from '../middlewares/authMiddleware.js'

dotenv.config()
const authRoute = Router()

// LOGIN
authRoute.post('/login', login);

// 2FA VERIFICATION
authRoute.post('/verify-2fa', verify2FA);

// RESEND 2FA CODE
authRoute.post('/resend-2fa', resend2FA);

// REFRESH TOKEN
authRoute.post('/refresh', refresh);

// LOGOUT
authRoute.post('/logout',  logout);

export default authRoute;
