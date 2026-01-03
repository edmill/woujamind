/**
 * Credit Store Component
 *
 * Modal for purchasing credit packages.
 * STRICTLY follows Woujamind Design System.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles, Check } from 'lucide-react';
import type { CreditPackage } from '../types';
import { getCreditPackages, purchaseCredits } from '../services/creditService';
import styles from './CreditStore.module.css';

interface CreditStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

export const CreditStore: React.FC<CreditStoreProps> = ({
  isOpen,
  onClose,
  onPurchaseComplete
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const packages = getCreditPackages();

  const handlePurchase = async (packageId: string) => {
    setIsPurchasing(true);
    try {
      await purchaseCredits(packageId);
      setPurchaseSuccess(true);
      setTimeout(() => {
        onPurchaseComplete();
        onClose();
        setPurchaseSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const formatCredits = (amount: number): string => {
    return amount.toLocaleString();
  };

  const calculateSpriteCount = (credits: number): number => {
    return Math.floor(credits / 350); // 8-direction sprites
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.overlay} onClick={onClose}>
        <motion.div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <Sparkles className={styles.headerIcon} />
              <h2 className={styles.title}>Buy Credits</h2>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.content}>
            {purchaseSuccess ? (
              <motion.div
                className={styles.successMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.successIcon}>
                  <Check size={32} />
                </div>
                <h3 className={styles.successTitle}>Purchase Successful!</h3>
                <p className={styles.successText}>Credits added to your account</p>
              </motion.div>
            ) : (
              <div className={styles.packageGrid}>
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`${styles.packageCard} ${
                      pkg.isPopular ? styles.packageCardPopular : ''
                    } ${selectedPackage === pkg.id ? styles.packageCardSelected : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.isPopular && (
                      <div className={styles.popularBadge}>
                        <Star size={12} />
                        <span>POPULAR</span>
                      </div>
                    )}

                    <h3 className={styles.packageName}>{pkg.displayName}</h3>

                    <div className={styles.packagePrice}>
                      {formatPrice(pkg.priceCents)}
                    </div>

                    <div className={styles.packageCredits}>
                      <span className={styles.creditsMain}>
                        {formatCredits(pkg.credits)}
                      </span>
                      {pkg.bonusCredits > 0 && (
                        <span className={styles.creditsBonus}>
                          +{formatCredits(pkg.bonusCredits)} bonus
                        </span>
                      )}
                      <span className={styles.creditsLabel}>credits</span>
                    </div>

                    <div className={styles.packageFeatures}>
                      <div className={styles.feature}>
                        <Check size={14} className={styles.featureIcon} />
                        <span>
                          ~{calculateSpriteCount(pkg.credits + pkg.bonusCredits)} full sprites
                        </span>
                      </div>
                      <div className={styles.feature}>
                        <Check size={14} className={styles.featureIcon} />
                        <span>{pkg.description}</span>
                      </div>
                    </div>

                    <button
                      className={`btn ${
                        selectedPackage === pkg.id ? 'btn--primary' : 'btn--outline'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg.id);
                      }}
                      disabled={isPurchasing}
                    >
                      {isPurchasing && selectedPackage === pkg.id
                        ? 'Processing...'
                        : 'Purchase'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.info}>
              <p className={styles.infoText}>
                <strong>Note:</strong> This is a demo version. No actual payment is processed.
                In production, this will integrate with Stripe for secure payments.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
