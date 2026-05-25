import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    username: z.string().min(2).max(50),
  }),
});
