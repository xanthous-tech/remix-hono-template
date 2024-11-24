import { Apple, AppleTokens, OAuth2RequestError, generateState } from 'arctic';
import { Cookie } from 'oslo/cookie';
import { parseJWT } from 'oslo/jwt';
import { generateIdFromEntropySize } from 'lucia';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, and } from 'drizzle-orm';

import { APP_URL, IS_PROD } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { db } from '@/db/drizzle';
import { accountTable, userTable } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createStripeCustomer } from '@/lib/stripe';

export interface AppleUser {
  name?: { firstName: string; lastName: string };
  email: string;
  id: string;
}

const logger = parentLogger.child({ module: 'apple-auth' });

export const apple = new Apple(
  {
    clientId: process.env.APPLE_CLIENT_ID ?? 'invalidClientId',
    teamId: process.env.APPLE_TEAM_ID ?? 'invalidTeamId',
    keyId: process.env.APPLE_KEY_ID ?? 'invalidKeyId',
    certificate: process.env.APPLE_CERTIFICATE ?? 'invalidCertificate',
  },
  `${APP_URL}/api/auth/apple/callback`,
);

export const appleAuthRouter = new Hono();

async function getAppleAuthorizationUrl() {
  const state = generateState();
  const url = await apple.createAuthorizationURL(state, {
    scopes: ['name', 'email'],
  });
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
  tokens: AppleTokens,
  user?: Pick<AppleUser, 'name'>,
): Promise<AppleUser> {
  // this.logger.debug(JSON.stringify(parseJWT(tokens.idToken)));
  const refreshedTokens = await apple.refreshAccessToken(
    tokens.refreshToken ?? 'invalidRefreshToken',
  );
  const jwt = parseJWT(refreshedTokens.idToken);

  if (!jwt || !jwt.subject) {
    throw new Error('Invalid JWT');
  }

  return {
    name: user?.name,
    email: (jwt.payload as any).email as string,
    id: jwt.subject,
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

      const stripeCustomer = await createStripeCustomer(
        userId,
        appleUser.email,
        appleUser.email,
      );

      const users = await tx
        .insert(userTable)
        .values({
          id: userId,
          name: appleUser.name
            ? `${appleUser.name.firstName} ${appleUser.name.lastName}`
            : undefined,
          email: appleUser.email,
          customerId: stripeCustomer.id,
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

    const session = await auth.createSession(user.id, {});
    return auth.createSessionCookie(session.id);
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
  const session = await auth.createSession(user.id, {});
  return auth.createSessionCookie(session.id);
}

appleAuthRouter.get('/login', async (c) => {
  const { state, url } = await getAppleAuthorizationUrl();

  c.header('Set-Cookie', createAppleStateCookie(state).serialize(), {
    append: true,
  });
  return c.redirect(url.toString());
});

appleAuthRouter.post('/callback', async (c) => {
  const body = await c.req.parseBody();
  const { code, state, user } = body;

  logger.info(body);

  const storedState = getCookie(c, 'apple_oauth_state') ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return c.text('Invalid state', 400);
  }

  try {
    const tokens = await apple.validateAuthorizationCode(code as string);

    const appleUser = await getAppleUser(
      tokens,
      user as Pick<AppleUser, 'name'>,
    );

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
