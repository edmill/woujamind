
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SpriteSheetResult } from './components/SpriteSheetResult';
import { AnimationPreview } from './components/AnimationPreview';
import { SettingsModal } from './components/SettingsModal';
import { generateSpriteSheet, analyzeCharacter, editSpriteSheet } from './services/geminiService';
import { SPRITE_ACTIONS, STYLE_PRESETS, DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS } from './constants';
import { GridConfig } from './types';
import { cropFrame, pasteFrame, alignFrameInSheet, alignWholeSheet } from './utils/imageUtils';
import { KeyRound, ExternalLink, Image as ImageIcon, Settings2, Grid3X3, Clock, Zap, Play, Pause, PaintBucket, Eye } from 'lucide-react';

const DEFAULT_SYSTEM_RULES = `1. INVISIBLE GRID: The grid layout is strictly mathematical. Do NOT draw visible grid lines, boxes, borders, or separators.
2. SOLID BACKGROUND: Use a solid uniform background color (or transparent). Do not draw scenery or ground lines.
3. NO TEXT/NUMBERS: Do NOT add frame numbers, labels, or annotations of any kind.
4. CHARACTER CONSISTENCY: The character must be pixel-perfect identical in every frame.
5. CENTERED: Center the character in every cell.
6. FULL BODY: Ensure the entire character fits within the cell.
7. USE FULL CANVAS: Fill the grid cells appropriately, do not leave excessive whitespace.`;

function App() {
  // Authentication State
  const [hasApiKey, setHasApiKey] = useState(false);

  // App State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>(['walk']); // Default to single action
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // HISTORY STATE
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusText, setStatusText] = useState("Generating...");
  
  // Style Config
  const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLE_PRESETS[0].id);
  const [styleNotes, setStyleNotes] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  
  // Model Config - DEFAULT TO FLASH (Cost Effective)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-image');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemRules, setSystemRules] = useState(DEFAULT_SYSTEM_RULES);

  // DEFAULT to 2x4 (Safe Aspect Ratio)
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: DEFAULT_GRID_ROWS, 
    cols: DEFAULT_GRID_COLS, 
    activeFrames: DEFAULT_GRID_ROWS * DEFAULT_GRID_COLS,
  });

  // --- WORKSPACE CONTROLS (Lifted State) ---
  const [localRows, setLocalRows] = useState(DEFAULT_GRID_ROWS);
  const [localCols, setLocalCols] = useState(DEFAULT_GRID_COLS);
  const [fps, setFps] = useState(8);
  const [bgColor, setBgColor] = useState("transparent"); // 'transparent' | '#1e293b' | '#000000' | '#ffffff'
  const [removeBg, setRemoveBg] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // New State for synchronizing moving marker and selection
  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([]);

  // Sync Local Grid with Generated Grid on reset
  useEffect(() => {
    setLocalRows(gridConfig.rows);
    setLocalCols(gridConfig.cols);
  }, [gridConfig.rows, gridConfig.cols]);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleConnectApiKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("API Key selection failed or cancelled", e);
        if (await window.aistudio.hasSelectedApiKey()) {
            setHasApiKey(true);
        }
      }
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setGeneratedImage(null); 
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedFrameIndices([]);
    };
    reader.readAsDataURL(file);
  };

  const toggleAction = (id: string) => {
    if (selectedActions.includes(id)) return;
    setSelectedActions([id]);
  };

  const handleSetGridConfig = (newConfig: GridConfig) => {
    setGridConfig({ ...newConfig, activeFrames: newConfig.rows * newConfig.cols });
  };

  // HISTORY MANAGEMENT
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
          // Standard Multi-Select Logic (Toggle inclusion)
          if (selectedFrameIndices.includes(index)) {
              setSelectedFrameIndices(prev => prev.filter(i => i !== index));
          } else {
              setSelectedFrameIndices(prev => [...prev, index].sort((a,b) => a - b));
          }
      } else {
          // Standard Single-Select Logic (Exclusive)
          if (selectedFrameIndices.length === 1 && selectedFrameIndices[0] === index) {
              // If clicking the ALREADY selected single frame, deselect it (toggle off)
              setSelectedFrameIndices([]);
          } else {
              // Select ONLY this frame
              setSelectedFrameIndices([index]);
          }
      }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedFrameIndices([]);
    
    // Force sync the local workspace view to the requested grid immediately
    setLocalRows(gridConfig.rows);
    setLocalCols(gridConfig.cols);

    try {
      const activeActionObjects = SPRITE_ACTIONS.filter(a => selectedActions.includes(a.id));
      const activeStyle = STYLE_PRESETS.find(s => s.id === selectedStyleId) || STYLE_PRESETS[0];

      setStatusText("Analyzing DNA...");
      const refinedDescription = await analyzeCharacter(uploadedImage, characterDescription);
      console.log("Stage 1 Complete. Refined Desc:", refinedDescription);

      setStatusText("Rendering Sprites...");
      // Pass the selectedModel to the service
      const resultBase64 = await generateSpriteSheet(
        uploadedImage,
        activeActionObjects,
        activeStyle.prompt,
        gridConfig.rows,
        gridConfig.cols,
        styleNotes,
        refinedDescription,
        selectedModel,
        systemRules // Pass the configured rules
      );

      // Save to History instead of just setting state
      pushToHistory(resultBase64);

    } catch (error: any) {
      console.error("Generation failed:", error);
      handleError(error);
    } finally {
      setIsGenerating(false);
      setStatusText("Generating...");
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
            const croppedFrame = await cropFrame(generatedImage, targetIndex, localRows, localCols);
            
            // 2. Edit
            const editedFrame = await editSpriteSheet(croppedFrame, prompt, selectedModel);
            
            // 3. Paste
            const updatedSheet = await pasteFrame(generatedImage, editedFrame, targetIndex, localRows, localCols);
            
            pushToHistory(updatedSheet);
        } else {
            // FULL SHEET EDIT MODE
            setStatusText("Refining Sheet...");
            const editedImage = await editSpriteSheet(generatedImage, prompt, selectedModel);
            pushToHistory(editedImage);
        }
    } catch (error: any) {
        console.error("Edit failed:", error);
        handleError(error);
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
          // Client-side deterministic alignment
          const newSheet = await alignFrameInSheet(generatedImage, index, localRows, localCols);
          pushToHistory(newSheet);
      } catch (e) {
          console.error("Align failed", e);
      } finally {
          setIsEditing(false);
          setStatusText("");
      }
  }

  const handleAutoAlignSheet = async () => {
    if (!generatedImage) return;
    setIsEditing(true);
    setStatusText("Auto-aligning Full Sheet...");
    try {
        const newSheet = await alignWholeSheet(generatedImage, localRows, localCols);
        pushToHistory(newSheet);
    } catch (e) {
        console.error("Sheet align failed", e);
    } finally {
        setIsEditing(false);
        setStatusText("");
    }
  };

  const handleError = (error: any) => {
      const errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.match(/(Requested entity was not found|PERMISSION_DENIED|UNAUTHENTICATED|API keys are not supported|API_KEY_MISSING|401|403)/)) {
         setHasApiKey(false); 
         alert("Authentication failed. Please select a valid API Key.");
      } else {
         alert("Operation failed. Please try again.");
      }
  };

  if (!hasApiKey) {
    return (
      <div className="flex h-screen w-full bg-slate-950 items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <ImageIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SpriteGen.ai</h1>
          <p className="text-slate-400">Generate professional game assets using Gemini's high-quality image model.</p>
          <button onClick={handleConnectApiKey} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">Connect API Key</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemRules={systemRules}
        setSystemRules={setSystemRules}
        onReset={() => setSystemRules(DEFAULT_SYSTEM_RULES)}
      />

      <Sidebar 
        selectedActions={selectedActions}
        toggleAction={toggleAction}
        onImageUpload={handleImageUpload}
        uploadedImage={uploadedImage}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        statusText={statusText}
        gridConfig={gridConfig}
        setGridConfig={handleSetGridConfig}
        styleNotes={styleNotes}
        setStyleNotes={setStyleNotes}
        characterDescription={characterDescription}
        setCharacterDescription={setCharacterDescription}
        selectedStyleId={selectedStyleId}
        setSelectedStyleId={setSelectedStyleId}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-black/20 relative">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex gap-6 min-h-0 overflow-hidden">
          {/* Left: Result */}
          <div className="flex-[2] min-w-0 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Settings2 className="w-4 h-4" /> Raw Output</h2>
            </div>
            <SpriteSheetResult 
              imageSrc={generatedImage} 
              rows={localRows} // Pass localRows
              cols={localCols} // Pass localCols
              onEdit={handleEditSpriteSheet}
              isEditing={isEditing}
              isGenerating={isGenerating} // PASS NEW PROP
              statusText={statusText}     // PASS NEW PROP
              backgroundColor={bgColor}
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

          {/* Right: Preview */}
          <div className="flex-1 min-w-[300px] h-full flex flex-col">
             <div className="flex justify-between items-center mb-2">
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Animation Preview</h2>
             </div>
             <AnimationPreview 
              imageSrc={generatedImage} 
              gridConfig={gridConfig}
              selectedActions={selectedActions}
              // Pass down unified controls
              fps={fps}
              setFps={setFps} // Pass setter
              backgroundColor={bgColor}
              removeBg={removeBg}
              localRows={localRows}
              localCols={localCols}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onFrameChange={setActiveFrameIndex}
              customFrameSequence={selectedFrameIndices}
            />
          </div>
        </div>

        {/* BOTTOM DOCK: Unified Workspace Controls */}
        <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center px-8 gap-8 shadow-2xl z-20">
            
            {/* 1. Grid Fine Tuning */}
            <div className="flex flex-col gap-1.5 border-r border-slate-800 pr-8">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Grid3X3 className="w-3 h-3" /> Grid Slice Tuning
                </label>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded px-2 py-1">
                        <span className="text-xs text-slate-500 font-mono">R:</span>
                        <input type="number" value={localRows} onChange={e => setLocalRows(Math.max(1, parseInt(e.target.value)||1))} className="w-8 bg-transparent text-sm text-center outline-none" />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded px-2 py-1">
                        <span className="text-xs text-slate-500 font-mono">C:</span>
                        <input type="number" value={localCols} onChange={e => setLocalCols(Math.max(1, parseInt(e.target.value)||1))} className="w-8 bg-transparent text-sm text-center outline-none" />
                    </div>
                </div>
            </div>

            {/* 2. REMOVED PLAYBACK CONTROLS (Moved to Preview) */}

            {/* 3. View Settings (Replaced Anti-Jitter) */}
            <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <PaintBucket className="w-3 h-3" /> Canvas
                </label>
                <div className="flex items-center gap-2">
                    {['transparent', '#1e293b', '#0f172a', '#ffffff'].map(c => (
                        <button
                            key={c}
                            onClick={() => setBgColor(c)}
                            className={`w-6 h-6 rounded border transition-all ${bgColor === c ? 'border-indigo-400 scale-110' : 'border-slate-700 hover:scale-105'}`}
                            style={{ backgroundColor: c === 'transparent' ? '' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%)' : 'none', backgroundSize: '10px 10px' }}
                            title={c}
                        />
                    ))}
                    <div className="w-px h-6 bg-slate-800 mx-2"></div>
                     <button 
                        onClick={() => setRemoveBg(!removeBg)}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${removeBg ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                    >
                        Auto-Remove BG
                    </button>
                </div>
            </div>

        </div>

      </main>
    </div>
  );
}

export default App;
