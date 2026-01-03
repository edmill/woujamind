/**
 * Credit Display Component
 *
 * Shows user's current credit balance with actions to buy more or view history.
 * STRICTLY follows Woujamind Design System.
 */

import React from 'react';
import { Coins, Plus, History } from 'lucide-react';
import type { UserCredits } from '../types';
import styles from './CreditDisplay.module.css';

interface CreditDisplayProps {
  credits: UserCredits;
  onBuyClick: () => void;
  onHistoryClick: () => void;
  compact?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  credits,
  onBuyClick,
  onHistoryClick,
  compact = false
}) => {
  const formatCredits = (amount: number): string => {
    return amount.toLocaleString();
  };

  const formatUSD = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <button
          className={styles.compactButton}
          onClick={onBuyClick}
          title="Your Credits"
        >
          <Coins className={styles.compactIcon} />
          <span className={styles.compactBalance}>
            {formatCredits(credits.balance)}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.creditSidebar}>
      <div className={styles.header}>
        <Coins className={styles.headerIcon} />
        <h3 className={styles.title}>Your Credits</h3>
      </div>

      <div className={styles.balanceBox}>
        <p className={styles.label}>Balance</p>
        <p className={styles.amount}>{formatCredits(credits.balance)}</p>
        <p className={styles.usd}>{formatUSD(credits.balanceUSD)}</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Purchased</span>
          <span className={styles.statValue}>{formatCredits(credits.totalPurchased)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Spent</span>
          <span className={styles.statValue}>{formatCredits(credits.totalSpent)}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className="btn btn--primary"
          onClick={onBuyClick}
        >
          <Plus size={16} />
          Buy Credits
        </button>

        <button
          className="btn btn--ghost btn--sm"
          onClick={onHistoryClick}
        >
          <History size={16} />
          History
        </button>
      </div>

      <div className={styles.info}>
        <p className={styles.infoText}>
          1 credit = $0.01 USD
        </p>
      </div>
    </aside>
  );
};
