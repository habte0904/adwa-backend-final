import bcrypt from "bcrypt";
import pool from "../config/db.config.js";

/**
 * Parse CLI flags or fallback to environment variables / defaults.
 * Example usage:
 *   node scripts/admin_migrate.js
 *   node scripts/admin_migrate.js --username superadmin --password "StrongPass@2026" --email superadmin@adwavictorymemorial.gov.et
 *   node scripts/admin_migrate.js --reset-password
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.replace(/^--/, "");
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        parsed[key] = true; // Boolean flag like --reset-password
      }
    }
  }

  return {
    username: parsed.username || process.env.ADMIN_USERNAME || "habtamu",
    email: parsed.email || process.env.ADMIN_EMAIL || "habtamuicrafttrade@gmail.com",
    password: parsed.password || process.env.ADMIN_PASSWORD || "Admin@4321",
    fname: parsed.fname || process.env.ADMIN_FNAME || "System",
    lname: parsed.lname || process.env.ADMIN_LNAME || "Administrator",
    phone: parsed.phone || process.env.ADMIN_PHONE || "+251900000000",
    gender: parsed.gender || process.env.ADMIN_GENDER || "Male",
    department: parsed.department || process.env.ADMIN_DEPARTMENT || "IT",
    resetPassword: Boolean(parsed["reset-password"] || process.env.ADMIN_RESET_PASSWORD === "true"),
  };
}

/**
 * 1. Find or create the 'admin' role, and ensure all permissions are granted.
 */
async function ensureAdminRole(client) {
  // Check if an 'admin' role already exists
  const roleRes = await client.query(
    "SELECT role_id, name FROM roles WHERE LOWER(name) = 'admin' LIMIT 1"
  );

  let roleId;
  if (roleRes.rows.length > 0) {
    roleId = roleRes.rows[0].role_id;
    console.log(`[INFO] Found existing 'admin' role (ID: ${roleId}).`);
  } else {
    // If ID 25 is available, prefer it; otherwise let database assign nextval
    const check25 = await client.query("SELECT role_id FROM roles WHERE role_id = 25");
    if (check25.rows.length === 0) {
      const createRes = await client.query(
        "INSERT INTO roles (role_id, name) VALUES (25, 'admin') RETURNING role_id"
      );
      roleId = createRes.rows[0].role_id;
    } else {
      const createRes = await client.query(
        "INSERT INTO roles (name) VALUES ('admin') RETURNING role_id"
      );
      roleId = createRes.rows[0].role_id;
    }
    console.log(`[INFO] Created new 'admin' role (ID: ${roleId}).`);
  }

  // Ensure all permissions from permissions table are granted to this role in role_permissions
  const permRes = await client.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, p.permission_id
     FROM permissions p
     WHERE NOT EXISTS (
       SELECT 1 FROM role_permissions rp
       WHERE rp.role_id = $1 AND rp.permission_id = p.permission_id
     )
     RETURNING permission_id`,
    [roleId]
  );

  if (permRes.rowCount > 0) {
    console.log(`[INFO] Granted ${permRes.rowCount} new permission(s) to admin role.`);
  } else {
    console.log(`[INFO] Admin role already holds full permissions.`);
  }

  return roleId;
}

/**
 * 2. Migrate / Create the Admin Account
 */
async function migrateAdminAccount() {
  const config = parseArgs();
  const client = await pool.connect();

  console.log("====================================================");
  console.log(" Starting Admin Account Migration / Creation");
  console.log("====================================================");
  console.log(` Target Username : ${config.username}`);
  console.log(` Target Email    : ${config.email}`);
  console.log(` Target Department: ${config.department}`);
  console.log("----------------------------------------------------");

  try {
    await client.query("BEGIN");

    // Step A: Ensure Admin Role & Permissions exist
    const adminRoleId = await ensureAdminRole(client);

    // Step B: Check if user already exists
    const existingUserRes = await client.query(
      "SELECT user_id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1",
      [config.username, config.email]
    );

    let userId;

    if (existingUserRes.rows.length > 0) {
      const existing = existingUserRes.rows[0];
      userId = existing.user_id;
      console.log(`[INFO] User already exists (User ID: ${userId}, Username: ${existing.username}).`);

      // Update password if --reset-password flag was provided
      if (config.resetPassword) {
        const hashedPassword = await bcrypt.hash(config.password, 10);
        await client.query(
          "UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2",
          [hashedPassword, userId]
        );
        console.log(`[SUCCESS] Password has been reset for user ID ${userId}.`);
      } else {
        console.log(`[NOTE] Existing password preserved. (Pass --reset-password to overwrite).`);
      }
    } else {
      // Step C: Create New Admin User
      const hashedPassword = await bcrypt.hash(config.password, 10);
      const insertUserSql = `
        INSERT INTO users (
          fname, lname, email, phone_no, password, gender, username, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        ) RETURNING user_id;
      `;

      const userParams = [
        config.fname,
        config.lname,
        config.email,
        config.phone,
        hashedPassword,
        config.gender,
        config.username,
      ];

      const userResult = await client.query(insertUserSql, userParams);
      userId = userResult.rows[0].user_id;
      console.log(`[SUCCESS] Created new user in 'users' table (User ID: ${userId}).`);
    }

    // Step D: Ensure Employee Record with Admin Role and 'Active' status
    const empRes = await client.query(
      "SELECT user_id, role_id, status FROM employee WHERE user_id = $1",
      [userId]
    );

    if (empRes.rows.length === 0) {
      await client.query(
        `INSERT INTO employee (user_id, role_id, department, status)
         VALUES ($1, $2, $3, 'Active')`,
        [userId, adminRoleId, config.department]
      );
      console.log(`[SUCCESS] Linked user ID ${userId} in 'employee' table as Active Admin.`);
    } else {
      await client.query(
        `UPDATE employee 
         SET role_id = $1, department = $2, status = 'Active'
         WHERE user_id = $3`,
        [adminRoleId, config.department, userId]
      );
      console.log(`[SUCCESS] Updated existing employee record for user ID ${userId} to Active Admin role.`);
    }

    await client.query("COMMIT");

    console.log("====================================================");
    console.log(" ADMIN ACCOUNT READY FOR LOGIN");
    console.log("====================================================");
    console.log(` Username : ${config.username}`);
    console.log(` Password : ${config.password}`);
    console.log(` Email    : ${config.email}`);
    console.log(` Role ID  : ${adminRoleId} (admin)`);
    console.log(` Status   : Active`);
    console.log("====================================================");
    console.log("IMPORTANT: Please change the password upon first login");
    console.log("in production for security reasons.");
    console.log("====================================================");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[ERROR] Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAdminAccount();

