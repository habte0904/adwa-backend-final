import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadFolder = path.join(__dirname, "../uploads/ads")

// ensure folder exists synchronously at module load
try {
  fs.mkdirSync(uploadFolder, { recursive: true })
} catch (err) {
  console.error("Failed to create upload folder", uploadFolder, err)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`
    cb(null, safeName)
  },
})
const upload = multer({ storage })

// POST /api/upload/ad-image
router.post("/upload/ad-image", upload.single("file"), (req, res) => {
  console.log("UPLOAD ROUTE: req.file =", req.file)
  if (!req.file) return res.status(400).json({ error: "No file uploaded" })
  const url = `/uploads/ads/${req.file.filename}`
  console.log("UPLOAD ROUTE: returning url", url)
  res.json({ url })
})

export default router