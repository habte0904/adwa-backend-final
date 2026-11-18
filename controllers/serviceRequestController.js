import asyncHandler from "express-async-handler"
import pool from "../config/db.config.js"
import dotenv from 'dotenv'
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { logActivity } from '../services/activityLog.service.js';
import { validateDocumentImageFile } from "../utils/imageValidation.js";
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

// Utility function for querying PostgreSQL
const dbQuery = async (sql, values = []) => {
  try {
    const result = await pool.query(sql, values);
    return result;
  } catch (err) {
    throw err;
  }
};

const calculateTotalPayment = async (request_id) => {
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
  const { organizationName, contactPerson, email, phoneNo, expectedAttendees, venue, category, status, area_sqm } = req.body;
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
  }




  const requestSql = `
        INSERT INTO service_requests (org_name, contact_person, email, phone_no,
            exp_attendees, venue, category, status, file, area_sqm)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`
  const values = [organizationName, contactPerson, email, phoneNo, expectedAttendees, venue, category, "pending", attachment, area_sqm ? parseFloat(area_sqm) : null]

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

  const { total_price, currency } = await calculateTotalPayment(request_id);
  await dbQuery(`UPDATE service_requests SET amount = $1, currency = $2 WHERE id = $3`, [total_price, currency, request_id]);

  res.status(201).json({ message: "service request created successfully!" });
  // Audit log: Create Service Request
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Create Service Request';
    const details = JSON.stringify({ organizationName, contactPerson, email, phoneNo, expectedAttendees, venue, category, dates });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }

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

  // 1. Check current status
  const { rows } = await dbQuery("SELECT paid, status FROM service_requests WHERE id = $1", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: "Request not found" });
  }
  if ((rows[0].status === "reject")) {
    return res.status(400).json({ error: "Only pending requests can be edited" });
  }

  // 2. Whitelist allowed fields
  const allowedFields = [
    "org_name",
    "contact_person",
    "email",
    "phone_no",
    "exp_attendees",
    "venue",
    "category",
    "status",
    "paid",
    "amount",
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

    let setString = requestKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const requestValues = requestKeys.map((key) => requestFields[key]);

    // If status is being updated and is "approved", also set approved_at
    // if (requestFields.status && requestFields.status.toLowerCase() === "approved") {
    //   setString += `, approved_at = NOW()`;
    // }


    let sqlRequest;
    if (req.body.status === "approved") {
      const amount = req.body.amount !== undefined ? req.body.amount : null;
      sqlRequest = await dbQuery(`
                 UPDATE service_requests
              SET status = $1, approved_at = NOW(), payment_flag = true, 
                  amount = $2
              WHERE id = $3
            `, [req.body.status, amount, id]);
    } else if (req.body.status) {
      // Handle other statuses (rejected, etc)
      sqlRequest = await dbQuery(`
              UPDATE service_requests
              SET status = $1
              WHERE id = $2
            `, [req.body.status, id]);
    } else if (req.body.amount !== undefined && requestKeys.includes('amount')) {
      // Handle standalone amount updates
      const amount = req.body.amount;

      sqlRequest = await dbQuery(`
            UPDATE service_requests
            SET amount = $1
            WHERE id = $2
          `, [amount, id]);
    } else {
      sqlRequest = `
          UPDATE service_requests
          SET ${setString} ,file =$${requestKeys.length + 1}
          WHERE id = $${requestKeys.length + 2}
        `;
      await dbQuery(sqlRequest, [...requestValues, attachment, id]);
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
        // Update is_half_day if it exists in entry
        if (entry.is_half_day !== undefined) {
          await dbQuery(
            `UPDATE request_dates SET is_half_day = $1, area_sqm = $2 WHERE id = $3`,
            [entry.is_half_day, entry.area_sqm ? parseFloat(entry.area_sqm) : null, unavailableDateId]
          );
        } else if (entry.area_sqm !== undefined) {
          await dbQuery(
            `UPDATE request_dates SET area_sqm = $1 WHERE id = $2`,
            [entry.area_sqm ? parseFloat(entry.area_sqm) : null, unavailableDateId]
          );
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

  if (req.body.amount === undefined) {
    const { total_price, currency } = await calculateTotalPayment(id);
    await dbQuery(`UPDATE service_requests SET amount = $1, currency = $2 WHERE id = $3`, [total_price, currency, id]);
  }

  res.status(200).json({ message: "Service request updated successfully!" });
  // Audit log: Update Service Request
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Update Service Request';
    const details = JSON.stringify({ id, requestFields, dates });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }
});


// Get all service requests
export const getAllRequests = asyncHandler(async (req, res) => {
  try {
    //  1. Get all service requests
    const requestsResult = await dbQuery(`
      SELECT id, org_name AS "organizationName", contact_person AS "contactPerson",
             email, phone_no AS "phoneNo", exp_attendees AS "expectedAttendees",
             venue, category, updated_at, approved_at, status, paid, file, payment_slip, 
             created_at AS "createdAt", amount, currency, area_sqm
      FROM service_requests
      WHERE status != 'draft'
      ORDER BY updated_at DESC
    `);

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

export const getSpecificRequest = asyncHandler(async (req, res) => {
  try {
    //console.log("email",req.body.email)
    //  1. Get all service requests
    const requestsResult = await dbQuery(`
      SELECT id, org_name AS "organizationName", contact_person AS "contactPerson",
             email, phone_no AS "phoneNo", exp_attendees AS "expectedAttendees",
             venue, category, status, paid, created_at AS "createdAt", 
             approved_at, amount, currency, area_sqm
      FROM service_requests
      WHERE email = $1
      ORDER BY created_at DESC
    `, [req.body.email]);

    const requests = requestsResult.rows;

    if (requests.length === 0) {
      return res.status(200).json([]);
    }

    //  2. Get all request_dates and request_timeslot in one go
    const datesResult = await dbQuery(`
      SELECT rd.id AS "dateId", rd.request_id, rd.date, rd.is_half_day, rd.full_day,
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
      const { request_id, dateId, date, slotId, start_time, end_time } = row;

      if (!requestMap[request_id]) continue;

      //  Initialize date entry if not present
      if (!requestMap[request_id].date[date]) {
        requestMap[request_id].date[date] = {
          id: dateId,
          date: new Date(date),
          fullDay: row.full_day,
          isHalfDay: row.is_half_day,
          timeSlots: []
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

    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Send message 
export const sendMessage = asyncHandler(async (req, res) => {
  const { email, organizationName, contactPerson, message } = req.body;

  try {
    await transporter.sendMail({
      from: `"Service Team" <${process.env.EVT_SMTP_USER}>`,
      to: email,
      subject: "Update on your service request at Adwa Victory Memorial",
      html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Service Request Update</title>
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
                  margin-bottom: 20px;
                  font-weight: 500;
                }
                .organization {
                  background-color: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 15px 20px;
                  margin: 20px 0;
                  border-radius: 0 8px 8px 0;
                }
                .organization strong {
                  color: #92400e;
                }
                .message-content {
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 25px;
                  margin: 25px 0;
                  font-size: 16px;
                  line-height: 1.7;
                }
                .signature {
                  margin-top: 30px;
                  padding-top: 20px;
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
                  padding: 25px 30px;
                  text-align: center;
                  font-size: 13px;
                }
                .footer-content {
                  margin-bottom: 15px;
                }
                .footer-links {
                  margin-top: 15px;
                  padding-top: 15px;
                  border-top: 1px solid #334155;
                }
                .footer a {
                  color: #f59e0b;
                  text-decoration: none;
                }
                .footer a:hover {
                  text-decoration: underline;
                }
                .divider {
                  height: 2px;
                  background: linear-gradient(90deg, #d97706, #f59e0b, #d97706);
                  margin: 0;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>🏛️ Adwa Victory Memorial </h1>
                  <p>Service Request Update Notification</p>
                </div>
                
                <div class="divider"></div>
                
                <div class="content">
                  <div class="greeting">
                    Dear ${contactPerson},
                  </div>
                  
                  ${organizationName
          ? `
                  <div class="organization">
                    <strong>Organization:</strong> ${organizationName}
                  </div>
                  `
          : ""
        }
                  
                  <div class="message-content">
                    ${message}
                  </div>
                  
                  <div class="signature">
                    <p>Best regards,</p>
                    <p class="team-name">Service Team</p>
                    <p class="museum-name">Adwa Victory Memorial </p>
                  </div>
                </div>
                
                <div class="footer">
                  <div class="footer-content">
                    <strong>Adwa Victory Memorial </strong><br>
                    Preserving History • Inspiring Future
                  </div>
                  
                  <div class="footer-links">
                    <p>© 2025 Adwa Victory Memorial. All rights reserved.</p>
                    <p>
                      <a href="mailto:info@adwamemorial.org">Contact Us</a> • 
                      <a href="#">Visit Our Website</a> • 
                      <a href="#">Museum Hours</a>
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
    })
  } catch (emailErr) {
    console.error(`Failed to send to ${email}:`, emailErr.message)
    return res.status(500).json({ message: "Failed to send email", error: emailErr.message })
  }
  res.status(200).json({ message: "email sent succefully!" });
  // Audit log: Send Service Request Message
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Send Service Request Message';
    const details = JSON.stringify({ email, organizationName, contactPerson, message });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }
})


// Delete unavailable date and time
export const deleteUnavailableDateTime = asyncHandler(async (req, res) => {
  const unavailableDateId = req.params.id;

  const result = await dbQuery(
    `SELECT COUNT(*) FROM request_dates WHERE id = $1`,
    [unavailableDateId]
  );

  if (parseInt(result.rows[0].count) === 0) {
    return res.status(200).json({ message: "No matching unavailable date and time found" });
  }

  await dbQuery(
    `DELETE FROM request_dates WHERE id = $1`,
    [unavailableDateId]
  );

  res.status(200).json({ message: "Unavailable date and time deleted successfully" });
  // Audit log: Delete Unavailable Date/Time (Service Request)
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Delete Unavailable Date/Time (Service Request)';
    const details = JSON.stringify({ unavailableDateId });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }
});

// Delete unavailable time slot
export const deleteUnavailableTimeSlot = asyncHandler(async (req, res) => {
  const timeSlotId = req.params.id;

  if (!timeSlotId) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const result = await dbQuery(
    `SELECT COUNT(*) FROM request_timeslot WHERE id = $1`,
    [timeSlotId]
  );

  if (parseInt(result.rows[0].count) === 0) {
    return res.status(200).json({ message: "No matching unavailable time slot found" });
  }

  await dbQuery(
    `DELETE FROM request_timeslot WHERE id = $1`,
    [timeSlotId]
  );

  res.status(200).json({ message: "Unavailable time slot deleted successfully" });
  // Audit log: Delete Unavailable Time Slot (Service Request)
  try {
    const userId = req.user?.id || null;
    const userName = req.user?.username || 'Unknown';
    const role = req.user?.roleName || 'Unknown';
    const department = req.user?.department || 'Unknown';
    const action = 'Delete Unavailable Time Slot (Service Request)';
    const details = JSON.stringify({ timeSlotId });
    logActivity({ userId, userName, role, department, action, details });
  } catch (e) { console.error('Activity log error:', e); }
});

// Delete service request
export const deleteServiceRequest = asyncHandler(async (req, res) => {
  const id = req.params.id
  const result = await dbQuery(`SELECT id from service_requests WHERE id = $1`, [id])
  if (result.rowCount === 0) {
    res.status(200).json({ message: "There is no request!" })
  }

  await dbQuery(`DELETE from service_requests WHERE id = $1`, [id])
  res.status(200).json({ message: "Request deleted successfully!" })
})
