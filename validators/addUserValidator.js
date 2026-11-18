import { body } from "express-validator";
import { normalizeEmail } from "../utils/auth.util.js";
// Validator for adding a new user
export const addUserValidator = [
  body("fname").notEmpty().withMessage("First name is required"),
  body("lname").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required").customSanitizer(normalizeEmail),
  body("phone_no")
  .matches(/^(?:\+251[79]|0[79])\d{8}$/)
  .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),
  body("gender").notEmpty().withMessage("Gender is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("role_id").notEmpty().withMessage("Role ID is required"),
];

export const updateUserValidator = [
  body("fname").optional().notEmpty().withMessage("First name cannot be empty"),
  body("lname").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email is required").customSanitizer(normalizeEmail),
  body("phone_no")
  .optional()
  .matches(/^(?:\+251[79]|0[79])\d{8}$/)
  .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),
  body("gender").optional().notEmpty().withMessage("Gender is required"),
  body("department").optional().notEmpty().withMessage("Department is required"),
  body("role_id").optional().notEmpty().withMessage("Role ID is required"),
];

export const addVisitorValidator = [
  body("nationality").notEmpty().withMessage("Nationality is required"),
  body("fname").notEmpty().withMessage("First name is required"),
  body("lname").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required").customSanitizer(normalizeEmail),
  body("phone_no")
  .matches(/^(?:\+251[79]|0[79])\d{8}$/)
  .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),
  body("gender").optional().notEmpty().withMessage("Gender is required"),
  body("acc_type").notEmpty().withMessage("Account type is required"),
];

export const updateVisitorValidator = [
  body("nationality").notEmpty().withMessage("Nationality is required"),
  body("fname").notEmpty().withMessage("First name is required"),
  body("lname").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email is required").customSanitizer(normalizeEmail),
  body("phone_no")
  .matches(/^(?:\+251[79]|0[79])\d{8}$/)
  .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),
  body("gender").optional().notEmpty().withMessage("Gender is required"),
  body("acc_type").notEmpty().withMessage("Account type is required"),
];

