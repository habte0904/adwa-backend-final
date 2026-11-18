// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/auth.util.js';

export const authenticateToken=(req, res, next)=> {
  
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
     
      return res.sendStatus(401); // token invalid
    }
    req.user = user;
    next();
  });
}


export function authMiddleware(req, res, next) {
  
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

     const token = authHeader.split(" ")[1];
    try {
         jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
          if (err) {
            return res.sendStatus(401); // token invalid
          }
          req.user = user;
          
          next();
        });
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export const requireAuth = (req, res, next) => {
  try {
    //console.log("req",req)
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });
    //console.log("token",token)
    const decoded = verifyAccessToken(token);
    
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Optional example for role-based routes
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};


