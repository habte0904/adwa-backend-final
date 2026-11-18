import asyncHandler from "express-async-handler";
import pool from "../config/db.config.js";
import bcrypt from "bcryptjs";
import { sendUserCredentialsEmail } from "../utils/emailService.js";
import crypto from "crypto";
import { activityLogger } from "../utils/activityLogger.js";
import { normalizeEmail } from "../utils/auth.util.js";

// Utility function for querying PostgreSQL
const dbQuery = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};

// Generate a temporary password
function generateTempPassword(length = 12) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '') // remove + / =
    .slice(0, length);
}
// Generate unique username
async function generateUsername(firstName, lastName) {
  const base = `${firstName.trim().toLowerCase()}.${lastName.trim().toLowerCase()}`;
  let username;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit
    username = `${base}${randomNum}`;

    const result = await dbQuery('SELECT COUNT(*) FROM users WHERE username = $1', [username]);
    exists = parseInt(result.rows[0].count) > 0;
  }

  return username;
}

// Add a new user
export const addUser = asyncHandler(async (req, res) => {
  const { fname, lname, phone_no, status, gender, department, role_id } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    const username = await generateUsername(fname, lname);
    const tempPassword = generateTempPassword();
    console.log("username: ",username)
    console.log("password:",tempPassword)
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const emailCheck = await dbQuery(`SELECT COUNT(*) FROM users WHERE email = $1 `,[email])
    if(parseInt(emailCheck.rows[0].count) > 0){
      res.status(400).json({error: "Email already registerd!"})
      return
    }

    const sqlUser = `
      INSERT INTO users (fname, lname, email, phone_no, gender, password, username)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id
    `;
    const resultUser = await dbQuery(sqlUser, [fname, lname, email, phone_no, gender, hashedPassword, username]);
    const userId = resultUser.rows[0].user_id;

    const sqlEmployee = `
      INSERT INTO employee (user_id, status, department, role_id)
      VALUES ($1, $2, $3, $4)
    `;

    await dbQuery(sqlEmployee, [userId, status, department, role_id]);

     sendUserCredentialsEmail(email, fname, username, tempPassword);

    activityLogger(req, {
      action: "Add User (Successful)",
      details: {
        userId,
        fname,
        lname,
        email,
        username,
        description: "User registered and credentials sent.",
      },
    });

    res.status(201).json({ message: 'User registered and credentials sent.', user_id: userId, username });
  } catch (err) {
    activityLogger(req, {
      action: "Add User (Failed)",
      details: { description: "Error adding user", error: err.message, email: req.body.email },
    });
    throw err; // Let asyncHandler catch this and respond
  }
});

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const username = req.user?.username || null;
  try {
    let usersSql = `
      SELECT u.user_id, u.fname, u.lname, u.email, u.phone_no, u.gender, u.created_at, u.updated_at, u.profile_image,
             e.status, e.department, e.role_id
      FROM users u
      JOIN employee e ON u.user_id = e.user_id
    `;
    let usersParams = [];

    if (username) {
      // Get user_id from username
      const userIdRes = await dbQuery('SELECT user_id FROM users WHERE username = $1', [username]);
      if (userIdRes.rows.length > 0) {
        const user_id = userIdRes.rows[0].user_id;
        // Get role_id from employee
        const empRes = await dbQuery('SELECT role_id FROM employee WHERE user_id = $1', [user_id]);
        if (empRes.rows.length > 0) {
          const role_id = empRes.rows[0].role_id;
          // Get role name from roles table
          const roleRes = await dbQuery('SELECT name FROM roles WHERE role_id = $1', [role_id]);
          if (roleRes.rows.length > 0) {
            const roleName = roleRes.rows[0].name;
            if (roleName.toLowerCase() !== 'admin') {
              // Only return users that do not have admin role
              usersSql += ' WHERE e.role_id != (SELECT role_id FROM roles WHERE LOWER(name) = $1)';
              usersParams.push('admin');
            }
          }
        }
      }
    }

    usersSql += '\nORDER BY u.updated_at DESC';
    const result = await dbQuery(usersSql, usersParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No users found!" });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    throw err;
  }
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  try {
    const sql = `
      SELECT u.user_id, u.fname, u.lname, u.email, u.phone_no, u.gender,
             e.status, e.department, e.role_id
      FROM users u
      JOIN employee e ON u.user_id = e.user_id
      WHERE u.user_id = $1
    `;
    const result = await dbQuery(sql, [user_id]);
    if (result.rows.length === 0) {
     
      return res.status(404).json({ message: "User not found!" });
    }

    activityLogger(req, {
      action: "Get User By ID (Successful)",
      details: { user_id, description: "User fetched successfully" },
    });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    activityLogger(req, {
      action: "Get User By ID (Failed)",
      details: { user_id, description: "Error fetching user", error: err.message },
    });
    throw err;
  }
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {

  const user_id = req.params.id;
  const { role_id, department, status, ...userFields } = req.body;

  try {
    // 1. Fetch previous user data from users table
    const prevUserRes = await dbQuery(`SELECT * FROM users WHERE user_id = $1`, [user_id]);
    if (prevUserRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
      const prevUser = prevUserRes.rows[0];
      if(req.body.email){
          userFields.email = normalizeEmail(req.body.email);
          const emailCheck = await dbQuery(`SELECT COUNT(*) FROM users WHERE email = $1 AND user_id != $2`,[userFields.email, user_id])
         console.log("emialchaecl",emailCheck.rows[0])
          if(parseInt(emailCheck.rows[0].count) > 0){
        
            res.status(400).json({error: "Email already registerd!"})
            return
          }
      }
       

    // 2. Fetch previous employee data
    const prevEmployeeRes = await dbQuery(`SELECT * FROM employee WHERE user_id = $1`, [user_id]);
    const prevEmployee = prevEmployeeRes.rows.length > 0 ? prevEmployeeRes.rows[0] : null;

    // 3. Whitelist allowed fields for `users` table
    const allowedUserFields = ["fname", "lname", "email", "phone_no", "gender"];
    const userKeys = Object.keys(userFields).filter((key) => allowedUserFields.includes(key));

    if (userKeys.length > 0) {
      const setString = userKeys.map((key, index) => `${key} = $${index + 1}`).join(", ");
      const userValues = userKeys.map((key) => userFields[key]);

      const sqlUser = `
        UPDATE users
        SET ${setString}
        WHERE user_id = $${userKeys.length + 1}
      `;
      await dbQuery(sqlUser, [...userValues, user_id]);
    }

    // 4. Update employee table
    const sqlEmployee = `
      UPDATE employee 
      SET role_id = $1, department = $2, status = $3
      WHERE user_id = $4
    `;
    await dbQuery(sqlEmployee, [role_id, department, status, user_id]);

    // 5. Fetch updated data for logging
    const updatedUserRes = await dbQuery(`SELECT * FROM users WHERE user_id = $1`, [user_id]);
    const updatedUser = updatedUserRes.rows[0];

    const updatedEmployeeRes = await dbQuery(`SELECT * FROM employee WHERE user_id = $1`, [user_id]);
    const updatedEmployee = updatedEmployeeRes.rows.length > 0 ? updatedEmployeeRes.rows[0] : null;

    // 6. Log old and new data
    activityLogger(req, {
      action: "Update User (Successful)",
      details: {
        user_id,
        previousData: {
          user: prevUser,
          employee: prevEmployee,
        },
        updatedData: {
          user: updatedUser,
          employee: updatedEmployee,
        },
        description: "User updated successfully",
      },
    });

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    activityLogger(req, {
      action: "Update User (Failed)",
      details: { user_id, description: "Error updating user", error: err.message },
    });
    throw err;
  }
});


// Reset user password and username
export const resetUser = asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const { fname, lname } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    const newPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const username = await generateUsername(fname, lname);

    const sql = `
      UPDATE users 
      SET password = $1, username = $2
      WHERE user_id = $3
    `;
    await dbQuery(sql, [hashedPassword, username, user_id]);

    await sendUserCredentialsEmail(email, fname, username, newPassword);

    activityLogger(req, {
      action: "Reset User (Successful)",
      details: { user_id, email, username, description: "User password and username reset successfully" },
    });

    res.status(200).json({ message: "User password and username reset successfully" });
  } catch (err) {
    activityLogger(req, {
      action: "Reset User (Failed)",
      details: { user_id, description: "Error resetting user password and username", error: err.message },
    });
    throw err;
  }
});

// Change user password
export const changePassword = asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const { newPassword, username } = req.body;

  try {
    const result = await dbQuery('SELECT COUNT(*) FROM users WHERE username = $1', [username]);
    const exists = parseInt(result.rows[0].count) > 0;

    if (!exists) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const sql = `UPDATE users SET password = $1, username = $2 WHERE user_id = $3`;
      await dbQuery(sql, [hashedPassword, username, user_id]);

      activityLogger(req, {
        action: "Change Password (Successful)",
        details: { user_id, username, description: "Password and username changed successfully" },
      });

      res.status(200).json({ message: "Password changed successfully" });
    } else {
      activityLogger(req, {
        action: "Change Password (Failed)",
        details: { user_id, username, description: "Username already exists" },
      });
      res.status(400).json({ message: "username exists" });
    }
  } catch (err) {
    activityLogger(req, {
      action: "Change Password (Failed)",
      details: { user_id, username, description: "Error changing password", error: err.message },
    });
    throw err;
  }
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const user_id = req.params.id;

  try {
    await dbQuery(`DELETE FROM employee WHERE user_id = $1`, [user_id]);
    const result = await dbQuery(`DELETE FROM users WHERE user_id = $1`, [user_id]);

    if (result.rowCount === 0) {
      activityLogger(req, {
        action: "Delete User (Failed)",
        details: { user_id, description: "User not found" },
      });
      return res.status(404).json({ message: "User not found!" });
    }

    activityLogger(req, {
      action: "Delete User (Successful)",
      details: { user_id, description: "User deleted successfully" },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    activityLogger(req, {
      action: "Delete User (Failed)",
      details: { user_id, description: "Error deleting user", error: err.message },
    });
    throw err;
  }
});

