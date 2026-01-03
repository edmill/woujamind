/**
 * API Key Input Component
 *
 * Reusable input field for API keys with:
 * - Toggle visibility (eye icon)
 * - Validate button (check icon)
 * - Integrated buttons within input
 * - Design System compliant
 */

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: () => Promise<void>;
  placeholder: string;
  validationStatus: 'idle' | 'success' | 'error' | 'validating';
  validationMessage?: string;
  disabled?: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  onChange,
  onValidate,
  placeholder,
  validationStatus,
  validationMessage,
  disabled = false
}) => {
  const [showKey, setShowKey] = useState(false);

  const handleValidate = async () => {
    if (value.trim()) {
      await onValidate();
    }
  };

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'success':
        return 'border-green-500 focus:ring-green-500';
      case 'error':
        return 'border-red-500 focus:ring-red-500';
      default:
        return 'border-slate-300 dark:border-slate-700 focus:ring-orange-500';
    }
  };

  return (
    <div className="space-y-3">
      {/* Input Container */}
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 pr-32 bg-white dark:bg-slate-900 border rounded-lg",
            "text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "transition-all",
            getStatusColor(),
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Integrated Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Toggle Visibility Button */}
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            disabled={disabled}
            className={cn(
              "p-2 rounded-md transition-colors",
              "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {/* Validate Button */}
          <button
            type="button"
            onClick={handleValidate}
            disabled={disabled || !value.trim() || validationStatus === 'validating'}
            className={cn(
              "p-2 rounded-md transition-all flex items-center justify-center",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              validationStatus === 'success'
                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20"
                : validationStatus === 'error'
                ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
                : "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
            )}
            title="Validate key"
          >
            {validationStatus === 'validating' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : validationStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : validationStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Validation Message */}
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
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : validationStatus === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : null}
          <span>{validationMessage}</span>
        </div>
      )}
    </div>
  );
};
