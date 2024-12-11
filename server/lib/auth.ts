import { eq, lte } from 'drizzle-orm';

import { logger as parentLogger } from '@/utils/logger';
import { generateIdFromEntropySize } from '@/utils/crypto';
import { createDate, isWithinExpirationDate, TimeSpan } from '@/utils/timespan';
import {
  Cookie,
  type CookieAttributes,
  CookieController,
} from '@/utils/cookie';
import { IS_PROD } from '@/config/server';
import { db } from '@/db/drizzle';
import { userTable, sessionTable, type User, type Session } from '@/db/schema';

const logger = parentLogger.child({ module: 'auth' });

const EXPIRE_TIME = new TimeSpan(30, 'd'); // 30 days
const ALMOST_EXPIRE_TIME = new TimeSpan(15, 'd'); // 15 days

const sessionCookieName = 'auth_session';
const baseSessionCookieAttributes: CookieAttributes = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
};
const sessionCookieController = new CookieController(
  sessionCookieName,
  baseSessionCookieAttributes,
  {
    expiresIn: EXPIRE_TIME,
  },
);

export async function createSession(userId: string): Promise<Session> {
  const sessionId = generateIdFromEntropySize(20);
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: createDate(EXPIRE_TIME),
  };
  await db.insert(sessionTable).values(session);
  return session;
}

export async function validateSession(
  sessionId: string,
): Promise<SessionValidationResult> {
  const result = await db
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId));

  if (result.length < 1) {
    return { session: null, user: null };
  }

  const { user, session } = result[0];

  if (!isWithinExpirationDate(session.expiresAt)) {
    await invalidateSession(session.id);
    return { session: null, user: null };
  }

  if (
    !isWithinExpirationDate(
      new Date(session.expiresAt.getTime() - ALMOST_EXPIRE_TIME.milliseconds()),
    )
  ) {
    session.expiresAt = createDate(EXPIRE_TIME);
    await db
      .update(sessionTable)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(sessionTable.id, session.id));
  }

  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  return db.select().from(sessionTable).where(eq(sessionTable.userId, userId));
}

export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessionTable).where(lte(sessionTable.expiresAt, new Date()));
  logger.trace('Deleted expired sessions');
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export function createBlankSessionCookie(): Cookie {
  return sessionCookieController.createBlankCookie();
}

export function createSessionCookie(session: Session): Cookie {
  return sessionCookieController.createCookie(session.id);
}

export function readSessionCookie(cookieHeader: string): string | null {
  const sessionId = sessionCookieController.parse(cookieHeader);
  return sessionId;
}

export function createCallbackUrlCookie(callbackUrl: string) {
  return new Cookie('auth_callback_url', callbackUrl, {
    path: '/',
    secure: IS_PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'none',
  });
}
