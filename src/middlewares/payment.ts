import { Hono } from 'hono';
import { eq } from 'drizzle-orm';

import { stripe } from '@/lib/stripe';
import { ProjectPackagesEnum, STRIPE_PRICE_IDS_LOOKUP } from '@/config/plans';
import { APP_STAGE } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { db } from '@/db/drizzle';
import { userTable } from '@/db/schema';

const logger = parentLogger.child({ module: 'payment' });
export const paymentRouter = new Hono();

paymentRouter.post('/webhook', async (c) => {
  const STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET ?? 'invalidWebhookSecret';

  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.text('No signature', 400);
  }

  const body = await c.req.text();
  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    STRIPE_WEBHOOK_SECRET,
  );

  const users = await db
    .select()
    .from(userTable)
    .where(eq(userTable.customerId, (event as any).customer as string));

  if (users.length === 0) {
    logger.info(`No user found for stripe customer ${(event as any).customer}`);
    // TODO: log this issue, but let the webhook go through
    return c.text('OK -- No user bailing.', 200);
  }

  const user = users[0];

  switch (event.type) {
    case 'checkout.session.completed': {
      break;
    }
    case 'invoice.payment_succeeded': {
      const obj = event.data.object as any;
      const priceID: string = obj.lines?.data[0].plan?.id;

      if (obj.discount?.coupon?.percent_off !== 100 || !priceID) {
        return c.text('OK', 200);
      }

      const currentPlan = STRIPE_PRICE_IDS_LOOKUP[APP_STAGE][
        priceID
      ] as ProjectPackagesEnum;

      // TODO: set up plan related things in user table

      // await db
      //   .update(userTable)
      //   .set({})
      //   .where(eq(userTable.id, user.id));

      // TODO: Unlock things if locked.

      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const obj = event.data.object as any;
      const priceID: string = obj.items?.data[0].plan?.id;

      const planStatus = obj.status;

      if (planStatus === 'trialing') {
        // free trial
      }

      if (planStatus === 'active') {
        // subscription is active.
        // TODO: Unlock things if locked.
      }

      if (planStatus === 'past_due') {
        // last payment was not successful.
      }

      if (planStatus === 'unpaid') {
        // all retries failed.
      }

      if (planStatus === 'cancelled') {
        // sub is cancelled.
      }

      if (planStatus === 'paused') {
        // trial ended but no default payment method.
      }

      const currentPlan = STRIPE_PRICE_IDS_LOOKUP[APP_STAGE][
        priceID
      ] as ProjectPackagesEnum;

      // TODO: set up plan related things in user table

      // await db
      //   .update(userTable)
      //   .set({})
      //   .where(eq(userTable.id, user.id));

      break;
    }
    default: {
      // unhandled event
      logger.info(event, 'unhandled event');
    }
  }

  return c.text('OK', 200);
});
