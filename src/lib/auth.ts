import { Lucia, Session, TimeSpan } from 'lucia';
import { Cookie } from 'oslo/cookie';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';

import { logger as parentLogger } from '@/utils/logger';
import { IS_PROD } from '@/config/server';
import { db } from '@/db/drizzle';
import { sessionTable, userTable } from '@/db/schema';

const logger = parentLogger.child({ module: 'auth' });
const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);

export const auth = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(30, 'd'),
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: IS_PROD,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      image: attributes.image,
      roleLevel: attributes.roleLevel,
    };
  },
});

export function getSessionCookieFromSession(
  session: Session | null,
): Cookie | null {
  if (!session) {
    return auth.createBlankSessionCookie();
  }

  if (session?.fresh) {
    return auth.createSessionCookie(session.id);
  }

  return null;
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

async function deleteExpiredSessions() {
  await auth.deleteExpiredSessions();
  logger.trace('Deleted expired sessions');
}

// run this on server start
deleteExpiredSessions();

export interface DatabaseUserAttributes {
  email?: string;
  name?: string;
  image?: string;
  roleLevel: number;
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof auth;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
