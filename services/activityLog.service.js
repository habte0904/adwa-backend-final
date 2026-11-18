import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Manual __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../data/activity.log');

function readLastLogs(n = 100) {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  return lines
    .slice(-n)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Logs an activity only if the 'details' JSON string is unique (not duplicated).
 * @param {Object} param0
 * @param {number} param0.userId
 * @param {string} param0.userName
 * @param {string} param0.role
 * @param {string} param0.department
 * @param {string} param0.action
 * @param {string} param0.details  (stringified JSON)
 */
function logActivity({ userId, userName, role, department, action, details }) {
  const newEntry = {
    timestamp: new Date().toISOString(),
    userId,
    userName,
    role,
    department,
    action,
    details,
  };
  const recentLogs = readLastLogs(1000);

  // Check if the exact same 'details' already exists
  const isDuplicate = recentLogs.some(log => log.details === details);

  // if (isDuplicate) {
  //   // Duplicate found, ignore logging
  //   return;
  // }

  fs.appendFileSync(LOG_FILE, JSON.stringify(newEntry) + '\n');
}

function getActivityLogs({ limit = 1000 } = {}) {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  return lines.slice(-limit).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean).reverse();
}

export { logActivity, getActivityLogs };




/*
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Manual __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../data/activity.log');

/**
 * Log an activity with user details.
 * @param {Object} param0
 * @param {number} param0.userId
 * @param {string} param0.userName
 * @param {string} param0.role
 * @param {string} param0.department
 * @param {string} param0.action
 * @param {string} param0.details
 */
/*
function logActivity({ userId, userName, role, department, action, details }) {
  const entry = {
    timestamp: new Date().toISOString(),
    userId,
    userName,
    role,
    department,
    action,
    details,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

function getActivityLogs({ limit = 100 } = {}) {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  return lines.slice(-limit).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean).reverse();
}

export { logActivity, getActivityLogs };
*/