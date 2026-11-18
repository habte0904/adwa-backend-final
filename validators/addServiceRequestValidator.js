import { body } from "express-validator";

export const addServiceRequestValidator = [
  body("organizationName")
    .notEmpty()
    .withMessage("Organization name is required"),

  body("contactPerson")
    .notEmpty()
    .withMessage("Contact person is required"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("phoneNo")
    .matches(/^(?:\+251[79]|0[79])\d{8}$/)
    .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),

  body("expectedAttendees")
    .isInt({ min: 1 })
    .withMessage("Expected attendees must be a positive number"),

  body("venue")
    .notEmpty()
    .withMessage("Venue is required"),

  body("category")
    .notEmpty()
    .withMessage("Category is required"),
];

export const updateServiceRequestValidator = [
  body("org_name")
    .optional()
    .notEmpty()
    .withMessage("Organization name must be a string"),

  body("contact_person")
    .optional()
    .notEmpty()
    .withMessage("Contact person must be a string"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Email must be valid"),

  body("phone_no")
    .optional()
    .matches(/^(?:\+251[79]|0[79])\d{8}$/)
    .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),

  body("exp_attendees")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Expected attendees must be a positive number"),
  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "draft"])
    .withMessage("Status must be one of: pending, approved, rejected"),
];

export const addServiceRequestValidatorUser = [
  body("organizationName")
    .notEmpty()
    .withMessage("Organization name is required"),

  body("contactPerson")
    .notEmpty()
    .withMessage("Contact person is required"),

  body("phoneNo")
    .matches(/^(?:\+251[79]|0[79])\d{8}$/)
    .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),

  body("expectedAttendees")
    .isInt({ min: 1 })
    .withMessage("Expected attendees must be a positive number"),
];

export const updateServiceRequestValidatorUser = [
  body("org_name")
    .optional()
    .notEmpty()
    .withMessage("Organization name must be a string"),

  body("contact_person")
    .optional()
    .notEmpty()
    .withMessage("Contact person must be a string"),

  body("phone_no")
    .optional()
    .matches(/^(?:\+251[79]|0[79])\d{8}$/)
    .withMessage("Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"),

  body("exp_attendees")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Expected attendees must be a positive number"),
  body("status")
    .optional()
    .isIn(["pending"])
    .withMessage("Status must be one of: pending, approved, rejected"),
];
