import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0,
    postsPerMonth: 5,
    priceId: null,
  },
  pro: {
    name: "Pro",
    price: 20,
    postsPerMonth: 50,
    priceId: process.env.STRIPE_PRICE_ID_PRO,
  },
  enterprise: {
    name: "Enterprise",
    price: 40,
    postsPerMonth: -1, // unlimited
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
  },
} as const;

export type SubscriptionTier = keyof typeof STRIPE_PLANS;
