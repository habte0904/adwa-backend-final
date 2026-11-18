import pool from '../config/db.config.js'

// Unified helpers ensure consistent "id" field (alias discount_id) and ticket join

export async function getAllGroupDiscounts() {
  const sql = `
    SELECT 
      gd.discount_id,
      gd.ticket_id,
      gd.min_group_size,
      gd.discount_percent,
      tt.type AS ticket_type,
      tt.price AS ticket_price
    FROM group_discounts gd
    JOIN ticket_types tt ON gd.ticket_id = tt.ticket_id
    ORDER BY gd.discount_id DESC
  `
  const { rows } = await pool.query(sql)
  return rows
}

export async function getGroupDiscountById(id) {
  const sql = `
    SELECT 
      gd.discount_id,
      gd.ticket_id,
      gd.min_group_size,
      gd.discount_percent,
      tt.type AS ticket_type,
      tt.price AS ticket_price
    FROM group_discounts gd
    JOIN ticket_types tt ON gd.ticket_id = tt.ticket_id
    WHERE gd.discount_id = $1
    LIMIT 1
  `
  const { rows } = await pool.query(sql, [id])
  return rows[0] || null
}

export async function createGroupDiscount({ ticket_id, min_group_size, discount_percent }) {

  // Validate ticket_id is a number
  const ticketIdNum = Number(ticket_id)
  if (isNaN(ticketIdNum) || ticketIdNum <= 0) {
    throw new Error("ticket_id must be a positive number")
  }

  await validateTicket(ticketIdNum)

  // Check for duplicate: same ticket_id and min_group_size
  const duplicateCheckSql = `
    SELECT 1 FROM group_discounts
    WHERE ticket_id = $1 AND min_group_size = $2
  `
  const { rows: dupRows } = await pool.query(duplicateCheckSql, [ticketIdNum, min_group_size])
  if (dupRows.length > 0) {
    throw new Error("A discount for this ticket type and group size already exists")
  }

  const sql = `
    INSERT INTO group_discounts (ticket_id, min_group_size, discount_percent)
    VALUES ($1, $2, $3)
    RETURNING discount_id AS id
  `
  const { rows } = await pool.query(sql, [ticketIdNum, min_group_size, discount_percent])
  return rows[0]
}


export async function updateGroupDiscount(id, { ticket_id, min_group_size, discount_percent }) {
  await validateTicket(ticket_id)
  const sql = `
    UPDATE group_discounts
   SET ticket_id = $1,
       min_group_size = $2,
       discount_percent = $3
 WHERE discount_id = $4
 RETURNING discount_id
  `
  const { rows } = await pool.query(sql, [ticket_id, min_group_size, discount_percent, id])
  return rows[0] || null
}

export async function deleteGroupDiscount(id) {
  const sql = `DELETE FROM group_discounts WHERE discount_id = $1`
  const res = await pool.query(sql, [id])
  return res.rowCount > 0
}

async function validateTicket(ticket_id) {
  // Accept either ticket_id or id column (if schema differs)
  const { rows } = await pool.query(
    `SELECT ticket_id FROM ticket_types WHERE ticket_id = $1 LIMIT 1`,
    [ticket_id]
  )
  if (!rows[0]) {
    throw new Error(`Ticket type with id ${ticket_id} not found`)
  }
}

export default {
  getAllGroupDiscounts,
  getGroupDiscountById,
  createGroupDiscount,
  updateGroupDiscount,
  deleteGroupDiscount,
}