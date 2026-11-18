// utils/activityLogger.js
import { logActivity } from '../services/activityLog.service.js';

export const activityLogger = (req, {
  action,
  details = {}
}) => {
  try {
    // Get common user info
    
    const user = req.user || {};
    const userId = user.id || 'UNKNOWN';
    const userName = user.username || 'Unknown';
    const role = user.roleName || 'Unknown';
    const department = user.department || 'Unknown';
   console.log()
    // Ensure details is stringified for storage
    const detailsString = typeof details === 'string'
      ? details
      : JSON.stringify(details);

    logActivity({
      userId,
      userName,
      role,
      department,
      action,
      details: detailsString
    });
  } catch (err) {
    console.error("Activity logging failed:", err);
  }
};
