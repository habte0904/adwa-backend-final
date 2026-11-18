import asyncHandler from  "express-async-handler";
import pool from "../config/db.config.js";  
import { format } from "date-fns";
import { logActivity } from '../services/activityLog.service.js';

const query = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
}

// Add new unavailable date and time
export const addUnavailableDateTime = asyncHandler(async (req, res) => {

  const { unavailable_dates } = req.body;
  const  venue_id = req.params.venue_id;
  
  if (!unavailable_dates || !Array.isArray(unavailable_dates)) {
    return res.status(400).json({ message: "Invalid input data" });
  }
  

  for (const entry of unavailable_dates) {
    const existing = await query(
      `SELECT id FROM unavailable_dates WHERE venue_id = $1 AND date = $2`,
      [venue_id, entry.date]
    );

  if (existing.rows.length === 0) {
    const dateResult = await query(
      "INSERT INTO unavailable_dates (venue_id, date, weekly_recurrence, monthly_recurrence) VALUES ($1, $2, $3, $4) RETURNING id",
      [venue_id, entry.date, entry.weekly_recurrence, entry.monthly_recurrence]
    );

    const unavailableDateId = dateResult.rows[0].id;

   if (Array.isArray(entry.time_slots) && entry.time_slots.length > 0) {
      for (const slot of entry.time_slots) {
       await query(
        `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
        [unavailableDateId, slot.start_time, slot.end_time]
      );
      }
    }
   }
   else{
      if (Array.isArray(entry.time_slots) && entry.time_slots.length > 0) {
      for (const slot of entry.time_slots) {
       await query(
        `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
        [existing.rows[0].id, slot.start_time, slot.end_time]
      );
      }
    }

   }
   
}

  // Log activity
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Add Unavailable Date/Time';
    const details = JSON.stringify({ venue_id, unavailable_dates });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }

  res.status(201).json({ message: "Unavailable dates and times added successfully" });
});

// Get all unavailable dates and times for a venue
export const getUnavailableDateTime = asyncHandler(async (req, res) => {
  const venue_id = req.params.venue_id;

  if (!venue_id) {
    return res.status(400).json({ message: "Venue ID is required" });
  }

  const result = await query(
    `SELECT 
       ud.id AS unavailable_date_id, 
       ud.date, 
       ud.weekly_recurrence, 
       ud.monthly_recurrence, 
       ut.id AS time_slot_id, 
       ut.start_time, 
       ut.end_time
     FROM unavailable_dates ud
     LEFT JOIN unavailable_time_slots ut ON ud.id = ut.unavailable_date_id
     WHERE ud.venue_id = $1
     ORDER BY ud.date ASC`,
    [venue_id]
  );

  const unavailableData = result.rows.reduce((acc, row) => {
    const { unavailable_date_id, date, start_time, end_time, time_slot_id, weekly_recurrence, monthly_recurrence } = row;

    const formattedDate = format(new Date(date), "yyyy-MM-dd");

    if (!acc[formattedDate]) {
      acc[formattedDate] = {
        id: unavailable_date_id,
        weekly_recurrence,
        monthly_recurrence,
        time_slots: []
      };
    }

    if (start_time && end_time) {
      acc[formattedDate].time_slots.push({
        id: time_slot_id,
        start_time,
        end_time
      });
    }

    return acc;
  }, {});

  res.status(200).json(unavailableData);
});

// Update unavailable date and time
export const updateUnavailableDateTime = asyncHandler(async (req, res) => {
  const unavailableDateId = req.params.id;
  const { weekly_recurrence, monthly_recurrence } = req.body;

  let timeSlots = [];
  if(req.body.time_slots){
    try{
      timeSlots = req.body.time_slots;
    }
    catch (error) {
      return res.status(400).json({ message: "Invalid time slots format" });
    }
  }

  await query(
    `UPDATE unavailable_dates SET weekly_recurrence = $1, monthly_recurrence = $2 WHERE id = $3`,
    [weekly_recurrence, monthly_recurrence, unavailableDateId]
  );

  if(Array.isArray(timeSlots) && timeSlots.length > 0) {
    for(const slot of timeSlots) {
      if (slot.id) {
        await query(
          `UPDATE unavailable_time_slots SET start_time = $1, end_time = $2 WHERE id = $3`,
          [slot.start_time, slot.end_time, slot.id]
        );
      } else {
        await query(
          `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
          VALUES ($1, $2, $3)
          ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
          [unavailableDateId, slot.start_time, slot.end_time]
        );

      }
    }
  }else{
    await query(
      `DELETE FROM unavailable_time_slots WHERE unavailable_date_id = $1`,
      [unavailableDateId]
    );
  }

  // Log activity
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Update Unavailable Date/Time';
    const details = JSON.stringify({ unavailableDateId, weekly_recurrence, monthly_recurrence, timeSlots });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }

  res.status(200).json({ message: "Unavailable date and time updated successfully" });
});
export const insertTimeslots = asyncHandler( async (req,res) => {
  const id = req.params.id;
  const {startTime, endTime} = req.body;

  await query(
          `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
          VALUES ($1, $2, $3)
          ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
          [id, startTime, endTime]
  );
  // Log activity
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Insert Unavailable Time Slot';
    const details = JSON.stringify({ unavailable_date_id: id, startTime, endTime });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }
  res.status(200).json({ message: "Unavailable time added successfully" });

})

export const updateSlot = asyncHandler( async (req,res) => {
  const id = req.params.id
  const {startTime, endTime, dateId} = req.body
  
        if (id !== "no") {
          await query(
            `UPDATE unavailable_time_slots SET start_time = $1, end_time = $2 WHERE id = $3`,
            [startTime, endTime, id]
          );
        } else {
          await query(
            `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
            VALUES ($1, $2, $3)
            ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
            [dateId, startTime, endTime]
          );
        }
  // Log activity
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Update Unavailable Time Slot';
    const details = JSON.stringify({ id, startTime, endTime, dateId });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }
    res.status(200).json({ message: "Unavailable time updated successfully" });
  
})

// Delete unavailable date and time
export const deleteUnavailableDateTime = asyncHandler(async (req, res) => {
 const unavailableDateId = req.params.id;

  const result = await query(
    `SELECT COUNT(*) FROM unavailable_dates WHERE id = $1`,
    [unavailableDateId]
  );

  if (parseInt(result.rows[0].count) === 0) {
    return res.status(200).json({ message: "No matching unavailable date and time found" });
  }

  await query(
    `DELETE FROM unavailable_dates WHERE id = $1`,
    [unavailableDateId]
  );

  // Log activity
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Delete Unavailable Date/Time';
    const details = JSON.stringify({ unavailableDateId });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }

  res.status(200).json({ message: "Unavailable date and time deleted successfully" });
});

// Delete unavailable time slot
export const deleteUnavailableTimeSlot = asyncHandler(async (req, res) => {
  const timeSlotId = req.params.id;

  if (!timeSlotId) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const result = await query(
    `SELECT COUNT(*) FROM unavailable_time_slots WHERE id = $1`,
    [timeSlotId]
  );

  if (parseInt(result.rows[0].count) === 0) {
    return res.status(200).json({ message: "No matching unavailable time slot found" });
  }

  await query(
    `DELETE FROM unavailable_time_slots WHERE id = $1`,
    [timeSlotId]
  );

  // Log activity
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Delete Unavailable Time Slot';
    const details = JSON.stringify({ timeSlotId });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }

  res.status(200).json({ message: "Unavailable time slot deleted successfully" });
});



    





