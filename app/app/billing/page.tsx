'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Sparkles, Calendar, Zap, Crown, Check, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [postsUsedThisMonth, setPostsUsedThisMonth] = useState(0);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSubscription = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSubscription(data.subscription || { tier: 'free' });
          setPostsUsedThisMonth(data.postsUsedThisMonth || 0);
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  const handleStartTrial = async () => {
    if (!user) return;

    setActivatingTrial(true);
    try {
      const now = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const userRef = doc(db, 'users', user.uid);

      // Update Firestore with proper date objects
      await setDoc(
        userRef,
        {
          subscription: {
            tier: 'trial',
            trialStartDate: now,
            trialEndDate: trialEndDate,
          },
        },
        { merge: true }
      );

      // Immediately reload subscription data from Firestore to ensure consistency
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        setSubscription(data.subscription || { tier: 'free' });
        setPostsUsedThisMonth(data.postsUsedThisMonth || 0);
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
      alert('Failed to start trial. Please try again.');
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    if (!user) return;

    setUpgrading(true);
    try {
      const priceId =
        tier === 'pro'
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE;

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    setManagingBilling(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setManagingBilling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Billing</h1>
          <p className="mt-2 text-secondary/80">Loading subscription info...</p>
        </div>
      </div>
    );
  }

  const isOnTrial = subscription?.tier === 'trial';
  const trialEndDate = subscription?.trialEndDate?.toDate?.() || subscription?.trialEndDate;
  const daysLeft = trialEndDate ? Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const trialExpired = isOnTrial && daysLeft <= 0;

  const planInfo = {
    free: { name: 'Free Plan', limit: 5, color: 'text-slate-600' },
    trial: { name: '14-Day Pro Trial', limit: 50, color: 'text-amber-600' },
    pro: { name: 'Pro Plan', limit: 50, color: 'text-primary' },
    enterprise: { name: 'Enterprise Plan', limit: Infinity, color: 'text-purple-600' },
  };

  const currentPlan = planInfo[subscription?.tier as keyof typeof planInfo] || planInfo.free;
  const usagePercentage = (postsUsedThisMonth / currentPlan.limit) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Billing</h1>
        <p className="mt-2 text-secondary/80">
          Manage your subscription and payment information.
        </p>
      </div>

      {/* Trial Activation Banner */}
      {subscription?.tier === 'free' && (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary">
                Try Pro Features Free for 14 Days!
              </h3>
              <p className="mt-2 text-secondary/80">
                Get access to 50 posts per month, advanced features, and priority support.
                No credit card required.
              </p>
              <Button
                onClick={handleStartTrial}
                disabled={activatingTrial}
                className="mt-4 bg-amber-600 hover:bg-amber-700"
              >
                {activatingTrial ? 'Activating...' : 'Start Free Trial'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Status Banner */}
      {isOnTrial && !trialExpired && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-600" />
            <div>
              <span className="font-semibold text-secondary">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial
              </span>
              <p className="text-sm text-secondary/70">
                Your trial ends on {new Date(trialEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Expired Banner */}
      {trialExpired && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-red-600" />
            <div>
              <span className="font-semibold text-secondary">Your trial has expired</span>
              <p className="text-sm text-secondary/70">
                Upgrade to Pro to continue accessing premium features
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-secondary">Current Plan</h2>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-lg bg-background p-6">
          <div>
            <h3 className={`text-2xl font-bold ${currentPlan.color}`}>
              {currentPlan.name}
            </h3>
            <p className="mt-1 text-secondary/80">
              {currentPlan.limit === Infinity ? 'Unlimited' : currentPlan.limit} posts per month
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-secondary">
              {subscription?.tier === 'free' || subscription?.tier === 'trial' ? '$0' : '$29'}
            </div>
            <div className="text-sm text-secondary/60">per month</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-secondary">Usage this month</h3>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-secondary/10">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-secondary/60">
            {postsUsedThisMonth} of {currentPlan.limit === Infinity ? '∞' : currentPlan.limit} posts used
          </p>
        </div>

        {/* Manage Billing Button for Paid Plans */}
        {(subscription?.tier === 'pro' || subscription?.tier === 'enterprise') && subscription?.stripeCustomerId && (
          <Button
            onClick={handleManageBilling}
            disabled={managingBilling}
            variant="outline"
          >
            {managingBilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            {managingBilling ? 'Loading...' : 'Manage Billing'}
          </Button>
        )}
      </div>

      {/* Upgrade Plans Section */}
      {subscription?.tier !== 'pro' && subscription?.tier !== 'enterprise' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-secondary">Available Plans</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-white rounded-2xl border-2 border-primary p-8"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-secondary">Pro</h3>
              </div>
              <p className="text-4xl font-bold text-secondary mb-6">
                $29<span className="text-lg text-secondary/60">/month</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>50 posts per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Advanced AI generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Campaign planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading}
                className="w-full bg-primary hover:bg-primary-hover"
              >
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade to Pro'}
              </Button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border-2 border-purple-200 p-8"
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-secondary">Enterprise</h3>
              </div>
              <p className="text-4xl font-bold text-secondary mb-6">
                $99<span className="text-lg text-secondary/60">/month</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Unlimited posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Advanced AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Multi-campaign support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Button
                onClick={() => handleUpgrade('enterprise')}
                disabled={upgrading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upgrade to Enterprise'}
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
