import asyncHandler from "express-async-handler";
import pool from "../config/db.config.js";
import bcrypt from "bcryptjs";


// Utility function for error handling
const dbQuery = async (sql, values = []) => {
  try {
    const [result] = await pool.query(sql, values);
    return result; // result contains insertId for INSERT queries
  } catch (err) {
    throw err;
  }
}   


//@description Register a new visitor        
//@route POST /api/visitor/register
//@access Public    
export const registerVisitor = asyncHandler(async (req, res) => {
  const { fname, lname, email, phone_no, password,
    nationality, acc_type
   } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sqlUser = ` INSERT INTO users 
      (fname, lname, email, phone_no, password) 
      VALUES (?, ?, ?, ?, ?) 
    `;
    const valuesUser = [fname, lname, email, phone_no, hashedPassword];
    const visitor = await dbQuery(sqlUser, valuesUser);
    const userId = visitor.insertId;

    const sqlVisitor = `INSERT INTO visitor
      (user_id, nationality, acc_type) VALUES (?, ?, ?) 
    `;

    const valuesVisitor = [userId, nationality, acc_type];
    await dbQuery(sqlVisitor, valuesVisitor);

    res.status(201).json({ message: "Visitor registered successfully" });

  });

//@description Get all visitors
//@route GET /api/visitor
//@access Public
export const getAllVisitors = asyncHandler(async (req, res) => {
    const sql = `
        SELECT u.user_id, u.fname, u.lname, u.email, u.phone_no,
               v.nationality, v.acc_type
        FROM users u
        JOIN visitor v ON u.user_id = v.user_id
    `;

    const visitors = await dbQuery(sql);
    if(!visitors || visitors.length === 0) {
      return res.status(404).json({ message: "No visitors found" });
    }

    res.status(200).json(visitors);
});

//@description Get visitor by ID
//@route GET /api/visitor/:id   
//@access Public
export const getVisitorById = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const sql = `
        SELECT u.user_id, u.fname, u.lname, u.email, u.phone_no,
               v.nationality, v.acc_type
        FROM users u
        JOIN visitor v ON u.user_id = v.user_id
        WHERE v.user_id = ?
    `;

    const visitor = await dbQuery(sql, [userId]);
    if (!visitor || visitor.length === 0) {
        return res.status(404).json({ message: "Visitor not found" });
    }

    res.status(200).json(visitor[0]);
});

//@description Update visitor by ID
//@route PUT /api/visitor/:id
//@access Private
export const updateVisitor = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { nationality, acc_type, ...visitorFields } = req.body;

    let sqlUser = "UPDATE users SET ";
    const updateFields = [];
    const valuesUser = [];

    for (const [key, value] of Object.entries(visitorFields)) {
        if (key === "password") {
            updateFields.push("password = ?");
            valuesUser.push(await bcrypt.hash(value, 10));
        } else {
            updateFields.push(`${key} = ?`);
            valuesUser.push(value);
        }
    }

    sqlUser += updateFields.join(", ") + " WHERE user_id = ?";
    valuesUser.push(userId);
    await dbQuery(sqlUser, valuesUser);

    // Always update visitor table
    const sqlVisitor = "UPDATE visitor SET nationality = ?, acc_type = ? WHERE user_id = ?";
    await dbQuery(sqlVisitor, [nationality, acc_type, userId]);

    res.status(200).json({ message: "Visitor updated successfully" });
});

//@description delete visitor by ID
//@route DELETE /api/visitor/:id    
//@access Private
export const deleteVisitor = asyncHandler(async (req, res) => { 
    const userId = req.params.id;

    // Delete from visitor table
    const sqlVisitor = "DELETE FROM visitor WHERE user_id = ?";
    await dbQuery(sqlVisitor, [userId]);

    // Delete from users table
    const sqlUser = "DELETE FROM users WHERE user_id = ?";
    const result = await dbQuery(sqlUser, [userId]);

    if (!result || result.affectedRows === 0) {
        return res.status(404).json({ message: "Visitor not found" });
    }

    res.status(200).json({ message: "Visitor deleted successfully" });
});

