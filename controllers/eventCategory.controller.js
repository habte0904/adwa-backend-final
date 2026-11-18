
import db from '../config/db.config.js';

// Helper: Validate category name
function isValidCategoryName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}

// Helper: Normalize name
function normalizeName(name) {
  return name.trim().toLowerCase();
}

export const getAllCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM event_category where is_deleted=false ORDER BY id');
    return res.json(result.rows);
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getCategoriesEvtMngmt = async (req, res) => {
  try {
    const result = await db.query('SELECT category FROM event_category where is_deleted=false and status=$1 ORDER BY id',[('active').toLowerCase()]);
    return res.json(result.rows);
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req, res) => {
  const { category, status, category_am } = req.body;
  

  if (!isValidCategoryName(category)) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  if (!['active', 'inactive'].includes((status || '').toLowerCase())) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check for duplicate name (case-insensitive)
    const existing = await db.query(
      'SELECT id FROM event_category WHERE LOWER(category) = $1',
      [normalizeName(category)]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    // Insert and return inserted row
    const result = await db.query(
      'INSERT INTO event_category (category, status, category_am) VALUES ($1, $2, $3) RETURNING id, category, status',
      [category.trim(), status.toLowerCase(), category_am]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category, status, category_am } = req.body;
  
  if (!isValidCategoryName(category)) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  if (!['active', 'inactive'].includes((status || '').toLowerCase())) {
    return res.status(400).json({ error: 'Invalid status' });

  }
 
  try {
    // Check for duplicate name (excluding self)
    const existing = await db.query(
      'SELECT id FROM event_category WHERE LOWER(category) = $1 AND id != $2',
      [normalizeName(category), id]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
   
    // Update and return updated row
    const result = await db.query(
      'UPDATE event_category SET category = $1, status = $2, category_am = $4 WHERE id = $3 RETURNING id, category, status',
      [category.trim(), status.toLowerCase(), id, category_am]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};



export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const eventIdRes = await db.query(
      'SELECT event_id FROM event WHERE category_id = $1 AND is_deleted=false',
      [id]
    );
    if (eventIdRes.rowCount > 0) {
        eventIdRes.rows.forEach(row => {
            deleteEvent(row.event_id);
        })
    }
    const result = await db.query(
      'update event_category set is_deleted=true WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const deleteEvent = async (event_id) => {
  const client = await db.connect();

  try {
   // const { event_id } = req.params;

    // Fetch event details (to get venue, date, startTime, endTime)
    const eventRes = await client.query(
      `SELECT venue_id, date, start_time, end_time 
       FROM event 
       WHERE event_id=$1`,
      [event_id]
    );

    const { venue_id, date, start_time, end_time } = eventRes.rows[0];

 

    // ✅ Step 2: Get unavailable_date_id for this date and venue
    const unavailableDateRes = await client.query(
      `SELECT id FROM unavailable_dates WHERE venue_id=$1 AND date=$2`,
      [venue_id, date]
    );

    if (unavailableDateRes.rowCount > 0) {
      const unavailable_date_id = unavailableDateRes.rows[0].id;

      // ✅ Step 3: Count time slots for this unavailable_date_id
      const slotCountRes = await client.query(
        `SELECT COUNT(*) AS cnt FROM unavailable_time_slots WHERE unavailable_date_id=$1`,
        [unavailable_date_id]
      );

      const slotCount = parseInt(slotCountRes.rows[0].cnt, 10);

      if (slotCount <= 1) {
        // If only one time slot exists → delete entire unavailable_date
        await client.query(
          `DELETE FROM unavailable_dates WHERE id=$1`,
          [unavailable_date_id]
        );
      } else {
        // If multiple slots exist → delete only matching slot
        await client.query(
          `DELETE FROM unavailable_time_slots 
           WHERE unavailable_date_id=$1 
             AND start_time=$2 
             AND end_time=$3`,
          [unavailable_date_id, start_time, end_time]
        );
      }
    }

    // Mark associated tickets as inactive (don't delete)
    await client.query(
      `UPDATE event_ticket_types SET is_deleted=true
       WHERE event_id=$1`,
      [event_id]
    );

     // Mark the event as inactive instead of deleting
     await client.query(
      `UPDATE event SET is_deleted=true, updated_at=NOW()
       WHERE event_id=$1`,
      [event_id]
    );

  

    res.status(200).json({ message: "Event and related data deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
  finally{
       client.release();
  }
};

