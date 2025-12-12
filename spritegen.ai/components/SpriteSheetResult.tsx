
import React, { useState, useEffect } from 'react';
import { Download, Wand2, X, Check, MousePointerClick, Ghost, AlignCenterHorizontal, Undo2, Redo2, LayoutList, Sparkles, Image as ImageIcon } from 'lucide-react';

interface SpriteSheetResultProps {
  imageSrc: string | null;
  rows: number;
  cols: number;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
  isGenerating?: boolean; // New Prop
  statusText?: string;    // New Prop
  backgroundColor: string;
  activeFrameIndex: number | null;
  selectedFrameIndices: number[];
  onToggleFrameSelect: (index: number, isMulti: boolean) => void;
  onAutoAlign?: (index: number) => void;
  onAlignAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const SpriteSheetResult: React.FC<SpriteSheetResultProps> = ({ 
  imageSrc, 
  rows,
  cols,
  onEdit,
  isEditing,
  isGenerating = false,
  statusText = "Processing...",
  backgroundColor,
  activeFrameIndex,
  selectedFrameIndices,
  onToggleFrameSelect,
  onAutoAlign,
  onAlignAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [showEditBar, setShowEditBar] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);

  // Auto-open edit bar when a single frame is selected
  useEffect(() => {
      if (selectedFrameIndices.length === 1) {
          setShowEditBar(true);
      } else {
          setShowEditBar(false);
      }
  }, [selectedFrameIndices]);

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `sprite-sheet-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitEdit = () => {
    if (editPrompt.trim()) {
      onEdit(editPrompt);
      setEditPrompt("");
    }
  };

  const handleAlign = () => {
      if (onAutoAlign && selectedFrameIndices.length === 1) {
          onAutoAlign(selectedFrameIndices[0]);
      } else {
          onEdit("Center this character in the frame exactly.");
      }
  }

  const handleHeaderAlignClick = () => {
      if (selectedFrameIndices.length === 1 && onAutoAlign) {
          onAutoAlign(selectedFrameIndices[0]);
      } else if (onAlignAll) {
          onAlignAll();
      }
  };

  const isSingleFrameEdit = selectedFrameIndices.length === 1;
  const totalVisualFrames = rows * cols;

  // RENDER EMPTY STATE if no image and not generating
  if (!imageSrc && !isGenerating) {
    return (
        <div className="flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/30 items-center justify-center text-slate-600 border-dashed relative group overflow-hidden">
            <div className="text-center p-8 z-10">
                <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mx-auto mb-4 border border-slate-800 group-hover:border-indigo-500/30 transition-colors">
                    <ImageIcon className="w-8 h-8 opacity-40 group-hover:text-indigo-400 group-hover:opacity-100 transition-all" />
                </div>
                <p className="text-sm font-bold text-slate-500 group-hover:text-slate-300">Ready to Generate</p>
                <p className="text-xs opacity-60 mt-1 max-w-[200px] mx-auto">Upload a character, select actions, and click generate.</p>
            </div>
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ 
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }} 
            />
        </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-800 overflow-hidden relative group" style={{ backgroundColor: imageSrc ? backgroundColor : '#020617' }}>
      
      {/* ---------------- LOADING OVERLAY ---------------- */}
      {isGenerating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="relative mb-6">
               {/* Outer Spinner */}
               <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
               {/* Inner Spinner Reverse */}
               <div className="absolute inset-2 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
               {/* Center Icon */}
               <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="w-8 h-8 text-indigo-300 animate-pulse" />
               </div>
           </div>
           
           <h3 className="text-xl font-bold text-white tracking-wide bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
               {statusText}
           </h3>
           
           <div className="mt-3 flex flex-col items-center gap-1">
               <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
               </div>
               <p className="text-[10px] text-slate-500 font-mono mt-2 opacity-70">AI Model is processing pixel data...</p>
           </div>
        </div>
      )}

      {/* ---------------- HEADER ---------------- */}
      {imageSrc && (
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
        
        {/* Left Side: Label & Magic Edit */}
        <div className="flex gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Raw Output</span>
            
            {/* UNDO / REDO */}
            <div className="w-px h-3 bg-slate-700 mx-1"></div>
            <button 
                onClick={onUndo} 
                disabled={!canUndo || isEditing}
                className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Undo"
            >
                <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={onRedo} 
                disabled={!canRedo || isEditing}
                className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Redo"
            >
                <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-700 mx-1"></div>
            {(onAlignAll || onAutoAlign) && (
                <button 
                    onClick={handleHeaderAlignClick}
                    disabled={isEditing}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-green-400 disabled:opacity-30 transition-colors"
                    title={isSingleFrameEdit ? "Auto-Align Selected Frame" : "Auto-Align Full Grid (Fix Jitter)"}
                >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline text-[10px] font-bold">
                        {isSingleFrameEdit ? 'Align Frame' : 'Align Grid'}
                    </span>
                </button>
            )}
          </div>
          
          <button
            onClick={() => setShowEditBar(!showEditBar)}
            disabled={isEditing || selectedFrameIndices.length > 1}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-xl transition-all
              ${showEditBar 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'}
              ${selectedFrameIndices.length > 1 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={selectedFrameIndices.length > 1 ? "Select only 1 frame to use Magic Edit" : "Edit Sheet or Selected Frame"}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">
                {isEditing ? 'Editing...' : isSingleFrameEdit ? `Edit Frame ${selectedFrameIndices[0] + 1}` : 'Magic Edit'}
            </span>
          </button>
        </div>

        <button 
          onClick={handleDownload}
          className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:bg-slate-800 text-slate-300 p-2 rounded-lg shadow-xl pointer-events-auto transition-colors"
          title="Download PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      )}

      {/* ---------------- MAGIC EDIT BAR ---------------- */}
      {showEditBar && imageSrc && (
        <div className="absolute top-16 left-4 right-4 z-20 pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-200">
          <div className={`bg-slate-900 border ${isSingleFrameEdit ? 'border-amber-500/50' : 'border-indigo-500/50'} rounded-xl p-2 shadow-2xl flex gap-2`}>
            <div className="flex items-center pl-2 pr-1">
                {isSingleFrameEdit ? <MousePointerClick className="w-4 h-4 text-amber-400" /> : <Wand2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <input 
              type="text" 
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder={isSingleFrameEdit ? "Tell AI what to do with this sprite (e.g. 'Center the character', 'Fix face')..." : "Edit entire sheet (e.g. 'Make outlines thicker')..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              onKeyDown={(e) => {
                  // STOP PROPAGATION to prevent AnimationPreview listeners from stealing focus/events
                  e.stopPropagation(); 
                  if (e.key === 'Enter') handleSubmitEdit();
              }}
              autoFocus
            />
            {isSingleFrameEdit && (
                <button
                    onClick={handleAlign}
                    disabled={isEditing}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors border border-amber-500/20"
                    title="Center Sprite (Auto-Align pixels)"
                >
                    <AlignCenterHorizontal className="w-4 h-4" />
                </button>
            )}
            <button 
              onClick={handleSubmitEdit}
              disabled={!editPrompt.trim() || isEditing}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 text-white ${isSingleFrameEdit ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
              <Check className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowEditBar(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isSingleFrameEdit && (
              <div className="flex justify-between items-center mt-1 ml-2">
                 <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                    Editing Single Frame Mode (AI)
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-500 font-bold uppercase">Helper:</span>
                     <button onClick={() => setOnionSkinEnabled(!onionSkinEnabled)} className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${onionSkinEnabled ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                         {onionSkinEnabled ? 'Hide Ghost' : 'Show Ghost'}
                     </button>
                 </div>
              </div>
          )}
        </div>
      )}

      {/* ---------------- IMAGE CONTAINER ---------------- */}
      {imageSrc && (
      <div className={`flex-1 overflow-auto p-8 flex items-center justify-center ${backgroundColor === 'transparent' ? 'checkerboard' : ''}`}>
        {/* ADDED w-fit mx-auto to ensure grid sits perfectly on image */}
        <div className={`relative shadow-2xl rounded-sm overflow-hidden border border-slate-700/50 transition-opacity w-fit mx-auto ${isEditing && !isSingleFrameEdit ? 'opacity-50' : 'opacity-100'}`}>
            <img 
              src={imageSrc} 
              alt="Generated Sprite Sheet" 
              className="max-w-full max-h-[60vh] object-contain pixelated block"
            />
            {/* Grid Overlay */}
            <div 
              className="absolute inset-0 pointer-events-auto cursor-crosshair"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`
              }}
            >
              {Array.from({ length: totalVisualFrames }).map((_, i) => {
                const isSelected = selectedFrameIndices.includes(i);
                // Calculate pseudo-onion skin if needed
                const isTargetForOnion = isSingleFrameEdit && onionSkinEnabled && selectedFrameIndices[0] === i;
                const prevIndex = i - 1;
                const showOnion = isTargetForOnion && prevIndex >= 0;
                
                // Show loading spinner specific to this frame if it's the target
                const isTargetForEditLoading = isEditing && isSingleFrameEdit && selectedFrameIndices[0] === i;

                return (
                    <div 
                    key={i} 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFrameSelect(i, e.shiftKey || e.ctrlKey || e.metaKey);
                    }}
                    className={`
                        relative border transition-all duration-75 overflow-hidden
                        ${isSelected ? 'border-amber-500/80 bg-amber-500/5 z-10' : 'border-indigo-500/10 hover:bg-white/5'}
                    `}
                    >
                    
                    {/* Onion Skin Layer (Previous Frame Ghost) */}
                    {showOnion && (
                        <div 
                            className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-difference"
                            style={{
                                backgroundImage: `url(${imageSrc})`,
                                // We need to calculate the exact position to show the PREV frame here
                                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                                // Positions are 0-indexed percentages. 
                                // e.g. 2 cols. Col 0 = 0%, Col 1 = 100%. 
                                // Formula: index / (count - 1) * 100
                                backgroundPositionX: `${((prevIndex % cols) / Math.max(1, cols - 1)) * 100}%`,
                                backgroundPositionY: `${(Math.floor(prevIndex / cols) / Math.max(1, rows - 1)) * 100}%`
                            }}
                        />
                    )}

                    {/* Moving Playhead Marker - RED */}
                    {activeFrameIndex === i && (
                        <div className="absolute inset-0 border-[3px] border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-30 pointer-events-none"></div>
                    )}
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                         <div className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] z-20"></div>
                    )}

                    {/* Local Loading Indicator for Single Frame Edit */}
                    {isTargetForEditLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                             <div className="bg-slate-900/90 p-2 rounded-full shadow-xl border border-indigo-500/50 animate-in fade-in zoom-in duration-200">
                                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                             </div>
                        </div>
                    )}

                    <span className={`text-[9px] p-0.5 block transition-opacity pointer-events-none relative z-20 ${activeFrameIndex === i || isSelected ? 'opacity-100 font-bold' : 'opacity-0 group-hover:opacity-100 text-indigo-400/50'} ${isSelected ? 'text-amber-400' : 'text-indigo-300'}`}>
                        {i + 1}
                    </span>
                    </div>
                );
              })}
            </div>
            
            {/* Global Loading Indicator (Full Sheet) */}
            {isEditing && !isSingleFrameEdit && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border border-indigo-500/50 shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-white">Refining Sheet...</span>
                </div>
              </div>
            )}
        </div>
      </div>
      )}
    </div>
  );
};
