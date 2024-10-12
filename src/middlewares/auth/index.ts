import { Router, Request, Response, NextFunction } from 'express';

import { auth, getSessionCookieFromSession } from '@/lib/auth';
import { githubAuthRouter } from './github';

export * from './bull-board';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next?: NextFunction,
) => {
  const cookies = req?.headers?.cookie ?? '';
  const sessionId = auth.readSessionCookie(cookies);

  if (!sessionId) {
    res.locals.user = null;
    res.locals.session = null;
    return next?.();
  }

  const { session, user } = await auth.validateSession(sessionId);
  const sessionCookie = getSessionCookieFromSession(session);
  if (sessionCookie) {
    res.setHeader('Set-Cookie', sessionCookie.serialize());
  }

  res.locals.user = user;
  res.locals.session = session;

  next?.();
};

export const authRouter = Router();

authRouter.use('/github', githubAuthRouter);
