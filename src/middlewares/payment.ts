import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from 'express';

import { stripe } from '@/lib/stripe';
import {
  ProjectPackagesEnum,
  STRIPE_PRICE_IDS_LOOKUP,
} from '@/config/plans';
import { APP_STAGE } from '@/config/server';
import { logger as parentLogger } from '@/utils/logger';
import { db } from '@/db/drizzle';
import { userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

const logger = parentLogger.child({ module: 'payment' });
export const paymentRouter = Router();

const stripeVerifyWebhookMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const stripeSigningSecret = process.env.STRIPE_SIGNING_SECRET as string;

  const signature =
    req.headers['Stripe-Signature'] ||
    req.headers['stripe-signature'] ||
    'noSignature';

  const event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    stripeSigningSecret,
  );

  res.locals.stripeEvent = event;

  next();
};

paymentRouter.post(
  '/webhook',
  stripeVerifyWebhookMiddleware,
  async (req, res) => {
    const event = res.locals.stripeEvent;

    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.customerId, event.customer));

    if (users.length === 0) {
      logger.info(`No user found for stripe customer ${event.customer}`);
      // TODO: log this issue, but let the webhook go through
      return res.status(200).send('OK -- No user bailing.');
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
          return res.status(200).send('OK');
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

    res.status(200).send('OK');
  },
);
