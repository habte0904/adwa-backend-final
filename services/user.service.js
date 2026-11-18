// user.service.js
import db from '../config/db.config.js'; // This should export a pg Pool instance
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Check if user exists by email
export async function checkIfUserExists(email) {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await db.query(sql, [email]);
  return rows.length > 0;
}

// Send email (plain text + optional html)
export async function sendEmail(to, subject, text, html = null) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EVT_SMTP_USER,
      pass: process.env.EVT_SMTP_PASS
    }
  });

  const mailOptions = {
    from:  `Adwa Victory Memorial ${process.env.EMAIL_USER}`,
    to,
    subject,
    text,
    html
  };

  await transporter.sendMail(mailOptions);
}

// Create employee user with random password
export async function createEmployeeUser(userData) {
  const randomPassword = crypto.randomBytes(6).toString('hex');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(randomPassword, salt);

  // Insert user
  const userSql = `
    INSERT INTO users (name, gender, email, phone, password_hash, role_id, status, created_at)
    VALUES ($1, $2, $3, $4, $5, 2, 'active', NOW())
    RETURNING id
  `;
  const userParams = [
    userData.name,
    userData.gender,
    userData.email,
    userData.phone,
    hashedPassword
  ];
  const userResult = await db.query(userSql, userParams);
  if (!userResult.rows.length) throw new Error('Failed to create user');

  const userId = userResult.rows[0].id;

  // Insert employee details
  const empSql = `
    INSERT INTO employee (user_id, employee_no, position, department)
    VALUES ($1, $2, $3, $4)
  `;
  const empParams = [userId, userData.employee_no, userData.position, userData.department];
  await db.query(empSql, empParams);

  // Send email with password
  await sendEmail(
    userData.email,
    'Your Adwa Victory Memorial Employee Account Password',
    `Hello ${userData.name},\nYour account password is: ${randomPassword}\nPlease login and change it.`,
    `<p>Hello ${userData.name},</p><p>Your account password is: <strong>${randomPassword}</strong></p><p>Please login and change it.</p>`
  );

  return { id: userId };
}

// Generate 6-digit verification code
export async function generateVisitorVerificationCode(email) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

  const sql = `
    INSERT INTO email_verifications (email, code, expires_at)
    VALUES ($1, $2, $3)
  `;
  await db.query(sql, [email, code, expiresAt]);
  return code;
}



export async function verifyVisitorCode(email, code) {
  const sql = `
    SELECT * FROM email_verifications 
    WHERE email = $1 AND code = $2 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const results = await db.query(sql, [email, code]);

  if (results.length === 0) return false;
 
  const record = results.rows[0];
  //console.log(record.expires_at)
  if (new Date(record.expires_at) < new Date()) {
    return false; // code expired
  }

  // Delete the used code
  const deleteSql = 'DELETE FROM email_verifications WHERE id = $1';
  await db.query(deleteSql, [record.id]);

  return true;
}




// Create visitor user
export async function createVisitorUser(userData) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // Insert user
  const userSql = `
    INSERT INTO users (fname,lname, gender, email, phone_no, password, created_at)
    VALUES ($1, $2, $3, $4, $5,$6, NOW())
    RETURNING user_id
  `;
  const userParams = [
    userData.name,
    userData.name,
    userData.gender,
    userData.email,
    userData.phone,
    hashedPassword
  ];
  const userResult = await db.query(userSql, userParams);
  if (!userResult.rows.length) throw new Error('Failed to create user');

  // Use the correct column name for user_id from RETURNING
  const userId = userResult.rows[0].user_id;

  // Insert visitor details
  const visSql = `
    INSERT INTO visitor (user_id, nationality)
    VALUES ($1, $2)
  `;
  await db.query(visSql, [userId, userData.nationality]);

  return { id: userId };
}




export const generateEmployeeVerificationCode = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // expires in 15 minutes

  const sql = 'INSERT INTO email_verifications (email, code, expires_at) VALUES ($1, $2, $3)';
  await db.query(sql, [email, code, expiresAt]);

  return code;
};

export const verifyEmployeeCode = async (email, code) => {
  const sql = `
    SELECT * FROM email_verifications
    WHERE email = $1 AND code = $2
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const result = await db.query(sql, [email, code]);

  if (result.rows.length === 0) return false;

  const record = result.rows[0];
  if (new Date(record.expires_at) < new Date()) return false; // code expired

  const deleteSql = `
    DELETE FROM email_verifications WHERE id = $1
  `;
  await db.query(deleteSql, [record.id]);

  return true;
};

// Get all employees
export async function getAllEmployees() {
  const sql = `
    SELECT u.*, e.employee_no, e.position, e.department
    FROM users u
    JOIN employee e ON u.id = e.user_id
    WHERE u.role_id = 2
  `;
  const { rows } = await db.query(sql);
  return rows;
}

// Get employee by ID
export async function getEmployeeById(id) {
  const sql = `
    SELECT u.*, e.employee_no, e.position, e.department
    FROM users u
    JOIN employee e ON u.id = e.user_id
    WHERE u.id = $1 AND u.role_id = 2
  `;
  const { rows } = await db.query(sql, [id]);
  return rows[0];
}

// Update employee
export async function updateEmployee(id, userData) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const checkSql = 'SELECT * FROM users WHERE id = $1 AND role_id = 2';
    const checkResult = await client.query(checkSql, [id]);
    if (!checkResult.rows.length) throw new Error('Employee not found');

    const updateUserSql = `
      UPDATE users SET name = $1, gender = $2, email = $3, phone = $4
      WHERE id = $5 AND role_id = 2
    `;
    await client.query(updateUserSql, [
      userData.name,
      userData.gender,
      userData.email,
      userData.phone,
      id
    ]);

    const updateEmpSql = `
      UPDATE employee SET employee_no = $1, position = $2, department = $3
      WHERE user_id = $4
    `;
    await client.query(updateEmpSql, [
      userData.employee_no,
      userData.position,
      userData.department,
      id
    ]);

    await client.query('COMMIT');
    return { id, ...userData };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Delete employee
export async function deleteEmployee(id) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM employee WHERE user_id = $1', [id]);
    const res = await client.query('DELETE FROM users WHERE id = $1 AND role_id = 2', [id]);
    await client.query('COMMIT');
    return res.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get all visitors
export async function getAllVisitors() {
  const sql = `
    SELECT u.*, v.nationality
    FROM users u
    JOIN visitor v ON u.id = v.user_id
    WHERE u.role_id = 3
  `;
  const { rows } = await db.query(sql);
  return rows;
}

// Get visitor by ID
export async function getVisitorById(id) {
  const sql = `
    SELECT u.*, v.nationality
    FROM users u
    JOIN visitor v ON u.id = v.user_id
    WHERE u.id = $1 AND u.role_id = 3
  `;
  const { rows } = await db.query(sql, [id]);
  return rows[0];
}

// Update visitor
export async function updateVisitor(id, userData) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const checkSql = 'SELECT * FROM users WHERE id = $1 AND role_id = 3';
    const checkResult = await client.query(checkSql, [id]);
    if (!checkResult.rows.length) throw new Error('Visitor not found');

    const updateUserSql = `
      UPDATE users SET name = $1, gender = $2, email = $3, phone = $4
      WHERE id = $5 AND role_id = 3
    `;
    await client.query(updateUserSql, [
      userData.name,
      userData.gender,
      userData.email,
      userData.phone,
      id
    ]);

    const updateVisitorSql = `
      UPDATE visitor SET nationality = $1 WHERE user_id = $2
    `;
    await client.query(updateVisitorSql, [userData.nationality, id]);

    await client.query('COMMIT');
    return { id, ...userData };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Delete visitor
export async function deleteVisitor(id) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM visitor WHERE user_id = $1', [id]);
    const res = await client.query('DELETE FROM users WHERE id = $1 AND role_id = 3', [id]);
    await client.query('COMMIT');
    return res.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
