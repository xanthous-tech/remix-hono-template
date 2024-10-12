import { parseCookies } from 'oslo/cookie';
import { generateIdFromEntropySize } from 'lucia';
import { Router } from 'express';
import { eq } from 'drizzle-orm';

import { logger as parentLogger } from '@/utils/logger';
import { db } from '@/db/drizzle';
import { userTable } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createStripeCustomer } from '@/lib/stripe';
import { getMagicLinkTokenById } from '@/utils/magic-link';

const logger = parentLogger.child({ module: 'magiclink-auth' });

export const magicLinkAuthRouter = Router();

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
  const session = await auth.createSession(user.id, {});
  return auth.createSessionCookie(session.id);
}

magicLinkAuthRouter.get('/:token', async (req, res) => {
  const token = req.params.token;

  const cookies = parseCookies(req.headers.cookie ?? '');
  const callbackUrl = cookies.get('auth_callback_url') ?? '/dashboard';

  const sessionCookie = await getSessionCookieByMagicLinkToken(token);

  return res
    .appendHeader('Set-Cookie', sessionCookie.serialize())
    .redirect(callbackUrl);
});
