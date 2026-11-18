import pool from '../config/db.config.js';
import { logActivity } from '../services/activityLog.service.js';
import dotenv from 'dotenv';
import { validateImageFile, validateVideoFile } from '../utils/imageValidation.js';
dotenv.config();

// Helper function to get all facilities with proper joins
const getAllFacilities = async (page = 'staff') => {
  let query;
  if (page === 'staff') {
    query = `
    SELECT 
      sf.id,
      sf.price_half_day,
      sf.price_full_day,
      sf.price_per_sqm,
      sf.currency,
      sf.features,
      sf.capacity,
      sf.status,
      sf.category_id,
      sf.venue_id,
      sf.image,
      sf.video,
      sf.description,
      sf.features_am, 
      sf.description_am,
      sc.category,
      vs.venue
    FROM service_facility sf
    INNER JOIN service_category sc ON sf.category_id = sc.id
    INNER JOIN venue_schedule vs ON sf.venue_id = vs.venue_id
    WHERE sf.is_deleted = FALSE 
    ORDER BY sf.updated_at DESC
  `;
  } else {
    query = `
    SELECT 
      sf.id,
      sf.price_half_day,
      sf.price_full_day,
      sf.price_per_sqm,
      sf.currency,
      sf.features,
      sf.capacity,
      sf.status,
      sf.image,
      sf.video,
      sf.description,
      sf.features_am, 
      sf.description_am,
      sc.category,
      sc.category_am,
      sc.description_am AS sdescription_am ,
      sc.description AS sdescription,
      sf.category_id,
      sf.venue_id,
      vs.venue, 
      vs.venue_am
    FROM service_facility sf
    INNER JOIN service_category sc ON sf.category_id = sc.id
    INNER JOIN venue_schedule vs ON sf.venue_id = vs.venue_id
    WHERE sf.is_deleted = FALSE and sf.status = 'active' 
    ORDER BY sf.updated_at DESC
  `;

  }

  const result = await pool.query(query);
  return result.rows;
};

// Get all facilities for frontend
export const getFrontendFacilities = async (req, res) => {
  try {
    const facilities = await getAllFacilities('frontend');


    // Format the data to match the frontend structure
    const formattedFacilities = facilities.map(facility => ({
      id: facility.id,
      venue_id: facility.venue_id,
      category_id: facility.category_id,
      venue: facility.venue,
      venue_am: facility.venue_am,
      category: facility.category,
      category_am: facility.category_am,
      price_half_day: parseFloat(facility.price_half_day),
      price_full_day: parseFloat(facility.price_full_day),
      price_per_sqm: facility.price_per_sqm ? parseFloat(facility.price_per_sqm) : null,
      currency: facility.currency,
      features: facility.features ? facility.features.split(',').map(f => f.trim()) : [],
      capacity: facility.capacity,
      image: facility.image,
      description: facility.description,
      video: facility.video,
      features_am: facility.features_am ? facility.features_am.split(',').map(f => f.trim()) : [],
      description_am: facility.description_am,
      sdescription: facility.sdescription,
      sdescription_am: facility.sdescription_am,
    }));

    res.json(formattedFacilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};





// Get all facilities (formatted like mock data)
export const getFacilities = async (req, res) => {
  try {
    const facilities = await getAllFacilities();


    // Format the data to match the frontend structure
    const formattedFacilities = facilities.map(facility => ({
      id: facility.id,
      venue_id: facility.venue_id,
      category_id: facility.category_id,
      venue: facility.venue,
      category: facility.category,
      price_half_day: parseFloat(facility.price_half_day),
      price_full_day: parseFloat(facility.price_full_day),
      price_per_sqm: facility.price_per_sqm ? parseFloat(facility.price_per_sqm) : null,
      currency: facility.currency,
      features: facility.features ? facility.features.split(',').map(f => f.trim()) : [],
      capacity: facility.capacity,
      status: facility.status,
      image: facility.image,
      video: facility.video,
      description: facility.description,
      features_am: facility.features_am ? facility.features_am.split(',').map(f => f.trim()) : [],
      description_am: facility.description_am
    }));

    res.json(formattedFacilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all venues for dropdown
export const getVenues = async (req, res) => {
  try {
    const query = 'SELECT venue_id, venue as name FROM venue_schedule WHERE LOWER(status) = LOWER($1) AND is_deleted = false';
    const result = await pool.query(query, ['active']);

    const formattedVenues = result.rows.map(venue => ({
      id: venue.venue_id.toString(),
      name: venue.name
    }));

    res.json(formattedVenues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all service categories for dropdown
export const getServiceCategories = async (req, res) => {
  try {
    const query = `SELECT id, category as name FROM service_category WHERE status = 'active' AND is_deleted = false`;
    const result = await pool.query(query);

    const formattedCategories = result.rows.map(category => ({
      id: category.id.toString(),
      name: category.name
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to get facility by ID with joins
const getFacilityById = async (id) => {
  const query = `
    SELECT 
      sf.id,
      sf.venue_id,
      sf.category_id,
      sf.price_half_day,
      sf.price_full_day,
      sf.price_per_sqm,
      sf.currency,
      sf.features,
      sf.capacity,
      sf.status,
      sc.category,
      vs.venue
    FROM service_facility sf
    INNER JOIN service_category sc ON sf.category_id = sc.id
    INNER JOIN venue_schedule vs ON sf.venue_id = vs.venue_id
    WHERE sf.id = $1 AND sf.is_deleted = FALSE 
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Create new facility
export const createFacility = async (req, res) => {
  const { venue_id, category_id, price_half_day, price_full_day, price_per_sqm, currency, features, capacity, description, features_am, description_am, status = 'active' } = req.body;

  try {
    // Validate required fields
    if (!venue_id || !category_id || !currency || !capacity || !description || !features_am || !description_am) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let image = req.body.image;
    let video = req.body.video;
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        // image = `${process.env.BACKEND_BASEURL}/${req.files.image[0].path.replace(/\\/g, '/')}`;

        if (req.files.image[0]) {
          const filePath = await validateImageFile(req.files.image[0]);
          if (!filePath) {
            return res.status(400).json({ error: "Invalid image file uploaded." });
          }
          image = `${process.env.BACKEND_BASEURL}/${filePath}`
        }

      }
      if (req.files.video && req.files.video[0]) {
        // video = `${process.env.BACKEND_BASEURL}/${req.files.video[0].path.replace(/\\/g, '/')}`;
        if (req.files.video[0]) {
          const filePath = await validateVideoFile(req.files.video[0]);
          if (!filePath) {
            return res.status(400).json({ error: "Invalid video file uploaded." });
          }
          video = `${process.env.BACKEND_BASEURL}/${filePath}`
        }
      }
    }


    // Validate status
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
    }

    const query = `
      INSERT INTO service_facility 
        (category_id, venue_id, price_half_day, price_full_day, price_per_sqm, currency, features, capacity, status, image, description, video, features_am, description_am)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      parseInt(category_id),
      parseInt(venue_id),
      price_half_day ? parseFloat(price_half_day) : null,
      price_full_day ? parseFloat(price_full_day) : null,
      price_per_sqm ? parseFloat(price_per_sqm) : null,
      currency,
      Array.isArray(features) ? features.join(', ') : features,
      parseInt(capacity),
      status,
      image,
      description,
      video,
      Array.isArray(features_am) ? features_am.join(', ') : features_am,
      description_am
    ];

    const result = await pool.query(query, values);

    // Get the complete facility data with joins
    const newFacility = await getFacilityById(result.rows[0].id);

    res.status(201).json({
      message: 'Facility created successfully',
      facility: newFacility
    });
    // Audit log: Create Facility
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Create Facility';
      const details = JSON.stringify({ venue_id, category_id, price_half_day, price_full_day, price_per_sqm, currency, features, capacity, status, image });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


//status check before update
const statusCheck = async (category_id, venue_id) => {
  const statusCheckRes = await pool.query(`select status from service_category where id=$1`, [category_id]);
  if (statusCheckRes.rows.length === 0) {
    return { error: 'Invalid category_id' };
  }
  if (statusCheckRes.rows[0].status.toLowerCase() === 'inactive') {
    return { error: 'Cannot update when the  facility category is inactive' };
  }

  const venueRes = await pool.query(`select status from venue_schedule where venue_id=$1`, [venue_id]);
  if (venueRes.rows.length === 0) {
    return { error: 'Invalid venue_id' };
  }
  if (venueRes.rows[0].status.toLowerCase() === 'inactive') {
    return { error: 'Cannot update when the  venue is inactive' };
  }
  return false
}

// Update facility
export const updateFacility = async (req, res) => {
  const { id } = req.params;
  const { venue_id, category_id, price_half_day, price_full_day, price_per_sqm, currency, features, capacity, status, description, features_am, description_am } = req.body;


  try {


    const statusMessage = await statusCheck(category_id, venue_id);

    if (statusMessage) {
      return res.status(400).json(statusMessage);
    }
    let image = req.body.image;
    let video = req.body.video;
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        // image = `${process.env.BACKEND_BASEURL}/${req.files.image[0].path.replace(/\\/g, '/')}`;

        if (req.files.image[0]) {
          const filePath = await validateImageFile(req.files.image[0]);
          if (!filePath) {
            return res.status(400).json({ error: "Invalid image file uploaded." });
          }
          image = `${process.env.BACKEND_BASEURL}/${filePath}`
        }

      }
      if (req.files.video && req.files.video[0]) {
        // video = `${process.env.BACKEND_BASEURL}/${req.files.video[0].path.replace(/\\/g, '/')}`;
        if (req.files.video[0]) {
          const filePath = await validateVideoFile(req.files.video[0]);
          if (!filePath) {
            return res.status(400).json({ error: "Invalid image file uploaded." });
          }
          video = `${process.env.BACKEND_BASEURL}/${filePath}`
        }
      }
    }
    // Check if facility exists
    const existingFacility = await pool.query(
      'SELECT * FROM service_facility WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (existingFacility.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
    }


    // Build dynamic update query based on provided fields
    let query = 'UPDATE service_facility SET ';
    const values = [];
    let paramCount = 1;
    const updates = [];

    if (venue_id !== undefined) {
      updates.push(`venue_id = $${paramCount}`);
      values.push(parseInt(venue_id));
      paramCount++;
    }

    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      values.push(parseInt(category_id));
      paramCount++;
    }

    if (price_half_day !== undefined) {
      updates.push(`price_half_day = $${paramCount}`);
      values.push(price_half_day ? parseFloat(price_half_day) : null);
      paramCount++;
    }

    if (price_full_day !== undefined) {
      updates.push(`price_full_day = $${paramCount}`);
      values.push(price_full_day ? parseFloat(price_full_day) : null);
      paramCount++;
    }

    if (price_per_sqm !== undefined) {
      updates.push(`price_per_sqm = $${paramCount}`);
      values.push(price_per_sqm ? parseFloat(price_per_sqm) : null);
      paramCount++;
    }

    if (currency !== undefined) {
      updates.push(`currency = $${paramCount}`);
      values.push(currency);
      paramCount++;
    }

    if (features !== undefined) {
      updates.push(`features = $${paramCount}`);
      values.push(Array.isArray(features) ? features.join(', ') : features);
      paramCount++;
    }

    if (capacity !== undefined) {
      updates.push(`capacity = $${paramCount}`);
      values.push(parseInt(capacity));
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (image !== undefined) {
      updates.push(`image = $${paramCount}`);
      values.push(image);
      paramCount++;
    }
    if (video !== undefined) {
      updates.push(`video = $${paramCount}`);
      values.push(video);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (description_am !== undefined) {
      updates.push(`description_am = $${paramCount}`);
      values.push(description_am);
      paramCount++;
    }
    if (features_am !== undefined) {
      updates.push(`features_am = $${paramCount}`);
      values.push(Array.isArray(features_am) ? features_am.join(', ') : features_am);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    query += updates.join(', ') + ` WHERE id = $${paramCount} AND is_deleted = FALSE RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    // Get the updated facility data with joins
    const updatedFacility = await getFacilityById(id);

    res.json({
      message: 'Facility updated successfully',
      facility: updatedFacility
    });
    // Audit log: Update Facility
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Update Facility';
      const details = JSON.stringify({ id, venue_id, category_id, price_half_day, price_full_day, price_per_sqm, currency, features, capacity, status, image });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete facility (soft delete)
export const deleteFacility = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if facility exists
    const existingFacility = await pool.query(
      'SELECT * FROM service_facility WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (existingFacility.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const query = `
      UPDATE service_facility 
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    await pool.query(query, [id]);

    res.json({ message: 'Facility deleted successfully' });
    // Audit log: Delete Facility
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Facility';
      const details = JSON.stringify({ id });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update facility status only
export const updateFacilityStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
    }

    // Check if facility exists
    const existingFacility = await pool.query(
      'SELECT * FROM service_facility WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (existingFacility.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const query = `
      UPDATE service_facility 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);

    // Get the updated facility data with joins
    const updatedFacility = await getFacilityById(id);

    res.json({
      message: 'Facility status updated successfully',
      facility: updatedFacility
    });
    // Audit log: Update Facility Status
    try {
      const userId = req.user?.id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Update Facility Status';
      const details = JSON.stringify({ id, status });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
  } catch (error) {
    console.error('Error updating facility status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
