/**
 * Generation Cost Estimate Component
 *
 * Shows the user the estimated cost and time for sprite generation.
 * Displays warnings if insufficient credits.
 * STRICTLY follows Woujamind Design System.
 */

import React from 'react';
import { AlertCircle, Clock, Coins } from 'lucide-react';
import type { GenerationCostEstimate, UserCredits } from '../types';
import styles from './GenerationCostEstimate.module.css';

interface GenerationCostEstimateProps {
  estimate: GenerationCostEstimate;
  userCredits: UserCredits;
  onBuyCredits?: () => void;
}

export const GenerationCostEstimateComponent: React.FC<GenerationCostEstimateProps> = ({
  estimate,
  userCredits,
  onBuyCredits
}) => {
  const hasEnoughCredits = userCredits.balance >= estimate.creditsRequired;
  const deficit = estimate.creditsRequired - userCredits.balance;

  const formatCredits = (amount: number): string => {
    return amount.toLocaleString();
  };

  const formatUSD = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.estimateGrid}>
        <div className={styles.estimateItem}>
          <Coins className={styles.estimateIcon} />
          <div className={styles.estimateContent}>
            <span className={styles.estimateLabel}>Cost</span>
            <span className={styles.estimateValue}>
              {formatCredits(estimate.creditsRequired)} credits
            </span>
            <span className={styles.estimateSubtext}>
              {formatUSD(estimate.usdEquivalent)}
            </span>
          </div>
        </div>

        <div className={styles.estimateItem}>
          <Clock className={styles.estimateIcon} />
          <div className={styles.estimateContent}>
            <span className={styles.estimateLabel}>Time</span>
            <span className={styles.estimateValue}>
              ~{estimate.estimatedMinutes} min
            </span>
            <span className={styles.estimateSubtext}>
              {estimate.directions} {estimate.directions === 1 ? 'direction' : 'directions'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.balanceInfo}>
        <div className={styles.balanceRow}>
          <span className={styles.balanceLabel}>Your Balance:</span>
          <span className={styles.balanceValue}>
            {formatCredits(userCredits.balance)} credits
          </span>
        </div>
        <div className={styles.balanceRow}>
          <span className={styles.balanceLabel}>After Generation:</span>
          <span className={`${styles.balanceValue} ${!hasEnoughCredits ? styles.balanceNegative : ''}`}>
            {formatCredits(Math.max(0, userCredits.balance - estimate.creditsRequired))} credits
          </span>
        </div>
      </div>

      {!hasEnoughCredits && (
        <div className={styles.warning}>
          <AlertCircle className={styles.warningIcon} />
          <div className={styles.warningContent}>
            <p className={styles.warningTitle}>Insufficient Credits</p>
            <p className={styles.warningText}>
              You need {formatCredits(deficit)} more credits to generate this sprite.
            </p>
            {onBuyCredits && (
              <button
                className="btn btn--primary btn--sm"
                onClick={onBuyCredits}
                style={{ marginTop: 'var(--space-8)' }}
              >
                Buy Credits
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.info}>
        <p className={styles.infoText}>
          Credits are deducted when generation starts and refunded if the job fails.
        </p>
      </div>
    </div>
  );
};
