import bcrypt from 'bcrypt'; // or: const bcrypt = require('bcrypt');
import pool from './config/db.config.js';

const saltRounds = 10;
const myPlaintextPassword = 'Password123';
//adminFinal
//Password123
//ticketMan
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed Password:', hashedPassword);

    await pool.query(
      `INSERT INTO users (fname, lname, email, phone_no, password, gender, username) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['Ticket', 'Man', 'ticketman@adwa.com', '0911223344', hashedPassword, 'Male', 'ticketMan']
    );

    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

hashPassword(myPlaintextPassword);
