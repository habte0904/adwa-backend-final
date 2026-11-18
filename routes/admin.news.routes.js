import express from "express"
import {createNews, updateNews, deleteNews, deleteComment} from "../controllers/news.controller.js"
const router = express.Router();
import multer from "multer";
import path from "path";
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/service-letters/");
  },
  filename: function (req, file, cb) {
    // Use original name or add extension to random name
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Admin news routes

router.post('/admin/news',authenticateToken,authorizePermissions(["NEWS"]), upload.single("image"), createNews);
router.put('/admin/news/:id',authenticateToken,authorizePermissions(["NEWS"]), upload.single("image"), updateNews);
router.delete('/admin/news/:id',authenticateToken,authorizePermissions(["NEWS"]), deleteNews);
router.delete('/admin/comment/:id', authenticateToken,authorizePermissions(["NEWS"]), deleteComment);


export default router;