import pool from "../config/db.config.js";

const handleDashboard = async (req, res) => {
  try {
    const total_users = await pool.query(`SELECT COUNT(*) FROM employee`);
    const active_roles = await pool.query(`SELECT COUNT(*) FROM roles`);
    const no_recent_logs = await pool.query(`
      SELECT COUNT(*) FROM audit_logs 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);

    // Select logs and convert time to local timezone (Africa/Addis_Ababa)
    const recent_logs = await pool.query(`
      SELECT user_id, action, created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Addis_Ababa' AS time
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 3
    `);

    // Fetch user names for each recent log
    const users = await Promise.all(
      recent_logs.rows.map(async (row) => {
        const result = await pool.query(
          `SELECT fname, lname FROM users WHERE user_id = $1`,
          [row.user_id]
        );
        const { fname, lname } = result.rows[0] || {};
        return {
          user_id: row.user_id,
          full_name: fname && lname ? `${fname} ${lname}` : "Unknown User",
        };
      })
    );

    // Combine user names with logs, convert date object to ISO string
    const logsWithNames = recent_logs.rows.map((log, idx) => ({
      action: log.action,
      time: new Date(log.time).toLocaleString("en-ET", { timeZone: "Africa/Addis_Ababa" }),
      user: users[idx].full_name,
    }));

    return res.json({
      total_users: total_users.rows[0]["count"],
      active_roles: active_roles.rows[0]["count"],
      no_recent_logs: no_recent_logs.rows[0]["count"],
      recent_logs: logsWithNames,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};




const sendLogs = async (req, res) => {
  try {
    if (req.params.user) {
      return res.send("nothing here");
    } else {
      const logs = await pool.query(`SELECT user_id, action, created_at FROM audit_logs`);

      const users_info = await Promise.all(
        logs.rows.map(async (row) => {
          const resultUsers = await pool.query(
            `SELECT fname, lname FROM users WHERE user_id = $1`,
            [row.user_id]
          );

          const resultEmp = await pool.query(
            `SELECT department, role_id FROM employee WHERE user_id = $1`,
            [row.user_id]
          );

          const empData = resultEmp.rows[0] || {};
          const role_id = empData.role_id;

          let role_name = "Unknown Role";
          if (role_id) {
            const roleRes = await pool.query(`SELECT name FROM roles WHERE role_id = $1`, [role_id]);
            role_name = roleRes.rows[0]?.name || role_name;
          }

          const { fname, lname } = resultUsers.rows[0] || {};

          return {
            full_name: fname && lname ? `${fname} ${lname}` : "Unknown User",
            department: empData.department || "Unknown Department",
            role: role_name,
            time: row.created_at,
            action: row.action,
          };
        })
      );

      return res.json({ users_info });
    }
  } catch (error) {
    
    return res.status(500).json({ error: "Server error" });
  }
};

export { handleDashboard,sendLogs };
