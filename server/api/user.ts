import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { logger as parentLogger } from '@/utils/logger';
import { authCheckMiddleware } from '@/middlewares/auth';

const logger = parentLogger.child({ api: 'user' });

const userIdSchema = z.object({
  id: z.string(),
});

export type UserIdInput = z.infer<typeof userIdSchema>;

export function getUserById({ id }: UserIdInput) {
  return { id, name: 'Bilbo' };
}

export const userRouter = new Hono().get(
  '/:id',
  // authCheckMiddleware,
  zValidator('param', userIdSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const output = getUserById({ id });
    return c.json(output);
  },
);
