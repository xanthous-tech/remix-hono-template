import 'dotenv/config';
import { ServerBuild, installGlobals } from '@remix-run/node';
import { createRequestHandler } from '@remix-run/express';
import express from 'express';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

import { IS_PROD } from './config/server';
import { httpLogger, logger as parentLogger } from './utils/logger';
import { openApiDocument, openApiRouter, trpc } from './trpc';
import { bullboardServerAdapter } from './queues';
import { workers } from './workers/register';
import {
  authMiddleware,
  authRouter,
  bullBoardAuthMiddleware,
} from './middlewares/auth';
import { paymentRouter } from './middlewares/payment';

installGlobals();
const logger = parentLogger.child({ component: 'main' });

logger.info(`imported workers: ${workers.map((w) => w.name).join(', ')}`);

const viteDevServer = IS_PROD
  ? undefined
  : await import('vite').then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
      }),
    );

const remixHandler = createRequestHandler({
  getLoadContext: (req, res) => ({
    user: res.locals.user,
    session: res.locals.session,
  }),
  // @ts-ignore
  build: viteDevServer
    ? () =>
        viteDevServer.ssrLoadModule(
          'virtual:remix/server-build',
        ) as Promise<ServerBuild>
    : await import('../build/server/index.js'),
});

const app = express();

app.use(compression());
if (IS_PROD) {
  app.use(httpLogger);
}

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' }),
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('build/client', { maxAge: '1h' }));

// auth middleware (injects user and session into req)
app.use(authMiddleware);

// handle trpc requests
app.use('/api/trpc', trpc);

// handle server-side auth redirects
app.use('/api/auth', authRouter);

// handle stripe webhook
app.use('/api/payment', paymentRouter);

// handle trpc-openapi
app.use('/api', openApiRouter);

// swagger docs
app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(openApiDocument));

// handle bull-board requests
app.use('/ctrls', bullBoardAuthMiddleware, bullboardServerAdapter.getRouter());

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// handle SSR requests
app.all('*', remixHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  logger.info(`Express server listening at http://localhost:${port}`),
);
