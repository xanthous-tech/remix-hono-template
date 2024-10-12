import { TRPCError, initTRPC } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { OpenApiMeta } from 'trpc-openapi';

// created for each request
export const createContext = ({ req, res }: CreateExpressContextOptions) => ({
  user: res.locals.user,
  session: res.locals.session,
});

export type TPRCContext = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<TPRCContext>().meta<OpenApiMeta>().create();

export const authProcedure = t.procedure.use(async (opts) => {
  const { meta, next, ctx } = opts;
  // only check authorization if enabled
  if (meta?.authRequired && !ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});
