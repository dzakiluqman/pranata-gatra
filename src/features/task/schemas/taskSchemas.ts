import { z } from "zod";

export const taskStatusSchema = z.enum(["pending", "in_progress", "completed"]);

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul tugas wajib diisi")
    .max(200, "Judul tugas maksimal 200 karakter"),

  description: z
    .string()
    .trim()
    .max(5000, "Deskripsi maksimal 5000 karakter")
    .optional()
    .or(z.literal("")),

  workspace_id: z.string().uuid("Workspace tidak valid"),

  subject_id: z.string().uuid("Subject tidak valid").nullable().optional(),

  assigned_to: z.string().uuid("Member tidak valid").nullable().optional(),

  deadline: z.string().datetime({ offset: true }).nullable().optional(),
});

export const createTaskSchema = taskSchema;

export const updateTaskSchema = taskSchema.partial().extend({
  id: z.string().uuid("Task tidak valid"),
  status: taskStatusSchema.optional(),
});

export const taskFilterSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  status: z.union([taskStatusSchema, z.literal("all")]).optional(),
  search: z.string().optional(),
  deadline: z.enum(["all", "overdue", "today", "upcoming", "none"]).optional(),
});

export type TaskFormSchema = z.infer<typeof taskSchema>;
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;
export type TaskFilterSchema = z.infer<typeof taskFilterSchema>;
