import { body } from "express-validator";

export const eventInfoValidator = [
  body("full_name")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ min: 2, max: 50 }).withMessage("First name must be 2-50 characters"),

  body("email")
    .if((value, { req }) => !req.body.walkin)
    .isEmail().withMessage("Valid email is required"),

  body("phone_no")
    .if((value, { req }) => !req.body.walkin)
    .matches(/^(?:\+251[79]|0[79])\d{8}$/)
    .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),
];


