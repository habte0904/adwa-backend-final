import asyncHandler from "express-async-handler"
import pool from "../config/db.config.js"
import dotenv from 'dotenv';
import { validateDocumentImageFile } from "../utils/imageValidation.js";
dotenv.config();


// Utility function for querying PostgreSQL
const dbQuery = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};

export const calculateTotalPayment = async (request_id) => {
  const sql = `
    SELECT 
        sr.id AS request_id,
        sf.currency,
        SUM(
          CASE 
            WHEN sr.category ILIKE 'plaza' THEN sf.price_per_sqm * COALESCE(rd.area_sqm, sr.area_sqm, 0)
            WHEN rd.is_half_day THEN sf.price_half_day
            ELSE sf.price_full_day
          END
        ) AS total_price
    FROM service_requests sr
    JOIN service_facility sf
        ON sf.category_id = (SELECT sc.id FROM service_category sc WHERE sc.category = sr.category)
      AND sf.venue_id = (SELECT v.venue_id FROM venue_schedule v WHERE v.venue = sr.venue)
    JOIN request_dates rd ON sr.id = rd.request_id
    WHERE sr.id = $1 AND sf.is_deleted = false
    GROUP BY sr.id, sf.currency;
  `;

  const result = await pool.query(sql, [request_id]);

  if (result.rowCount === 0) {
    const fallbackSql = `
        SELECT sr.id, sf.currency 
        FROM service_requests sr
        JOIN service_facility sf ON sf.category_id = (SELECT sc.id FROM service_category sc WHERE sc.category = sr.category)
        AND sf.venue_id = (SELECT v.venue_id FROM venue_schedule v WHERE v.venue = sr.venue)
        WHERE sr.id = $1 AND sf.is_deleted = false
    `;
    const fallback = await pool.query(fallbackSql, [request_id]);
    if (fallback.rowCount === 0) throw new Error(`Invalid request_id: ${request_id}`);

    return {
      request_id: fallback.rows[0].id,
      total_price: 0,
      currency: fallback.rows[0].currency
    };
  }

  const data = result.rows[0];
  return {
    request_id: data.request_id,
    total_price: data.total_price,
    currency: data.currency
  };
};

// Create new service request
export const createServiceRequest = asyncHandler(async (req, res) => {

  const { organizationName, contactPerson, phoneNo, expectedAttendees, venue, category, area_sqm } = req.body;
  const email = req.user.email;
  let dates = [];

  if (req.body.date) {
    try {
      dates = JSON.parse(req.body.date);
    } catch (err) {
      return res.status(400).json({ message: "Invalid date format" });
    }
  }


  // Handle file
  let attachment = null;
  if (req.file) {
    const filePath = await validateDocumentImageFile(req.file);
    if (!filePath) {
      return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    attachment = `${process.env.BACKEND_BASEURL}/${filePath}`
  } else {
    return res.status(400).json({ message: "Upload file" });
  }

  const requestSql = `
        INSERT INTO service_requests (org_name, contact_person, email, phone_no,
            exp_attendees, venue, category, status, file, area_sqm)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`
  const values = [organizationName, contactPerson, email, phoneNo, expectedAttendees, venue, category, "draft", attachment, area_sqm ? parseFloat(area_sqm) : null]

  const result = await dbQuery(requestSql, values);
  const request_id = result.rows[0].id;


  for (const entry of dates) {

    const existing = await dbQuery(
      `SELECT id FROM request_dates WHERE request_id = $1 AND date = $2`,
      [request_id, entry.date]
    );

    if (existing.rows.length === 0) {
      const dateResult = await dbQuery(
        "INSERT INTO request_dates (request_id, date, is_half_day, full_day, area_sqm) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [request_id, entry.date, entry.is_half_day || false, true, entry.area_sqm ? parseFloat(entry.area_sqm) : null]
      );

      const unavailableDateId = dateResult.rows[0].id;

      if (Array.isArray(entry.time_slots) && entry.time_slots.length > 0) {
        for (const slot of entry.time_slots) {
          if (!slot.id) {
            await dbQuery(
              `INSERT INTO request_timeslot (request_date_id, start_time, end_time)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (request_date_id, start_time, end_time) DO NOTHING`,
              [unavailableDateId, slot.start_time, slot.end_time]
            );
          }
        }
      }
    }
  }

  const { total_price, currency } = await calculateTotalPayment(request_id)
  await dbQuery(`UPDATE service_requests SET amount=$1, currency=$2 WHERE id=$3`, [total_price, currency, request_id])
  res.status(201).json({ message: "service request created successfully!" });
})

export const updateServiceRequest = asyncHandler(async (req, res) => {

  const id = parseInt(req.params.id, 10);
  const { ...requestFields } = req.body;
  let dates = [];

  if (req.body.date) {
    try {
      dates = JSON.parse(req.body.date);
    } catch (err) {
      return res.status(400).json({ message: "Invalid date format" });
    }
  }

  // Handle file
  let attachment = null;
  if (req.file) {
    const filePath = await validateDocumentImageFile(req.file);
    if (!filePath) {
      return res.status(400).json({ error: "Invalid image file uploaded." });
    }
    attachment = `${process.env.BACKEND_BASEURL}/${filePath}`
  } else {
    attachment = req.body.file
  }


  // 1. Check current status and ownership
  const { rows } = await dbQuery("SELECT status, paid, email FROM service_requests WHERE id = $1", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (rows[0].email !== req.user.email) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  if ((rows[0].status !== "draft") || rows[0].paid) {
    return res.status(400).json({ error: "Only pending requests can be edited" });
  }

  // 2. Whitelist allowed fields
  const allowedFields = [
    "org_name",
    "contact_person",
    "email",
    "phone_no",
    "exp_attendees",
    "status",
    "area_sqm"
  ];

  const requestKeys = Object.keys(requestFields).filter((key) =>
    allowedFields.includes(key)
  );

  if (requestKeys.length === 0 && !dates) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }

  // 3. Build SQL update safely
  if (requestKeys.length > 0) {
    const setString = requestKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const requestValues = requestKeys.map((key) => requestFields[key]);
    let sqlRequest;
    if (req.body.status) {
      if (req.body.status === "pending") {
        sqlRequest = await dbQuery(`
            UPDATE service_requests
            SET status =$1
            WHERE id = $2
          `, ['pending', id]);
      }
      else { }
    } else {
      sqlRequest = `
          UPDATE service_requests
          SET ${setString}, file = $${requestKeys.length + 1}, area_sqm = $${requestKeys.length + 2}
          WHERE id = $${requestKeys.length + 3}
        `;
      const area_sqm = req.body.area_sqm ? parseFloat(req.body.area_sqm) : null;
      await dbQuery(sqlRequest, [...requestValues, attachment, area_sqm, id]);
    }

  }

  //  2. Handle date and timeslot updates if `date` is provided
  if (dates) {
    for (const entry of dates) {
      const entryDate = entry.date; // date value
      let unavailableDateId;

      //  Check if date exists for this request
      const existing = await dbQuery(
        `SELECT id FROM request_dates WHERE request_id = $1 AND date = $2`,
        [id, entryDate]
      );

      if (existing.rows.length === 0) {
        //  Insert new date if not exists
        const dateResult = await dbQuery(
          `INSERT INTO request_dates (request_id, date, is_half_day, full_day, area_sqm) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [id, entryDate, entry.is_half_day || false, true, entry.area_sqm ? parseFloat(entry.area_sqm) : null]
        );
        unavailableDateId = dateResult.rows[0].id;
      } else {
        unavailableDateId = existing.rows[0].id;
        // Update is_half_day if provided
        if (entry.is_half_day !== undefined) {
          await dbQuery(`UPDATE request_dates SET is_half_day = $1, area_sqm = $2 WHERE id = $3`, [entry.is_half_day, entry.area_sqm ? parseFloat(entry.area_sqm) : null, unavailableDateId]);
        } else if (entry.area_sqm !== undefined) {
          await dbQuery(`UPDATE request_dates SET area_sqm = $1 WHERE id = $2`, [entry.area_sqm ? parseFloat(entry.area_sqm) : null, unavailableDateId]);
        }
      }

      //  Handle time slots for this date
      const timeSlots = entry.time_slots || [];

      if (Array.isArray(timeSlots) && timeSlots.length > 0) {
        for (const slot of timeSlots) {
          if (slot.id) {
            //  Update existing timeslot
            await dbQuery(
              `UPDATE request_timeslot 
               SET start_time = $1, end_time = $2 
               WHERE id = $3 AND request_date_id = $4`,
              [slot.start_time, slot.end_time, slot.id, unavailableDateId]
            );
          } else {
            //  Insert new timeslot if it does not exist
            await dbQuery(
              `INSERT INTO request_timeslot (request_date_id, start_time, end_time)
               VALUES ($1, $2, $3)
               ON CONFLICT (request_date_id, start_time, end_time) DO NOTHING`,
              [unavailableDateId, slot.start_time, slot.end_time]
            );
          }
        }
      } else {
        //  If no timeslots provided, delete all for this date
        await dbQuery(
          `DELETE FROM request_timeslot WHERE request_date_id = $1`,
          [unavailableDateId]
        );
      }
    }
  }
  const { total_price, currency } = await calculateTotalPayment(id)
  await dbQuery(`UPDATE service_requests SET amount=$1, currency=$2 WHERE id=$3`, [total_price, currency, id])
  res.status(200).json({ message: "Service request updated successfully!" });
});


export const getSpecificRequest = asyncHandler(async (req, res) => {
  try {
    //console.log("email",req.body.email)
    //  1. Get all service requests
    const requestsResult = await dbQuery(`
    SELECT sr.id, sr.org_name AS "organizationName", sr.contact_person AS "contactPerson",
     sr.email, sr.phone_no AS "phoneNo", sr.exp_attendees AS "expectedAttendees", sr.amount,
     sr.currency,
     sr.venue, vs.venue_id, sr.category, sr.updated_at, sr.status, sr.paid, sr.file, sr.payment_slip, sr.payment_flag AS paymentFlag, sr.created_at AS "createdAt",
     sf.price_half_day, sf.price_full_day, sf.price_per_sqm, sr.area_sqm, sr.approved_at
   FROM service_requests sr
   JOIN venue_schedule vs ON sr.venue = vs.venue
   JOIN service_category sc ON sc.category = sr.category 
   JOIN service_facility sf ON sf.category_id = sc.id AND sf.venue_id = vs.venue_id
   WHERE sr.email = $1
   ORDER BY sr.updated_at DESC
   `, [req.user.email]);

    const requests = requestsResult.rows;

    if (requests.length === 0) {
      return res.status(200).json([]);
    }

    //  2. Get all request_dates and request_timeslot in one go
    const datesResult = await dbQuery(`
      SELECT rd.id AS "dateId", rd.request_id, rd.date, rd.is_half_day, rd.full_day, rd.area_sqm,
             rt.id AS "slotId", rt.start_time, rt.end_time
      FROM request_dates rd
      LEFT JOIN request_timeslot rt ON rd.id = rt.request_date_id
      ORDER BY rd.date ASC, rt.start_time ASC
    `);

    const datesData = datesResult.rows;

    //  3. Group dates and timeslots under their request
    const requestMap = {};

    for (const req of requests) {
      requestMap[req.id] = {
        ...req,
        date: {} // Will hold the structured date object
      };
    }

    for (const row of datesData) {
      const { request_id, dateId, date, slotId, start_time, end_time, area_sqm } = row;

      if (!requestMap[request_id]) continue;

      //  Initialize date entry if not present
      if (!requestMap[request_id].date[date]) {

        requestMap[request_id].date[date] = {
          id: dateId,
          date: new Date(date),
          fullDay: row.full_day,
          isHalfDay: row.is_half_day,
          timeSlots: [],
          area_sqm: area_sqm
        };
      }

      //  Add timeslot if exists
      if (slotId) {
        requestMap[request_id].date[date].timeSlots.push({
          id: slotId,
          slot_id: slotId,
          startTime: start_time,
          endTime: end_time
        });
        requestMap[request_id].date[date].fullDay = false;
      }
    }

    //  Convert map back to array
    const response = Object.values(requestMap).sort((a, b) => b.updated_at - a.updated_at);

    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const getReserveRequest = asyncHandler(async (req, res) => {
  const { tx_ref } = req.params;


  try {
    //  1. Get all service requests
    const requestsResult = await dbQuery(`
      SELECT sr.id, sr.org_name AS "organizationName", sr.contact_person AS "contactPerson",
       sr.email, sr.phone_no AS "phoneNo", sr.exp_attendees AS "expectedAttendees",sr.amount,
       sr.currency,sr.venue, vs.venue_id,sc.category_am, vs.venue_am,  sr.category, sr.status, sr.paid, sr.payment_slip, sr.created_at AS "createdAt",
       sf.price_half_day, sf.price_full_day, sr.approved_at
    FROM service_requests sr
    JOIN venue_schedule vs ON sr.venue = vs.venue
    JOIN service_category sc ON sr.category = sc.category
    JOIN service_facility sf ON sf.category_id = sc.id AND sf.venue_id = vs.venue_id
    WHERE sr.tx_ref = $1 AND sr.email = $2
    ORDER BY sr.created_at DESC
    `, [tx_ref, req.user.email]);

    const requests = requestsResult.rows;

    if (requests.length === 0) {
      return res.status(200).json([]);
    }

    //  2. Get all request_dates and request_timeslot in one go
    const datesResult = await dbQuery(`
      SELECT rd.id AS "dateId", rd.request_id, rd.date, rd.is_half_day, rd.full_day, rd.area_sqm,
             rt.id AS "slotId", rt.start_time, rt.end_time
      FROM request_dates rd
      LEFT JOIN request_timeslot rt ON rd.id = rt.request_date_id
      ORDER BY rd.date ASC, rt.start_time ASC
    `);

    const datesData = datesResult.rows;

    //  3. Group dates and timeslots under their request
    const requestMap = {};

    for (const req of requests) {
      requestMap[req.id] = {
        ...req,
        date: {} // Will hold the structured date object
      };
    }

    for (const row of datesData) {
      const { request_id, dateId, date, slotId, start_time, end_time, area_sqm } = row;

      if (!requestMap[request_id]) continue;

      //  Initialize date entry if not present
      if (!requestMap[request_id].date[date]) {

        requestMap[request_id].date[date] = {
          id: dateId,
          date: new Date(date),
          fullDay: row.full_day,
          isHalfDay: row.is_half_day,
          timeSlots: [],
          area_sqm: area_sqm
        };
      }

      //  Add timeslot if exists
      if (slotId) {
        requestMap[request_id].date[date].timeSlots.push({
          id: slotId,
          slot_id: slotId,
          startTime: start_time,
          endTime: end_time
        });
        requestMap[request_id].date[date].fullDay = false;
      }
    }

    //  Convert map back to array
    const response = Object.values(requestMap);

    res.status(200).json(response[0]);

  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})

// Add new unavailable date and time
export const addUnavailableDateTime = asyncHandler(async (req, res) => {
  const { unavailable_dates } = req.body;
  const venue_id = req.params.venue_id;

  if (!unavailable_dates || !Array.isArray(unavailable_dates)) {
    return res.status(400).json({ message: "Invalid input data" });
  }


  for (const entry of unavailable_dates) {
    const existing = await dbQuery(
      `SELECT id FROM unavailable_dates WHERE venue_id = $1 AND date = $2`,
      [venue_id, entry.date]
    );

    if (existing.rows.length === 0) {
      const dateResult = await dbQuery(
        "INSERT INTO unavailable_dates (venue_id, date, weekly_recurrence, monthly_recurrence) VALUES ($1, $2, $3, $4) RETURNING id",
        [venue_id, entry.date, entry.weekly_recurrence, entry.monthly_recurrence]
      );

      const unavailableDateId = dateResult.rows[0].id;

      if (Array.isArray(entry.time_slots) && entry.time_slots.length > 0) {
        for (const slot of entry.time_slots) {
          await dbQuery(
            `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
            [unavailableDateId, slot.start_time, slot.end_time]
          );
        }
      }
    }
    else {
      if (Array.isArray(entry.time_slots) && entry.time_slots.length > 0) {
        for (const slot of entry.time_slots) {
          await dbQuery(
            `INSERT INTO unavailable_time_slots (unavailable_date_id, start_time, end_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (unavailable_date_id, start_time, end_time) DO NOTHING`,
            [existing.rows[0].id, slot.start_time, slot.end_time]
          );
        }
      }

    }

  }


  res.status(201).json({ message: "Unavailable dates and times added successfully" });
});

// Delete unavailable date and time
export const deleteUnavailableDateTime = asyncHandler(async (req, res) => {
  const unavailableDateId = req.params.id;

  const result = await dbQuery(
    `SELECT rd.id, sr.email FROM request_dates rd JOIN service_requests sr ON rd.request_id = sr.id WHERE rd.id = $1`,
    [unavailableDateId]
  );

  if (result.rows.length === 0) {
    return res.status(200).json({ message: "No matching unavailable date and time found" });
  }

  if (result.rows[0].email !== req.user.email) {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  await dbQuery(
    `DELETE FROM request_dates WHERE id = $1`,
    [unavailableDateId]
  );

  res.status(200).json({ message: "Unavailable date and time deleted successfully" });

});

// Delete unavailable time slot
export const deleteUnavailableTimeSlot = asyncHandler(async (req, res) => {
  const timeSlotId = req.params.id;

  if (!timeSlotId) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const result = await dbQuery(
    `SELECT rt.id, sr.email FROM request_timeslot rt JOIN request_dates rd ON rt.request_date_id = rd.id JOIN service_requests sr ON rd.request_id = sr.id WHERE rt.id = $1`,
    [timeSlotId]
  );

  if (result.rows.length === 0) {
    return res.status(200).json({ message: "No matching unavailable time slot found" });
  }

  if (result.rows[0].email !== req.user.email) {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  await dbQuery(
    `DELETE FROM request_timeslot WHERE id = $1`,
    [timeSlotId]
  );

  res.status(200).json({ message: "Unavailable time slot deleted successfully" });
});

// Delete service request
export const deleteServiceRequest = asyncHandler(async (req, res) => {
  const id = req.params.id
  const result = await dbQuery(`SELECT id, email from service_requests WHERE id = $1`, [id])
  if (result.rowCount === 0) {
    return res.status(200).json({ message: "There is no request!" })
  }
  if (result.rows[0].email !== req.user.email) {
    return res.status(403).json({ message: "Unauthorized to delete this request!" });
  }

  await dbQuery(`DELETE from service_requests WHERE id = $1`, [id])
  res.status(200).json({ message: "Request deleted successfully!" })
})



// Delete unavailable date and time
export const deleteUnavailableDateTimeVenue = asyncHandler(async (req, res) => {
  const unavailableDateId = req.params.id;

  const result = await dbQuery(
    `SELECT COUNT(*) FROM unavailable_dates WHERE id = $1`,
    [unavailableDateId]
  );

  if (parseInt(result.rows[0].count) === 0) {
    return res.status(200).json({ message: "No matching unavailable date and time found" });
  }

  await dbQuery(
    `DELETE FROM unavailable_dates WHERE id = $1`,
    [unavailableDateId]
  );

  res.status(200).json({ message: "Unavailable date and time deleted successfully" });
});

// Delete unavailable time slot
export const deleteUnavailableTimeSlotVenue = asyncHandler(async (req, res) => {
  const timeSlotId = req.params.id;

  if (!timeSlotId) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const result = await dbQuery(
    `SELECT COUNT(*) FROM unavailable_time_slots WHERE id = $1`,
    [timeSlotId]
  );

  if (parseInt(result.rows[0].count) === 0) {
    return res.status(200).json({ message: "No matching unavailable time slot found" });
  }

  await dbQuery(
    `DELETE FROM unavailable_time_slots WHERE id = $1`,
    [timeSlotId]
  );

  res.status(200).json({ message: "Unavailable time slot deleted successfully" });
});


export const uploadPaymentSlip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "Please upload a payment slip file." });
  }

  const verifyRes = await dbQuery("SELECT id, email FROM service_requests WHERE id = $1", [id]);
  if (verifyRes.rowCount === 0) return res.status(404).json({ error: "Service request not found." });
  if (verifyRes.rows[0].email !== req.user.email) return res.status(403).json({ error: "Unauthorized access" });

  const filePath = await validateDocumentImageFile(req.file);
  if (!filePath) {
    return res.status(400).json({ error: "Invalid file type. Please upload an image or PDF." });
  }

  const paymentSlipUrl = `${process.env.BACKEND_BASEURL}/${filePath}`;

  const result = await dbQuery(
    "UPDATE service_requests SET payment_slip = $1 WHERE id = $2 RETURNING id",
    [paymentSlipUrl, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Service request not found." });
  }

  res.status(200).json({
    message: "Payment slip uploaded successfully!",
    payment_slip: paymentSlipUrl
  });
});

