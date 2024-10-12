import {
  Google,
  GoogleTokens,
  OAuth2RequestError,
  generateState,
  generateCodeVerifier,
} from 'arctic';
import { Cookie, parseCookies } from 'oslo/cookie';
import { generateIdFromEntropySize } from 'lucia';
import { Router } from 'express';
import { eq, and } from 'drizzle-orm';

import { APP_URL, IS_PROD } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { db } from '@/db/drizzle';
import { accountTable, userTable } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createStripeCustomer } from '@/lib/stripe';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture: string;
}

const logger = parentLogger.child({ module: 'google-auth' });

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID ?? 'invalidClientId',
  process.env.GOOGLE_CLIENT_SECRET ?? 'invalidClientSecret',
  `${APP_URL}/api/auth/google/callback`,
);

export const googleAuthRouter = Router();

async function getGoogleAuthorizationUrl() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ['profile', 'email'],
  });

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

async function getGoogleUser(tokens: GoogleTokens) {
  const googleUserResponse = await fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
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

googleAuthRouter.get('/login', async (req, res) => {
  const { state, codeVerifier, url } = await getGoogleAuthorizationUrl();

  res
    .appendHeader('Set-Cookie', createGoogleStateCookie(state).serialize())
    .appendHeader(
      'Set-Cookie',
      createGoogleCodeVerifierCookie(codeVerifier).serialize(),
    )
    .redirect(url.toString());
});

googleAuthRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  const cookies = parseCookies(req.headers.cookie ?? '');
  const storedState = cookies.get('google_oauth_state') ?? null;
  const storedCodeVerifier = cookies.get('google_oauth_code_verifier') ?? null;
  if (
    !code ||
    !storedCodeVerifier ||
    !state ||
    !storedState ||
    state !== storedState
  ) {
    return res.status(400).send('Invalid state');
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    const googleUser = await getGoogleUser(tokens);

    const cookie = await getSessionCookieFromGoogleUser(googleUser);

    const callbackUrl = cookies.get('auth_callback_url') ?? '/dashboard';

    return res
      .appendHeader('Set-Cookie', cookie.serialize())
      .redirect(callbackUrl);
  } catch (e) {
    logger.error(e);
    if (
      e instanceof OAuth2RequestError &&
      e.message === 'bad_verification_code'
    ) {
      // invalid code
      res.status(400).end('Invalid code');
      return;
    }
    res.status(500).end('Internal server error');
    return;
  }
});
