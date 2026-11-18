import { Router } from "express"
import pool from "../config/db.config.js"
const router = Router()

router.post("/price-quote", async (req, res) => {
  try {
    const { ticketTypes = [] } = req.body
    if (!Array.isArray(ticketTypes) || !ticketTypes.length) return res.json({ base_total: 0, total_discount: 0, final_total: 0, lines: [] })

    const ids = [...new Set(ticketTypes.map(t => Number(t.ticket_id)))].filter(Boolean)
    if (!ids.length) return res.status(400).json({ error: "Invalid ticket ids" })

    const { rows: ticketRows } = await pool.query(
      `SELECT ticket_id, price FROM ticket_types WHERE ticket_id = ANY($1)`,
      [ids]
    )
    const priceMap = Object.fromEntries(ticketRows.map(r => [r.ticket_id, Number(r.price)]))

    const { rows: discountRows } = await pool.query(
      `SELECT ticket_id, min_group_size, discount_percent
       FROM group_discounts
       WHERE ticket_id = ANY($1)`,
      [ids]
    )

    const grouped = discountRows.reduce((acc, d) => {
      (acc[d.ticket_id] ||= []).push(d)
      return acc
    }, {})

    let base = 0, discountSum = 0
    const lines = []

    for (const item of ticketTypes) {
      const ticket_id = Number(item.ticket_id)
      const quantity = Number(item.quantity) || 0
      if (!priceMap[ticket_id] || quantity <= 0) continue
      const unit = priceMap[ticket_id]
      const lineBase = unit * quantity
      base += lineBase
      const candidates = (grouped[ticket_id] || []).filter(g => quantity >= g.min_group_size)
      const best = candidates.reduce((best, cur) => cur.discount_percent > (best?.discount_percent || 0) ? cur : best, null)
      const lineDiscount = best ? (lineBase * best.discount_percent) / 100 : 0
      discountSum += lineDiscount
      lines.push({
        ticket_id,
        quantity,
        unit_price: unit,
        base: lineBase,
        discount_percent: best?.discount_percent || 0,
        discount_amount: lineDiscount,
        final: lineBase - lineDiscount,
      })
    }

    res.json({
      base_total: base,
      total_discount: discountSum,
      final_total: base - discountSum,
      lines,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router