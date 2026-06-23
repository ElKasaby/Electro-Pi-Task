import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required'
    })
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters')
      .trim(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.preprocess(
      (arg) => {
        if (!arg) return undefined;
        if (typeof arg === 'string' || arg instanceof Date) {
          const date = new Date(arg);
          return isNaN(date.getTime()) ? undefined : date;
        }
        return arg;
      },
      z.date().refine((date) => {
        // Allow today or future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date.getTime() >= today.getTime();
      }, {
        message: 'Due date must be today or in the future'
      })
    ).optional()
  })
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters')
      .trim()
      .optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.preprocess(
      (arg) => {
        if (!arg) return undefined;
        if (typeof arg === 'string' || arg instanceof Date) {
          const date = new Date(arg);
          return isNaN(date.getTime()) ? undefined : date;
        }
        return arg;
      },
      z.date().refine((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date.getTime() >= today.getTime();
      }, {
        message: 'Due date must be today or in the future'
      })
    ).optional().nullable()
  })
});
