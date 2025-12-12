/**
 * SpriteMagic Component
 * Main orchestrator for the sprite generation interface.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Play, 
  Download, 
  RefreshCw, 
  Zap,
  Sword,
  Smile,
  XCircle,
  Sun,
  Moon,
  Star,
  Film,
  FileImage,
  Grid,
  Settings2,
  Palette,
  CheckCircle2,
  Lock,
  ChevronLeft
} from 'lucide-react';

import { BackgroundParticles } from './components/BackgroundParticles';
import { SelectionCard } from './components/SelectionCard';
import { BlobPreview } from './components/BlobPreview';
import { AnimatedLogo } from './components/AnimatedLogo';
import { TokenDisplay } from './components/TokenDisplay';
import { PricingModal } from './components/PricingModal';
import { SettingsModal, getStoredApiKey, getStoredRules } from './components/SettingsModal';
import { SpriteSheetResult } from './components/SpriteSheetResult';
import { CompactAnimationPreview } from './components/CompactAnimationPreview';
import { ACTIONS, EXPRESSIONS, ART_STYLES } from './constants';
import { TabMode, ActionType, ExpressionType, Theme, ArtStyle } from './types';
import { cn } from './utils';
import { generateSpriteSheet, editSpriteSheet } from './services/geminiService';
import { extractFrames, createGifBlob, cropFrame, pasteFrame, alignFrameInSheet, alignWholeSheet } from './utils/imageUtils';

export default function SpriteMagic() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const [tabMode, setTabMode] = useState<TabMode>('action');
  const [selectedAction, setSelectedAction] = useState<ActionType>('idle');
  const [selectedExpression, setSelectedExpression] = useState<ExpressionType>('neutral');
  const [selectedArtStyle, setSelectedArtStyle] = useState<ArtStyle>('pixel');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Panel State - separate from result to keep sprite sheet visible
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // Editing State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Frame Selection State
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([]);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // New states for download options
  const [fps, setFps] = useState<number>(8);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  
  // Paywall & Token State
  const [tokens, setTokens] = useState<number>(1); // Start with 1 free token
  const [showPricing, setShowPricing] = useState(false);
  const [hasAccount, setHasAccount] = useState(false); // Mock user account state

  // Grid configuration
  const [gridRows, setGridRows] = useState<number>(2);
  const [gridCols, setGridCols] = useState<number>(4);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      setIsCheckingApiKey(true);
      try {
        // Check stored API key first
        const stored = getStoredApiKey();
        if (stored) {
          setStoredApiKey(stored);
          setHasApiKey(true);
          setIsCheckingApiKey(false);
          return;
        }
        
        // Check for environment variable
        const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
        if (envKey) {
          setHasApiKey(true);
          setIsCheckingApiKey(false);
          return;
        }
        
        // If no env key, check AI Studio
        if (typeof window !== 'undefined' && window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(false);
        }
      } catch (e) {
        console.error("API key check failed:", e);
        setHasApiKey(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    checkKey();
  }, []);

  // Update API key state when stored key changes
  const handleApiKeyChange = (newApiKey: string | null) => {
    setStoredApiKey(newApiKey);
    setHasApiKey(!!newApiKey);
  };

  // Effect: Handle Art Style Logic
  useEffect(() => {
    if (selectedFile) {
      if (selectedArtStyle !== 'inherited') {
         setSelectedArtStyle('inherited');
      }
    } else {
      if (selectedArtStyle === 'inherited') {
        setSelectedArtStyle('pixel');
      }
    }
  }, [selectedFile]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleConnectApiKey = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch (e) {
        console.error("API Key selection failed or cancelled", e);
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        }
      }
    } else {
      alert("Please set VITE_GEMINI_API_KEY in your .env file or use AI Studio");
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !selectedFile) return;
    if (!hasApiKey) {
      alert("Please connect your API key first");
      return;
    }

    // Check tokens
    if (tokens <= 0) {
      setShowPricing(true);
      return;
    }
    
    // Collapse left panel immediately when Generate is clicked
    setIsLeftPanelCollapsed(true);
    
    setIsGenerating(true);
    setError(null);
    setStatusText("Analyzing character...");
    setResult(false);
    setGeneratedImage(null);
    setSelectedFrameIndices([]);
    setActiveFrameIndex(null);
    
    try {
      // Convert file to base64 if provided
      let imageBase64: string | null = null;
      if (selectedFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      setStatusText("Generating sprite sheet...");
      
      // Reset history for new generation
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedFrameIndices([]);
      setActiveFrameIndex(null);
      
      // Determine grid size based on selected action
      const action = ACTIONS.find(a => a.id === selectedAction);
      const frameCount = action?.frames || 8;
      const calculatedCols = Math.ceil(frameCount / gridRows);
      const finalCols = Math.max(calculatedCols, gridCols);
      
      // Get model-specific rules (default to gemini-2.5-flash-image for now)
      const modelId = 'gemini-2.5-flash-image';
      const customRules = getStoredRules(modelId);
      
      // Generate the sprite sheet
      const resultImage = await generateSpriteSheet(
        imageBase64,
        selectedAction,
        selectedExpression,
        selectedArtStyle,
        prompt,
        gridRows,
        finalCols,
        modelId,
        customRules
      );

      // Save to history instead of just setting state
      pushToHistory(resultImage);
      setResult(true);
      // Panel already collapsed when Generate was clicked
      setTokens(prev => Math.max(0, prev - 1));
      triggerConfetti();
      
    } catch (error: any) {
      console.error("Generation failed:", error);
      const errorMessage = error.message || JSON.stringify(error);
      
      if (errorMessage.match(/(Requested entity was not found|PERMISSION_DENIED|UNAUTHENTICATED|API keys are not supported|API_KEY_MISSING|401|403)/)) {
        setHasApiKey(false);
        setError("Authentication failed. Please connect a valid API Key.");
      } else {
        setError(errorMessage || "Generation failed. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      setStatusText("");
    }
  };

  const triggerConfetti = () => {
    // Fire a burst of confetti
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#f97316', '#0ea5e9'] // orange-500, sky-500
    });
    fire(0.2, {
      spread: 60,
      colors: ['#f97316', '#0ea5e9']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#f97316', '#0ea5e9']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#f97316', '#0ea5e9']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#f97316', '#0ea5e9']
    });
  };

  const handlePurchase = (amount: number) => {
    // Close modal
    setShowPricing(false);
    
    // Add tokens
    setTokens(prev => prev + amount);
    
    // Trigger magical effect
    triggerConfetti();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setSelectedArtStyle('inherited');
      setResult(false);
      setGeneratedImage(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // History Management
  const pushToHistory = (image: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(image);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setGeneratedImage(image);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGeneratedImage(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGeneratedImage(history[newIndex]);
    }
  };

  const handleToggleFrameSelect = (index: number, isMulti: boolean) => {
    if (isMulti) {
      if (selectedFrameIndices.includes(index)) {
        setSelectedFrameIndices(prev => prev.filter(i => i !== index));
      } else {
        setSelectedFrameIndices(prev => [...prev, index].sort((a, b) => a - b));
      }
    } else {
      if (selectedFrameIndices.length === 1 && selectedFrameIndices[0] === index) {
        setSelectedFrameIndices([]);
      } else {
        setSelectedFrameIndices([index]);
      }
    }
  };

  const handleEditSpriteSheet = async (prompt: string) => {
    if (!generatedImage) return;
    setIsEditing(true);
    try {
      if (selectedFrameIndices.length === 1) {
        // SINGLE FRAME EDIT MODE
        const targetIndex = selectedFrameIndices[0];
        setStatusText(`Refining Frame ${targetIndex + 1}...`);
        
        // 1. Crop
        const croppedFrame = await cropFrame(generatedImage, targetIndex, gridRows, gridCols);
        
        // 2. Edit
        const modelId = 'gemini-2.5-flash-image';
        const editedFrame = await editSpriteSheet(croppedFrame, prompt, modelId);
        
        // 3. Paste
        const updatedSheet = await pasteFrame(generatedImage, editedFrame, targetIndex, gridRows, gridCols);
        
        pushToHistory(updatedSheet);
      } else {
        // FULL SHEET EDIT MODE
        setStatusText("Refining Sheet...");
        const modelId = 'gemini-2.5-flash-image';
        const editedImage = await editSpriteSheet(generatedImage, prompt, modelId);
        pushToHistory(editedImage);
      }
    } catch (error: any) {
      console.error("Edit failed:", error);
      setError(error.message || "Edit failed. Please try again.");
    } finally {
      setIsEditing(false);
      setStatusText("");
    }
  };

  const handleAutoAlignFrame = async (index: number) => {
    if (!generatedImage) return;
    setIsEditing(true);
    setStatusText(`Auto-aligning Frame ${index + 1}...`);
    try {
      const newSheet = await alignFrameInSheet(generatedImage, index, gridRows, gridCols);
      pushToHistory(newSheet);
    } catch (e) {
      console.error("Align failed", e);
      setError("Alignment failed. Please try again.");
    } finally {
      setIsEditing(false);
      setStatusText("");
    }
  };

  const handleAutoAlignSheet = async () => {
    if (!generatedImage) return;
    setIsEditing(true);
    setStatusText("Auto-aligning Full Sheet...");
    try {
      const newSheet = await alignWholeSheet(generatedImage, gridRows, gridCols);
      pushToHistory(newSheet);
    } catch (e) {
      console.error("Sheet align failed", e);
      setError("Sheet alignment failed. Please try again.");
    } finally {
      setIsEditing(false);
      setStatusText("");
    }
  };

  const reset = () => {
    setResult(false);
    setIsGenerating(false);
    setGeneratedImage(null);
    setError(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedFrameIndices([]);
    setActiveFrameIndex(null);
  };

  const handleDownloadSheet = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `sprite-sheet-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadGif = async () => {
    if (!generatedImage) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = generatedImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const frames = extractFrames(img, gridRows, gridCols, gridRows * gridCols, isTransparent);
      const gifBlob = await createGifBlob(frames, 1000 / fps);
      
      const url = URL.createObjectURL(gifBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sprite-animation-${Date.now()}.gif`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("GIF creation failed:", error);
      alert("Failed to create GIF. Please try again.");
    }
  };

  return (
    <div className={cn(theme, "w-full min-h-screen overflow-x-hidden")}>
      <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0a0a0e] text-slate-900 dark:text-slate-200 p-4 md:p-8 lg:p-12 font-sans selection:bg-orange-500/30 transition-colors duration-500 overflow-x-hidden">
        
        <BackgroundParticles />
        <PricingModal 
          isOpen={showPricing} 
          onClose={() => setShowPricing(false)} 
          onPurchase={handlePurchase}
          currentTokens={tokens} 
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onApiKeyChange={handleApiKeyChange}
          currentApiKey={storedApiKey}
        />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4"
          >
            <div className="flex items-center gap-4">
              <AnimatedLogo />
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-sky-600 to-orange-500 dark:from-orange-400 dark:via-sky-400 dark:to-orange-300">
                  Sprite Magic
                </h1>
                <p className="text-slate-500 text-sm">AI-Powered Character Alchemist</p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 self-end md:self-auto">
              <TokenDisplay 
                tokens={tokens} 
                onPurchase={() => setShowPricing(true)} 
              />
              
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="Settings"
              >
                <Settings2 className="w-5 h-5" />
              </button>

              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          <div className={cn(
            "flex gap-8 lg:gap-12 min-h-[600px] overflow-hidden relative"
          )}>
            
            {/* LEFT COLUMN: Controls */}
            <motion.div 
              initial={false}
              animate={{ 
                flexBasis: isLeftPanelCollapsed 
                  ? '48px' // Collapsed: only 48px visible
                  : 'calc(50% - 24px)', // Expanded: half width minus gap
                width: isLeftPanelCollapsed 
                  ? '48px' // Collapsed: only 48px visible
                  : 'calc(50% - 24px)', // Expanded: half width minus gap
              }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "relative flex-shrink-0 overflow-hidden",
                "lg:block"
              )}
              style={{ willChange: 'width, flex-basis' }}
            >
              {/* Thin edge indicator when collapsed (desktop only) */}
              <div className={cn(
                "hidden lg:block absolute right-0 top-0 bottom-0 w-[48px] pointer-events-none z-20",
                "bg-gradient-to-r from-slate-200/90 via-slate-200/70 to-transparent",
                "dark:from-slate-800/90 dark:via-slate-800/70",
                "border-r-2 border-slate-300 dark:border-slate-600",
                "shadow-[4px_0_12px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.4)]",
                isLeftPanelCollapsed ? "opacity-100" : "opacity-0 transition-opacity duration-500"
              )} />
              
              {/* Content wrapper that slides out */}
              <motion.div
                initial={false}
                animate={{
                  x: isLeftPanelCollapsed ? 'calc(-100% + 48px)' : 0,
                  opacity: isLeftPanelCollapsed ? 0 : 1,
                }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "w-[calc(50%-24px)] lg:w-full",
                  "space-y-6 overflow-x-hidden",
                  isLeftPanelCollapsed ? "pointer-events-none lg:pointer-events-auto" : "overflow-y-auto"
                )}
              >
              
              {/* 1. Prompt & Image Input */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs flex items-center justify-center border border-orange-200 dark:border-orange-500/30">1</span>
                    Character Concept
                  </h2>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-sky-500 rounded-2xl opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500 blur" />
                  <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your character (e.g., 'A cyberpunk samurai with glowing neon katana, pixel art style, 32-bit')"
                      className="w-full h-32 bg-transparent text-lg p-4 focus:outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-200"
                    />
                    
                    {/* Image Attachment Bar */}
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
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-orange-500/50">
                              <img src={filePreview || ''} alt="Ref" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-orange-600 dark:text-orange-300 max-w-[120px] truncate">
                                {selectedFile.name}
                              </span>
                              <span className="text-[10px] text-slate-500">Reference Image</span>
                            </div>
                            <button 
                              onClick={clearFile}
                              className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors"
                              title="Remove image"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                        {prompt.length} chars
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Art Style Selection */}
              <section className="space-y-3 overflow-x-hidden">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs flex items-center justify-center border border-orange-200 dark:border-orange-500/30">2</span>
                    Art Style
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
                  {selectedFile && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedArtStyle('inherited')}
                      className={cn(
                        "relative p-2 rounded-lg border text-left transition-all h-20 overflow-hidden group",
                        selectedArtStyle === 'inherited'
                          ? "border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                          : "border-slate-200 bg-white/50 hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <ImageIcon className={cn("w-4 h-4", selectedArtStyle === 'inherited' ? "text-sky-600 dark:text-sky-300" : "text-slate-400")} />
                          {selectedArtStyle === 'inherited' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                        </div>
                        <div>
                          <div className={cn("font-bold text-xs", selectedArtStyle === 'inherited' ? "text-sky-700 dark:text-white" : "text-slate-600 dark:text-slate-300")}>Inherited</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">Match image style</div>
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
                        "relative p-2 rounded-lg border text-left transition-all h-20 overflow-hidden group",
                        selectedArtStyle === style.id
                          ? "border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                          : "border-slate-200 bg-white/50 hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600"
                      )}
                    >
                      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br", style.previewColor)} />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <Palette className={cn("w-4 h-4", selectedArtStyle === style.id ? "text-orange-600 dark:text-orange-300" : "text-slate-400")} />
                          {selectedArtStyle === style.id && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />}
                        </div>
                        <div>
                          <div className={cn("font-bold text-xs", selectedArtStyle === style.id ? "text-orange-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>{style.label}</div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">{style.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* 3. Actions / Expressions Tabs */}
              <section className="space-y-3 overflow-x-hidden">
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

                 <div className="min-h-[220px] overflow-x-hidden p-3">
                   {tabMode === 'action' ? (
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-3 sm:grid-cols-6 gap-3"
                     >
                        {ACTIONS.map((action, i) => (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <SelectionCard 
                              item={action}
                              selected={selectedAction === action.id}
                              onClick={() => setSelectedAction(action.id)}
                            />
                          </motion.div>
                        ))}
                     </motion.div>
                   ) : (
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-3 sm:grid-cols-5 gap-3"
                     >
                        {EXPRESSIONS.map((exp, i) => (
                          <motion.div
                            key={exp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <SelectionCard 
                              item={exp}
                              selected={selectedExpression === exp.id}
                              onClick={() => setSelectedExpression(exp.id)}
                            />
                          </motion.div>
                        ))}
                     </motion.div>
                   )}
                 </div>
              </section>

              {/* API Key Warning */}
              {!hasApiKey && !isCheckingApiKey && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
                    <Lock className="w-5 h-5" />
                    <span>API Key Required</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Connect your Gemini API key to generate sprite sheets.
                  </p>
                  <button
                    onClick={handleConnectApiKey}
                    className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors"
                  >
                    Connect API Key
                  </button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2">
                    <XCircle className="w-5 h-5" />
                    <span>Error</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
                </div>
              )}

              {/* Generate Button - Sticky at bottom for better access */}
              <div className="sticky bottom-0 pt-4 bg-white dark:bg-slate-900 pb-2 z-10">
                <motion.button
                  whileHover={{ scale: (tokens > 0 && hasApiKey) ? 1.02 : 1 }}
                  whileTap={{ scale: (tokens > 0 && hasApiKey) ? 0.98 : 1 }}
                  onClick={handleGenerate}
                  disabled={(!prompt && !selectedFile) || isGenerating || !hasApiKey}
                  className={cn(
                    "w-full relative overflow-hidden rounded-xl px-6 py-4 font-bold text-lg text-white shadow-2xl transition-all",
                    (tokens > 0 && hasApiKey)
                      ? "bg-gradient-to-r from-orange-500 via-sky-500 to-orange-600 bg-[size:200%_auto] hover:bg-right" 
                      : "bg-slate-200 dark:bg-slate-800 cursor-not-allowed",
                    "disabled:opacity-50 disabled:grayscale"
                  )}
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {isGenerating ? (
                       <>
                         <RefreshCw className="w-5 h-5 animate-spin" />
                         <span>{statusText || "Weaving Magic..."}</span>
                       </>
                    ) : !hasApiKey ? (
                       <>
                         <Lock className="w-5 h-5 text-slate-400" />
                         <span className="text-slate-400">Connect API Key</span>
                       </>
                    ) : tokens <= 0 ? (
                       <>
                         <Lock className="w-5 h-5 text-slate-400" />
                         <span className="text-slate-400">Out of Magic (Get Tokens)</span>
                       </>
                    ) : (
                       <>
                         <Wand2 className="w-5 h-5" />
                         <span>Generate (1 Token)</span>
                       </>
                    )}
                  </div>
                </motion.button>
                {tokens > 0 && hasApiKey && (
                   <div className="text-center mt-2 text-xs text-slate-400 dark:text-slate-500">
                     Includes commercial license & high-res download
                   </div>
                )}
              </div>
              </motion.div>
            </motion.div>

            {/* RIGHT COLUMN: Preview & Results */}
            <motion.div 
              className={cn(
                "relative flex-1 min-w-0",
                "transition-all duration-500"
              )}
              animate={{
                opacity: result ? 1 : 0.7,
              }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: isLeftPanelCollapsed && result ? 0.1 : 0 }}
              style={{ willChange: 'opacity' }}
            >
              {/* Expand Left Panel Button (when collapsed) - positioned on thin edge */}
              {isLeftPanelCollapsed && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setIsLeftPanelCollapsed(false)}
                  className="hidden lg:block absolute left-0 top-4 z-50 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 rounded-r-lg shadow-xl hover:bg-white dark:hover:bg-slate-800 hover:border-orange-400 dark:hover:border-orange-500 text-slate-700 dark:text-slate-300 transition-all"
                  title="Show creation panel"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </motion.button>
              )}
              <AnimatePresence mode="wait">
                 {!result ? (
                   <motion.div 
                     key="preview"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                     className="h-full min-h-[500px] flex flex-col gap-4"
                   >
                     <div className="flex items-center justify-between mb-2">
                       <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                         {tabMode === 'action' ? 'Action Preview' : 'Expression Preview'}
                       </h3>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                             <Settings2 className="w-3 h-3" />
                             <span>Preview Config</span>
                          </div>
                          <button 
                            onClick={() => setIsTransparent(!isTransparent)}
                            className={cn(
                              "text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1",
                              isTransparent 
                                ? "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                            )}
                          >
                             <Grid className="w-3 h-3" />
                             {isTransparent ? 'Transparent' : 'Grid'}
                          </button>
                       </div>
                     </div>
                     
                     <BlobPreview 
                        mode={tabMode}
                        action={selectedAction} 
                        expression={selectedExpression} 
                        isTransparent={isTransparent}
                     />
                     
                     <div className="bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                       <h4 className="text-orange-600 dark:text-orange-400 font-bold mb-2 flex items-center gap-2">
                         <Zap className="w-4 h-4" /> Pro Tip
                       </h4>
                       <p className="text-slate-500 dark:text-slate-400 text-sm">
                         {tabMode === 'action' 
                           ? "The blob's movement mimics the squash and stretch animation principles we apply to your sprite sheet." 
                           : "Expressions modify the character's facial features and subtle idle animations."}
                       </p>
                     </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="result"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ 
                       opacity: 1, 
                       scale: 1,
                       y: 0
                     }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.4, ease: "easeOut" }}
                     className="h-full min-h-[600px] flex flex-col gap-4"
                   >
                     {/* Compact Animation Preview - shown when panel is collapsed and space allows */}
                     {isLeftPanelCollapsed && (
                       <CompactAnimationPreview
                         imageSrc={generatedImage}
                         rows={gridRows}
                         cols={gridCols}
                         fps={fps}
                         setFps={setFps}
                         backgroundColor={isTransparent ? 'transparent' : '#ffffff'}
                       />
                     )}
                     
                     <div className="flex-1 min-h-0">
                       <SpriteSheetResult
                         imageSrc={generatedImage}
                         rows={gridRows}
                         cols={gridCols}
                         onEdit={handleEditSpriteSheet}
                         isEditing={isEditing}
                         isGenerating={isGenerating}
                         statusText={statusText}
                         backgroundColor={isTransparent ? 'transparent' : '#ffffff'}
                         activeFrameIndex={activeFrameIndex}
                         selectedFrameIndices={selectedFrameIndices}
                         onToggleFrameSelect={handleToggleFrameSelect}
                         onAutoAlign={handleAutoAlignFrame}
                         onAlignAll={handleAutoAlignSheet}
                         onUndo={handleUndo}
                         onRedo={handleRedo}
                         canUndo={historyIndex > 0}
                         canRedo={historyIndex < history.length - 1}
                       />
                     </div>
                   </motion.div>
                 )}
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
