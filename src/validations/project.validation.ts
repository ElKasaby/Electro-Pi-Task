import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required'
    })
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters')
      .trim(),
    description: z.string().optional(),
    status: z.enum(['planned', 'in_progress', 'completed']).optional()
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters')
      .trim()
      .optional(),
    description: z.string().optional(),
    status: z.enum(['planned', 'in_progress', 'completed']).optional()
  })
});
