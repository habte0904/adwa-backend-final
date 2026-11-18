import pool from "../config/db.config.js";
import { activityLogger } from "../utils/activityLogger.js";

// Utility wrapper for querying the DB
const dbQuery = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};

const addRole = async (req, res) => {
  try {
    const { name, permissionIdArray } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      activityLogger(req, {
        action: "Add Role (Failed)",
        details: { description: "Role name is required and must be a non-empty string" },
      });
      return res.status(400).json({ message: "Role name is required and must be a non-empty string." });
    }

    // 1. Check for duplicate role
    const roleNameCheck = await dbQuery(`SELECT name FROM roles WHERE name = $1`, [name]);
    if (roleNameCheck.rowCount > 0) {
      activityLogger(req, {
        action: "Add Role (Failed)",
        details: { description: `Role with name '${name}' already exists.` },
      });
      return res.status(409).json({ message: "Role with this name already exists." }); // 409 Conflict
    }

    // 2. Insert role and get role_id
    const result = await dbQuery(`INSERT INTO roles(name) VALUES($1) RETURNING role_id`, [name]);
    const roleId = result.rows[0].role_id;

    // 3. Handle permissions
    const permissions = Array.isArray(permissionIdArray) ? permissionIdArray : [];

    if (!permissions.every((p) => Number.isInteger(p))) {
      activityLogger(req, {
        action: "Add Role (Failed)",
        details: { description: "Each permission must be a valid integer ID." },
      });
      return res.status(400).json({ message: "Each permission must be a valid integer ID." });
    }

    // 4. Insert role-permission mappings
    if (permissions.length > 0) {
      const values = permissions.map((_, i) => `($1, $${i + 2})`).join(", ");
      const params = [roleId, ...permissions];
      const sql = `INSERT INTO role_permissions(role_id, permission_id) VALUES ${values}`;
      await dbQuery(sql, params);
    }

    // Resolve permission names for logging
    let permissionNames = [];
    if (permissions.length > 0) {
      const permRes = await dbQuery(
        `SELECT name FROM permissions WHERE permission_id = ANY($1::int[])`,
        [permissions]
      );
      permissionNames = permRes.rows.map((row) => row.name);
    }

    activityLogger(req, {
      action: "Add Role (Successful)",
      details: {
        name,
        permissionIds: permissions,
        // Join permission names with comma + space
        permissionNames: permissionNames.join(", "),
        description: "Role and permissions added successfully!",
      },
    });

    // 5. Send success response
    return res.status(201).json({ message: "Role and permissions added successfully!", roleId });
  } catch (err) {
    console.error("Error in addRole:", err);
    activityLogger(req, {
      action: "Add Role (Failed)",
      details: { description: "Server error while adding role", error: err.message },
    });
    return res.status(500).json({ message: "Server error while adding role." });
  }
};

const getRoles = async (req, res) => {
  try {
    const username = req.user?.username || null;
    let rolesSql = `SELECT * FROM roles`;
    let rolesParams = [];

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
              // Only return roles that are not admin
              rolesSql += ' WHERE LOWER(name) != $1';
              rolesParams.push('admin');
            }
          }
        }
      }
    }

    const roleRes = await dbQuery(rolesSql, rolesParams);
    const permRes = await dbQuery(`SELECT * FROM permissions`);
    const rolePermRes = await dbQuery(`SELECT * FROM role_permissions`);

    return res.status(200).json({
      role: roleRes.rows,
      permissions: permRes.rows,
      rolePerm: rolePermRes.rows,
    });
  } catch (err) {
    console.error("Error in getRoles:", err);
    return res.status(500).json({ message: "Internal server error while fetching roles." });
  }
};

const updateRole = async (req, res) => {
  const role_id = parseInt(req.params.id, 10);
  const { name, permissionIdArray } = req.body;

  if (!role_id || isNaN(role_id)) {
    return res.status(400).json({ message: "Valid role_id is required.", role: role_id, type: typeof role_id });
  }

  if (name && typeof name !== "string") {
    return res.status(400).json({ message: "Role name must be a string." });
  }

  if (permissionIdArray && !Array.isArray(permissionIdArray)) {
    return res.status(400).json({ message: "Permissions must be sent as an array." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Update role name if provided and not duplicate
    if (name) {
      const roleNameCheck = await client.query(`SELECT name FROM roles WHERE role_id = $1`, [role_id]);

      if (roleNameCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        activityLogger(req, {
          action: "Update Role (Failed)",
          details: { role_id, description: "Role not found." },
        });
        return res.status(404).json({ message: "Role not found." });
      }

      const currentName = roleNameCheck.rows[0].name;

      if (currentName.toLowerCase() !== name.toLowerCase()) {
        const duplicateCheck = await client.query(
          `SELECT role_id FROM roles WHERE name = $1 AND role_id != $2`,
          [name, role_id]
        );

        if (duplicateCheck.rowCount > 0) {
          await client.query("ROLLBACK");
          activityLogger(req, {
            action: "Update Role (Failed)",
            details: { role_id, name, description: "Another role with the same name exists." },
          });
          return res.status(409).json({ message: "Another role with the same name already exists." });
        }

        await client.query(`UPDATE roles SET name = $1 WHERE role_id = $2`, [name, role_id]);
      }
    }

    // 2. Update permissions if provided
    if (Array.isArray(permissionIdArray)) {
      // Clear existing permissions
      await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [role_id]);

      // Insert new ones if not empty
      if (permissionIdArray.length > 0) {
        const insertValues = permissionIdArray.map((_, idx) => `($1, $${idx + 2})`).join(", ");
        const params = [role_id, ...permissionIdArray];
        await client.query(`INSERT INTO role_permissions(role_id, permission_id) VALUES ${insertValues}`, params);
      }
    }

    await client.query("COMMIT");

    // Resolve permission names for logging
    let permissionNames = [];
    if (Array.isArray(permissionIdArray) && permissionIdArray.length > 0) {
      const permRes = await dbQuery(
        `SELECT name FROM permissions WHERE permission_id = ANY($1::int[])`,
        [permissionIdArray]
      );
      permissionNames = permRes.rows.map((row) => row.name);
    }

    activityLogger(req, {
      action: "Update Role (Successful)",
      details: {
        role_id,
        newName: name,
        permissionIds: permissionIdArray,
        permissionNames: permissionNames.join(", "),
        description: "Role and permissions updated successfully.",
      },
    });

    return res.status(200).json({ message: "Role updated successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating role:", err);
    activityLogger(req, {
      action: "Update Role (Failed)",
      details: { role_id, description: "Internal server error while updating role", error: err.message },
    });
    return res.status(500).json({ message: "Internal server error while updating role." });
  } finally {
    client.release();
  }
};

const deleteRole = async (req, res) => {
  const role_id = parseInt(req.params.id, 10);

  if (isNaN(role_id)) {
    return res.status(400).json({ message: "Invalid role ID" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Optional: Check if the role exists
    const check = await client.query(`SELECT * FROM roles WHERE role_id = $1`, [role_id]);
    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      activityLogger(req, {
        action: "Delete Role (Failed)",
        details: { role_id, description: "Role not found" },
      });
      return res.status(404).json({ message: "Role not found" });
    }

    // Delete from role_permissions first to avoid foreign key constraint
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [role_id]);

    // Then delete from roles
    await client.query(`DELETE FROM roles WHERE role_id = $1`, [role_id]);

    await client.query("COMMIT");

    activityLogger(req, {
      action: "Delete Role (Successful)",
      details: { role_id, description: "Role deleted successfully" },
    });

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in transaction:", err);
    activityLogger(req, {
      action: "Delete Role (Failed)",
      details: { role_id, description: "Server error during deletion", error: err.message },
    });
    res.status(500).json({ message: "Server error during deletion" });
  } finally {
    client.release();
  }
};

export { addRole, getRoles, updateRole, deleteRole };
