
import {
  getAllGroupDiscounts,
  getGroupDiscountById,
  createGroupDiscount,
  updateGroupDiscount,
  deleteGroupDiscount,
} from '../services/groupDiscount.service.js'
import { logActivity } from '../services/activityLog.service.js';

function parseBody(body) {
  const ticket_id = Number(body.ticket_id)
  const min_group_size = Number(body.min_group_size)
  const discount_percent = Number(body.discount_percent)

  const errors = []
  if (!ticket_id || ticket_id <= 0) errors.push('ticket_id must be a positive number')
  if (!min_group_size || min_group_size <= 0) errors.push('min_group_size must be > 0')
  if (
    isNaN(discount_percent) ||
    discount_percent < 0 ||
    discount_percent > 100
  )
    errors.push('discount_percent must be between 0 and 100')

  if (errors.length) {
    const err = new Error(errors.join('; '))
    err.status = 400
    throw err
  }

  return { ticket_id, min_group_size, discount_percent }
}

export async function listGroupDiscounts(req, res) {
  try {
    const data = await getAllGroupDiscounts()
    res.json({ data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function getOneGroupDiscount(req, res) {
  try {
    const { id } = req.params
    const row = await getGroupDiscountById(id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export async function createGroupDiscountCtrl(req, res) {
  try {
    const dto = parseBody(req.body)
    const created = await createGroupDiscount(dto)
    const full = await getGroupDiscountById(created.id)
    res.status(201).json(full)
    // Audit log: Create group discount
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Create Group Discount';
      const details = JSON.stringify({
        ticket_id: full.ticket_id,
        ticket_type: full.ticket_type,
        min_group_size: full.min_group_size,
        discount_percent: full.discount_percent,
        discount_id: full.discount_id
      });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message })
  }
}

export async function updateGroupDiscountCtrl(req, res) {
  try {
    const { id } = req.params
    const dto = parseBody(req.body)
    const updated = await updateGroupDiscount(id, dto)
    if (!updated) return res.status(404).json({ error: 'Not found' })
    const full = await getGroupDiscountById(id)
    res.json(full)
    // Audit log: Update group discount
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Update Group Discount';
      const details = JSON.stringify({
        discount_id: full.discount_id,
        ticket_id: full.ticket_id,
        ticket_type: full.ticket_type,
        min_group_size: full.min_group_size,
        discount_percent: full.discount_percent
      });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message })
  }
}

export async function deleteGroupDiscountCtrl(req, res) {
  try {
    const { id } = req.params
    // Fetch group discount before deleting for ticket name
    const full = await getGroupDiscountById(id)
    const ok = await deleteGroupDiscount(id)
    if (!ok) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
    // Audit log: Delete group discount
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Group Discount';
      const details = JSON.stringify({
        discount_id: id,
        ticket_id: full?.ticket_id,
        ticket_type: full?.ticket_type,
        min_group_size: full?.min_group_size,
        discount_percent: full?.discount_percent
      });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

export default {
  listGroupDiscounts,
  getOneGroupDiscount,
  createGroupDiscountCtrl,
  updateGroupDiscountCtrl,
  deleteGroupDiscountCtrl,
}