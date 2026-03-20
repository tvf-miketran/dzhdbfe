import { z } from "zod";

/**
 * Validation schema for creating a new employee
 */
export const createEmployeeSchema = z.object({
  vnFullName: z
    .string()
    .min(1, "Vietnamese name is required")
    .max(100, "Name is too long"),
  enFullName: z
    .string()
    .min(1, "English name is required")
    .max(100, "Name is too long"),
  employeeId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined)
    .refine((val) => !val || val.length <= 50, {
      message: "Employee ID is too long",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description is too long"),
  password: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined)
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
  authorizeRole: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
  status: z.boolean().default(true),
});

/**
 * Type inference from the validation schema
 */
export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

/**
 * Validation schema for updating employee information
 */
export const updateEmployeeSchema = z.object({
  vnFullName: z
    .string()
    .min(1, "Vietnamese name is required")
    .max(100, "Name is too long")
    .optional(),
  enFullName: z
    .string()
    .min(1, "English name is required")
    .max(100, "Name is too long")
    .optional(),
  employeeId: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined)
    .refine((val) => !val || val.length <= 50, {
      message: "Employee ID is too long",
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .optional(),
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .transform((val) => val?.trim() || undefined),
  authorizeRole: z.enum(["MEMBER", "ADMIN"]).optional(),
  status: z.boolean().optional(),
});

export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
