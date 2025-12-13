/**
 * ResultView Component
 * Displays the generated sprite sheet and animation preview.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  FileImage, 
  Film, 
  Settings2, 
  Sparkles, 
  Lock, 
  Wand2, 
  Undo, 
  Redo, 
  Grid, 
  MousePointer2, 
  Play 
} from 'lucide-react';
import { cn } from '../utils';

interface ResultViewProps {
  tokens: number;
  reset: () => void;
  setPrompt: (s: string) => void;
  setSelectedFile: (f: File | null) => void;
  setFilePreview: (s: string | null) => void;
  setHasResult: (b: boolean) => void;
  
  // Sprite Sheet State
  selectedFrame: number | null;
  setSelectedFrame: (frame: number | null) => void;
  
  // Animation Preview State
  fps: number;
  setFps: (fps: number) => void;
  isTransparent: boolean;
  setIsTransparent: (isTransparent: boolean) => void;
}

export function ResultView({
  tokens,
  reset,
  setPrompt,
  setSelectedFile,
  setFilePreview,
  setHasResult,
  selectedFrame,
  setSelectedFrame,
  fps,
  setFps,
  isTransparent,
  setIsTransparent
}: ResultViewProps) {
  return (
    <motion.div 
      key="result"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Result Header */}
      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={reset}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Back to Editor"
            >
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Generation Complete</h3>
         </div>
         <div className="flex gap-2">
           <button 
             className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
             title="Download Sprite Sheet"
           >
             <FileImage className="w-4 h-4" />
             <span>Download Sheet</span>
           </button>
           <button 
             className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-orange-900/20"
             title="Download GIF"
           >
             <Film className="w-4 h-4" />
             <span>Download GIF</span>
           </button>
         </div>
      </div>

      {/* Split View Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">

         {/* LEFT: Sprite Sheet */}
         <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="flex items-center justify-between min-h-[32px] shrink-0">
               <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sprite Sheet</h4>
               <div className="text-xs text-slate-400">2048 x 256px</div>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl relative overflow-hidden flex flex-col shadow-inner group/sheet min-h-0">
               {/* Border Overlay to prevent clipping by children */}
               <div className="absolute inset-0 rounded-2xl border border-slate-200 dark:border-slate-800 pointer-events-none z-50" />
               
               <div className="absolute inset-0 opacity-30 pointer-events-none" 
                 style={{
                     backgroundImage: 'linear-gradient(45deg, #000000 25%, transparent 25%, transparent 75%, #000000 75%, #000000), linear-gradient(45deg, #000000 25%, transparent 25%, transparent 75%, #000000 75%, #000000)',
                     backgroundSize: '20px 20px',
                     backgroundPosition: '0 0, 10px 10px',
                     opacity: 0.05
                 }}
               />
               
               {/* AI Edit Toolbar */}
               <div className="h-14 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 relative z-20 shrink-0">
                  {/* Left: History Controls */}
                  <div className="flex items-center gap-1">
                     <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors" title="Undo">
                       <Undo className="w-4 h-4" />
                     </button>
                     <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors" title="Redo">
                       <Redo className="w-4 h-4" />
                     </button>
                  </div>

                  {/* Right: Frame Context */}
                  <div className="flex items-center gap-3">
                     {selectedFrame !== null ? (
                        <>
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                             <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                             <span className="text-xs font-bold font-mono text-orange-600 dark:text-orange-400">Frame {selectedFrame}</span>
                           </div>
                           <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20" title="AI Regenerate">
                             <Wand2 className="w-3 h-3" />
                             <span>Regenerate</span>
                           </button>
                        </>
                     ) : (
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Select a frame to edit</span>
                     )}
                  </div>
               </div>

               <div className="flex-1 grid grid-cols-4 gap-4 overflow-y-auto p-4 custom-scrollbar content-start relative z-10 pb-12">
                 {[1,2,3,4,5,6,7,8,9,10,11,12].map((i, idx) => (
                   <motion.div 
                     key={i} 
                     onClick={() => setSelectedFrame(selectedFrame === i ? null : i)}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ 
                       opacity: 1, 
                       scale: selectedFrame === i ? 1.05 : 1,
                       borderColor: selectedFrame === i ? 'rgb(249 115 22)' : ''
                     }}
                     transition={{ delay: 0.2 + (idx * 0.05) }}
                     className={cn(
                       "aspect-square bg-white dark:bg-slate-800 border-2 rounded-xl transition-all flex items-center justify-center text-xs font-mono relative group cursor-pointer overflow-hidden",
                       selectedFrame === i 
                         ? "border-orange-500 ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/10 z-10" 
                         : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-slate-500 hover:scale-[1.02]"
                     )}
                   >
                      <span className={cn(
                        "transition-opacity",
                        selectedFrame === i ? "opacity-100 font-bold text-orange-500" : "opacity-30 group-hover:opacity-100 text-slate-400"
                      )}>
                        #{i}
                      </span>
                      
                      {selectedFrame === i && (
                        <motion.div 
                          layoutId="selection-glow"
                          className="absolute inset-0 bg-orange-500/5 pointer-events-none"
                        />
                      )}
                      
                      {/* Selection Corner Marker */}
                      {selectedFrame === i && (
                        <div className="absolute top-0 right-0 p-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        </div>
                      )}
                   </motion.div>
                 ))}
               </div>
            </div>

            {/* Layout Update: Moved Generations Remaining to Left Column Footer */}
            <div className="flex items-center px-1 shrink-0 pt-2">
               <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Generations remaining: <span className="text-orange-500 font-bold ml-1">{tokens}</span>
               </div>
            </div>
         </div>
         
         {/* RIGHT: Animation Preview */}
         <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="flex items-center justify-between min-h-[32px] shrink-0">
               <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Animation Preview</h4>
               
               {/* Controls */}
               <div className="flex items-center gap-3">
                  <button 
                     onClick={() => setIsTransparent(!isTransparent)}
                     className={cn(
                       "p-1.5 rounded-lg border transition-all",
                       isTransparent 
                         ? "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300" 
                         : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                     )}
                     title="Toggle Transparency"
                  >
                     <Grid className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-orange-500/30 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg min-h-0">
               {!isTransparent ? (
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0wIDBoMTB2MTBIMHptMTAgMTBoMTB2MTBIMTB6IiBmaWxsPSIjMWUyOTNiIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
               ) : (
                 <div className="absolute inset-0 opacity-40" 
                   style={{
                       backgroundImage: 'radial-gradient(#0ea5e9 0.5px, transparent 0.5px), radial-gradient(#0ea5e9 0.5px, #e5e5f7 0.5px)',
                       backgroundSize: '20px 20px',
                       backgroundPosition: '0 0, 10px 10px'
                   }}
                 />
               )}
               
               <motion.div 
                 key={selectedFrame || 'anim'}
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 260, damping: 20 }}
                 className="relative z-10 w-full h-full flex items-center justify-center p-8" 
                 style={{ imageRendering: 'pixelated' }}
               >
                 {selectedFrame ? (
                   <div className="w-48 h-48 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-orange-500 flex items-center justify-center relative group">
                     <div className="text-4xl font-bold text-orange-500 opacity-20 group-hover:opacity-40 transition-opacity">#{selectedFrame}</div>
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                       Frame {selectedFrame}
                     </div>
                     {/* Mock content for frame */}
                     <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-sky-500/10" />
                   </div>
                 ) : (
                   <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-sky-500 rounded-lg shadow-[0_0_50px_rgba(249,115,22,0.6)] flex items-center justify-center text-white font-bold border-4 border-white dark:border-orange-400 text-center text-sm p-2 animate-bounce-slow">
                      ANIMATION PREVIEW
                   </div>
                 )}
               </motion.div>

               <div className="absolute bottom-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-mono group/fps-control transition-all hover:bg-black/70 hover:px-4">
                  <button 
                    onClick={() => selectedFrame && setSelectedFrame(null)}
                    className={cn("flex items-center gap-2", selectedFrame ? "cursor-pointer hover:text-orange-400" : "cursor-default")}
                    title={selectedFrame ? "Click to return to animation preview" : "Animation Speed"}
                  >
                     {selectedFrame ? (
                        <MousePointer2 className="w-3 h-3 text-orange-400" />
                     ) : (
                        <Play className="w-3 h-3 fill-current" />
                     )}
                  </button>
                  
                  <div className="flex items-center gap-2">
                      <span className="min-w-[40px] text-center">{fps} FPS</span>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value))}
                        className="w-0 group-hover/fps-control:w-24 transition-all duration-300 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-orange-500"
                      />
                  </div>
               </div>
            </div>

            {/* Layout Update: Moved Action Buttons to Right Column Footer */}
            <div className="flex gap-4 justify-end pt-4 shrink-0">
               <button 
                 onClick={reset}
                 className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
               >
                 <Settings2 className="w-5 h-5" />
                 Tweak Settings
               </button>
               
               <button 
                 onClick={() => {
                   setPrompt('');
                   setSelectedFile(null);
                   setFilePreview(null);
                   setHasResult(false);
                   reset();
                 }}
                 className={cn(
                   "px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all",
                   tokens > 0 
                     ? "bg-gradient-to-r from-orange-500 to-sky-500 hover:shadow-orange-500/25 hover:scale-[1.02]" 
                     : "bg-slate-700 cursor-not-allowed opacity-50"
                 )}
                 disabled={tokens <= 0}
               >
                 {tokens > 0 ? (
                   <>
                     <Sparkles className="w-5 h-5" />
                     <span>Create New</span>
                     <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">1 Token</span>
                   </>
                 ) : (
                   <>
                     <Lock className="w-5 h-5" />
                     <span>Need Tokens</span>
                   </>
                 )}
               </button>
            </div>
         </div>

      </div>
    </motion.div>
  );
}