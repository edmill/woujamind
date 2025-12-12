
import React, { useRef } from 'react';
import { GridConfig, StylePreset } from '../types';
import { SPRITE_ACTIONS, STYLE_PRESETS, GRID_PRESETS } from '../constants';
import { Upload, Wand2, Image as ImageIcon, ALargeSmall, Palette, Film, Sparkles, Zap, LayoutGrid, Settings } from 'lucide-react';

interface SidebarProps {
  selectedActions: string[];
  toggleAction: (id: string) => void;
  onImageUpload: (file: File) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  statusText: string;
  uploadedImage: string | null;
  gridConfig: GridConfig;
  setGridConfig: (config: GridConfig) => void;
  styleNotes: string;
  setStyleNotes: (notes: string) => void;
  characterDescription: string;
  setCharacterDescription: (desc: string) => void;
  selectedStyleId: string;
  setSelectedStyleId: (id: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedActions,
  toggleAction,
  onImageUpload,
  onGenerate,
  isGenerating,
  statusText,
  uploadedImage,
  gridConfig,
  setGridConfig,
  styleNotes,
  setStyleNotes,
  characterDescription,
  setCharacterDescription,
  selectedStyleId,
  setSelectedStyleId,
  selectedModel,
  setSelectedModel,
  onOpenSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const currentPresetId = GRID_PRESETS.find(p => p.rows === gridConfig.rows && p.cols === gridConfig.cols)?.id || 'custom';

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const preset = GRID_PRESETS.find(p => p.id === e.target.value);
      if (preset) {
          setGridConfig({
              rows: preset.rows,
              cols: preset.cols,
              activeFrames: preset.rows * preset.cols
          });
      }
  };

  return (
    <div className="w-80 h-full bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl z-20 font-sans">
      <div className="p-6 border-b border-slate-800/50 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            SpriteGen.ai
            </h1>
            <p className="text-xs text-slate-500 mt-1">Professional Asset Generator</p>
        </div>
        <button 
            onClick={onOpenSettings}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Settings & Rules"
        >
            <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        
        {/* Upload Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">1</span>
            Source Character
          </h3>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all group overflow-hidden
              ${uploadedImage ? 'border-indigo-500/50 bg-slate-900' : 'border-slate-800 hover:border-slate-600 hover:bg-slate-900'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
            
            {uploadedImage ? (
              <div className="relative group-hover:scale-105 transition-transform duration-300">
                <img src={uploadedImage} alt="Uploaded" className="mx-auto h-32 object-contain rounded-md shadow-2xl" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-md backdrop-blur-sm">
                   <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/20">Change</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-slate-200 py-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors border border-slate-800">
                    <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Upload Image</span>
                <span className="text-[10px] text-slate-500 max-w-[150px]">Supports PNG, JPG. Best results with clear full-body images.</span>
              </div>
            )}
          </div>
        </section>

        {/* Character Description */}
        <section>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">2</span>
             Identity
           </h3>
           <div className="space-y-3">
             <div className="relative">
                <ALargeSmall className="absolute top-3 left-3 w-4 h-4 text-slate-500" />
                <textarea
                    value={characterDescription}
                    onChange={(e) => setCharacterDescription(e.target.value)}
                    placeholder="Describe the character... (e.g. A cyberpunk samurai with a red laser katana and neon armor)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 p-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-600"
                    rows={3}
                />
             </div>
           </div>
        </section>

        {/* Style Selection */}
        <section>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">3</span>
             Art Style
           </h3>
           <div className="space-y-3">
              <div className="relative">
                 <Palette className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-slate-500 pointer-events-none" />
                 <select
                    value={selectedStyleId}
                    onChange={(e) => setSelectedStyleId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                 >
                    {STYLE_PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                 </select>
              </div>

              <textarea
                value={styleNotes}
                onChange={(e) => setStyleNotes(e.target.value)}
                placeholder="Additional style notes... (e.g. Dark mood, purple aura)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                rows={1}
              />
           </div>
        </section>

        {/* Actions Selection */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">4</span>
                Select Action
            </h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Single Selection
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {SPRITE_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`
                  text-xs px-3 py-2.5 rounded-lg border transition-all text-left flex items-center gap-2 relative overflow-hidden group
                  ${selectedActions.includes(action.id) 
                    ? 'bg-indigo-900/30 border-indigo-500/50 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}
                `}
              >
                {/* Radio Button Style */}
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${selectedActions.includes(action.id) ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600 group-hover:border-slate-400'}`}>
                    {selectedActions.includes(action.id) && <div className="w-1 h-1 bg-white rounded-full" />}
                </div>
                {action.label}
              </button>
            ))}
          </div>
        </section>

        {/* Grid Template Config */}
        <section className="pt-4 border-t border-slate-800/50">
           <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
             <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-400">Sheet Template</span>
             </div>
             
             <div className="relative">
                 <select
                    value={currentPresetId}
                    onChange={handlePresetChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                 >
                    {GRID_PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                 </select>
                 <LayoutGrid className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
             </div>
             
             <div className="flex justify-between mt-2 px-1">
                 <span className="text-[10px] text-slate-600">Rows: {gridConfig.rows}</span>
                 <span className="text-[10px] text-slate-600">Cols: {gridConfig.cols}</span>
                 <span className="text-[10px] text-indigo-400 font-bold">{gridConfig.rows * gridConfig.cols} Frames</span>
             </div>
           </div>
        </section>

      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-4">
        {/* Model Selector */}
        <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Model Quality
            </h3>
            <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                 <button
                    onClick={() => setSelectedModel('gemini-2.5-flash-image')}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md transition-all ${selectedModel === 'gemini-2.5-flash-image' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                 >
                     <Zap className="w-4 h-4 mb-1 text-yellow-400" />
                     <span className="text-[10px] font-bold">Standard</span>
                     <span className="text-[9px] opacity-60">Fast & Low Cost</span>
                 </button>
                 <button
                    onClick={() => setSelectedModel('gemini-3-pro-image-preview')}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md transition-all ${selectedModel === 'gemini-3-pro-image-preview' ? 'bg-indigo-900/40 text-white shadow-sm border border-indigo-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                 >
                     <Sparkles className="w-4 h-4 mb-1 text-purple-400" />
                     <span className="text-[10px] font-bold">Pro</span>
                     <span className="text-[9px] opacity-60">High Cost</span>
                 </button>
            </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={!uploadedImage || isGenerating || selectedActions.length === 0}
          className={`
            w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
            ${!uploadedImage || selectedActions.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isGenerating 
                ? 'bg-indigo-900/30 text-indigo-300 cursor-wait border border-indigo-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] border border-indigo-500/50'}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
              <span>{statusText || "PROCESSING..."}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              GENERATE SPRITE SHEET
            </>
          )}
        </button>
      </div>
    </div>
  );
};
