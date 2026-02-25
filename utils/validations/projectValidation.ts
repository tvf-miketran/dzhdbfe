import { z } from "zod";

/**
 * Schema for a single project row (name + code pair)
 */
export const projectRowSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Project name is too long"),
  code: z
    .string()
    .min(1, "Project code is required")
    .max(50, "Project code is too long"),
});

/**
 * Validation schema for creating a new project
 */
export const createProjectSchema = z
  .object({
    projectManager: z
      .string()
      .min(1, "Project Manager is required")
      .max(100, "Project Manager name is too long"),
    projectRows: z
      .array(projectRowSchema)
      .min(1, "At least one project with name and code is required"),
    bankId: z.string().optional(),
    projectLink: z
      .string()
      .url("Project link must be a valid URL")
      .optional()
      .or(z.literal("")),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    },
  );

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
