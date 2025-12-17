# Sprite Magic - Pricing Implementation Guide

This guide outlines the practical steps to implement the hybrid credit-based pricing model.

---

## Phase 1: Core Payment Infrastructure (Week 1)

### 1. Set Up Stripe Account
- [ ] Create Stripe account at https://stripe.com
- [ ] Complete business verification
- [ ] Enable test mode for development
- [ ] Configure webhook endpoints
- [ ] Get API keys (publishable and secret)

### 2. Install Payment Dependencies
```bash
npm install @stripe/stripe-js stripe
npm install -D @types/stripe
```

### 3. Create Stripe Products & Prices
In Stripe Dashboard, create these products:

**Hobby Plan**
- Product name: "Sprite Magic - Hobby"
- Recurring: Monthly
- Price: $12.00
- Metadata:
  - `credits_monthly`: 25
  - `credits_rollover_max`: 50
  - `tier`: "hobby"

**Creator Plan**
- Product name: "Sprite Magic - Creator"
- Recurring: Monthly
- Price: $39.00
- Metadata:
  - `credits_monthly`: 120
  - `credits_rollover_max`: 200
  - `tier`: "creator"

**Professional Plan**
- Product name: "Sprite Magic - Professional"
- Recurring: Monthly
- Price: $99.00
- Metadata:
  - `credits_monthly`: 400
  - `credits_rollover_max`: 999999
  - `tier`: "professional"

**Credit Top-Ups** (one-time purchases)
- 10 credits: $6.00
- 25 credits: $13.00
- 50 credits: $22.00
- 100 credits: $40.00

---

## Phase 2: Authentication System (Week 1-2)

### Option A: Clerk (Recommended - Easiest)
```bash
npm install @clerk/clerk-react
```

**Pros:**
- Pre-built UI components
- Easy Stripe integration
- Built-in user management
- $25/month up to 10K users

**Setup:**
1. Create account at https://clerk.com
2. Create application
3. Get publishable key
4. Add environment variables:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Option B: Firebase Auth (Free)
```bash
npm install firebase
```

**Pros:**
- Free for unlimited users
- Google sign-in built-in
- Proven scalability

**Setup:**
1. Create Firebase project
2. Enable Authentication
3. Enable Google/Email providers
4. Add environment variables:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

### Option C: Supabase Auth (Free + Database)
```bash
npm install @supabase/supabase-js
```

**Pros:**
- Free tier includes auth + database
- PostgreSQL backend
- Real-time subscriptions

---

## Phase 3: Database Setup (Week 2)

### Recommended: Supabase (Free tier is generous)

**Database Schema:**

```sql
-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  tier TEXT NOT NULL, -- hobby, creator, professional, studio
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits table
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0, -- From subscription
  bonus_credits INTEGER NOT NULL DEFAULT 0, -- From purchases or promos
  rollover_credits INTEGER NOT NULL DEFAULT 0, -- Carried over from last month
  last_refill_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (audit log)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- generation, edit, frame_edit, refund, purchase, refill
  credits_used INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage stats table (for analytics)
CREATE TABLE public.usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  generations_count INTEGER DEFAULT 0,
  edits_count INTEGER DEFAULT 0,
  frame_edits_count INTEGER DEFAULT 0,
  api_cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_credits_user_id ON public.credits(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_usage_stats_user_date ON public.usage_stats(user_id, date);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credits" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to refill monthly credits
CREATE OR REPLACE FUNCTION refill_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.credits c
  SET
    rollover_credits = CASE
      WHEN s.tier = 'hobby' THEN LEAST(c.balance, 50)
      WHEN s.tier = 'creator' THEN LEAST(c.balance, 200)
      ELSE c.balance
    END,
    balance = monthly_credits +
      CASE
        WHEN s.tier = 'hobby' THEN LEAST(c.balance, 50)
        WHEN s.tier = 'creator' THEN LEAST(c.balance, 200)
        ELSE c.balance
      END + bonus_credits,
    last_refill_date = NOW()
  FROM public.subscriptions s
  WHERE c.user_id = s.user_id
    AND s.status = 'active'
    AND DATE_TRUNC('month', c.last_refill_date) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 4: Backend API (Week 2-3)

### Create Edge Functions (Supabase) or Serverless Functions

**1. Stripe Webhook Handler**
Handles subscription creation, updates, and cancellations.

**Location:** `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await handleSubscriptionChange(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionCanceled(subscription)
        break
      }
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'payment') {
          // One-time credit purchase
          await handleCreditPurchase(session)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

async function handleSubscriptionChange(subscription: any) {
  const tier = subscription.items.data[0].price.metadata.tier
  const monthlyCredits = parseInt(subscription.items.data[0].price.metadata.credits_monthly)

  // Update subscription in database
  await supabaseAdmin.from('subscriptions').upsert({
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    tier: tier,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end,
  })

  // Update credits
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single()

  if (userData) {
    await supabaseAdmin.from('credits').upsert({
      user_id: userData.id,
      monthly_credits: monthlyCredits,
      balance: monthlyCredits, // Initial grant
    })
  }
}

// Additional handler functions...
```

**2. Credit Deduction API**

**Location:** `supabase/functions/deduct-credits/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CREDIT_COSTS = {
  generation: 1,
  full_sheet_edit: 0.5,
  frame_edit: 0.25,
  frame_insertion: 0.5,
}

serve(async (req) => {
  try {
    const { operation, userId } = await req.json()
    const authHeader = req.headers.get('Authorization')!

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const creditsNeeded = CREDIT_COSTS[operation] || 1

    // Check current balance
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (creditError || !creditData) {
      return new Response(
        JSON.stringify({ error: 'User credits not found' }),
        { status: 404 }
      )
    }

    if (creditData.balance < creditsNeeded) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          balance: creditData.balance,
          needed: creditsNeeded
        }),
        { status: 402 }
      )
    }

    // Deduct credits
    const newBalance = creditData.balance - creditsNeeded
    const { error: updateError } = await supabase
      .from('credits')
      .update({ balance: newBalance })
      .eq('user_id', userId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to deduct credits' }),
        { status: 500 }
      )
    }

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: operation,
      credits_used: creditsNeeded,
      credits_before: creditData.balance,
      credits_after: newBalance,
      description: `${operation} operation`,
    })

    return new Response(
      JSON.stringify({
        success: true,
        balance: newBalance
      }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
})
```

---

## Phase 5: Frontend Integration (Week 3-4)

### 1. Update Component.tsx

Add credit deduction before API calls:

```typescript
// src/services/creditsService.ts
import { supabase } from './supabaseClient'

export async function deductCredits(
  operation: 'generation' | 'full_sheet_edit' | 'frame_edit' | 'frame_insertion'
): Promise<{ success: boolean; balance: number; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('deduct-credits', {
      body: { operation, userId: user.id }
    })

    if (error) throw error
    return data
  } catch (err) {
    return { success: false, balance: 0, error: err.message }
  }
}

export async function getCreditsBalance(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return data?.balance || 0
  } catch (err) {
    console.error('Failed to fetch credits:', err)
    return 0
  }
}
```

**Update handleGenerate in Component.tsx:**

```typescript
const handleGenerate = async () => {
  if (!prompt && !selectedFile) return;
  if (!hasApiKey) {
    alert("Please connect your API key first");
    return;
  }

  // Check and deduct credits BEFORE generation
  const creditResult = await deductCredits('generation')
  if (!creditResult.success) {
    if (creditResult.error === 'Insufficient credits') {
      setShowPricing(true) // Open pricing modal
      toast.error('Insufficient credits. Please upgrade or purchase more.')
    } else {
      toast.error('Failed to process credits. Please try again.')
    }
    return
  }

  // Update UI with new balance
  setTokens(creditResult.balance)

  setIsGenerating(true);
  setStatusText("Analyzing character...");
  // ... rest of generation code
}
```

### 2. Create Pricing Modal Component

**Location:** `src/components/PricingModal.tsx` (Update existing)

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { Check, X, Zap } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../services/supabaseClient'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  currentCredits: number
}

const PLANS = [
  {
    name: 'Hobby',
    price: 12,
    credits: 25,
    priceId: 'price_xxx', // Replace with actual Stripe Price ID
    features: [
      '25 credits/month',
      'Rollover up to 50 credits',
      'GIF export',
      'Email support',
    ],
    highlight: false,
  },
  {
    name: 'Creator',
    price: 39,
    credits: 120,
    priceId: 'price_yyy',
    features: [
      '120 credits/month',
      'Rollover up to 200 credits',
      'Priority generation',
      'Advanced editing',
      'Priority support',
    ],
    highlight: true,
  },
  {
    name: 'Professional',
    price: 99,
    credits: 400,
    priceId: 'price_zzz',
    features: [
      '400 credits/month',
      'Unlimited rollover',
      'Fastest queue',
      'API access',
      'Team collaboration (3 users)',
      'Priority support',
    ],
    highlight: false,
  },
]

const CREDIT_PACKS = [
  { credits: 10, price: 6, priceId: 'price_aaa' },
  { credits: 25, price: 13, priceId: 'price_bbb' },
  { credits: 50, price: 22, priceId: 'price_ccc' },
  { credits: 100, price: 40, priceId: 'price_ddd' },
]

export function PricingModal({ isOpen, onClose, currentCredits }: PricingModalProps) {
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoading(priceId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to subscribe')
        return
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId, userId: user.id, mode: 'subscription' }
      })

      if (error) throw error

      const stripe = await stripePromise
      await stripe?.redirectToCheckout({ sessionId: data.sessionId })
    } catch (err) {
      console.error('Subscription error:', err)
      toast.error('Failed to start subscription')
    } finally {
      setLoading(null)
    }
  }

  const handleBuyCredits = async (priceId: string, credits: number) => {
    setLoading(priceId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to purchase credits')
        return
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          mode: 'payment',
          metadata: { credits: credits.toString() }
        }
      })

      if (error) throw error

      const stripe = await stripePromise
      await stripe?.redirectToCheckout({ sessionId: data.sessionId })
    } catch (err) {
      console.error('Purchase error:', err)
      toast.error('Failed to purchase credits')
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Choose Your Plan
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Current balance: {currentCredits} credits
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Monthly Subscriptions</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border-2 ${
                  plan.highlight
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {plan.highlight && (
                  <div className="text-orange-600 dark:text-orange-400 text-sm font-bold mb-2">
                    MOST POPULAR
                  </div>
                )}
                <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                <div className="text-4xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-lg text-slate-600 dark:text-slate-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.priceId, plan.name)}
                  disabled={loading === plan.priceId}
                  className={`w-full py-3 rounded-lg font-semibold ${
                    plan.highlight
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50`}
                >
                  {loading === plan.priceId ? 'Loading...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* One-time Credit Packs */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/50">
          <h3 className="text-xl font-bold mb-4">One-Time Credit Packs</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.credits}
                className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold">{pack.credits}</span>
                </div>
                <div className="text-lg font-semibold mb-3">${pack.price}</div>
                <button
                  onClick={() => handleBuyCredits(pack.priceId, pack.credits)}
                  disabled={loading === pack.priceId}
                  className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm disabled:opacity-50"
                >
                  {loading === pack.priceId ? 'Loading...' : 'Buy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

---

## Phase 6: Testing (Week 4)

### Test Checklist

**Authentication:**
- [ ] User can sign up with email
- [ ] User can sign in
- [ ] User can sign out
- [ ] User session persists on refresh

**Subscription Flow:**
- [ ] User can view pricing modal
- [ ] User can subscribe to a plan
- [ ] Credits are added after subscription
- [ ] Stripe webhook updates subscription status
- [ ] User sees updated credit balance

**Credit Purchase:**
- [ ] User can buy credit packs
- [ ] Credits are added after purchase
- [ ] Transaction is logged

**Credit Deduction:**
- [ ] Credits deducted on sprite generation
- [ ] Credits deducted on edits
- [ ] User blocked if insufficient credits
- [ ] Error handling works correctly

**Credit Rollover:**
- [ ] Monthly refill function works
- [ ] Rollover limits respected (Hobby: 50, Creator: 200)
- [ ] Professional tier has unlimited rollover

**Cancellation:**
- [ ] User can cancel subscription
- [ ] Subscription continues until period end
- [ ] Credits stop refilling after cancellation
- [ ] User can resubscribe

---

## Phase 7: Launch Preparation (Week 5)

### 1. Set Up Analytics
- [ ] Install PostHog or Mixpanel
- [ ] Track key events:
  - Signup
  - First generation
  - Subscription started
  - Subscription canceled
  - Credit purchase
  - Out of credits
  - Pricing modal viewed

### 2. Email Notifications
- [ ] Welcome email on signup
- [ ] Low credits warning (< 5 credits)
- [ ] Subscription started confirmation
- [ ] Payment failed notification
- [ ] Subscription ending soon reminder

### 3. Admin Dashboard
- [ ] User list with subscription status
- [ ] Revenue metrics
- [ ] Usage statistics
- [ ] Refund tools
- [ ] Manual credit adjustments

### 4. Legal Pages
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund Policy
- [ ] Cookie Policy

### 5. Error Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Configure alerts for critical errors
- [ ] Monitor Stripe webhook failures

---

## Phase 8: Soft Launch (Week 6)

### Launch Strategy

1. **Beta Testers** (Week 1)
   - Invite 20-50 beta testers
   - Give 50 free credits each
   - Gather feedback on pricing
   - Fix critical bugs

2. **Friends & Family** (Week 2)
   - Expand to 100-200 users
   - Offer 25% discount code
   - Test payment flow at scale
   - Refine UX based on feedback

3. **Public Launch** (Week 3-4)
   - Announce on Twitter, Reddit, Product Hunt
   - Offer launch special: First 1000 users get 10 free credits
   - Monitor performance and costs closely
   - Be ready to adjust pricing if needed

---

## Cost Management Tools

### 1. Rate Limiting
Add to your API calls:

```typescript
// src/utils/rateLimiter.ts
const RATE_LIMITS = {
  generation: { max: 10, window: 3600 }, // 10 per hour
  edit: { max: 30, window: 3600 }, // 30 per hour
}

export async function checkRateLimit(
  userId: string,
  operation: keyof typeof RATE_LIMITS
): Promise<boolean> {
  const limit = RATE_LIMITS[operation]
  const key = `ratelimit:${userId}:${operation}`

  // Check Redis or database for recent operations
  const recentOps = await getRecentOperations(userId, operation, limit.window)

  if (recentOps.length >= limit.max) {
    return false // Rate limit exceeded
  }

  return true
}
```

### 2. Usage Monitoring
```typescript
// Track actual API costs in real-time
async function logApiCost(userId: string, operation: string, costUsd: number) {
  await supabase.from('usage_stats').upsert({
    user_id: userId,
    date: new Date().toISOString().split('T')[0],
    [`${operation}_count`]: 1,
    api_cost_usd: costUsd,
  }, {
    onConflict: 'user_id,date',
    ignoreDuplicates: false,
  })
}
```

### 3. Cost Alerts
Set up alerts when:
- Daily API costs exceed $100
- Any user uses > 200 credits/day (potential abuse)
- Webhook failures occur
- Payment failures exceed 5% of attempts

---

## Success Metrics

### Week 1-4 (MVP Launch)
- **Goal:** 100 signups, 10 paying customers
- **Metric:** $100-500 MRR
- **KPI:** 10% free-to-paid conversion

### Month 2-3 (Growth)
- **Goal:** 500 signups, 50-100 paying customers
- **Metric:** $1,000-3,000 MRR
- **KPI:** 15% free-to-paid conversion

### Month 4-6 (Scale)
- **Goal:** 2,000 signups, 200-400 paying customers
- **Metric:** $5,000-12,000 MRR
- **KPI:** 20% free-to-paid conversion

---

## Emergency Procedures

### If API Costs Spike
1. Immediately add stricter rate limits
2. Temporarily disable free tier
3. Investigate abuse (check usage_stats table)
4. Add CAPTCHA if bot activity detected

### If Payments Fail
1. Check Stripe webhook logs
2. Verify webhook endpoint is accessible
3. Check database connection
4. Manually reconcile subscriptions if needed

### If Users Complain About Pricing
1. Don't immediately change prices
2. Gather feedback (survey or interviews)
3. Consider adding a cheaper tier
4. Offer upgrade incentives instead of lowering prices

---

## Maintenance Checklist (Monthly)

- [ ] Review API cost trends
- [ ] Check for inactive subscriptions
- [ ] Run credit rollover function
- [ ] Review failed payments
- [ ] Analyze user churn reasons
- [ ] Update pricing if needed
- [ ] Review and optimize database queries
- [ ] Check for security vulnerabilities
- [ ] Backup database
- [ ] Review error logs

---

## Resources & Documentation

**Stripe:**
- Docs: https://stripe.com/docs
- Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks

**Supabase:**
- Docs: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- Database: https://supabase.com/docs/guides/database

**Clerk:**
- Docs: https://clerk.com/docs
- Stripe Integration: https://clerk.com/docs/integrations/stripe

---

## Next Steps

1. **Set up Stripe account** (1 day)
2. **Choose auth provider** (1 day to implement)
3. **Set up Supabase database** (2 days)
4. **Implement webhook handler** (2 days)
5. **Update frontend** (3 days)
6. **Test thoroughly** (3 days)
7. **Soft launch to beta users** (1 week)
8. **Iterate and improve** (ongoing)

**Estimated time to launch:** 4-6 weeks

---

Good luck! 🚀
