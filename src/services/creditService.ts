/**
 * Credit Service (Mock Implementation)
 *
 * Provides credit management functionality for the frontend.
 * This is a mock implementation using localStorage until backend is ready.
 *
 * IMPORTANT: In production, this will be replaced with API calls to the backend.
 */

import type {
  UserCredits,
  CreditTransaction,
  CreditPackage,
  GenerationCostEstimate,
  DirectionCount
} from '../types';
import { GENERATION_COSTS as COSTS } from '../types';

// LocalStorage keys
const CREDITS_STORAGE_KEY = 'woujamind_user_credits';
const TRANSACTIONS_STORAGE_KEY = 'woujamind_credit_transactions';

// Default user ID (for mock implementation)
const MOCK_USER_ID = 'demo-user-001';

// Default starting credits
const INITIAL_CREDITS = 5000; // Start with $50 worth of credits for demo

/**
 * Get current user credits
 */
export const getUserCredits = (): UserCredits => {
  const stored = localStorage.getItem(CREDITS_STORAGE_KEY);

  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      lastUpdated: new Date(parsed.lastUpdated),
      balanceUSD: parsed.balance / 100
    };
  }

  // Initialize with default credits
  const defaultCredits: UserCredits = {
    userId: MOCK_USER_ID,
    balance: INITIAL_CREDITS,
    balanceUSD: INITIAL_CREDITS / 100,
    totalPurchased: INITIAL_CREDITS,
    totalSpent: 0,
    lastUpdated: new Date()
  };

  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(defaultCredits));
  return defaultCredits;
};

/**
 * Check if user has sufficient credits
 */
export const hasSufficientCredits = (requiredCredits: number): boolean => {
  const credits = getUserCredits();
  return credits.balance >= requiredCredits;
};

/**
 * Deduct credits from user account
 * Returns true if successful, false if insufficient balance
 */
export const deductCredits = (
  amount: number,
  description: string,
  referenceId?: string
): boolean => {
  const credits = getUserCredits();

  if (credits.balance < amount) {
    console.warn(`[creditService] Insufficient credits: ${credits.balance} < ${amount}`);
    return false;
  }

  // Deduct credits
  credits.balance -= amount;
  credits.totalSpent += amount;
  credits.balanceUSD = credits.balance / 100;
  credits.lastUpdated = new Date();

  // Save updated credits
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(credits));

  // Log transaction
  logTransaction({
    id: crypto.randomUUID(),
    userId: MOCK_USER_ID,
    amount: -amount,
    transactionType: 'spend',
    referenceId,
    description,
    createdAt: new Date()
  });

  console.log(`[creditService] Deducted ${amount} credits. New balance: ${credits.balance}`);
  return true;
};

/**
 * Refund credits to user account
 */
export const refundCredits = (
  amount: number,
  reason: string,
  referenceId?: string
): void => {
  const credits = getUserCredits();

  // Add credits back
  credits.balance += amount;
  credits.totalSpent = Math.max(0, credits.totalSpent - amount);
  credits.balanceUSD = credits.balance / 100;
  credits.lastUpdated = new Date();

  // Save updated credits
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(credits));

  // Log transaction
  logTransaction({
    id: crypto.randomUUID(),
    userId: MOCK_USER_ID,
    amount: amount,
    transactionType: 'refund',
    referenceId,
    description: reason,
    createdAt: new Date()
  });

  console.log(`[creditService] Refunded ${amount} credits. New balance: ${credits.balance}`);
};

/**
 * Add credits to user account (for purchases)
 */
export const addCredits = (
  amount: number,
  description: string,
  referenceId?: string
): void => {
  const credits = getUserCredits();

  // Add credits
  credits.balance += amount;
  credits.totalPurchased += amount;
  credits.balanceUSD = credits.balance / 100;
  credits.lastUpdated = new Date();

  // Save updated credits
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(credits));

  // Log transaction
  logTransaction({
    id: crypto.randomUUID(),
    userId: MOCK_USER_ID,
    amount: amount,
    transactionType: 'purchase',
    referenceId,
    description,
    createdAt: new Date()
  });

  console.log(`[creditService] Added ${amount} credits. New balance: ${credits.balance}`);
};

/**
 * Log a credit transaction
 */
const logTransaction = (transaction: CreditTransaction): void => {
  const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const transactions: CreditTransaction[] = stored ? JSON.parse(stored) : [];

  transactions.unshift(transaction); // Add to beginning

  // Keep only last 100 transactions
  if (transactions.length > 100) {
    transactions.splice(100);
  }

  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
};

/**
 * Get user's credit transaction history
 */
export const getTransactionHistory = (limit: number = 20): CreditTransaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const transactions: CreditTransaction[] = stored ? JSON.parse(stored) : [];

  return transactions
    .slice(0, limit)
    .map(t => ({
      ...t,
      createdAt: new Date(t.createdAt)
    }));
};

/**
 * Calculate cost for sprite generation
 */
export const calculateGenerationCost = (directions: DirectionCount): GenerationCostEstimate => {
  const creditsRequired = COSTS[directions];
  const usdEquivalent = creditsRequired / 100;

  // Estimate time based on directions
  let estimatedMinutes = 2; // Base time for 1 direction
  if (directions === 4) estimatedMinutes = 4;
  if (directions === 8) estimatedMinutes = 6;

  return {
    directions,
    creditsRequired,
    usdEquivalent,
    estimatedMinutes
  };
};

/**
 * Get available credit packages
 */
export const getCreditPackages = (): CreditPackage[] => {
  return [
    {
      id: 'starter',
      credits: 1000,
      priceCents: 1000, // $10
      bonusCredits: 0,
      displayName: 'Starter Pack',
      description: 'Perfect for trying out sprite generation',
      isActive: true,
      isPopular: false
    },
    {
      id: 'pro',
      credits: 5000,
      priceCents: 5000, // $50
      bonusCredits: 500,
      displayName: 'Pro Bundle',
      description: 'Best value for regular creators',
      isActive: true,
      isPopular: true
    },
    {
      id: 'studio',
      credits: 15000,
      priceCents: 15000, // $150
      bonusCredits: 2000,
      displayName: 'Studio Pack',
      description: 'For professional game studios',
      isActive: true,
      isPopular: false
    },
    {
      id: 'enterprise',
      credits: 50000,
      priceCents: 50000, // $500
      bonusCredits: 10000,
      displayName: 'Enterprise',
      description: 'Maximum credits for large teams',
      isActive: true,
      isPopular: false
    }
  ];
};

/**
 * Mock credit purchase (simulates Stripe payment)
 * In production, this would call the backend API which handles Stripe
 */
export const purchaseCredits = async (packageId: string): Promise<boolean> => {
  const packages = getCreditPackages();
  const selectedPackage = packages.find(p => p.id === packageId);

  if (!selectedPackage) {
    throw new Error('Invalid package ID');
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Add credits (including bonus)
  const totalCredits = selectedPackage.credits + selectedPackage.bonusCredits;
  addCredits(
    totalCredits,
    `Purchased ${selectedPackage.displayName}`,
    `stripe_${crypto.randomUUID()}`
  );

  return true;
};

/**
 * Reset credits to initial state (for testing)
 */
export const resetCredits = (): void => {
  localStorage.removeItem(CREDITS_STORAGE_KEY);
  localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  console.log('[creditService] Credits reset to initial state');
};
