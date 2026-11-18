import db from '../config/db.config.js';

// Get all service categories
export const getServiceCategories = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM service_category WHERE is_deleted = false ORDER BY id DESC'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
};

// Create a new service category
export const createServiceCategory = async (req, res) => {
  const { category, description, category_am, description_am, status } = req.body;
 

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Check for duplicate (case-insensitive)
    const duplicate = await db.query(
      'SELECT 1 FROM service_category WHERE LOWER(TRIM(category)) = LOWER(TRIM($1))',
      [category]
    );

    if (duplicate.rowCount > 0) {
      return res.status(400).json({ error: 'A service category with this name already exists' });
    }

    const normalizedStatus = (status || 'active').toLowerCase();

    const result = await db.query(
      'INSERT INTO service_category (category, description, status, category_am, description_am) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category.trim(), description || '', normalizedStatus, category_am, description_am]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log("err:", err);
    res.status(500).json({ error: 'Failed to create service category' });
  }
};

// Update a service category
export const updateServiceCategory = async (req, res) => {
  const { id } = req.params;
  const { category, description, status, category_am, description_am, } = req.body;

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Check for duplicate (excluding self, case-insensitive)
    const duplicate = await db.query(
      'SELECT 1 FROM service_category WHERE LOWER(TRIM(category)) = LOWER(TRIM($1)) AND id != $2',
      [category, id]
    );

    if (duplicate.rowCount > 0) {
      return res.status(400).json({ error: 'A service category with this name already exists' });
    }

    const normalizedStatus = (status || 'active').toLowerCase();

    // Update related service_facility status
    const serviceFacilityRes=await db.query(
      `UPDATE service_facility
       SET status = $1
       FROM venue_schedule sc
       WHERE service_facility.venue_id = sc.venue_id
       AND service_facility.category_id = $2
       AND sc.status = 'Active'`,
      [normalizedStatus, id]
    );

   
    // Update service_category
    const result = await db.query(
      'UPDATE service_category SET category = $1, description = $2, status = $3, category_am = $5, description_am = $6 WHERE id = $4 RETURNING *',
      [category.trim(), description || '', normalizedStatus, id, category_am, description_am]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Service category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("err:", err);
    res.status(500).json({ error: 'Failed to update service category' });
  }
};

// Delete a service category
export const deleteServiceCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Soft-delete related facilities
    await db.query('UPDATE service_facility SET is_deleted = true WHERE category_id = $1', [id]);

    // Soft-delete the category
    const result = await db.query('UPDATE service_category SET is_deleted = true WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Service category not found' });
    }

    res.json({ message: 'Service category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service category' });
  }
};

