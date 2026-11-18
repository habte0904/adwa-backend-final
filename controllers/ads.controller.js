import * as adsService from "../services/ads.service.js";
import { logActivity } from "../services/activityLog.service.js";

// --- helper functions for validation ---
function isValidImageUrl(url) {
  if (typeof url !== "string") return false;
  try {
    // Basic URL validation
    new URL(url, "http://dummy-base");
    // Restrict extensions to images
    return /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(url);
  } catch {
    return false;
  }
}

function normalizeAndValidateAnimation(animation) {
  if (!animation) return { images: [] };

  // Parse JSON if it came as a string
  if (typeof animation === "string") {
    try {
      animation = JSON.parse(animation);
    } catch {
      throw new Error("Invalid animation JSON format");
    }
  }

  if (typeof animation !== "object") {
    throw new Error("Animation must be an object");
  }

  let images = animation.images;
  if (!Array.isArray(images)) {
    images = images ? [images] : [];
  }

  // Validate images
  images = images.filter((img) => isValidImageUrl(img));
  if (images.length === 0 && animation.images?.length > 0) {
    throw new Error("Invalid images provided in animation");
  }

  return {
    ...animation,
    images,
  };
}

// --- controller methods ---
export async function getAllAds(req, res) {
  const ads = await adsService.getAll();
  res.json(ads);
}

export async function getAdById(req, res) {
  const ad = await adsService.getById(req.params.id);
  if (!ad) return res.status(404).json({ error: "Not found" });
  res.json(ad);
}

export async function createAd(req, res) {
  try {
    const payload = { ...req.body };

    // Validate animation
    payload.animation = normalizeAndValidateAnimation(payload.animation);

    // Validate main image if provided
    if (payload.image && !isValidImageUrl(payload.image)) {
      return res.status(400).json({ error: "Invalid main image format" });
    }

    const newAd = await adsService.create(payload);

    // Audit log
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || "Unknown";
      const role = req.user?.roleName || "Unknown";
      const department = req.user?.department || "Unknown";
      const action = "Create Ad";
      const details = JSON.stringify({ payload });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) {
      console.error("Activity log error:", e);
    }

    res.status(201).json(newAd);
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
}

export async function updateAd(req, res) {
  try {
    const payload = { ...req.body };

    // Validate animation
    payload.animation = normalizeAndValidateAnimation(payload.animation);

    // Validate main image if provided
    if (payload.image && !isValidImageUrl(payload.image)) {
      return res.status(400).json({ error: "Invalid main image format" });
    }

    const updated = await adsService.update(req.params.id, payload);

    // Audit log
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || "Unknown";
      const role = req.user?.roleName || "Unknown";
      const department = req.user?.department || "Unknown";
      const action = "Update Ad";
      const details = JSON.stringify({ id: req.params.id, payload });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) {
      console.error("Activity log error:", e);
    }

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
}

export async function deleteAd(req, res) {
  const id = req.params.id;
  let deleted = false;

  try {
    if (typeof adsService.delete === "function") {
      deleted = await adsService.delete(id);
    } else if (typeof adsService.deleteAd === "function") {
      deleted = await adsService.deleteAd(id);
    } else if (typeof adsService.deleteAdvertisement === "function") {
      deleted = await adsService.deleteAdvertisement(id);
    } else {
      deleted = await adsService.deleteAd?.(id);
    }
  } catch (err) {
    console.error("Error deleting ad:", err);
    return res.status(500).json({ error: "Delete failed" });
  }

  // Audit log
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || "Unknown";
    const role = req.user?.roleName || "Unknown";
    const department = req.user?.department || "Unknown";
    const action = "Delete Ad";
    const details = JSON.stringify({ id });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) {
    console.error("Activity log error:", e);
  }

  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
}
