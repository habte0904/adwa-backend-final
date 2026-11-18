import express from 'express';
import {format} from "date-fns"
import { getActivityLogs,logActivity } from '../services/activityLog.service.js';
import {authenticateToken} from "../middlewares/authMiddleware.js";
import {authorizePermissions} from "../middlewares/authorizePermissions.js"; 
const logRouter = express.Router();

// GET /api/activity-logs?limit=50

// GET /api/activity-logs?limit=50
logRouter.get('/', authenticateToken, authorizePermissions(['ACTIVITY_LOGS']),(req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const logs = getActivityLogs({ limit });
  res.json(logs);
});

// POST /api/activity-logs/export
// { username, date, action } in body
logRouter.post('/export', authenticateToken, authorizePermissions(['ACTIVITY_LOGS']),(req, res) => {
  const { username, date, action } = req.body;
  // Get all logs (no limit)
  const logs = getActivityLogs({ limit: 100000 });
  const filtered = logs.filter(log => {
    let match = true;
    if (username && log.userName && !log.userName.toLowerCase().includes(username.toLowerCase())) match = false;
    if (date && log.timestamp && !log.timestamp.startsWith(date)) match = false;
    if (action && log.action && !log.action.toLowerCase().includes(action.toLowerCase())) match = false;
    return match;
  });

  if (!filtered.length) {
    return res.json({ csv: null, message: 'No data for this request.' });
  }

  // Format date/time and build CSV with numbering and spacing
  const headers = ['No.', 'Date', 'Time', 'User Name', 'Role', 'Department', 'Action', 'Details'];
  const rows = filtered.map((log, idx) => {
    const d = new Date(log.timestamp);
    const dateStr = format(d, 'yyyy-MM-dd');
    const timeStr = format(d, 'hh:mm:ss a');
    return [
      (idx + 1).toString().padStart(3),
      dateStr,
      timeStr,
      log.userName || '',
      log.role || '',
      log.department || '',
      log.action || '',
      typeof log.details === 'string' ? log.details.replace(/\r?\n/g, ' ') : JSON.stringify(log.details)
    ];
  });

  // Table-like CSV: add spacing between columns
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ? r[i].length : 0)))
  );
  const pad = (str, len) => (str + ' '.repeat(len)).slice(0, len);
  const csvLines = [
    headers.map((h, i) => pad(h, colWidths[i])).join(' | '),
    '-'.repeat(colWidths.reduce((a, b) => a + b + 3, -3)),
    ...rows.map(row => row.map((cell, i) => pad(cell, colWidths[i])).join(' | '))
  ];
  const csv = csvLines.join('\n');
  res.json({ csv });
});


logRouter.post('/', authenticateToken, authorizePermissions(['ACTIVITY_LOGS']),(req, res) => {
  const logEntry = req.body;
  
  logActivity(logEntry);
  res.status(201).json({ success: true });
});

export default logRouter;
