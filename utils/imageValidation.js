import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp"; // for HEIC/HEIF conversion
import dotenv from 'dotenv';
dotenv.config();

// Allowed safe extensions to prevent polyglot issues (preventing .svg, .html, etc.)
const SAFE_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".ico", ".heic", ".heif", ".avif",
  ".mp4", ".mpeg", ".ogg", ".webm", ".mov", ".avi", ".wmv", ".flv", ".3gp", ".3g2", ".mkv",
  ".pdf", ".doc", ".docx", ".rtf", ".txt"
];

// Media validation function (supports both images and videos)
export const validateMediaFile = async (file) => {
  if (!file) return false;

  const allowedMimeTypes = [
    // Image types (SVG removed to prevent polyglot XSS)
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "image/bmp", "image/tiff", "image/x-icon", "image/heic", "image/heif", "image/avif",
    
    // Video types
    "video/mp4", "video/mpeg", "video/ogg", "video/webm", "video/quicktime",
    "video/x-msvideo", "video/x-ms-wmv", "video/x-flv", "video/3gpp", "video/3gpp2",
    "video/x-matroska"
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!SAFE_EXTENSIONS.includes(ext)) {
    fs.unlinkSync(file.path);
    return false;
  }

  // Initial check for mimetype
  if (!allowedMimeTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return false;
  }

  // For other files (images and videos), verify binary signature
  const fileBuffer = fs.readFileSync(file.path);
  const fileType = await fileTypeFromBuffer(fileBuffer);

  if (file.mimetype.startsWith("video/")) {
  // If it's a video, trust mimetype more than file-type (since detection is limited for videos)
  if (fileType && !fileType.mime.startsWith("video/")) {
    fs.unlinkSync(file.path);
    return false;
  }
} else {
  // For images/documents keep strict check
  if (!fileType || fileType.mime !== file.mimetype) {
    fs.unlinkSync(file.path);
    return false;
  }
}


  // Return relative path (you can change this to include BASEURL if needed)
  return `${file.path.replace(/\\/g, "/")}`;
};

// Optional: Separate functions if you need to distinguish between image and video validation
export const validateImageFile = async (file) => {
  if (!file) return false;
  
  const imageMimeTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "image/bmp", "image/tiff", "image/x-icon", "image/heic", "image/heif", "image/avif",
  ];
  
  if (!imageMimeTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return false;
  }
  
  return validateMediaFile(file);
};

export const validateVideoFile = async (file) => {
  if (!file) return false;
  
  const videoMimeTypes = [
    "video/mp4", "video/mpeg", "video/ogg", "video/webm", "video/quicktime",
    "video/x-msvideo", "video/x-ms-wmv", "video/x-flv", "video/3gpp", "video/3gpp2",
    "video/x-matroska"
  ];
  
  if (!videoMimeTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return false;
  }
  
  return validateMediaFile(file);
};

// New method: Validate Word documents, PDFs, and Images
export const validateDocumentImageFile = async (file) => {
  if (!file) return false;

  const allowedMimeTypes = [
    // Images (SVG removed to prevent polyglot XSS)
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "image/bmp", "image/tiff", "image/x-icon", "image/heic", "image/heif", "image/avif",

    // PDF
    "application/pdf",

    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word.document.macroEnabled.12",
    "application/vnd.ms-word.template.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",

    // RTF
    "application/rtf",

    // Plain text
    "text/plain",

    // Fallback
    "application/octet-stream"
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  // Block malicious extensions
  if (!SAFE_EXTENSIONS.includes(ext)) {
    fs.unlinkSync(file.path);
    return false;
  }

  // Check if mimetype is allowed
  if (!allowedMimeTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return false;
  }


  // Check file signature
  const fileBuffer = fs.readFileSync(file.path);
  const fileType = await fileTypeFromBuffer(fileBuffer);

  if (!fileType) {
    fs.unlinkSync(file.path);
    return false;
  }

  // Validate by category
  if (file.mimetype.startsWith("image/") || fileType.mime.startsWith("image/")) {
    // Relaxed check: only ensure it's some valid image
    if (!fileType.mime.startsWith("image/")) {
      fs.unlinkSync(file.path);
      return false;
    }

    // Auto-convert HEIC/HEIF → JPEG for compatibility
   if (fileType.mime === "image/heic" || fileType.mime === "image/heif") {
  try {
    const jpegPath = file.path.replace(/\.[^/.]+$/, ".jpg");
    await sharp(fileBuffer).jpeg({ quality: 90 }).toFile(jpegPath);
    fs.unlinkSync(file.path);
    return `${jpegPath.replace(/\\/g, "/")}`;
  } catch (err) {
    console.error("HEIC conversion failed:", err);
    fs.unlinkSync(file.path);
    return false;
  }
}

  } else if (file.mimetype === "application/pdf") {
    if (fileType.mime !== "application/pdf") {
      fs.unlinkSync(file.path);
      return false;
    }
  } else if (file.mimetype.includes("word") || file.mimetype === "application/rtf") {
    const allowedWordSignatures = [
      "d0cf11e0a1b11ae1", // DOC, PPT, XLS (CFBF)
      "504b0304" // DOCX (ZIP)
    ];
    const fileSignature = fileBuffer.toString("hex", 0, 4);
    if (!allowedWordSignatures.includes(fileSignature)) {
      fs.unlinkSync(file.path);
      return false;
    }
  } else if (file.mimetype === "text/plain" || file.mimetype === "application/octet-stream") {
    if (!fileType.mime.startsWith("text/") && fileType.mime !== "application/octet-stream") {
      fs.unlinkSync(file.path);
      return false;
    }
  }

  // Success → return safe path
  return `${file.path.replace(/\\/g, "/")}`;
};

// Individual validation functions for specific types
export const validateWordDocument = async (file) => {
  if (!file) return false;
  
  const wordMimeTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word.document.macroEnabled.12",
    "application/vnd.ms-word.template.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "application/rtf"
  ];
  
  if (!wordMimeTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return false;
  }
  
  return validateDocumentImageFile(file);
};

export const validatePdfDocument = async (file) => {
  if (!file) return false;
  
  if (file.mimetype !== "application/pdf") {
    fs.unlinkSync(file.path);
    return false;
  }
  
  return validateDocumentImageFile(file);
};

// Utility function to get file type category
export const getFileTypeCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType === 'application/rtf') return 'word';
  if (mimeType === 'text/plain') return 'text';
  return 'unknown';
};
