# Stripe Products Setup Instructions

## Quick Setup Guide

Follow these steps to create the four subscription tiers in your Stripe dashboard.

---

## Step 1: Access Stripe Products

1. Go to: https://dashboard.stripe.com/test/products
2. Sign in with your Google account (henninghammertorp@gmail.com)
3. Ensure you're in **Test Mode** (toggle in the top right)

---

## Step 2: Create Products and Prices

### Product 1: Storyscale Starter

1. Click **"+ Add product"**
2. Fill in the details:
   - **Name**: `Storyscale Starter`
   - **Description**: `25 posts per month with core features`
   - **Image**: Upload a product image (optional)

3. **Pricing**:
   - **Pricing model**: `Standard pricing`
   - **Price**: `20.00 USD`
   - **Billing period**: `Monthly`
   - **Payment type**: `Recurring`

4. **Additional options**:
   - ✅ Enable **"Offer a free trial"**
   - Set trial duration: `7 days`

5. Click **"Save product"**
6. **IMPORTANT**: Copy the **Price ID** (starts with `price_...`)
   - This will be used as `STRIPE_PRICE_ID_STARTER`

---

### Product 2: Storyscale Pro

1. Click **"+ Add product"**
2. Fill in the details:
   - **Name**: `Storyscale Pro`
   - **Description**: `50 posts per month with advanced features`
   - **Image**: Upload a product image (optional)

3. **Pricing**:
   - **Pricing model**: `Standard pricing`
   - **Price**: `40.00 USD`
   - **Billing period**: `Monthly`
   - **Payment type**: `Recurring`

4. **Additional options**:
   - ✅ Enable **"Offer a free trial"**
   - Set trial duration: `7 days`

5. Click **"Save product"**
6. **IMPORTANT**: Copy the **Price ID** (starts with `price_...`)
   - This will be used as `STRIPE_PRICE_ID_PRO`

---

### Product 3: Storyscale Enterprise

1. Click **"+ Add product"**
2. Fill in the details:
   - **Name**: `Storyscale Enterprise`
   - **Description**: `Unlimited posts with premium features`
   - **Image**: Upload a product image (optional)

3. **Pricing**:
   - **Pricing model**: `Standard pricing`
   - **Price**: `80.00 USD`
   - **Billing period**: `Monthly`
   - **Payment type**: `Recurring`

4. **Additional options**:
   - ✅ Enable **"Offer a free trial"**
   - Set trial duration: `7 days`

5. Click **"Save product"**
6. **IMPORTANT**: Copy the **Price ID** (starts with `price_...`)
   - This will be used as `STRIPE_PRICE_ID_ENTERPRISE`

---

## Step 3: Update Environment Variables

Add the Price IDs to your `.env.local` file:

```bash
# Stripe Product Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxxx

NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx

NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxx
```

---

## Step 4: Verify Products

1. Go to: https://dashboard.stripe.com/test/products
2. You should see 3 products:
   - ✅ Storyscale Starter ($20/month, 7-day trial)
   - ✅ Storyscale Pro ($40/month, 7-day trial)
   - ✅ Storyscale Enterprise ($80/month, 7-day trial)

---

## Subscription Tier Summary

| Tier | Posts/Month | Price | Free Trial | Features |
|------|-------------|-------|------------|----------|
| **Free** | 3 | $0 | N/A | Basic AI generation, Community support |
| **Starter** | 25 | $20 | 7 days | Core features, Campaign planning, Email support |
| **Pro** | 50 | $40 | 7 days | Advanced AI, Multi-campaign, Priority support |
| **Enterprise** | Unlimited | $80 | 7 days | Advanced AI models, White-label, Dedicated support |

---

## Free Trial Behavior

- **During trial**: Users get full access to the tier they selected
- **After trial ends**:
  - If payment method is provided → User is charged and subscription continues
  - If no payment method → User is downgraded to Free tier (3 posts/month)

---

## Testing the Setup

After creating the products:

1. Start your dev server: `npm run dev`
2. Navigate to `/app/billing`
3. Click "Upgrade to Starter/Pro/Enterprise"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout with any future expiry date and CVC
6. Verify:
   - ✅ Checkout session completes
   - ✅ Webhook fires
   - ✅ User subscription updates in Firestore
   - ✅ User can access their subscribed tier features

---

## Quick Reference: Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

---

## Next Steps

1. ✅ Create all three products in Stripe
2. ✅ Copy all Price IDs
3. ✅ Update `.env.local` with the Price IDs
4. ✅ Restart your dev server
5. ✅ Test the complete checkout flow
6. ✅ Verify webhook events in Stripe CLI

---

**Last Updated**: 2025-10-28
