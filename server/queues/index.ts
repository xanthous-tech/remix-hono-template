import { createBullBoard } from '@bull-board/api';
import { HonoAdapter } from '@bull-board/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';

import { emailQueue } from './email';

export const bullboardServerAdapter = new HonoAdapter(serveStatic);
bullboardServerAdapter.setBasePath('/ctrls');

const queues = [emailQueue].map((queue) => new BullMQAdapter(queue));

createBullBoard({
  serverAdapter: bullboardServerAdapter,
  queues,
});
