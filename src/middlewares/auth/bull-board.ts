import { NextFunction, Request, Response } from 'express';

import { Role } from '@/types/roles';

export const bullBoardAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { user } = res.locals;

  // need to be an admin to access bull-board
  if (!user || user.roleLevel < Role.SuperAdmin) {
    return res.status(401).send('Unauthorized');
  }

  next?.();
};
