
import React from 'react';
import { X, Save, RotateCcw, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemRules: string;
  setSystemRules: (rules: string) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, systemRules, setSystemRules, onReset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              Generation Rules & Safeguards
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure the strict rules the AI must follow.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4 flex gap-3">
             <div className="min-w-[4px] bg-indigo-500 rounded-full"></div>
             <div className="text-sm text-indigo-200">
                <strong className="block text-indigo-100 mb-1">Consistency Controls</strong>
                These rules are injected into every generation request. They prevent common AI artifacts like visible grid lines, frame numbers, or character mutations. Edit them only if you are experiencing specific issues.
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
              Critical System Prompts (Technical Requirements)
            </label>
            <div className="relative">
                <textarea 
                value={systemRules}
                onChange={(e) => setSystemRules(e.target.value)}
                className="w-full h-80 bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs font-mono text-green-400 focus:border-indigo-500 focus:outline-none leading-relaxed resize-none shadow-inner"
                placeholder="Enter system rules here..."
                spellCheck={false}
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-[10px] text-slate-500 border border-slate-800 pointer-events-none">
                    Markdown Supported
                </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-b-xl">
           <button 
             onClick={onReset}
             className="flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 transition-colors px-3 py-2 rounded hover:bg-slate-800"
           >
             <RotateCcw className="w-3.5 h-3.5" /> Reset Default Rules
           </button>
           <button 
             onClick={onClose}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 transform"
           >
             <Save className="w-4 h-4" /> Save Configuration
           </button>
        </div>
      </div>
    </div>
  );
};
