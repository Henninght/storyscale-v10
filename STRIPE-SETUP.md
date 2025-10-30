# Stripe Integration Setup Guide

## Overview
Complete Stripe billing integration for Storyscale with subscription management, usage tracking, and webhook handling.

---

## 🎯 What's Implemented

### API Endpoints
1. **`/api/create-checkout-session`** - Creates Stripe checkout session for upgrades
2. **`/api/webhooks/stripe`** - Handles Stripe webhook events
3. **`/api/create-portal-session`** - Creates billing portal session for subscribers

### Features
- ✅ Subscription tier management (Free Trial, Starter, Pro, Enterprise)
- ✅ 7-day free trial with automatic conversion
- ✅ Usage limits (3/25/50/unlimited posts per month)
- ✅ Stripe Checkout integration
- ✅ Stripe Customer Portal integration
- ✅ Webhook handling for subscription lifecycle
- ✅ Monthly usage reset on payment
- ✅ Enhanced billing page UI with plan comparison

---

## 📋 Setup Steps

### 1. Create Stripe Account
1. Go to https://stripe.com
2. Sign up for a Stripe account
3. Complete account verification

### 2. Get Stripe API Keys
1. Navigate to **Developers** → **API keys** in Stripe Dashboard
2. Copy your **Publishable key** and **Secret key**
3. For testing, use **Test mode** keys (starts with `pk_test_` and `sk_test_`)

### 3. Create Subscription Products
1. Go to **Products** → **Add product** in Stripe Dashboard

**Starter Plan:**
- Name: `Storyscale Starter`
- Description: `25 posts per month with core features`
- Pricing: `$20/month`
- Billing period: `Monthly`
- Free trial: `7 days`
- Copy the **Price ID** (starts with `price_`)

**Pro Plan:**
- Name: `Storyscale Pro`
- Description: `50 posts per month with advanced features`
- Pricing: `$40/month`
- Billing period: `Monthly`
- Free trial: `7 days`
- Copy the **Price ID** (starts with `price_`)

**Enterprise Plan:**
- Name: `Storyscale Enterprise`
- Description: `Unlimited posts with premium features`
- Pricing: `$80/month`
- Billing period: `Monthly`
- Free trial: `7 days`
- Copy the **Price ID** (starts with `price_`)

### 4. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Product Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=price_your_starter_plan_price_id
STRIPE_PRICE_ID_STARTER=price_your_starter_plan_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_your_pro_plan_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_plan_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_plan_price_id
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_plan_price_id

# Will be set after webhook creation (step 6)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** Both `NEXT_PUBLIC_STRIPE_PRICE_ID_*` and `STRIPE_PRICE_ID_*` are needed:
- `NEXT_PUBLIC_*` for client-side (billing page)
- `STRIPE_PRICE_ID_*` for server-side (webhook handler)

### 5. Test Locally with Stripe CLI

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to local server:
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like `whsec_...` - add this to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 6. Test the Integration Locally

Start your dev server:
```bash
npm run dev
```

Test the flow:
1. Navigate to `/app/billing`
2. Click "Upgrade to Pro" or "Upgrade to Enterprise"
3. You'll be redirected to Stripe Checkout
4. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. Complete checkout
6. Verify webhook events in Stripe CLI terminal
7. Check that your subscription updated in Firestore

### 7. Setup Production Webhooks

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your production URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your production environment variables as `STRIPE_WEBHOOK_SECRET`

### 8. Update Vercel Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all Stripe-related variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Production publishable key)
   - `STRIPE_SECRET_KEY` (Production secret key)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER` (Starter plan price ID)
   - `STRIPE_PRICE_ID_STARTER` (Starter plan price ID)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` (Pro plan price ID)
   - `STRIPE_PRICE_ID_PRO` (Pro plan price ID)
   - `NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE` (Enterprise plan price ID)
   - `STRIPE_PRICE_ID_ENTERPRISE` (Enterprise plan price ID)
   - `STRIPE_WEBHOOK_SECRET` (Production webhook signing secret)
3. Redeploy your application

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Billing page loads without errors
- [ ] Current plan displays correctly
- [ ] Usage tracking shows correct numbers
- [ ] "Upgrade to Pro" button redirects to Stripe Checkout
- [ ] Test card payment completes successfully
- [ ] Webhook fires and updates Firestore subscription
- [ ] User redirected back to billing page with success message
- [ ] "Manage Billing" button opens Stripe Customer Portal
- [ ] Post generation respects usage limits
- [ ] Limit reached shows upgrade prompt

### Production Testing
- [ ] All above tests pass in production
- [ ] Production webhook endpoint is accessible
- [ ] Webhook signature verification works
- [ ] Real payment methods work correctly
- [ ] Email receipts are sent (configured in Stripe)
- [ ] Subscription status updates correctly
- [ ] Monthly usage resets on successful payment

---

## 🔧 Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates/updates subscription, sets tier and billing period |
| `customer.subscription.updated` | Updates subscription tier and status |
| `customer.subscription.deleted` | Downgrades user to Free tier |
| `invoice.payment_succeeded` | Resets monthly usage counter |
| `invoice.payment_failed` | Updates subscription status to `past_due` |

---

## 📊 Subscription Tiers

| Tier | Posts/Month | Price | Free Trial | Features |
|------|-------------|-------|------------|----------|
| Free | 3 | $0 | N/A | Basic AI generation, Community support |
| Starter | 25 | $20 | 7 days | Core features, Campaign planning, Email support |
| Pro | 50 | $40 | 7 days | Advanced AI, Multi-campaign, Priority support |
| Enterprise | Unlimited | $80 | 7 days | Advanced AI models, White-label, Dedicated support |

**Note:** After the 7-day free trial ends, users are automatically converted to the Free tier (3 posts/month) if they don't provide payment details.

---

## 🔐 Security Notes

- ✅ Webhook signature verification implemented
- ✅ Firebase Auth required for all API endpoints
- ✅ User can only access their own subscription data
- ✅ Stripe secret keys never exposed to client
- ✅ Environment variables properly scoped

---

## 🐛 Troubleshooting

### Webhook not firing
- Check that Stripe CLI is running: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
- Verify webhook URL is correct in Stripe Dashboard
- Check server logs for errors in `/api/webhooks/stripe`

### Checkout session creation fails
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check that Price IDs are valid and active in Stripe
- Ensure user exists in Firestore

### Subscription not updating after payment
- Check webhook logs in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
- Ensure Firebase UID is in subscription metadata
- Check Firestore rules allow subscription updates

### Usage limits not working
- Verify `postsUsedThisMonth` field exists in user document
- Check that `/api/generate` increments the counter
- Ensure webhook resets counter on successful payment

---

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

## ✅ Next Steps

After setup is complete:

1. **Test thoroughly** in development
2. **Switch to production keys** when ready to go live
3. **Enable live mode** in Stripe Dashboard
4. **Update webhook endpoint** to production URL
5. **Test with real payment methods** in production
6. **Monitor Stripe Dashboard** for any issues
7. **Set up email notifications** in Stripe settings
8. **Configure tax settings** if applicable
9. **Review Stripe compliance** requirements for your region

---

**Last Updated:** 2025-10-26
**Status:** Ready for testing
