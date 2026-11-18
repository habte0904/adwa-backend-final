import jwt from 'jsonwebtoken'
import pool from '../config/db.config.js'  // your pg client

export const authorizePermissions = (allowedPermissions = []) => {
 
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization']
     
      if (!authHeader) return res.status(401).json({ error: "Authorization header missing" })

      const token = authHeader.split(' ')[1]
      if (!token) return res.status(401).json({ error: "Token missing" })

      // Verify and decode JWT, expecting { id: user_id, username }
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const userId = decoded.id
      if (!userId) return res.status(401).json({ error: "Invalid token payload" })

      // Get user's role_id from employee table using userId
      const roleRes = await pool.query(
        "SELECT role_id FROM employee WHERE user_id = $1",
        [userId]
      )

      if (roleRes.rowCount === 0) {
        return res.status(401).json({ error: "User role not found" })
      }

      const roleId = roleRes.rows[0].role_id
       
      // Get permission IDs for this role from role_permissions
      const permIdsRes = await pool.query(
        "SELECT permission_id FROM role_permissions WHERE role_id = $1",
        [roleId]
      )

      if (permIdsRes.rowCount === 0) {
        return res.status(403).json({ error: "No permissions assigned to role" })
      }

      const permissionIds = permIdsRes.rows.map(row => row.permission_id)

      // Get permission names for those IDs
      const permsRes = await pool.query(
        `SELECT name FROM permissions WHERE permission_id = ANY($1::int[])`,
        [permissionIds]
      )

      const userPermissions = permsRes.rows.map(row => row.name)
     
      // Check if userPermissions include any allowedPermissions
      const isAuthorized = allowedPermissions.some(p => userPermissions.includes(p))
     
      if (!isAuthorized) {
        return res.status(403).json({ error: "Forbidden: insufficient permissions" })
      }

      req.user = decoded
      req.user.permissions = userPermissions

      next()
    } catch (error) {
      console.error("Authorization error:", error)
      return res.status(401).json({ error: "Unauthorized" })
    }
  }
}
