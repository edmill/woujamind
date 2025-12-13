/**
 * SpriteMagic Component
 * Main orchestrator for the sprite generation interface.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft,
  Settings2,
  Grid,
  Zap
} from 'lucide-react';

import { BackgroundParticles } from './components/BackgroundParticles';
import { BlobPreview } from './components/BlobPreview';
import { PricingModal } from './components/PricingModal';
import { TabMode, ActionType, ExpressionType, Theme, ArtStyle } from './types';
import { cn } from './utils';

// New Split Components
import { Header } from './components/Header';
import { InputSidebar } from './components/InputSidebar';
import { ResultView } from './components/ResultView';

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
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);

  // Responsive check
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // New states for download options
  const [fps, setFps] = useState<number>(8);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  
  // Paywall & Token State
  const [tokens, setTokens] = useState<number>(1); // Start with 1 free token
  const [showPricing, setShowPricing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect: Keyboard Navigation for Sprite Sheet
  useEffect(() => {
    if (!result) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If no frame selected, arrows select the first one
      if (selectedFrame === null) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
          setSelectedFrame(1);
          e.preventDefault();
        }
        return;
      }
      
      const cols = 4;
      const totalFrames = 12; // based on current hardcoded array
      let newFrame = selectedFrame;
      
      switch(e.key) {
        case 'ArrowRight':
          newFrame = newFrame < totalFrames ? newFrame + 1 : 1;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          newFrame = newFrame > 1 ? newFrame - 1 : totalFrames;
          e.preventDefault();
          break;
        case 'ArrowDown':
          if (newFrame + cols <= totalFrames) newFrame += cols;
          e.preventDefault();
          break;
        case 'ArrowUp':
          if (newFrame - cols >= 1) newFrame -= cols;
          e.preventDefault();
          break;
        case 'Escape':
          setSelectedFrame(null);
          e.preventDefault();
          break;
      }
      
      if (newFrame !== selectedFrame) {
        setSelectedFrame(newFrame);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, selectedFrame]);

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

  const handleGenerate = () => {
    if (!prompt && !selectedFile) return;

    // Check tokens
    if (tokens <= 0) {
      setShowPricing(true);
      return;
    }
    
    setIsGenerating(true);
    
    // Deduct token after "successful" generation (simulated)
    setTimeout(() => {
      setTokens(prev => Math.max(0, prev - 1));
      setIsGenerating(false);
      setResult(true);
      setHasResult(true);
    }, 2500);
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
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setResult(false);
    setIsGenerating(false);
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
        
        <div className="w-full max-w-[96%] 2xl:max-w-[1800px] mx-auto relative z-10 flex-1 flex flex-col min-h-0">
          
          <Header 
            tokens={tokens}
            setShowPricing={setShowPricing}
            theme={theme}
            toggleTheme={toggleTheme}
          />

          {/* Main Layout - Flex Container for Roll-up Animation */}
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
                             <motion.div 
                               initial={{ y: 10, opacity: 0 }}
                               whileHover={{ scale: 1.05 }}
                               className="bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transform group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                             >
                               <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
                                 <ArrowLeft className="w-5 h-5 rotate-180" />
                               </span>
                               <span className="font-bold text-slate-900 dark:text-white pr-2">Return to Result</span>
                             </motion.div>
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
                      reset={reset}
                      setPrompt={setPrompt}
                      setSelectedFile={setSelectedFile}
                      setFilePreview={setFilePreview}
                      setHasResult={setHasResult}
                      selectedFrame={selectedFrame}
                      setSelectedFrame={setSelectedFrame}
                      fps={fps}
                      setFps={setFps}
                      isTransparent={isTransparent}
                      setIsTransparent={setIsTransparent}
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