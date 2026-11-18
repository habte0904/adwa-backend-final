import { body } from "express-validator";
import { normalizeEmail } from "../utils/auth.util.js";
export const updateProfileValidator = [
  body("fname")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),
  body("lname")
    .trim()
    .notEmpty().withMessage("Last name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Last name must be 2-50 characters"),
  body("phone_no")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^(?:\+251[79]|0[79])\d{8}$/).withMessage("Invalid phone number format"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .customSanitizer(normalizeEmail),
  body("gender")
    .trim()
    .notEmpty().withMessage("Gender is required")
    .isIn(["male", "female", "Male", "Female"]).withMessage("Gender must be male or female"),
]


