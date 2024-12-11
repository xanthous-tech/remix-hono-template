import {
  Google,
  OAuth2RequestError,
  generateState,
  generateCodeVerifier,
  OAuth2Tokens,
} from 'arctic';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq, and } from 'drizzle-orm';

import { APP_URL, IS_PROD } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { Cookie } from '@/utils/cookie';
import { generateIdFromEntropySize } from '@/utils/crypto';
import { db } from '@/db/drizzle';
import { accountTable, userTable } from '@/db/schema';
import { createStripeCustomer } from '@/lib/stripe';
import { createSession, createSessionCookie } from '@/lib/auth';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture: string;
}

const logger = parentLogger.child({ middleware: 'google-auth' });

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID ?? 'invalidClientId',
  process.env.GOOGLE_CLIENT_SECRET ?? 'invalidClientSecret',
  `${APP_URL}/api/auth/google/callback`,
);

export const googleAuthRouter = new Hono();

async function getGoogleAuthorizationUrl() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ['profile', 'email'];
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  return {
    url,
    state,
    codeVerifier,
  };
}

function createGoogleStateCookie(state: string) {
  return new Cookie('google_oauth_state', state, {
    path: '/',
    secure: IS_PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });
}

function createGoogleCodeVerifierCookie(codeVerifier: string) {
  return new Cookie('google_oauth_code_verifier', codeVerifier, {
    path: '/',
    secure: IS_PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });
}

async function getGoogleUser(tokens: OAuth2Tokens) {
  const googleUserResponse = await fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    },
  );
  const googleUser: GoogleUser = await googleUserResponse.json();
  return googleUser;
}

async function getSessionCookieFromGoogleUser(googleUser: GoogleUser) {
  const accounts = await db
    .select()
    .from(accountTable)
    .where(
      and(
        eq(accountTable.provider, 'google'),
        eq(accountTable.providerAccountId, googleUser.sub),
      ),
    )
    .limit(1);

  if (accounts.length === 0) {
    const { account, user } = await db.transaction(async (tx) => {
      const userId = generateIdFromEntropySize(10);

      const stripeCustomer = await createStripeCustomer(
        userId,
        googleUser.email,
        googleUser.email,
      );

      const users = await tx
        .insert(userTable)
        .values({
          id: userId,
          name: googleUser.name,
          email: googleUser.email,
          image: googleUser.picture,
          customerId: stripeCustomer.id,
        })
        .returning();

      const accounts = await tx
        .insert(accountTable)
        .values({
          id: googleUser.sub,
          userId: users[0].id,
          provider: 'google',
          providerAccountId: googleUser.sub,
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
  const session = await createSession(user.id);
  return createSessionCookie(session);
}

googleAuthRouter.get('/login', async (c) => {
  const { state, codeVerifier, url } = await getGoogleAuthorizationUrl();

  c.header('Set-Cookie', createGoogleStateCookie(state).serialize(), {
    append: true,
  });
  c.header(
    'Set-Cookie',
    createGoogleCodeVerifierCookie(codeVerifier).serialize(),
    {
      append: true,
    },
  );

  return c.redirect(url.toString());
});

googleAuthRouter.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  const storedState = getCookie(c, 'google_oauth_state') ?? null;
  const storedCodeVerifier = getCookie(c, 'google_oauth_code_verifier') ?? null;
  if (
    !code ||
    !storedCodeVerifier ||
    !state ||
    !storedState ||
    state !== storedState
  ) {
    return c.text('Invalid state', 400);
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    const googleUser = await getGoogleUser(tokens);

    const cookie = await getSessionCookieFromGoogleUser(googleUser);

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
