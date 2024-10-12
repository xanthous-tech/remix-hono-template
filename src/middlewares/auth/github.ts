import {
  GitHub,
  GitHubTokens,
  OAuth2RequestError,
  generateState,
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

export interface GitHubUser {
  id: string;
  login: string;
}

const logger = parentLogger.child({ module: 'github-auth' });

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID ?? 'invalidClientId',
  process.env.GITHUB_CLIENT_SECRET ?? 'invalidClientSecret',
  {
    redirectURI: `${APP_URL}/api/auth/github/callback`,
  },
);

export const githubAuthRouter = Router();

async function getGitHubAuthorizationUrl() {
  const state = generateState();
  const url = await github.createAuthorizationURL(state);
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

async function getGitHubUser(tokens: GitHubTokens) {
  const githubUserResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
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

githubAuthRouter.get('/login', async (req, res) => {
  const { state, url } = await getGitHubAuthorizationUrl();

  res
    .appendHeader('Set-Cookie', createGitHubStateCookie(state).serialize())
    .redirect(url.toString());
});

githubAuthRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  const cookies = parseCookies(req.headers.cookie ?? '');
  const storedState = cookies.get('github_oauth_state') ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return res.status(400).send('Invalid state');
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUser = await getGitHubUser(tokens);

    const cookie = await getSessionCookieFromGitHubUser(githubUser);

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
