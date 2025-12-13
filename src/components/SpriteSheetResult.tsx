/**
 * SpriteSheetResult Component
 * Displays the generated sprite sheet with frame selection and editing capabilities.
 */
import React, { useState, useEffect } from 'react';
import { Download, Wand2, X, Check, Undo2, Redo2, LayoutList, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils';

interface SpriteSheetResultProps {
  imageSrc: string | null;
  rows: number;
  cols: number;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
  isGenerating?: boolean;
  statusText?: string;
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

  // Removed auto-open behavior - user must manually click Magic Edit button
  // Previous behavior: automatically opened edit bar when a single frame was selected

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
  };

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
      <div className="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 items-center justify-center text-slate-500 dark:text-slate-400 border-dashed relative group overflow-hidden">
        <div className="text-center p-8 z-10">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-800 group-hover:border-orange-500/30 transition-colors">
            <ImageIcon className="w-8 h-8 opacity-40 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:opacity-100 transition-all" />
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Ready to Generate</p>
          <p className="text-xs opacity-60 mt-1 max-w-[200px] mx-auto">Upload a character, select actions, and click generate.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative group",
        imageSrc ? "" : "bg-transparent"
      )}
      style={imageSrc ? { backgroundColor } : undefined}
    >
      
      {/* LOADING OVERLAY */}
      {isGenerating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="relative mb-6">
            {/* Outer Spinner */}
            <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            {/* Inner Spinner Reverse */}
            <div className="absolute inset-2 border-4 border-sky-500/20 border-b-sky-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-400 dark:text-orange-300 animate-pulse" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white tracking-wide bg-gradient-to-r from-orange-300 to-sky-300 bg-clip-text text-transparent animate-pulse">
            {statusText}
          </h3>
          
          <div className="mt-3 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:150ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:300ms]"></span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2 opacity-70">AI Model is processing pixel data...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      {imageSrc && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
          
          {/* Left Side: Label & Controls */}
          <div className="flex gap-2 pointer-events-auto">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Raw Output</span>
              
              {/* UNDO / REDO */}
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
              <button 
                onClick={onUndo} 
                disabled={!canUndo || isEditing}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-500 dark:disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
                title="Undo"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={onRedo} 
                disabled={!canRedo || isEditing}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:text-slate-500 dark:disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors"
                title="Redo"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
              {(onAlignAll || onAutoAlign) && (
                <button 
                  onClick={handleHeaderAlignClick}
                  disabled={isEditing}
                  className="p-1.5 rounded-lg flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-xl transition-all",
                showEditBar 
                  ? 'bg-orange-600 dark:bg-orange-500 border-orange-500 text-white' 
                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                selectedFrameIndices.length > 1 && 'opacity-50 cursor-not-allowed'
              )}
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
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 p-2 rounded-lg shadow-xl pointer-events-auto transition-colors"
            title="Download PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAGIC EDIT BAR */}
      {showEditBar && imageSrc && (
        <div className="absolute top-16 left-4 right-4 z-20 pointer-events-auto">
          <div className={cn(
            "bg-white dark:bg-slate-900 border rounded-xl p-2 shadow-2xl flex gap-2",
            isSingleFrameEdit ? 'border-orange-500/50' : 'border-orange-500/50'
          )}>
            <div className="flex items-center pl-2 pr-1">
              <Wand2 className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            </div>
            <input 
              type="text" 
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder={isSingleFrameEdit ? "Tell AI what to do with this sprite (e.g. 'Center the character', 'Fix face')..." : "Edit entire sheet (e.g. 'Make outlines thicker')..."}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              onKeyDown={(e) => {
                e.stopPropagation(); 
                if (e.key === 'Enter') handleSubmitEdit();
              }}
              autoFocus
            />
            {isSingleFrameEdit && (
              <button
                onClick={handleAlign}
                disabled={isEditing}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400 rounded-lg transition-colors border border-orange-500/20"
                title="Center Sprite (Auto-Align pixels)"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleSubmitEdit}
              disabled={!editPrompt.trim() || isEditing}
              className="p-2 rounded-lg transition-colors disabled:opacity-50 text-white bg-orange-600 hover:bg-orange-500"
            >
              <Check className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowEditBar(false)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isSingleFrameEdit && (
            <div className="flex justify-between items-center mt-1 ml-2">
              <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                Editing Single Frame Mode (AI)
              </div>
            </div>
          )}
        </div>
      )}

      {/* IMAGE CONTAINER */}
      {imageSrc && (
        <div className={cn(
          "flex-1 overflow-auto p-8 flex items-center justify-center",
          backgroundColor === 'transparent' && "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0wIDBoMTB2MTBIMHptMTAgMTBoMTB2MTBIMTB6IiBmaWxsPSIjY2NjIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4=')] bg-[length:20px_20px]"
        )}>
          <div className={cn(
            "relative shadow-2xl rounded-sm overflow-hidden border border-slate-300 dark:border-slate-700/50 transition-opacity w-fit mx-auto",
            isEditing && !isSingleFrameEdit ? 'opacity-50' : 'opacity-100'
          )}>
            <img 
              src={imageSrc} 
              alt="Generated Sprite Sheet" 
              className="max-w-full max-h-[60vh] object-contain block [image-rendering:pixelated]"
            />
            {/* Grid Overlay */}
            <div 
              className="absolute inset-0 pointer-events-auto cursor-crosshair grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`
              }}
            >
              {Array.from({ length: totalVisualFrames }).map((_, i) => {
                const isSelected = selectedFrameIndices.includes(i);
                const isTargetForEditLoading = isEditing && isSingleFrameEdit && selectedFrameIndices[0] === i;

                return (
                  <div 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFrameSelect(i, e.shiftKey || e.ctrlKey || e.metaKey);
                    }}
                    className={cn(
                      "relative border transition-all duration-75 overflow-hidden",
                      isSelected 
                        ? 'border-orange-500/80 bg-orange-500/5 z-10' 
                        : 'border-orange-500/10 hover:bg-white/5 dark:hover:bg-white/5'
                    )}
                  >
                    
                    {/* Moving Playhead Marker - RED */}
                    {activeFrameIndex === i && (
                      <div className="absolute inset-0 border-[3px] border-red-600 dark:border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-30 pointer-events-none"></div>
                    )}
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)] z-20"></div>
                    )}

                    {/* Local Loading Indicator for Single Frame Edit */}
                    {isTargetForEditLoading && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <div className="bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-xl border border-orange-500/50">
                          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </div>
                    )}

                    <span className={cn(
                      "text-[9px] p-0.5 block transition-opacity pointer-events-none relative z-20",
                      activeFrameIndex === i || isSelected ? 'opacity-100 font-bold' : 'opacity-0 group-hover:opacity-100',
                      isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-orange-400 dark:text-orange-300'
                    )}>
                      {i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Global Loading Indicator (Full Sheet) */}
            {isEditing && !isSingleFrameEdit && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="bg-black/70 dark:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 border border-orange-500/50 shadow-2xl">
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
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

