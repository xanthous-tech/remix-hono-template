import { createMiddleware } from 'hono/factory';

import { Role } from '@/types/roles';

export const bullBoardAuthMiddleware = createMiddleware(async (c, next) => {
  const { user } = c.var;

  // need to be an admin to access bull-board
  if (!user || user.roleLevel < Role.SuperAdmin) {
    return c.text('Unauthorized', 401);
  }

  await next();
});
