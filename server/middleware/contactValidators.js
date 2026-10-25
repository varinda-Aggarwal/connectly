import { body } from "express-validator";

export const contactValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),
];