
import pool from "../config/db.config.js";
import nodemailer from "nodemailer";
import validator from "validator";
import dotenv from 'dotenv'
import { format } from "date-fns";
import { logActivity } from '../services/activityLog.service.js';
import { validateImageFile } from "../utils/imageValidation.js";
let newTicketId = -1;
const convertTo12Hour = (time24) => {
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

dotenv.config()
// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EVT_SMTP_HOST,   // e.g., "smtp.gmail.com", "smtp.office365.com"
  port: process.env.EVT_SMTP_PORT,   // usually 465 (SSL) or 587 (TLS)
  secure: process.env.EVT_SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.EVT_SMTP_USER, // email
    pass: process.env.EVT_SMTP_PASS  //  app password
  }
});


// GET all events
export const getAllEvents = async (req, res) => {
  try {
    const query = `
      SELECT 
            e.*,
            ec.category AS category,
            vs.venue as location,
            e.is_free,
            COALESCE(
              json_agg(
                json_build_object(
                  'ticket_id', ett.ticket_id,
                  'type', ett.type,
                  'price', ett.price,
                  'description', ett.description,
                  'features', ett.feature,
                  'ticketLimit', ett.ticket_limit,
                  'status', ett.status,
                  'type_am',ett.type_am,
                  'description_am',ett.description_am,
                  'features_am',ett.features_am
                )
              ) FILTER (WHERE ett.ticket_id IS NOT NULL AND ett.is_deleted = false), '[]'
            ) AS ticket_types
          FROM event e
          LEFT JOIN event_ticket_types ett ON e.event_id = ett.event_id
          inner JOIN event_category ec ON e.category_id = ec.id
          inner join venue_schedule vs on e.venue_id=vs.venue_id
          WHERE e.is_deleted=false and ec.is_deleted=false and vs.is_deleted=false
          GROUP BY e.event_id, ec.category,vs.venue
          ORDER BY e.updated_at DESC;

    `;

    const { rows } = await pool.query(query);
    const events = rows.map((event) => ({
      id: event.event_id,
      title: event.title,
      title_am: event.title_am,
      description_am: event.description_am,
      description: event.description,
      category: event.category,
      totalAttendance: event.no_of_attendee,
      image: event.image_path ? event.image_path : null,
      is_free: event.is_free,
      venue: event.location,
      dates: format(new Date(event.date), "yyyy-MM-dd"),   // wrap in array if you expect multiple dates later
      startTime: event.start_time,
      endTime: event.end_time,
      ticketTypes: event.ticket_types,
    }));



    res.status(200).json(events);
  } catch (err) {
    console.error("Error fetching events with ticket types:", err);
    res.status(500).json({ error: "Failed to fetch events with ticket types" });
  }
};


// GET all events in simplified format for frontend (like EventsPage.jsx)
export const getAllEventsSimple = async (req, res) => {
  try {
    const query = `
      SELECT 
  e.event_id,
  e.title,
  e.title_am,
  e.description_am,
  e.description,
  e.date,
  e.start_time,
  e.end_time,
  vs.venue AS location,
  vs.venue_am as location_am,
  ec.category as category,
  ec.category_am as category_am,
  e.image_path,
  e.no_of_attendee,
  e.is_free,
  COALESCE(SUM(ei.ticket_no), 0) AS registered
FROM event e
LEFT JOIN event_info ei ON e.event_id = ei.event_id
INNER JOIN event_category ec ON e.category_id = ec.id
INNER JOIN venue_schedule vs ON e.venue_id = vs.venue_id
WHERE e.is_deleted = false 
GROUP BY 
  e.event_id, e.title, e.description, e.date, e.start_time, e.end_time, vs.venue, ec.category, e.image_path, e.no_of_attendee, e.is_free,
  vs.venue_am,ec.category_am
ORDER BY e.date ASC;

    `;
    const { rows } = await pool.query(query);

    // Map to frontend format
    const events = rows.map((event) => ({
      id: event.event_id,
      dateRaw: event.date,
      title: event.title,
      title_am: event.title_am,
      description_am: event.description_am,
      fullDescription_am: event.description_am,
      date: format(new Date(event.date), "MMMM d, yyyy"),
      time: event.start_time && event.end_time ? `${event.start_time} - ${event.end_time}` : "",
      start_time: event.start_time ? `${event.start_time}` : "",
      end_time: event.end_time ? `${event.end_time}` : "",
      location: event.location,
      location_am: event.location_am,
      category: event.category,
      category_am: event.category_am,
      type: event.is_free ? "Free" : "Paid",
      featured: false,
      image: event.image_path || "",
      description: event.description,
      fullDescription: event.description,
      capacity: event.no_of_attendee,
      registered: event.registered,
    }));
    res.status(200).json(events);
  } catch (err) {
    console.error("Error fetching simple events:", err);
    res.status(500).json({ error: "Failed to fetch simple events" });
  }
};

// GET all events in simplified format for frontend (like EventsPage.jsx)
export const getSpecificEventsSimple = async (req, res) => {

  const id = req.params.id
  try {
    const query = `
      SELECT 
  e.event_id,
  e.title,
  e.title_am,
  e.description,
  e.description_am,
  e.date,
  e.start_time,
  e.end_time,
  vs.venue AS location,
  vs.venue_am AS location_am,
  ec.category as category,
  ec.category_am AS category_am,
  e.image_path,
  e.no_of_attendee,
  e.is_free,
  COALESCE(SUM(ei.ticket_no), 0) AS registered
FROM event e
LEFT JOIN event_info ei ON e.event_id = ei.event_id
INNER JOIN event_category ec ON e.category_id = ec.id
INNER JOIN venue_schedule vs ON e.venue_id = vs.venue_id
WHERE e.is_deleted = false AND e.event_id = $1
GROUP BY 
  e.event_id, e.title_am,e.description_am,vs.venue_am,ec.category_am,e.title, e.description, e.date, e.start_time, e.end_time, vs.venue, ec.category, e.image_path, e.no_of_attendee, e.is_free
ORDER BY e.date DESC;
    `;
    const { rows } = await pool.query(query, [id]);

    // Map to frontend format
    const events = rows.map((event) => ({
      id: event.event_id,
      dateRaw: event.date,
      title: event.title,
      title_am: event.title_am,
      date: format(new Date(event.date), "MMMM d, yyyy"),
      time: event.start_time && event.end_time ? `${event.start_time} - ${event.end_time}` : "",
      start_time: event.start_time ? `${event.start_time}` : "",
      end_time: event.end_time ? `${event.end_time}` : "",
      location: event.location,
      location_am: event.location_am,
      category: event.category,
      category_am: event.category_am,
      type: event.is_free ? "Free" : "Paid",
      featured: false,
      image: event.image_path || "",
      description: event.description,
      description_am: event.description_am,
      fullDescription: event.description,
      fullDescription_am: event.description_am,
      capacity: event.no_of_attendee,
      registered: event.registered,
      is_free: event.is_free,
    }));

    res.status(200).json(events);
  } catch (err) {
    console.error("Error fetching simple events:", err);
    res.status(500).json({ error: "Failed to fetch simple events" });
  }
};



async function createEventTicketType(ticketData, event_id) {

  const sql = `
    INSERT INTO event_ticket_types
    (event_id, type, price, description, feature, ticket_limit, status,type_am,description_am,features_am)
    VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
    RETURNING ticket_id
  `;
  const values = [
    event_id,
    ticketData.type,
    ticketData.price,
    ticketData.description,
    ticketData.features,
    ticketData.ticketLimit,
    ticketData.status,
    ticketData.type_am,
    ticketData.description_am,
    ticketData.features_am
  ];
  const result = await pool.query(sql, values);
  return result.rows[0].ticket_id;

}





// CREATE Event with detailed ticket logging
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      dates,
      startTime,
      endTime,
      venue,
      category,
      totalAttendance,
      status = "upcoming",
      ticketTypes,
      title_am,
      description_am,
      is_free
    } = req.body;

    // Handle uploaded image
    const image_name = req.file?.originalname || null;

    let image_path = null

    if (req.file) {
      const filePath = await validateImageFile(req.file);
      if (!filePath) {
        return res.status(400).json({ error: "Invalid image file uploaded." });
      }
      image_path = filePath
    }

    const image_type = req.file?.mimetype || null;
    const categoryIdRes = await pool.query(`select id from event_category where category=$1`, [category])
    const categoryId = categoryIdRes.rows[0].id;
    const venueIdRes = await pool.query(`select venue_id from venue_schedule where venue=$1`, [venue])
    const venueId = venueIdRes.rows[0].venue_id;
    // Insert event
    const { rows } = await pool.query(
      `INSERT INTO event 
        (title, description, date, start_time, end_time, venue_id, category_id, no_of_attendee, status, created_at, updated_at, 
        image_name, image_path, image_type,title_am,description_am,is_free)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW(),$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [title, description, dates, startTime, endTime, venueId, categoryId, totalAttendance, status, image_name, image_path, image_type, title_am, description_am, is_free || false]
    );

    const eventId = rows[0].event_id;
    const ticketChanges = { added: [], updated: [], deleted: [] };

    // Insert ticket types and log them
    if (is_free !== 'true' && is_free !== true && Array.isArray(ticketTypes) && ticketTypes.length > 0) {
      for (const ticketData of ticketTypes) {
        const newTicketId = await createEventTicketType(ticketData, eventId);
        ticketChanges.added.push({ ...ticketData, ticket_id: newTicketId });
      }
    } else if (String(is_free) === 'true' || is_free === true) {
      const freeTicketData = {
        type: "Free",
        price: 0,
        description: "Standard free entry ticket",
        features: "Free Entry",
        ticketLimit: totalAttendance,
        status: "active",
        type_am: "ነፃ",
        description_am: "መደበኛ ነፃ መግቢያ ቲኬት",
        features_am: "ነፃ መግቢያ"
      };
      const newTicketId = await createEventTicketType(freeTicketData, eventId);
      ticketChanges.added.push({ ...freeTicketData, ticket_id: newTicketId });
    }

    // Log activity with ticket details
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Create Event';
      const details = JSON.stringify({
        event: {
          eventId,
          title,
          description,
          dates,
          startTime,
          endTime,
          venue,
          category,
          totalAttendance,
          status,
          status,
          title_am,
          description_am,
          is_free
        },
        ticketChanges
      });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }

    res.status(201).json(rows[0]);
  } catch (err) {
    // Log failed activity
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Create Event (Failed)';
      const details = JSON.stringify(req.body);
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }

    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
};

//status check before update
const statusCheck = async (category_id, venue_id) => {
  const statusCheckRes = await pool.query(`select status from event_category where id=$1`, [category_id]);
  if (statusCheckRes.rows.length === 0) {
    return { error: 'Invalid category_id' };
  }
  if (statusCheckRes.rows[0].status.toLowerCase() === 'inactive') {
    return { error: 'Cannot update when the facility category is inactive' };
  }

  const venueRes = await pool.query(`select status from venue_schedule where venue_id=$1`, [venue_id]);
  if (venueRes.rows.length === 0) {
    return { error: 'Invalid venue_id' };
  }
  if (venueRes.rows[0].status.toLowerCase() === 'inactive') {
    return { error: 'Cannot update when  the venue is inactive' };
  }
  return false
}

// UPDATE event

export const updateEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const {
      title,
      description,
      dates,
      startTime,
      endTime,
      venue,
      category,
      totalAttendance,
      status = "upcoming",
      ticketTypes,
      title_am,
      description_am,
      is_free
    } = req.body;

    const imageDb = await pool.query(
      "SELECT image_name, image_path, image_type FROM event WHERE event_id = $1",
      [event_id]
    );

    // Handle uploaded image
    const image_name = req.file?.originalname || imageDb.rows[0].image_name;
    //const image_path = req.file?.path || imageDb.rows[0].image_path;
    let image_path = null
    //background_image = req.file ? `${process.env.BACKEND_BASEURL}/${req.file.path.replace(/\\/g, '/')}` : req.body.background_image || null;
    if (req.file) {
      const filePath = await validateImageFile(req.file);
      if (!filePath) {
        return res.status(400).json({ error: "Invalid image file uploaded." });
      }
      image_path = filePath
    } else {
      image_path = imageDb.rows[0].image_path;
    }

    const image_type = req.file?.mimetype || imageDb.rows[0].image_type;
    const categoryIdRes = await pool.query(`select id from event_category where category=$1`, [category])
    const categoryId = categoryIdRes.rows[0].id;
    const venueIdRes = await pool.query(`select venue_id from venue_schedule where venue=$1`, [venue])
    const venueId = venueIdRes.rows[0].venue_id;

    const statusMessage = await statusCheck(categoryId, venueId);

    if (statusMessage) {
      return res.status(400).json(statusMessage);
    }
    const { rowCount } = await pool.query(
      `UPDATE event SET
         title=$1, description=$2, date=$3, start_time=$4, end_time=$5, venue_id=$6, category_id=$7,
         no_of_attendee=$8, status=$9, updated_at=NOW(), image_name=$10, image_path=$11, image_type=$12,
         title_am=$14,description_am=$15, is_free=$16
       WHERE event_id=$13`,
      [
        title,
        description,
        dates,
        startTime,
        endTime,
        venueId,
        categoryId,
        totalAttendance,
        status,
        image_name,
        image_path,
        image_type,
        event_id,
        title_am,
        description_am,
        is_free || false
      ]
    );

    if (rowCount === 0) {
      // Log failed activity
      try {
        const userId = req.user?.id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Update Event (Failed)';
        const details = JSON.stringify(req.body);
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
      return res.status(404).json({ error: "Event not found" });
    }


    // Track ticket changes
    const ticketChanges = { added: [], updated: [], deleted: [] };
    // Collect all new ticket IDs
    const newTicketIds = [];

    // ✅ Update / insert ticket types
    if (is_free !== 'true' && is_free !== true && Array.isArray(ticketTypes)) {
      for (const ticketData of ticketTypes) {
        if (ticketData.ticket_id) {
          // Existing ticket → update
          await pool.query(
            `UPDATE event_ticket_types
             SET type=$1, price=$2, description=$3, feature=$4, ticket_limit=$5, status=$6,
             type_am=$9,description_am=$10,features_am=$11
             WHERE ticket_id=$7 AND event_id=$8`,
            [
              ticketData.type,
              ticketData.price,
              ticketData.description,
              ticketData.features,
              ticketData.ticketLimit,
              ticketData.status,
              ticketData.ticket_id,
              event_id,
              ticketData.type_am,
              ticketData.description_am,
              ticketData.features_am
            ]
          );
          ticketChanges.updated.push(ticketData);
        } else {
          // New ticket → insert
          const createdId = await createEventTicketType(ticketData, event_id);
          newTicketIds.push(createdId);
          ticketChanges.added.push({ ...ticketData, ticket_id: createdId });
        }
      }
    }

    // ✅ Soft-delete tickets missing from request
    const ids = (is_free !== 'true' && is_free !== true && Array.isArray(ticketTypes)) ? ticketTypes.filter(t => t.ticket_id).map(t => t.ticket_id) : [];

    // Build exclusion list for NOT IN (existing + new)
    const excludeIds = [...ids, ...newTicketIds];

    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map((_, i) => `$${i + 2}`).join(","); // Start from $2
      let query = `
        SELECT * FROM event_ticket_types
        WHERE event_id=$1 AND ticket_id NOT IN (${placeholders}) AND is_deleted=false
      `;
      let params = [event_id, ...excludeIds];

      const deletedTicketsRes = await pool.query(query, params);
      ticketChanges.deleted = deletedTicketsRes.rows;

      let updateQuery = `
        UPDATE event_ticket_types
        SET is_deleted=true
        WHERE event_id=$1 AND ticket_id NOT IN (${placeholders})
      `;
      await pool.query(updateQuery, params);
    } else {
      // If no tickets came in, mark all as deleted
      const deletedTicketsRes = await pool.query(
        `SELECT * FROM event_ticket_types WHERE event_id=$1 AND is_deleted=false`,
        [event_id]
      );
      ticketChanges.deleted = deletedTicketsRes.rows;
      await pool.query(
        `UPDATE event_ticket_types SET is_deleted=true WHERE event_id=$1`,
        [event_id]
      );
    }

    // Log activity with ticket changes
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Update Event';
      const details = JSON.stringify({
        event_id,
        title,
        description,
        dates,
        startTime,
        endTime,
        venue,
        category,
        totalAttendance,
        ticketChanges
      });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }

    res.status(200).json({ message: "Event updated successfully", ticketChanges });
  } catch (err) {
    // Log failed activity
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Update Event (Failed)';
      const details = JSON.stringify(req.body);
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }

    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
};




// DELETE event (with unavailable_dates + unavailable_time_slots cleanup)
export const deleteEvent = async (req, res) => {
  const client = await pool.connect();

  try {
    const { event_id } = req.params;

    // Fetch event details (to get venue, date, startTime, endTime)
    const eventRes = await client.query(
      `SELECT vs.venue AS venue, date, start_time, end_time 
       FROM event
       join venue_schedule vs on event.venue_id=vs.venue_id 
       WHERE event_id=$1`,
      [event_id]
    );

    if (eventRes.rowCount === 0) {
      client.release();
      // Log failed activity
      try {
        const userId = req.user?.user_id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Delete Event (Failed)';
        const details = JSON.stringify({ event_id });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
      return res.status(404).json({ error: "Event not found" });
    }

    const { venue, date, start_time, end_time } = eventRes.rows[0];

    // ✅ Step 1: Get venue_id from venue_schedule
    const venueRes = await client.query(
      `SELECT venue_id FROM venue_schedule WHERE venue=$1`,
      [venue]
    );

    if (venueRes.rowCount === 0) {
      client.release();
      // Log failed activity
      try {
        const userId = req.user?.user_id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Delete Event (Failed)';
        const details = JSON.stringify({ event_id, venue });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
      return res.status(404).json({ error: "Venue not found in venue_schedule" });
    }

    const venue_id = venueRes.rows[0].venue_id;

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

    client.release();

    // Log activity
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Event';
      const details = JSON.stringify({ event_id, venue, date, start_time, end_time });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }

    res.status(200).json({ message: "Event and related data deleted successfully" });
  } catch (err) {
    client.release();
    // Log failed activity
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Delete Event (Failed)';
      const details = JSON.stringify(req.params);
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
};

// SEND message to registered users for a specific event
export const sendEventMessage = async (req, res) => {
  try {
    const { event_id, message } = req.body;

    // Fetch registered emails
    const { rows } = await pool.query(
      "SELECT email, full_name FROM event_info WHERE event_id=$1",
      [event_id]
    );

    if (rows.length === 0) {
      // Log failed activity
      try {
        const userId = req.user?.user_id || null;
        const userName = req.user?.username || 'Unknown';
        const role = req.user?.roleName || 'Unknown';
        const department = req.user?.department || 'Unknown';
        const action = 'Send Event Message (Failed)';
        const details = JSON.stringify({ event_id, message });
        logActivity({ userId, userName, role, department, action, details });
      } catch (e) { console.error('Activity log error:', e); }
      return res.status(404).json({ error: "No registrants found for this event" });
    }

    // Helper to validate email format
    const isValidEmail = (email) => validator.isEmail(email);
    const failedEmails = [];

    // Send emails individually
    for (const user of rows) {
      if (!isValidEmail(user.email)) {
        console.warn(`Skipping invalid email: ${user.email}`);
        failedEmails.push({ email: user.email, reason: "Invalid format" });
        continue;
      }

      try {
        await transporter.sendMail({
          from: `"Adwa Victory Memorial Museum" <${process.env.EVT_SMTP_USER}>`,
          to: user.email,
          subject: "Important Announcement from Adwa Victory Memorial Museum",
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Museum Announcement</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333333;
                  background-color: #f8f9fa;
                }
                .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
                  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .header p {
                  margin: 8px 0 0 0;
                  font-size: 14px;
                  opacity: 0.9;
                }
                .content {
                  padding: 40px 30px;
                  background-color: #ffffff;
                }
                .greeting {
                  font-size: 18px;
                  color: #2c3e50;
                  margin-bottom: 25px;
                  font-weight: 500;
                }
                .announcement-badge {
                  background: linear-gradient(135deg, #fef3c7, #fde68a);
                  border: 2px solid #f59e0b;
                  border-radius: 12px;
                  padding: 15px 20px;
                  margin: 20px 0;
                  text-align: center;
                  font-weight: 600;
                  color: #92400e;
                  font-size: 16px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .message-content {
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 12px;
                  padding: 30px;
                  margin: 25px 0;
                  font-size: 16px;
                  line-height: 1.8;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                .cta-section {
                  background: linear-gradient(135deg, #fef3c7, #fde68a);
                  border-radius: 12px;
                  padding: 25px;
                  margin: 30px 0;
                  text-align: center;
                  border: 1px solid #f59e0b;
                }
                .cta-text {
                  color: #92400e;
                  font-weight: 600;
                  margin-bottom: 15px;
                  font-size: 16px;
                }
                .signature {
                  margin-top: 35px;
                  padding-top: 25px;
                  border-top: 2px solid #f1f5f9;
                }
                .signature p {
                  margin: 5px 0;
                }
                .team-name {
                  font-weight: 600;
                  color: #d97706;
                  font-size: 16px;
                }
                .museum-name {
                  color: #64748b;
                  font-size: 14px;
                }
                .footer {
                  background-color: #1e293b;
                  color: #cbd5e1;
                  padding: 30px;
                  text-align: center;
                  font-size: 13px;
                }
                .footer-content {
                  margin-bottom: 20px;
                }
                .footer-links {
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #334155;
                }
                .footer a {
                  color: #f59e0b;
                  text-decoration: none;
                  margin: 0 10px;
                }
                .footer a:hover {
                  text-decoration: underline;
                }
                .divider {
                  height: 3px;
                  background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706);
                  margin: 0;
                }
                .icon {
                  font-size: 24px;
                  margin-bottom: 10px;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <div class="icon">🏛️</div>
                  <h1>Adwa Victory Memorial Museum</h1>
                  <p>Important Announcement</p>
                </div>
                
                <div class="divider"></div>
                
                <div class="content">
                  
                  
                  <div class="announcement-badge">
                    📢 Museum Announcement
                  </div>
                  
                  <div class="message-content">
                    ${message}
                  </div>
                  
                  <div class="cta-section">
                    <div class="cta-text">
                      🎯 Stay connected with us for more updates and events
                    </div>
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      Visit our museum to explore Ethiopia's rich history and heritage
                    </p>
                  </div>
                  
                  <div class="signature">
                    <p>Warm regards,</p>
                    <p class="team-name">Communications Team</p>
                    <p class="museum-name">Adwa Victory Memorial Museum</p>
                  </div>
                </div>
                
                <div class="footer">
                  <div class="footer-content">
                    <strong>🏛️ Adwa Victory Memorial Museum</strong><br>
                    <em>Preserving History • Inspiring Future • Celebrating Victory</em>
                  </div>
                  
                  <div class="footer-content">
                    <p>📍 Addis Ababa, Ethiopia</p>
                    <p>📞 +251-XXX-XXXX | ✉️ info@adwamemorial.org</p>
                  </div>
                  
                  <div class="footer-links">
                    <p>© 2024 Adwa Victory Memorial Museum. All rights reserved.</p>
                    <p>
                      <a href="mailto:info@adwamemorial.org">Contact Us</a>
                      <a href="#">Visit Website</a>
                      <a href="#">Museum Hours</a>
                      <a href="#">Exhibitions</a>
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        })
      } catch (emailErr) {
        console.error(`Failed to send to ${user.email}:`, emailErr.message)
        return res.status(500).json({ message: "Failed to send announcement email", error: emailErr.message })
      }
    }

    const successCount = rows.length - failedEmails.length;

    // Log activity
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Send Event Message';
      const details = JSON.stringify({ event_id, message, successCount, failedEmails });
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }

    res.status(200).json({
      message: `Message sent to ${successCount} registrants.`,
      failed: failedEmails.length > 0 ? failedEmails : null
    });
  } catch (err) {
    // Log failed activity
    try {
      const userId = req.user?.user_id || null;
      const userName = req.user?.username || 'Unknown';
      const role = req.user?.roleName || 'Unknown';
      const department = req.user?.department || 'Unknown';
      const action = 'Send Event Message (Failed)';
      const details = JSON.stringify(req.body);
      logActivity({ userId, userName, role, department, action, details });
    } catch (e) { console.error('Activity log error:', e); }
    console.error(err);
    res.status(500).json({ error: "Failed to send messages" });
  }
};


