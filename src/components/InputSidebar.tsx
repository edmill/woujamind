/**
 * InputSidebar Component
 * Handles user inputs including prompt, image upload, art style, and action/expression selection.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ImageIcon, 
  XCircle, 
  Palette, 
  CheckCircle2, 
  Sword, 
  Smile, 
  RefreshCw, 
  Lock, 
  Wand2 
} from 'lucide-react';
import { cn } from '../utils';
import { ART_STYLES, ACTIONS, EXPRESSIONS } from '../constants';
import { ArtStyle, TabMode, ActionType, ExpressionType } from '../types';
import { PromptHelper } from './PromptHelper';
import { PromptEnhancer } from './PromptEnhancer';

interface InputSidebarProps {
  isDesktop: boolean;
  result: boolean;
  
  // Prompt Input
  prompt: string;
  setPrompt: (prompt: string) => void;
  
  // File Input
  selectedFile: File | null;
  filePreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  
  // Art Style
  selectedArtStyle: ArtStyle;
  setSelectedArtStyle: (style: ArtStyle) => void;
  
  // Motion & Mood
  tabMode: TabMode;
  setTabMode: (mode: TabMode) => void;
  selectedAction: ActionType;
  setSelectedAction: (action: ActionType) => void;
  selectedExpression: ExpressionType;
  setSelectedExpression: (exp: ExpressionType) => void;
  
  // Generation
  tokens: number;
  isGenerating: boolean;
  handleGenerate: () => void;
  hasApiKey?: boolean;
  isCheckingApiKey?: boolean;
  onConnectApiKey?: () => void;
}

export function InputSidebar({
  isDesktop,
  result,
  prompt,
  setPrompt,
  selectedFile,
  filePreview,
  handleFileChange,
  clearFile,
  fileInputRef,
  selectedArtStyle,
  setSelectedArtStyle,
  tabMode,
  setTabMode,
  selectedAction,
  setSelectedAction,
  selectedExpression,
  setSelectedExpression,
  tokens,
  isGenerating,
  handleGenerate,
  hasApiKey = true,
  isCheckingApiKey = false,
  onConnectApiKey
}: InputSidebarProps) {
  const [showImagePreview, setShowImagePreview] = React.useState(false);

  return (
    <AnimatePresence initial={false} mode="sync">
      {/* Full Screen Image Preview Modal */}
      {showImagePreview && filePreview && (
        <motion.div
          key="image-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
          onClick={() => setShowImagePreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={filePreview} 
              alt="Reference Preview" 
              className="max-w-full max-h-[85vh] object-contain bg-slate-900"
            />
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                <p className="font-medium text-center">{selectedFile?.name}</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {!result && (
        <motion.div 
          key="sidebar"
          initial={{ width: isDesktop ? 450 : '100%', opacity: 1 }}
          animate={{ width: isDesktop ? 450 : '100%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex-shrink-0 flex flex-col h-full overflow-visible"
        >
          <div className="flex flex-col h-full pr-4 lg:pr-8 overflow-visible">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-visible space-y-8 px-5 py-6 sprite-scroll -mr-4 pr-4">
            {/* 1. Prompt & Image Input */}
            <section className="space-y-4 overflow-visible">
              <div className="flex items-center justify-between relative">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs flex items-center justify-center border border-orange-200 dark:border-orange-500/30">1</span>
                  Character Concept
                </h2>
                <PromptHelper 
                  onSelectPrompt={setPrompt}
                  currentPrompt={prompt}
                />
              </div>

              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-sky-500 rounded-2xl opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500 blur" />
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your character or changes to a referenced image."
                    className="w-full h-24 bg-transparent text-sm p-4 focus:outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-200"
                  />
                  
                  {/* Image Attachment & Enhancement Bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                    <div className="flex items-center gap-3">
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                      
                      {!selectedFile ? (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Add Reference Image
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                          <button 
                            onClick={() => setShowImagePreview(true)}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-orange-500/50 hover:border-orange-500 transition-colors cursor-zoom-in group/img"
                          >
                            <img src={filePreview || ''} alt="Ref" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                               <div className="opacity-0 group-hover/img:opacity-100 transition-opacity">
                                  <ImageIcon className="w-4 h-4 text-white drop-shadow-md" />
                               </div>
                            </div>
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-orange-600 dark:text-orange-300 max-w-[120px] truncate">
                              {selectedFile.name}
                            </span>
                            <span className="text-[10px] text-slate-500">Click to enlarge</span>
                          </div>
                          <button 
                            onClick={clearFile}
                            className="ml-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors"
                            title="Remove image"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <PromptEnhancer 
                        currentPrompt={prompt}
                        onEnhance={setPrompt}
                        disabled={!prompt.trim()}
                      />
                      <div className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                        {prompt.length} chars
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Art Style Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs flex items-center justify-center border border-orange-200 dark:border-orange-500/30">2</span>
                  Art Style
                </h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedFile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedArtStyle('inherited')}
                    className={cn(
                      "relative p-3 rounded-xl border text-left transition-all h-24 overflow-hidden group",
                      selectedArtStyle === 'inherited'
                        ? "border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        : "border-slate-200 bg-white/50 hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600"
                    )}
                  >
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <ImageIcon className={cn("w-5 h-5", selectedArtStyle === 'inherited' ? "text-sky-600 dark:text-sky-300" : "text-slate-400")} />
                        {selectedArtStyle === 'inherited' && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                      </div>
                      <div>
                        <div className={cn("font-bold text-sm", selectedArtStyle === 'inherited' ? "text-sky-700 dark:text-white" : "text-slate-600 dark:text-slate-300")}>Inherited</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Match image style</div>
                      </div>
                    </div>
                  </motion.button>
                )}

                {ART_STYLES.map((style) => (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedArtStyle(style.id)}
                    className={cn(
                      "relative p-3 rounded-xl border text-left transition-all h-24 overflow-hidden group",
                      selectedArtStyle === style.id
                        ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                        : "border-slate-200 bg-white/50 hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600"
                    )}
                  >
                    <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br", style.previewColor)} />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <Palette className={cn("w-5 h-5", selectedArtStyle === style.id ? "text-orange-600 dark:text-orange-300" : "text-slate-400")} />
                        {selectedArtStyle === style.id && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                      </div>
                      <div>
                        <div className={cn("font-bold text-sm", selectedArtStyle === style.id ? "text-orange-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>{style.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">{style.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* 3. Actions / Expressions Tabs */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs flex items-center justify-center border border-orange-200 dark:border-orange-500/30">3</span>
                    Motion & Mood
                  </h2>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1">
                  <button
                    onClick={() => setTabMode('action')}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      tabMode === 'action' 
                        ? "bg-white dark:bg-orange-600 text-orange-900 dark:text-white shadow-sm dark:shadow-lg ring-1 ring-slate-200 dark:ring-0" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    <Sword className="w-4 h-4" />
                    Actions
                  </button>
                  <button
                    onClick={() => setTabMode('expression')}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      tabMode === 'expression' 
                        ? "bg-white dark:bg-orange-600 text-orange-900 dark:text-white shadow-sm dark:shadow-lg ring-1 ring-slate-200 dark:ring-0" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    <Smile className="w-4 h-4" />
                    Expressions
                  </button>
              </div>

              <div className="min-h-[100px]">
                {tabMode === 'action' ? (
                  <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                      {ACTIONS.map((action, i) => {
                        const gridHint = {
                          idle: '1x4 Grid (4 frames)',
                          walk: '2x4 Grid (8 frames)',
                          run: '2x4 Grid (8 frames)',
                          jump: '2x3 Grid (6 frames)',
                          attack: '2x3 Grid (6 frames)',
                          cast: '2x4 Grid (8 frames)'
                        }[action.id] || 'Custom Grid';

                        return (
                        <motion.button
                          key={action.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedAction(action.id)}
                          className={cn(
                            "relative p-3 rounded-xl border text-left transition-all h-24 overflow-hidden group",
                            selectedAction === action.id
                              ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                              : "border-slate-200 bg-white/50 hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600"
                          )}
                        >
                          <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
                            selectedAction === action.id ? "from-orange-500 to-amber-500 opacity-10" : "from-slate-400 to-slate-600"
                          )} />
                          <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div className={cn("transition-colors", selectedAction === action.id ? "text-orange-600 dark:text-orange-300" : "text-slate-400")}>
                                {action.icon}
                              </div>
                              {selectedAction === action.id && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                            </div>
                            <div>
                              <div className={cn("font-bold text-sm", selectedAction === action.id ? "text-orange-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>
                                {action.label}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                Best: {gridHint}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      )})}
                  </motion.div>
                ) : (
                  <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                      {EXPRESSIONS.map((exp, i) => (
                        <motion.button
                          key={exp.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedExpression(exp.id)}
                          className={cn(
                            "relative p-3 rounded-xl border text-left transition-all h-24 overflow-hidden group",
                            selectedExpression === exp.id
                              ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                              : "border-slate-200 bg-white/50 hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600"
                          )}
                        >
                          <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
                            selectedExpression === exp.id ? "from-orange-500 to-amber-500 opacity-10" : "from-slate-400 to-slate-600"
                          )} />
                          <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div className={cn("transition-colors", selectedExpression === exp.id ? "text-orange-600 dark:text-orange-300" : "text-slate-400")}>
                                {exp.icon}
                              </div>
                              {selectedExpression === exp.id && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                            </div>
                            <div>
                              <div className={cn("font-bold text-sm", selectedExpression === exp.id ? "text-orange-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>
                                {exp.label}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                Expression Variant
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                  </motion.div>
                )}
              </div>
            </section>

            {/* API Key Warning */}
            {!hasApiKey && !isCheckingApiKey && onConnectApiKey && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
                  <Lock className="w-5 h-5" />
                  <span>API Key Required</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Connect your Gemini API key to generate sprite sheets.
                </p>
                <button
                  onClick={onConnectApiKey}
                  className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors"
                >
                  Connect API Key
                </button>
              </div>
            )}


            </div>

            {/* Generate Button - Pinned to bottom */}
            <div className="pt-4 pb-2 space-y-3 shrink-0 border-t border-slate-200 dark:border-slate-800 relative z-10 mt-auto">
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: (tokens > 0 && hasApiKey) ? 1.02 : 1 }}
                  whileTap={{ scale: (tokens > 0 && hasApiKey) ? 0.98 : 1 }}
                  onClick={handleGenerate}
                  disabled={(!prompt && !selectedFile) || isGenerating || !hasApiKey}
                  className={cn(
                    "flex-1 relative overflow-hidden rounded-xl px-8 py-5 font-bold text-xl text-white shadow-2xl transition-all",
                    (tokens > 0 && hasApiKey)
                      ? "bg-gradient-to-r from-orange-500 via-sky-500 to-orange-600 bg-[size:200%_auto] hover:bg-right" 
                      : "bg-slate-200 dark:bg-slate-800 cursor-not-allowed",
                    "disabled:opacity-50 disabled:grayscale"
                  )}
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span>Weaving Magic...</span>
                      </>
                    ) : !hasApiKey ? (
                      <>
                        <Lock className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-400">Connect API Key</span>
                      </>
                    ) : tokens <= 0 ? (
                      <>
                        <Lock className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-400">Out of Magic (Get Tokens)</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6" />
                        <span>Generate (1 Token)</span>
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
              {tokens > 0 && hasApiKey && (
                <div className="text-center mt-3 text-xs text-slate-400 dark:text-slate-500">
                  Includes commercial license & high-res download
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

