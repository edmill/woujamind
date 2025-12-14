/**
 * SpriteMagic Component
 * Main orchestrator for the sprite generation interface.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { 
  Zap,
  Grid,
  Settings2
} from 'lucide-react';

import { BackgroundParticles } from './components/BackgroundParticles';
import { BlobPreview } from './components/BlobPreview';
import { PricingModal } from './components/PricingModal';
import { SettingsModal, getStoredApiKey, getStoredRules } from './components/SettingsModal';
import { Header } from './components/Header';
import { InputSidebar } from './components/InputSidebar';
import { ResultView } from './components/ResultView';
import { ACTIONS } from './constants';
import { TabMode, ActionType, ExpressionType, Theme, ArtStyle } from './types';
import { cn } from './utils';
import { generateSpriteSheet, editSpriteSheet } from './services/geminiService';
import { extractFrames, createGifBlob, cropFrame, pasteFrame, alignFrameInSheet, alignWholeSheet, cleanSpriteSheet } from './utils/imageUtils';

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
  const [hasResult, setHasResult] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  
  // Generation metadata
  const [generationPrompt, setGenerationPrompt] = useState<string>('');
  const [generationModel, setGenerationModel] = useState<string>('');
  const [generationCharacterDescription, setGenerationCharacterDescription] = useState<string>('');
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // Editing State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Frame Selection State
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null); // 1-based frame number for ResultView

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
  const [_hasAccount, _setHasAccount] = useState(false); // Mock user account state (reserved for future)

  // Grid configuration
  const [gridRows, _setGridRows] = useState<number>(2);
  const [gridCols, _setGridCols] = useState<number>(4);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive check (used by InputSidebar animations/layout)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

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
    
    setIsGenerating(true);
    setStatusText("Analyzing character...");
    setResult(false);
    setHasResult(false);
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
      setSelectedFrame(null);
      
      // Determine grid size based on selected action
      const action = ACTIONS.find(a => a.id === selectedAction);
      const frameCount = action?.frames || 8;
      const calculatedCols = Math.ceil(frameCount / gridRows);
      const finalCols = Math.max(calculatedCols, gridCols);
      
      // Get model-specific rules (using gemini-3-pro-image-preview for best quality and animation support)
      const modelId = 'gemini-3-pro-image-preview';
      const customRules = getStoredRules(modelId);
      
      // Generate the sprite sheet
      const result = await generateSpriteSheet(
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

      // Store generation metadata
      setGenerationPrompt(result.prompt);
      setGenerationModel(result.modelId);
      setGenerationCharacterDescription(result.characterDescription);

      // Post-process: Clean up magenta backgrounds and grid lines
      setStatusText("Cleaning sprite sheet...");
      const { cleaned, hadIssues, issues } = await cleanSpriteSheet(result.imageData, gridRows, finalCols);
      
      // Save to history instead of just setting state
      pushToHistory(cleaned);
      setResult(true);
      setHasResult(true);
      // Panel already collapsed when Generate was clicked
      setTokens(prev => Math.max(0, prev - 1));
      triggerConfetti();
      
      // Show appropriate success message
      if (hadIssues && issues.length > 0) {
        toast.success(`Sprite sheet generated! Fixed: ${issues.join(', ')}`);
      } else {
        toast.success("Sprite sheet generated successfully! 🎉");
      }
      
    } catch (error: any) {
      console.error("Generation failed:", error);
      const errorMessage = error.message || JSON.stringify(error);
      
      if (errorMessage.match(/(Requested entity was not found|PERMISSION_DENIED|UNAUTHENTICATED|API keys are not supported|API_KEY_MISSING|401|403)/)) {
        setHasApiKey(false);
        toast.error("Authentication failed. Please connect a valid API Key.");
      } else {
        toast.error(errorMessage || "Generation failed. Please try again.");
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
        setSelectedFrame(null);
      } else {
        setSelectedFrameIndices([index]);
        setSelectedFrame(index + 1); // Convert to 1-based for ResultView
      }
    }
  };

  const handleEditSpriteSheet = async (prompt: string) => {
    if (!generatedImage) return;
    
    // Validate prompt
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error("Please enter an edit prompt");
      return;
    }
    
    // Warn about potentially destructive prompts
    const destructiveKeywords = ['remove', 'delete', 'erase', 'clear', 'blank'];
    const lowerPrompt = trimmedPrompt.toLowerCase();
    const hasDestructive = destructiveKeywords.some(kw => lowerPrompt.includes(kw));
    
    if (hasDestructive && lowerPrompt.includes('sprite')) {
      toast.error("Cannot remove sprites from sprite sheet. Try 'clean up sprite' or 'improve sprite' instead.");
      return;
    }
    
    setIsEditing(true);
    try {
      if (selectedFrameIndices.length === 1) {
        // SINGLE FRAME EDIT MODE
        const targetIndex = selectedFrameIndices[0];
        setStatusText(`Refining Frame ${targetIndex + 1}...`);

        // 1. Crop
        const croppedFrame = await cropFrame(generatedImage, targetIndex, gridRows, gridCols);

        // 2. Edit
        const modelId = 'gemini-3-pro-image-preview';
        const editedFrame = await editSpriteSheet(croppedFrame, trimmedPrompt, modelId);

        // 3. Paste
        const updatedSheet = await pasteFrame(generatedImage, editedFrame, targetIndex, gridRows, gridCols);

        pushToHistory(updatedSheet);
        toast.success(`Frame ${targetIndex + 1} edited successfully!`);
      } else if (selectedFrameIndices.length > 1) {
        // MULTI-FRAME BATCH EDIT MODE
        setStatusText(`Editing ${selectedFrameIndices.length} selected frames...`);
        const modelId = 'gemini-3-pro-image-preview';
        let currentSheet = generatedImage;

        // Edit each selected frame sequentially
        for (let i = 0; i < selectedFrameIndices.length; i++) {
          const frameIndex = selectedFrameIndices[i];
          setStatusText(`Editing frame ${frameIndex + 1} (${i + 1}/${selectedFrameIndices.length})...`);

          const croppedFrame = await cropFrame(currentSheet, frameIndex, gridRows, gridCols);
          const editedFrame = await editSpriteSheet(croppedFrame, trimmedPrompt, modelId);
          currentSheet = await pasteFrame(currentSheet, editedFrame, frameIndex, gridRows, gridCols);
        }

        pushToHistory(currentSheet);
        toast.success(`${selectedFrameIndices.length} frames edited successfully!`);
      } else {
        // FULL SHEET EDIT MODE (no frames selected)
        setStatusText("Refining Sheet...");
        const modelId = 'gemini-3-pro-image-preview';
        const rawEdited = await editSpriteSheet(generatedImage, trimmedPrompt, modelId);

        // Post-process edited sheet too
        setStatusText("Cleaning edited sheet...");
        const { cleaned, hadIssues, issues } = await cleanSpriteSheet(rawEdited, gridRows, gridCols);

        pushToHistory(cleaned);

        if (hadIssues && issues.length > 0) {
          toast.success(`Sheet edited! Fixed: ${issues.join(', ')}`);
        } else {
          toast.success("Sprite sheet edited successfully!");
        }
      }
    } catch (error: any) {
      console.error("Edit failed:", error);
      toast.error(error.message || "Edit failed. Please try again.");
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
      toast.success(`Frame ${index + 1} aligned successfully!`);
    } catch (e) {
      console.error("Align failed", e);
      toast.error("Alignment failed. Please try again.");
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
      toast.success("All frames aligned successfully!");
    } catch (e) {
      console.error("Sheet align failed", e);
      toast.error("Sheet alignment failed. Please try again.");
    } finally {
      setIsEditing(false);
      setStatusText("");
    }
  };

  // Soft back to editor: keep the generated image so user can return to it.
  const backToEditor = () => {
    setResult(false);
    setSelectedFrameIndices([]);
    setActiveFrameIndex(null);
    setSelectedFrame(null);
  };

  const reset = () => {
    setResult(false);
    setHasResult(false);
    setIsGenerating(false);
    setGeneratedImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedFrameIndices([]);
    setActiveFrameIndex(null);
    setSelectedFrame(null);
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

  const handleRegenerate = () => {
    if (selectedFrame !== null) {
      const frameIndex = selectedFrame - 1;
      setSelectedFrameIndices([frameIndex]);
      // This will trigger the edit bar in ResultView
    }
  };

  return (
    <div className={cn(theme, "w-full h-screen overflow-hidden")}>
      <div className="w-full h-full bg-slate-50 dark:bg-[#0a0a0e] text-slate-900 dark:text-slate-200 p-4 md:p-6 lg:p-8 font-sans selection:bg-orange-500/30 transition-colors duration-500 flex flex-col">
        
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
        
        <div className="w-full max-w-[96%] 2xl:max-w-[1800px] mx-auto relative z-10 flex-1 flex flex-col min-h-0">
          
          <Header 
            tokens={tokens}
            setShowPricing={setShowPricing}
            theme={theme}
            toggleTheme={toggleTheme}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />

          {/* Main Layout - Flex Container */}
          <div className="flex-1 flex flex-col lg:flex-row relative min-h-0">
            <style>{`
              .sprite-scroll::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              .sprite-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .sprite-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .dark .sprite-scroll::-webkit-scrollbar-thumb {
                background: #334155;
              }
              .sprite-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
              .dark .sprite-scroll::-webkit-scrollbar-thumb:hover {
                background: #475569;
              }
            `}</style>
            
            {/* LEFT COLUMN: Controls (Collapsible) */}
            <InputSidebar 
              isDesktop={isDesktop}
              result={result}
              prompt={prompt}
              setPrompt={setPrompt}
              selectedFile={selectedFile}
              filePreview={filePreview}
              handleFileChange={handleFileChange}
              clearFile={clearFile}
              fileInputRef={fileInputRef}
              selectedArtStyle={selectedArtStyle}
              setSelectedArtStyle={setSelectedArtStyle}
              tabMode={tabMode}
              setTabMode={setTabMode}
              selectedAction={selectedAction}
              setSelectedAction={setSelectedAction}
              selectedExpression={selectedExpression}
              setSelectedExpression={setSelectedExpression}
              tokens={tokens}
              isGenerating={isGenerating}
              handleGenerate={handleGenerate}
              hasApiKey={hasApiKey}
              isCheckingApiKey={isCheckingApiKey}
              onConnectApiKey={handleConnectApiKey}
            />
            {/* RIGHT COLUMN: Preview & Results (Expandable) */}
            <motion.div 
              layout
              className="flex-1 relative flex flex-col h-full"
            >
              <div className={cn("h-full flex flex-col transition-all duration-500", !result ? "pl-0 lg:pl-12" : "pl-0")}>
              <AnimatePresence mode="wait">
                 {!result ? (
                   <motion.div 
                     key="preview"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                     className="flex-1 flex flex-col gap-4 h-full"
                   >
                     <div className="flex items-center justify-between mb-2 shrink-0">
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
                     
                     <div 
                        className={cn(
                          "flex-1 relative rounded-2xl transition-all overflow-hidden min-h-[400px] h-full border border-slate-200 dark:border-slate-800 shadow-sm",
                          hasResult ? "cursor-pointer group ring-offset-4 ring-offset-slate-50 dark:ring-offset-[#0a0a0e]" : ""
                        )}
                        onClick={() => hasResult && setResult(true)}
                     >
                        <BlobPreview 
                           mode={tabMode}
                           action={selectedAction} 
                           expression={selectedExpression} 
                           isTransparent={isTransparent}
                           isGenerating={isGenerating}
                        />

                        {hasResult && (
                          <div className="absolute inset-0 z-10 bg-slate-900/5 dark:bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px] rounded-2xl border-2 border-orange-500/50 border-dashed">
                            <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                              <span className="font-bold text-slate-900 dark:text-white pr-2">Return to Result</span>
                            </div>
                          </div>
                        )}
                     </div>
                     
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
                   <ResultView 
                      tokens={tokens}
                      reset={backToEditor}
                      setPrompt={setPrompt}
                      setSelectedFile={setSelectedFile}
                      setFilePreview={setFilePreview}
                      setHasResult={setHasResult}
                      imageSrc={generatedImage}
                      rows={gridRows}
                      cols={gridCols}
                      selectedFrame={selectedFrame}
                      setSelectedFrame={setSelectedFrame}
                      activeFrameIndex={activeFrameIndex}
                      selectedFrameIndices={selectedFrameIndices}
                      onToggleFrameSelect={handleToggleFrameSelect}
                      onEdit={handleEditSpriteSheet}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      canUndo={historyIndex > 0}
                      canRedo={historyIndex < history.length - 1}
                      isEditing={isEditing}
                      isGenerating={isGenerating}
                      statusText={statusText}
                      fps={fps}
                      setFps={setFps}
                      isTransparent={isTransparent}
                      setIsTransparent={setIsTransparent}
                      onDownloadSheet={handleDownloadSheet}
                      onDownloadGif={handleDownloadGif}
                      onRegenerate={handleRegenerate}
                      onClearResult={reset}
                      onAutoAlign={handleAutoAlignFrame}
                      onAlignAll={handleAutoAlignSheet}
                      generationPrompt={generationPrompt}
                      generationModel={generationModel}
                      generationCharacterDescription={generationCharacterDescription}
                   />
                 )}
              </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
