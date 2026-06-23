import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required'
    })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z.string({
      required_error: 'Email is required'
    })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    password: z.string({
      required_error: 'Password is required'
    })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['admin', 'member']).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'Email is required'
    })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    password: z.string({
      required_error: 'Password is required'
    })
      .min(1, 'Password is required')
  })
});
