// controllers/navigationController.js
import pool from "../config/db.config.js";

export const getRoleNavigationByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Step 1: Get role_id from employee
    const empResult = await pool.query(
      "SELECT role_id FROM employee WHERE user_id = $1",
      [user_id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const role_id = empResult.rows[0].role_id;

    // Step 2: Get all permission_ids for this role
    const permResult = await pool.query(
      "SELECT permission_id FROM role_permissions WHERE role_id = $1",
      [role_id]
    );
    //permResult.rows=[{permission_id:1},{permission_id:2}]
    const permissionIds = permResult.rows.map(row => row.permission_id);

    if (permissionIds.length === 0) {
      return res.status(200).json({ roleNavigation: {} });
    }

    // Step 3: Get permission details from permissions table
    const placeholders = permissionIds.map((_, i) => `$${i + 1}`).join(", ");
    const permsQuery = `SELECT name, title, url, icon, section FROM permissions WHERE permission_id IN (${placeholders})`;

    const permissionsResult = await pool.query(permsQuery, permissionIds);

    // Step 4: Build roleNavigation object (role name will be used as key)
    const permissionData = permissionsResult.rows.map(perm => ({
      title: perm.title,
      url: perm.url,
      icon: perm.icon,
      code: perm.name,
      section: perm.section,
    }));

    // (Optional) Get role name for dynamic key
    const roleNameResult = await pool.query(
      "SELECT name FROM roles WHERE role_id = $1",
      [role_id]
    );

    const roleKey =
      roleNameResult.rows[0]?.name?.replace(/\s+/g, "") || "customRole";

    const roleNavigation = {
      [roleKey]: permissionData,
    };
    
    return res.status(200).json({ roleNavigation });
  } catch (err) {
    console.error("Error getting roleNavigation:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
