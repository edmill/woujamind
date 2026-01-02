/**
 * SettingsModal Component
 * Modal for managing API key and model-specific generation rules.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw, ShieldAlert, Key, CheckCircle2, AlertCircle, Loader2, HardDrive, Download, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils';
import { getStorageStats, clearAllSprites } from '../utils/spriteStorage';
import { downloadSpriteArchive } from '../utils/archiveUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange: (apiKey: string | null) => void;
  currentApiKey: string | null;
}

const DEFAULT_GEMINI_25_RULES = `PERSONA: You are a professional pixel artist and game animator with 15+ years of experience creating sprite sheets for 2D games. Your specialty is producing clean, consistent, frame-perfect sprite animations that game developers can immediately use in their projects.

QUALITY STANDARDS:
• Perfect grid alignment - sprites must align mathematically without visible separators
• Frame-to-frame consistency - character size, colors, and style identical across all frames
• Professional composition - proper spacing, centered characters, full visibility
• Clean output - pure white backgrounds, no artifacts, grid lines, or text overlays`;

const DEFAULT_GEMINI_30_RULES = `PERSONA: You are a master game artist and technical animator specializing in production-ready sprite sheets for professional 2D game development. You understand the precise technical requirements for game engine integration and prioritize pixel-perfect consistency and clean composition.

QUALITY STANDARDS:
• Invisible grid structure - mathematical spacing only, zero visible borders or separators
• Pixel-perfect consistency - exact character dimensions, proportions, and colors across every frame
• Professional-grade composition - optimal padding, perfect centering, complete character visibility
• Production-ready output - pristine white backgrounds (#FFFFFF), zero artifacts or annotations
• Character props ALLOWED - characters may hold items, weapons, or tools that move with them
• NO duplicate body parts - each character has exactly one set of limbs/body parts per frame
• NO cross-frame elements - no projectiles, beams, or connections spanning multiple frames
• Enhanced detail - leverage advanced model capabilities for superior sprite quality and animation smoothness`;

// LocalStorage keys
const STORAGE_KEYS = {
  API_KEY: 'woujamind_api_key',
  REPLICATE_API_KEY: 'woujamind_replicate_api_key',
  GEMINI_25_RULES: 'woujamind_gemini_25_rules',
  GEMINI_30_RULES: 'woujamind_gemini_30_rules',
};

export function SettingsModal({ isOpen, onClose, onApiKeyChange, currentApiKey }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [replicateApiKey, setReplicateApiKey] = useState<string>('');
  const [gemini25Rules, setGemini25Rules] = useState<string>(DEFAULT_GEMINI_25_RULES);
  const [gemini30Rules, setGemini30Rules] = useState<string>(DEFAULT_GEMINI_30_RULES);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [activeRulesTab, setActiveRulesTab] = useState<'25' | '30'>('25');
  const [showSaveSuccess, setShowSaveSuccess] = useState<{ type: 'rules25' | 'rules30' | 'all' | null }>({ type: null });
  const [storageStats, setStorageStats] = useState<{ count: number; estimatedSize: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const storedReplicateApiKey = localStorage.getItem(STORAGE_KEYS.REPLICATE_API_KEY);
      const stored25Rules = localStorage.getItem(STORAGE_KEYS.GEMINI_25_RULES);
      const stored30Rules = localStorage.getItem(STORAGE_KEYS.GEMINI_30_RULES);

      setApiKey(storedApiKey || currentApiKey || '');
      setReplicateApiKey(storedReplicateApiKey || '');
      setGemini25Rules(stored25Rules || DEFAULT_GEMINI_25_RULES);
      setGemini30Rules(stored30Rules || DEFAULT_GEMINI_30_RULES);
      setValidationStatus('idle');
      setValidationMessage('');

      // Load storage stats
      getStorageStats().then(setStorageStats).catch(console.error);
    }
  }, [isOpen, currentApiKey]);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await downloadSpriteArchive();
      toast.success(`Exported ${storageStats?.count || 0} sprite sheets!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export sprites. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = async () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearAllSprites();
      setStorageStats({ count: 0, estimatedSize: 0 });
      setShowClearConfirm(false);
      toast.success('All sprite sheets cleared from local storage!');

      // Reload saved sprites in parent component
      window.location.reload();
    } catch (error) {
      console.error('Clear failed:', error);
      toast.error('Failed to clear sprites. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationStatus('error');
      setValidationMessage('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setValidationMessage('Validating...');

    try {
      // Test the API key by making a simple request to list models
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      
      if (response.ok) {
        const data = await response.json();
        // Check if we got a valid response with models
        if (data.models && Array.isArray(data.models)) {
          setValidationStatus('success');
          setValidationMessage('API key is valid!');
          // Save to localStorage
          localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
          onApiKeyChange(apiKey);
        } else {
          setValidationStatus('error');
          setValidationMessage('Invalid API key response. Please check and try again.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setValidationStatus('error');
        const errorMsg = errorData.error?.message || `Invalid API key (${response.status}). Please check and try again.`;
        setValidationMessage(errorMsg);
      }
    } catch (error: any) {
      setValidationStatus('error');
      setValidationMessage(error.message || 'Failed to validate API key. Please check your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveApiKey = () => {
    // Save API key if validated
    if (validationStatus === 'success' && apiKey) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
      onApiKeyChange(apiKey);
    } else if (apiKey && !currentApiKey) {
      // If user entered a key but didn't validate, still save it
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
      onApiKeyChange(apiKey);
    }
  };

  const handleSaveRules = (model: '25' | '30') => {
    if (model === '25') {
      localStorage.setItem(STORAGE_KEYS.GEMINI_25_RULES, gemini25Rules);
      setShowSaveSuccess({ type: 'rules25' });
    } else {
      localStorage.setItem(STORAGE_KEYS.GEMINI_30_RULES, gemini30Rules);
      setShowSaveSuccess({ type: 'rules30' });
    }
    
    // Hide success indicator after 2 seconds
    setTimeout(() => {
      setShowSaveSuccess({ type: null });
    }, 2000);
  };

  const handleSave = () => {
    // Save API key
    handleSaveApiKey();

    // Save Replicate API key
    if (replicateApiKey) {
      localStorage.setItem(STORAGE_KEYS.REPLICATE_API_KEY, replicateApiKey);
    }

    // Save both rule sets
    localStorage.setItem(STORAGE_KEYS.GEMINI_25_RULES, gemini25Rules);
    localStorage.setItem(STORAGE_KEYS.GEMINI_30_RULES, gemini30Rules);
    
    // Show success indicator
    setShowSaveSuccess({ type: 'all' });
    
    // Close after showing success briefly
    setTimeout(() => {
      setShowSaveSuccess({ type: null });
      onClose();
    }, 1500);
  };

  const handleResetRules = (model: '25' | '30') => {
    if (model === '25') {
      setGemini25Rules(DEFAULT_GEMINI_25_RULES);
    } else {
      setGemini30Rules(DEFAULT_GEMINI_30_RULES);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden border-b border-slate-200 dark:border-slate-800">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-orange-500 to-teal-500" />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage your API key and model-specific generation rules
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

              {/* Storage Management Section */}
              <section className="space-y-3">
                <div className="flex items-start gap-3">
                  <HardDrive className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Storage Management</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Export your sprite sheets to reclaim browser storage space
                    </p>

                    {/* Storage Stats */}
                    <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {storageStats?.count || 0} sprite sheets
                        </span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        ~{storageStats?.estimatedSize?.toFixed(2) || 0} MB
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportAll}
                        disabled={!storageStats?.count || isExporting}
                        className={cn(
                          "flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
                          storageStats?.count && !isExporting
                            ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg hover:shadow-xl active:scale-95"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Export All (.zip)
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleClearAll}
                        disabled={!storageStats?.count || isClearing}
                        className={cn(
                          "flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
                          storageStats?.count && !isClearing
                            ? "bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl active:scale-95"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isClearing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Clear All
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

              {/* API Key Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini API Key</h3>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Get your API key from{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                    >
                      Google AI Studio
                    </a>
                    . Your key is stored locally in your browser.
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setValidationStatus('idle');
                          setValidationMessage('');
                        }}
                        placeholder="Enter your Gemini API key"
                        className={cn(
                          "flex-1 px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg",
                          "text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600",
                          "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
                          validationStatus === 'error' && "border-red-500",
                          validationStatus === 'success' && "border-green-500"
                        )}
                      />
                      <button
                        onClick={validateApiKey}
                        disabled={isValidating || !apiKey.trim()}
                        className={cn(
                          "px-6 py-3 rounded-lg font-bold transition-all",
                          "bg-orange-600 hover:bg-orange-700 text-white",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "flex items-center gap-2"
                        )}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Validating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Validate Key</span>
                          </>
                        )}
                      </button>
                    </div>

                    {validationMessage && (
                      <div className={cn(
                        "flex items-center gap-2 p-3 rounded-lg text-sm",
                        validationStatus === 'success' 
                          ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400"
                          : validationStatus === 'error'
                          ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400"
                          : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      )}>
                        {validationStatus === 'success' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : validationStatus === 'error' ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : null}
                        <span>{validationMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

              {/* Replicate API Key Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Replicate API Key</h3>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Get your API key from{' '}
                    <a
                      href="https://replicate.com/account/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                    >
                      Replicate
                    </a>
                    . Required for video-based sprite generation using Seedance. Your key is stored locally in your browser.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="password"
                      value={replicateApiKey}
                      onChange={(e) => setReplicateApiKey(e.target.value)}
                      placeholder="Enter your Replicate API key"
                      className={cn(
                        "w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg border-slate-300 dark:border-slate-700",
                        "text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600",
                        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Model Rules Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Model-Specific Rules</h3>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    These rules are injected into every generation request to ensure consistency and prevent common AI artifacts. 
                    Different rules can be configured for Gemini 2.5 and Gemini 3.0 models.
                  </p>
                </div>

                {/* Tabs */}
                <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 mb-4">
                  <button
                    onClick={() => setActiveRulesTab('25')}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      activeRulesTab === '25'
                        ? "bg-white dark:bg-slate-800 text-orange-900 dark:text-white shadow-sm dark:shadow-lg ring-1 ring-slate-200 dark:ring-0"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Gemini 2.5</span>
                  </button>
                  <button
                    onClick={() => setActiveRulesTab('30')}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      activeRulesTab === '30'
                        ? "bg-white dark:bg-slate-800 text-orange-900 dark:text-white shadow-sm dark:shadow-lg ring-1 ring-slate-200 dark:ring-0"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>Gemini 3.0</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {activeRulesTab === '25' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Gemini 2.5 Rules
                        </label>
                        <button
                          onClick={() => handleResetRules('25')}
                          className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </div>
                      <textarea
                        value={gemini25Rules}
                        onChange={(e) => setGemini25Rules(e.target.value)}
                        className="w-full h-64 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                        placeholder="Enter generation rules for Gemini 2.5..."
                      />
                      <button
                        onClick={() => handleSaveRules('25')}
                        className="w-full relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 hover:from-orange-600 hover:to-sky-600 transition-all shadow-lg shadow-orange-500/20 overflow-hidden"
                      >
                        <AnimatePresence mode="wait">
                          {showSaveSuccess.type === 'rules25' ? (
                            <motion.div
                              key="success"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Saved!</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="save"
                              initial={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save Gemini 2.5 Rules</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Gemini 3.0 Rules
                        </label>
                        <button
                          onClick={() => handleResetRules('30')}
                          className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </div>
                      <textarea
                        value={gemini30Rules}
                        onChange={(e) => setGemini30Rules(e.target.value)}
                        className="w-full h-64 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                        placeholder="Enter generation rules for Gemini 3.0..."
                      />
                      <button
                        onClick={() => handleSaveRules('30')}
                        className="w-full relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 hover:from-orange-600 hover:to-sky-600 transition-all shadow-lg shadow-orange-500/20 overflow-hidden"
                      >
                        <AnimatePresence mode="wait">
                          {showSaveSuccess.type === 'rules30' ? (
                            <motion.div
                              key="success"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Saved!</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="save"
                              initial={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save Gemini 3.0 Rules</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  )}
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 overflow-hidden min-w-[140px]"
              >
                <AnimatePresence mode="wait">
                  {showSaveSuccess.type === 'all' ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Saved!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="save"
                      initial={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Settings</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Clear Confirmation Dialog */}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowClearConfirm(false)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-red-500 dark:border-red-500/50 max-w-md w-full p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Clear All Sprites?
                    </h3>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    This will permanently delete all {storageStats?.count || 0} sprite sheets from local storage.
                    Make sure you've exported them first!
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmClear}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      Delete All
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Export utility functions for accessing stored settings
export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
};

export const getStoredRules = (model: string): string => {
  // Check if model is 3.0 variant (not 2.5)
  const is30Model = model.includes('gemini-3') || model.includes('3.0');
  const key = is30Model ? STORAGE_KEYS.GEMINI_30_RULES : STORAGE_KEYS.GEMINI_25_RULES;
  const stored = localStorage.getItem(key);

  if (stored) return stored;

  // Return defaults if not stored
  return is30Model ? DEFAULT_GEMINI_30_RULES : DEFAULT_GEMINI_25_RULES;
};

