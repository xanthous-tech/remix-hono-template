import { Stripe } from 'stripe';

import { APP_URL } from '@/config/server';

export const stripe = new Stripe(process.env.STRIPE_SK || 'invalidStripeSK', {
  apiVersion: '2024-06-20',
});

export async function redirectToStripeBillingPortal(
  customerId: string,
  returnUrl: string,
) {
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return portal;
}

export async function createStripeCheckoutSession(
  customerId: string,
  locale: string,
  priceId: string,
  returnPath?: string,
) {
  const session = await stripe.checkout.sessions.create({
    currency: locale.toLocaleLowerCase() === 'zh-hant' ? 'hkd' : 'usd',
    customer: customerId,
    mode: 'subscription',
    // discounts: price.coupon ? [{ coupon: price.coupon }] : undefined,
    // payment_method_collection: 'always', // whether to collect payment details...
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: returnPath
      ? `${APP_URL}${returnPath}?status=success`
      : `${APP_URL}/payment/confirm?status=success`,
    cancel_url: returnPath
      ? `${APP_URL}${returnPath}?status=cancelled`
      : `${APP_URL}/payment?status=cancelled`,
    //
    tax_id_collection: { enabled: true },
    customer_update: { name: 'auto', address: 'auto' },
  });

  return session;
}

export async function createStripeCustomer(
  userId: string,
  userName: string,
  userEmail: string,
  referral = '',
) {
  const params: Stripe.CustomerCreateParams = {
    name: userName,
    email: userEmail,
    metadata: { userId: userId },
    ...(referral ? { referral } : {}),
  };

  const options: Stripe.RequestOptions = {
    idempotencyKey: userId,
  };

  return await stripe.customers.create(params, options);
}
