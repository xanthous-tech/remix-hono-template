import {
  GitHub,
  OAuth2RequestError,
  OAuth2Tokens,
  generateState,
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
import { createSession, createSessionCookie } from '@/lib/auth';

export interface GitHubUser {
  id: string;
  login: string;
}

const logger = parentLogger.child({ middleware: 'github-auth' });

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID ?? 'invalidClientId',
  process.env.GITHUB_CLIENT_SECRET ?? 'invalidClientSecret',
  `${APP_URL}/api/auth/github/callback`,
);

export const githubAuthRouter = new Hono();

async function getGitHubAuthorizationUrl() {
  const state = generateState();
  // TODO: Add scopes if needed
  const scopes: string[] = [];
  const url = await github.createAuthorizationURL(state, scopes);
  return {
    url,
    state,
  };
}

function createGitHubStateCookie(state: string) {
  return new Cookie('github_oauth_state', state, {
    path: '/',
    secure: IS_PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });
}

async function getGitHubUser(tokens: OAuth2Tokens) {
  const githubUserResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
    },
  });
  const githubUser: GitHubUser = await githubUserResponse.json();
  return githubUser;
}

async function getSessionCookieFromGitHubUser(githubUser: GitHubUser) {
  const accounts = await db
    .select()
    .from(accountTable)
    .where(
      and(
        eq(accountTable.provider, 'github'),
        eq(accountTable.providerAccountId, githubUser.id),
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
          name: githubUser.login,
        })
        .returning();

      const accounts = await tx
        .insert(accountTable)
        .values({
          id: githubUser.id,
          userId: users[0].id,
          provider: 'github',
          providerAccountId: githubUser.id,
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

githubAuthRouter.get('/login', async (c) => {
  const { state, url } = await getGitHubAuthorizationUrl();

  c.header('Set-Cookie', createGitHubStateCookie(state).serialize(), {
    append: true,
  });

  return c.redirect(url.toString());
});

githubAuthRouter.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  const storedState = getCookie(c, 'github_oauth_state') ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return c.text('Invalid state', 400);
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUser = await getGitHubUser(tokens);

    const cookie = await getSessionCookieFromGitHubUser(githubUser);

    const callbackUrl = getCookie(c, 'auth_callback_url') ?? '/';

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
