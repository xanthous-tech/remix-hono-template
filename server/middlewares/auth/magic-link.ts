import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';

import { logger as parentLogger } from '@/utils/logger';
import { generateIdFromEntropySize } from '@/utils/crypto';
import { getMagicLinkTokenById } from '@/utils/magic-link';
import { createStripeCustomer } from '@/lib/stripe';
import { db } from '@/db/drizzle';
import { userTable } from '@/db/schema';
import { createSession, createSessionCookie } from '@/lib/auth';

const logger = parentLogger.child({ middleware: 'magic-link-auth' });

export const magicLinkAuthRouter = new Hono();

async function getSessionCookieByMagicLinkToken(token: string) {
  const magicLinkToken = await getMagicLinkTokenById(token);

  if (!magicLinkToken) {
    throw new Error('Token Expired');
  }

  let users = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, magicLinkToken.email))
    .limit(1);

  if (users.length === 0) {
    const userId = generateIdFromEntropySize(10);

    const stripeCustomer = await createStripeCustomer(
      userId,
      magicLinkToken.email,
      magicLinkToken.email,
    );

    users = await db
      .insert(userTable)
      .values({
        id: userId,
        email: magicLinkToken.email,
        customerId: stripeCustomer.id,
      })
      .returning();
  }

  const user = users[0];
  const session = await createSession(user.id);
  return createSessionCookie(session);
}

magicLinkAuthRouter.get('/:token', async (c) => {
  const token = c.req.param('token');

  const callbackUrl = getCookie(c, 'auth_callback_url') ?? '/dashboard';

  try {
    const sessionCookie = await getSessionCookieByMagicLinkToken(token);

    c.header('Set-Cookie', sessionCookie.serialize(), { append: true });

    return c.redirect(callbackUrl);
  } catch (error) {
    logger.error(error);
    return c.text('Invalid or expired token', 400);
  }
});
