import {
  Apple,
  OAuth2Tokens,
  decodeIdToken,
  OAuth2RequestError,
  generateState,
} from 'arctic';
import { decodeBase64IgnorePadding } from '@oslojs/encoding';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { APP_URL, IS_PROD } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { generateIdFromEntropySize } from '@/utils/crypto';
import { Cookie } from '@/utils/cookie';
import { db } from '@/db/drizzle';
import { accountTable, userTable } from '@/db/schema';
// import { auth } from '@/lib/auth';
import {
  createSession,
  createSessionCookie,
  getUserSessions,
} from '@/lib/auth';

export interface AppleUser {
  name: { firstName: string; lastName: string } | null;
  email: string | null;
  id: string;
}

const logger = parentLogger.child({ module: 'apple-auth' });

const applePrivateKey = decodeBase64IgnorePadding(
  process.env.APPLE_CERTIFICATE ?? 'invalidCertificate',
);

export const apple = new Apple(
  process.env.APPLE_CLIENT_ID ?? 'invalidClientId',
  process.env.APPLE_TEAM_ID ?? 'invalidTeamId',
  process.env.APPLE_KEY_ID ?? 'invalidKeyId',
  applePrivateKey,
  `${APP_URL}/api/auth/apple/callback`,
);

export const appleAuthRouter = new Hono();

async function getAppleAuthorizationUrl() {
  const state = generateState();
  const scopes = ['name', 'email'];
  const url = apple.createAuthorizationURL(state, scopes);
  url.searchParams.set('response_mode', 'form_post');

  return {
    url,
    state,
  };
}

function createAppleStateCookie(state: string) {
  return new Cookie('apple_oauth_state', state, {
    path: '/',
    secure: IS_PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'none',
  });
}

async function getAppleUser(
  tokens: OAuth2Tokens,
  user: Omit<AppleUser, 'id'>,
): Promise<AppleUser> {
  const idToken: any = decodeIdToken(tokens.idToken());
  logger.debug(idToken);

  // TODO: Untested, needs further checking. Move arctic v1's refresh token methods if needed.
  return {
    id: idToken.sub,
    name: user?.name ?? null,
    email: (idToken.payload as any).email as string,
  };
}

async function getSessionCookieFromAppleUser(appleUser: AppleUser) {
  const accounts = await db
    .select()
    .from(accountTable)
    .where(
      and(
        eq(accountTable.provider, 'apple'),
        eq(accountTable.providerAccountId, appleUser.id),
      ),
    )
    .limit(1);

  if (accounts.length === 0) {
    const { account, user } = await db.transaction(async (tx) => {
      const userId = generateIdFromEntropySize(10);

      const users = await tx
        .insert(userTable)
        .values({
          id: userId,
          name: appleUser.name
            ? `${appleUser.name.firstName} ${appleUser.name.lastName}`
            : undefined,
          email: appleUser.email ?? `${appleUser.id}@apple.id`,
        })
        .returning();

      const accounts = await tx
        .insert(accountTable)
        .values({
          id: appleUser.id,
          userId: users[0].id,
          provider: 'apple',
          providerAccountId: appleUser.id,
        })
        .returning();

      return { account: accounts[0], user: users[0] };
    });

    const session = await createSession(user.id);
    return createSessionCookie(session);
  }

  const account = accounts[0];
  const users = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, account.userId))
    .limit(1);

  if (users.length === 0) {
    throw new Error('User not found');
  }

  const user = users[0];

  const sessions = await getUserSessions(user.id);

  if (sessions.length === 0) {
    const session = await createSession(user.id);
    return createSessionCookie(session);
  }

  const session = sessions.find((s) => s.expiresAt > new Date());

  if (!session) {
    const newSession = await createSession(user.id);
    return createSessionCookie(newSession);
  }

  return createSessionCookie(session);
}

appleAuthRouter.get('/login', async (c) => {
  const { state, url } = await getAppleAuthorizationUrl();

  c.header('Set-Cookie', createAppleStateCookie(state).serialize(), {
    append: true,
  });
  return c.redirect(url.toString());
});

appleAuthRouter.post(
  '/register',
  zValidator(
    'json',
    z.object({
      id: z.string(),
      email: z.string().email().nullable(),
      name: z
        .object({
          firstName: z.string(),
          lastName: z.string(),
        })
        .nullable(),
    }),
  ),
  async (c) => {
    const body = c.req.valid('json');
    logger.info(body);

    const { id, name, email } = body;

    if (!id) {
      return c.text('Invalid request', 400);
    }

    const appleUser: AppleUser = {
      id,
      name,
      email,
    };

    const cookie = await getSessionCookieFromAppleUser(appleUser);
    return c.json({ sessionId: cookie.value });
  },
);

appleAuthRouter.post('/callback', async (c) => {
  const body = await c.req.parseBody();
  const { code, state, user: userJsonString } = body;

  logger.info(body);

  const user: AppleUser = JSON.parse(userJsonString as string);

  const storedState = getCookie(c, 'apple_oauth_state') ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return c.text('Invalid state', 400);
  }

  try {
    const tokens = await apple.validateAuthorizationCode(code as string);

    const appleUser = await getAppleUser(tokens, user);

    const cookie = await getSessionCookieFromAppleUser(appleUser);

    const callbackUrl = getCookie(c, 'auth_callback_url') ?? '/dashboard';

    c.header('Set-Cookie', cookie.serialize(), { append: true });
    return c.redirect(callbackUrl);
  } catch (e) {
    logger.error(e);
    if (
      e instanceof OAuth2RequestError &&
      e.message === 'bad_verification_code'
    ) {
      // invalid code
      return c.text('Invalid code', 400);
    }
    return c.text('Internal server error', 500);
  }
});
