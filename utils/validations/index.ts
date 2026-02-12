/**
 * Validation Schemas
 *
 * This module exports all validation schemas used throughout the application.
 * All schemas are built using Zod for type-safe runtime validation.
 *
 * Usage:
 * ```ts
 * import { createEmployeeSchema } from "../../utils/validations";
 *
 * const result = createEmployeeSchema.parse(formData);
 * ```
 */

export * from "./employeeValidation";
