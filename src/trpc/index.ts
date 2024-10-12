import * as trpcExpress from '@trpc/server/adapters/express';
import { createOpenApiExpressMiddleware, generateOpenApiDocument } from 'trpc-openapi';
import {z} from 'zod';

import { APP_URL } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { t, createContext } from './util';
// import { scriptRouter } from './script';

const logger = parentLogger.child({ module: 'trpc' });

export const appRouter = t.router({
  // script: scriptRouter,
  getUser: t.procedure
    .meta({
      openapi: {
        description: 'Get User',
        method: 'GET',
        path: '/user/{id}',
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string(), name: z.string() }))
    .query((opts) => {
      return { id: opts.input.id, name: 'Bilbo' };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;

export const trpc = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
});

export const openApiRouter = createOpenApiExpressMiddleware({
  router: appRouter,
  createContext,
  responseMeta: undefined,
  onError: undefined,
  maxBodySize: undefined,
});

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Remix Express Template API',
  description: 'This is the OpenAPI spec for the Remix Express Template API (backed by tRPC).',
  version: '1.0.0',
  baseUrl: `${APP_URL}/api`,
  // tags: ['auth', 'users', 'posts'],
});
