import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminDb } from '@/lib/firebase-admin'

// Lazy initialization to prevent build errors
let stripeInstance: Stripe | null = null;
function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripeInstance;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not defined' },
      { status: 500 }
    );
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    )
  }

  // Log the event for debugging
  console.log(`Received Stripe webhook: ${event.type}`, event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const firebaseUID = session.metadata?.firebaseUID
  if (!firebaseUID) {
    console.error('No Firebase UID in checkout session metadata')
    return
  }

  const subscriptionId = session.subscription as string
  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId)

  const priceId = subscriptionData.items.data[0].price.id
  const tier = getTierFromPriceId(priceId)

  await adminDb
    .collection('users')
    .doc(firebaseUID)
    .update({
      'subscription.tier': tier,
      'subscription.status': subscriptionData.status,
      'subscription.stripeCustomerId': session.customer as string,
      'subscription.stripePriceId': priceId,
      'subscription.currentPeriodEnd': new Date(
        (subscriptionData as any).current_period_end * 1000
      ),
      updatedAt: new Date(),
    })

  console.log(`Subscription created for user ${firebaseUID}: ${tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const firebaseUID = subscription.metadata?.firebaseUID
  if (!firebaseUID) {
    console.error('No Firebase UID in subscription metadata')
    return
  }

  const priceId = subscription.items.data[0].price.id
  const tier = getTierFromPriceId(priceId)

  await adminDb
    .collection('users')
    .doc(firebaseUID)
    .update({
      'subscription.tier': tier,
      'subscription.status': subscription.status,
      'subscription.stripePriceId': priceId,
      'subscription.currentPeriodEnd': new Date(
        (subscription as any).current_period_end * 1000
      ),
      updatedAt: new Date(),
    })

  console.log(`Subscription updated for user ${firebaseUID}: ${tier}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const firebaseUID = subscription.metadata?.firebaseUID
  if (!firebaseUID) {
    console.error('No Firebase UID in subscription metadata')
    return
  }

  // Downgrade to free tier
  await adminDb
    .collection('users')
    .doc(firebaseUID)
    .update({
      'subscription.tier': 'free',
      'subscription.status': 'canceled',
      'subscription.currentPeriodEnd': new Date(),
      updatedAt: new Date(),
    })

  console.log(`Subscription canceled for user ${firebaseUID}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId)

  const firebaseUID = subscriptionData.metadata?.firebaseUID
  if (!firebaseUID) {
    console.error('No Firebase UID in subscription metadata')
    return
  }

  // Reset monthly usage counter on successful payment
  await adminDb
    .collection('users')
    .doc(firebaseUID)
    .update({
      postsUsedThisMonth: 0,
      'subscription.currentPeriodEnd': new Date(
        (subscriptionData as any).current_period_end * 1000
      ),
      updatedAt: new Date(),
    })

  console.log(`Payment succeeded and usage reset for user ${firebaseUID}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId)

  const firebaseUID = subscriptionData.metadata?.firebaseUID
  if (!firebaseUID) {
    console.error('No Firebase UID in subscription metadata')
    return
  }

  // Update subscription status to past_due
  await adminDb
    .collection('users')
    .doc(firebaseUID)
    .update({
      'subscription.status': 'past_due',
      updatedAt: new Date(),
    })

  console.log(`Payment failed for user ${firebaseUID}`)
}

function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'enterprise' {
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
    return 'pro'
  } else if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) {
    return 'enterprise'
  }
  return 'free'
}

// Disable body parsing - Stripe needs raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
