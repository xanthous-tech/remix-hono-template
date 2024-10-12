import { Hono } from 'hono';

import { userRouter } from './user';

// define main API router here
export const apiRouter = new Hono().route('/user', userRouter);

export type MainAPI = typeof apiRouter;
