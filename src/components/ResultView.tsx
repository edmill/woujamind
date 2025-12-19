/**
 * ResultView Component
 * Displays the generated sprite sheet and animation preview with full integration.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
  Play,
  XCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Copy,
  Loader2,
  Palette,
  Plus,
  Minus,
  Download,
  Upload,
  LayoutList,
  ImageIcon,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn } from '../utils';
import { extractFrames } from '../utils/imageUtils';
import { enhancePrompt } from '../services/geminiService';
import { ArtStyle } from '../types';
import { ART_STYLES } from '../constants';
import { GeneratingOverlay } from './GeneratingOverlay';

interface ResultViewProps {
  tokens: number;
  reset: () => void;
  setPrompt: (s: string) => void;
  setSelectedFile: (f: File | null) => void;
  setFilePreview: (s: string | null) => void;
  setHasResult: (b: boolean) => void;
  onClearResult?: () => void;
  
  // Sprite Sheet Data
  imageSrc: string | null;
  rows: number;
  cols: number;
  
  // Frame Selection
  selectedFrame: number | null;
  setSelectedFrame: (frame: number | null) => void;
  activeFrameIndex: number | null;
  selectedFrameIndices: number[];
  onToggleFrameSelect: (index: number, isMulti: boolean) => void;
  
  // Editing & History
  onEdit?: (prompt: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isEditing?: boolean;
  isGenerating?: boolean;
  statusText?: string;
  
  // Animation Preview State
  fps: number;
  setFps: (fps: number) => void;
  isTransparent: boolean;
  setIsTransparent: (isTransparent: boolean) => void;
  
  // Download handlers
  onDownloadSheet?: () => void;
  onDownloadGif?: () => void;
  
  // Regenerate handler
  onRegenerate?: () => void;
  
  // Alignment handlers
  onAutoAlign?: (index: number) => void;
  onAlignAll?: () => void;

  // Frame management handlers
  onInsertFrame?: (index: number, position: 'before' | 'after') => void;
  onRemoveFrame?: (index: number) => void;
  onReplaceFrameWithImage?: (index: number, imageFile: File) => void;

  // Generation metadata
  generationPrompt?: string;
  generationModel?: string;
  generationCharacterDescription?: string;

  // Art Style
  selectedArtStyle: ArtStyle;
  onArtStyleChange: (style: ArtStyle) => void;
}

export function ResultView({
  tokens,
  reset,
  setPrompt,
  setSelectedFile,
  setFilePreview,
  setHasResult,
  onClearResult,
  imageSrc,
  rows,
  cols,
  selectedFrame,
  setSelectedFrame,
  activeFrameIndex,
  selectedFrameIndices,
  onToggleFrameSelect,
  onEdit,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isEditing = false,
  isGenerating = false,
  statusText = "Processing...",
  fps,
  setFps,
  isTransparent,
  setIsTransparent,
  onDownloadSheet,
  onDownloadGif,
  onRegenerate,
  onAutoAlign,
  onAlignAll,
  onInsertFrame,
  onRemoveFrame,
  onReplaceFrameWithImage,
  generationPrompt = '',
  generationModel = '',
  generationCharacterDescription = '',
  selectedArtStyle,
  onArtStyleChange
}: ResultViewProps) {
  const [frames, setFrames] = useState<HTMLCanvasElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteContainerRef = useRef<HTMLDivElement>(null);
  const [showEditBar, setShowEditBar] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Animation preview position (for single frame mode)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [previewDragStart, setPreviewDragStart] = useState({ x: 0, y: 0 });
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInsertDropdown, setShowInsertDropdown] = useState(false);
  const insertDropdownRef = useRef<HTMLDivElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#6f7281');
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const backgroundSettingsRef = useRef<HTMLDivElement>(null);
  const totalFrames = rows * cols;

  // Default background presets
  const BACKGROUND_PRESETS = [
    { name: 'Grey Blue', color: '#6f7281' },
    { name: 'White', color: '#ffffff' },
    { name: 'Black', color: '#000000' },
    { name: 'Slate Dark', color: '#1e293b' },
    { name: 'Slate Light', color: '#f1f5f9' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'Green', color: '#22c55e' },
  ];

  // LocalStorage keys
  const STORAGE_KEYS = {
    DEFAULT_BACKGROUND_TYPE: 'sprite_magic_default_background_type', // 'color' | 'image'
    DEFAULT_BACKGROUND_COLOR: 'sprite_magic_default_background_color',
    DEFAULT_BACKGROUND_IMAGE: 'sprite_magic_default_background_image', // base64 or blob URL
  };

  // Load default background on mount
  useEffect(() => {
    const defaultType = localStorage.getItem(STORAGE_KEYS.DEFAULT_BACKGROUND_TYPE);
    if (defaultType === 'color') {
      const savedColor = localStorage.getItem(STORAGE_KEYS.DEFAULT_BACKGROUND_COLOR);
      if (savedColor) {
        setBackgroundColor(savedColor);
      }
    } else if (defaultType === 'image') {
      const savedImage = localStorage.getItem(STORAGE_KEYS.DEFAULT_BACKGROUND_IMAGE);
      if (savedImage) {
        setBackgroundImageUrl(savedImage);
      }
    }
  }, []);

  // Close background settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backgroundSettingsRef.current && !backgroundSettingsRef.current.contains(event.target as Node)) {
        setShowBackgroundSettings(false);
      }
    };

    if (showBackgroundSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBackgroundSettings]);

  // Generating overlay state
  const [isSwooshing, setIsSwooshing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const wasGeneratingRef = useRef(false);

  // Get current art style information
  const currentArtStyle = ART_STYLES.find(style => style.id === selectedArtStyle) || ART_STYLES[0];

  // Manage generating overlay state
  useEffect(() => {
    // Show overlay when generating
    if (isGenerating) {
      setShowOverlay(true);
      setIsSwooshing(false);
      wasGeneratingRef.current = true;
    }
    // When generation completes, trigger swoosh
    else if (wasGeneratingRef.current && imageSrc) {
      setIsSwooshing(true);
      wasGeneratingRef.current = false;
    }
  }, [isGenerating, imageSrc]);

  // Handler for when swoosh animation completes
  const handleSwooshComplete = () => {
    setIsSwooshing(false);
    setShowOverlay(false);
  };

  // Reset preview position when a new sprite sheet is loaded
  useEffect(() => {
    setPreviewPosition({ x: 0, y: 0 });
  }, [imageSrc]);

  // Extract frames from sprite sheet
  useEffect(() => {
    if (!imageSrc) {
      setFrames([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      const extractedFrames = extractFrames(img, rows, cols, totalFrames, isTransparent);
      setFrames(extractedFrames);
      if (extractedFrames.length > 0) {
        setCurrentFrameIndex(0);
      }
    };
  }, [imageSrc, rows, cols, totalFrames, isTransparent]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0 || selectedFrame !== null) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      const frameDelay = 1000 / fps;
      
      if (timestamp - lastFrameTimeRef.current >= frameDelay) {
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
        lastFrameTimeRef.current = timestamp;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frames.length, fps, selectedFrame]);


  // Render current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const frameToShow = selectedFrame !== null && selectedFrame > 0 && selectedFrame <= frames.length
      ? frames[selectedFrame - 1] 
      : frames[currentFrameIndex];
    
    if (!frameToShow) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = frameToShow.width;
    canvas.height = frameToShow.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frameToShow, 0, 0);
  }, [currentFrameIndex, frames, selectedFrame]);

  // Removed auto-open behavior - user must manually click Magic Edit button
  // Previous behavior: automatically opened edit bar when a single frame was selected

  // Close insert frame dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (insertDropdownRef.current && !insertDropdownRef.current.contains(event.target as Node)) {
        setShowInsertDropdown(false);
      }
    };

    if (showInsertDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInsertDropdown]);

  // Keyboard navigation for frames and animation control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Spacebar: Toggle play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (selectedFrame !== null) {
          // If a frame is selected, deselect it to return to animation
          // Don't reset preview position - preserve it
          setSelectedFrame(null);
          if (onToggleFrameSelect) {
            selectedFrameIndices.forEach(() => {
              // Clear all selections
            });
          }
          setIsPlaying(true);
        } else {
          setIsPlaying(!isPlaying);
        }
      }

      // Arrow keys: Navigate frames
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        
        const currentIndex = selectedFrame !== null ? selectedFrame - 1 : (selectedFrameIndices[0] ?? -1);
        let newIndex: number;

        if (e.code === 'ArrowLeft') {
          // Previous frame
          newIndex = currentIndex > 0 ? currentIndex - 1 : totalFrames - 1;
        } else {
          // Next frame
          newIndex = currentIndex < totalFrames - 1 ? currentIndex + 1 : 0;
        }

        // Update selection
        if (onToggleFrameSelect) {
          // Clear previous selection and select new frame
          onToggleFrameSelect(newIndex, false);
        }
        setSelectedFrame(newIndex + 1);
        setIsPlaying(false); // Pause animation when navigating frames
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFrame, selectedFrameIndices, totalFrames, isPlaying, onToggleFrameSelect]);

  const handleSubmitEdit = () => {
    if (editPrompt.trim() && onEdit) {
      onEdit(editPrompt);
      setEditPrompt("");
    }
  };

  const handleDownloadSheet = () => {
    if (onDownloadSheet) {
      onDownloadSheet();
    } else if (imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `sprite-sheet-${Date.now()}.png`;
      link.click();
    }
  };

  const handleDownloadGif = () => {
    if (onDownloadGif) {
      onDownloadGif();
    }
  };

  const handleCopyPrompt = async () => {
    if (generationPrompt) {
      await navigator.clipboard.writeText(generationPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFrameClick = (frameNumber: number) => {
    const frameIndex = frameNumber - 1;
    if (onToggleFrameSelect) {
      onToggleFrameSelect(frameIndex, false);
    }
    const newSelectedFrame = selectedFrame === frameNumber ? null : frameNumber;
    setSelectedFrame(newSelectedFrame);
    
    // Don't reset preview position - preserve it across frame selections
  };

  const handleAutoAlignClick = () => {
    const isSingleFrameEdit = selectedFrameIndices.length === 1;
    if (isSingleFrameEdit && onAutoAlign) {
      onAutoAlign(selectedFrameIndices[0]);
    } else if (onAlignAll) {
      onAlignAll();
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom handler - zooms toward cursor position
  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if not holding shift (shift is typically used for horizontal scrolling)
    if (e.shiftKey) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY;
    const zoomSpeed = 0.15; // Adjust zoom sensitivity (higher = more sensitive)
    const zoomFactor = delta > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    
    if (newZoom !== zoom && spriteContainerRef.current) {
      // Get mouse position relative to the container
      const container = spriteContainerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate the center of the container
      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;
      
      // Calculate mouse offset from center (in container coordinates)
      const offsetX = mouseX - containerCenterX;
      const offsetY = mouseY - containerCenterY;
      
      // Adjust pan to zoom toward mouse position
      // The pan needs to be adjusted by the difference in zoom scaled by the offset
      const zoomRatio = newZoom / zoom;
      const newPanX = pan.x - (offsetX * (zoomRatio - 1));
      const newPanY = pan.y - (offsetY * (zoomRatio - 1));
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Pan with middle mouse button, spacebar + drag, or Cmd/Ctrl + drag, or when zoomed
    const canPan = e.button === 1 || // Middle mouse button
                   e.button === 0 && (e.metaKey || e.ctrlKey || e.shiftKey || zoom !== 1); // Left click with modifier or when zoomed
    
    if (canPan) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Animation preview drag handlers (only when single frame is selected)
  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    if (selectedFrame !== null && selectedFrame > 0) {
      e.preventDefault();
      setIsDraggingPreview(true);
      setPreviewDragStart({ 
        x: e.clientX - previewPosition.x, 
        y: e.clientY - previewPosition.y 
      });
    }
  };

  const handlePreviewMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPreview && selectedFrame !== null) {
      setPreviewPosition({ 
        x: e.clientX - previewDragStart.x, 
        y: e.clientY - previewDragStart.y 
      });
    }
  };

  const handlePreviewMouseUp = () => {
    setIsDraggingPreview(false);
  };

  const handleResetPreviewPosition = () => {
    setPreviewPosition({ x: 0, y: 0 });
  };

  const handleReplaceImageClick = () => {
    if (replaceImageInputRef.current) {
      replaceImageInputRef.current.click();
    }
  };

  const handleReplaceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onReplaceFrameWithImage && selectedFrameIndices.length === 1) {
      const file = e.target.files[0];
      onReplaceFrameWithImage(selectedFrameIndices[0], file);
      // Clear the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleBackgroundImageClick = () => {
    if (backgroundImageInputRef.current) {
      backgroundImageInputRef.current.click();
    }
  };

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Revoke old URL if exists
        if (backgroundImageUrl && backgroundImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(backgroundImageUrl);
        }

        setBackgroundImageUrl(base64String);
        toast.success('Background image loaded');
        e.target.value = '';
      };

      reader.onerror = () => {
        toast.error('Failed to load background image');
        e.target.value = '';
      };

      reader.readAsDataURL(file);
    }
  };

  const handleClearBackgroundImage = () => {
    if (backgroundImageUrl) {
      // Only revoke blob URLs, not base64
      if (backgroundImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImageUrl);
      }
      setBackgroundImageUrl(null);
      toast.success('Background image removed');
    }
  };

  const handleClearBackground = () => {
    // Clear both image and reset to default color
    if (backgroundImageUrl) {
      if (backgroundImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImageUrl);
      }
      setBackgroundImageUrl(null);
    }
    // Reset to default background color
    setBackgroundColor('#6f7281');
    toast.success('Background cleared');
  };

  const handleSetDefaultBackground = () => {
    if (backgroundImageUrl) {
      localStorage.setItem(STORAGE_KEYS.DEFAULT_BACKGROUND_TYPE, 'image');
      localStorage.setItem(STORAGE_KEYS.DEFAULT_BACKGROUND_IMAGE, backgroundImageUrl);
      toast.success('Default background set to current image');
    } else {
      localStorage.setItem(STORAGE_KEYS.DEFAULT_BACKGROUND_TYPE, 'color');
      localStorage.setItem(STORAGE_KEYS.DEFAULT_BACKGROUND_COLOR, backgroundColor);
      toast.success('Default background set to current color');
    }
    setShowBackgroundSettings(false);
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    // Clear image when setting color
    if (backgroundImageUrl) {
      if (backgroundImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImageUrl);
      }
      setBackgroundImageUrl(null);
    }
  };

  const handleTransparentToggle = () => {
    setIsTransparent(!isTransparent);
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="h-full flex flex-col gap-6 relative"
    >
      {/* Generating Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <GeneratingOverlay
            statusText={statusText}
            isSwooshing={isSwooshing}
            onSwooshComplete={handleSwooshComplete}
          />
        )}
      </AnimatePresence>

      {/* Result Header */}
      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={onClearResult || reset}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Back to Editor"
            >
               <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Generation Complete</h3>
         </div>
         <div className="flex gap-2">
           <button
             onClick={handleDownloadSheet}
             className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
             title="Download Sprite Sheet"
           >
             <Download className="w-4 h-4" />
             <span>Download Sheet</span>
           </button>
           <button
             onClick={handleDownloadGif}
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
               {imageSrc && (
                 <div className="text-xs text-slate-400">
                   {rows} x {cols} Grid ({totalFrames} frames)
                 </div>
               )}
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl relative flex flex-col shadow-inner group/sheet min-h-0 overflow-visible">
               {/* AI Edit Toolbar */}
               <div className="h-14 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 relative z-20 shrink-0 rounded-t-2xl">
                  {/* Left: History Controls */}
                  <div className="flex items-center gap-1">
                     <button 
                       onClick={onUndo}
                       disabled={!canUndo || isEditing}
                       className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                       title="Undo"
                     >
                       <Undo className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={onRedo}
                       disabled={!canRedo || isEditing}
                       className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                       title="Redo"
                     >
                       <Redo className="w-4 h-4" />
                     </button>
                     
                     {/* Auto-Align Button */}
                     {(onAlignAll || onAutoAlign) && (
                       <>
                         <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                         <button
                           onClick={handleAutoAlignClick}
                           disabled={isEditing}
                           className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           title={selectedFrameIndices.length === 1 ? "Auto-Align Selected Frame" : "Auto-Align Full Grid (Fix Jitter)"}
                         >
                           <LayoutList className="w-4 h-4" />
                           <span className="hidden lg:inline text-xs font-semibold">
                             {selectedFrameIndices.length === 1 ? 'Align Frame' : 'Align Grid'}
                           </span>
                         </button>
                       </>
                     )}

                     {/* Art Style Info Badge */}
                     <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                     <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg" title={`Art Style: ${currentArtStyle.label}`}>
                       <Palette className="w-4 h-4" />
                       <span className="hidden lg:inline text-xs font-semibold">{currentArtStyle.label}</span>
                     </div>

                     {/* Frame Management Buttons */}
                     {(onInsertFrame || onRemoveFrame) && selectedFrameIndices.length === 1 && (
                       <>
                         <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                         {/* Insert Frame Button with Dropdown */}
                         {onInsertFrame && (
                           <div className="relative" ref={insertDropdownRef}>
                             <button
                               onClick={() => setShowInsertDropdown(!showInsertDropdown)}
                               disabled={isEditing}
                               className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                               title="Insert Frame"
                             >
                               <Plus className="w-4 h-4" />
                               <span className="hidden lg:inline text-xs font-semibold">Insert</span>
                               <ChevronDown className={cn("w-3 h-3 transition-transform", showInsertDropdown && "rotate-180")} />
                             </button>

                             {/* Insert Dropdown */}
                             <AnimatePresence>
                               {showInsertDropdown && (
                                 <motion.div
                                   initial={{ opacity: 0, y: -10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -10 }}
                                   className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                                 >
                                   <div className="p-2">
                                     <button
                                       onClick={() => {
                                         onInsertFrame(selectedFrameIndices[0], 'before');
                                         setShowInsertDropdown(false);
                                       }}
                                       className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                                     >
                                       <Plus className="w-4 h-4" />
                                       <div className="flex-1">
                                         <div className="font-bold text-sm">Insert Before</div>
                                         <div className="text-xs text-slate-500 dark:text-slate-400">Add frame before Frame {selectedFrameIndices[0] + 1}</div>
                                       </div>
                                     </button>
                                     <button
                                       onClick={() => {
                                         onInsertFrame(selectedFrameIndices[0], 'after');
                                         setShowInsertDropdown(false);
                                       }}
                                       className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
                                     >
                                       <Plus className="w-4 h-4" />
                                       <div className="flex-1">
                                         <div className="font-bold text-sm">Insert After</div>
                                         <div className="text-xs text-slate-500 dark:text-slate-400">Add frame after Frame {selectedFrameIndices[0] + 1}</div>
                                       </div>
                                     </button>
                                   </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                         )}

                         {/* Remove Frame Button */}
                         {onRemoveFrame && (
                           <button
                             onClick={() => onRemoveFrame(selectedFrameIndices[0])}
                             disabled={isEditing}
                             className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                             title="Remove Frame"
                           >
                             <Minus className="w-4 h-4" />
                             <span className="hidden lg:inline text-xs font-semibold">Remove</span>
                           </button>
                         )}

                         <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

                         {/* Upload Image Button */}
                         {onReplaceFrameWithImage && (
                           <>
                             <button
                               onClick={handleReplaceImageClick}
                               disabled={isEditing}
                               className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                               title="Replace frame with custom image"
                             >
                               <FileImage className="w-4 h-4" />
                               <span className="hidden lg:inline text-xs font-semibold">Upload</span>
                             </button>
                             <input
                               ref={replaceImageInputRef}
                               type="file"
                               accept="image/*"
                               onChange={handleReplaceImageChange}
                               className="hidden"
                             />
                           </>
                         )}
                       </>
                     )}
                  </div>

                  {/* Right: Magic Edit Button */}
                  <div className="flex items-center gap-3">
                     {onEdit && (
                       <button
                         onClick={() => setShowEditBar(!showEditBar)}
                         disabled={isEditing || selectedFrameIndices.length > 1}
                         className={cn(
                           "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold",
                           showEditBar 
                             ? 'bg-orange-600 dark:bg-orange-500 border-orange-500 text-white' 
                             : 'bg-white/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
                           (isEditing || selectedFrameIndices.length > 1) && 'opacity-50 cursor-not-allowed'
                         )}
                         title={selectedFrameIndices.length > 1 ? "Select only 1 frame to use Magic Edit" : "Edit Sheet or Selected Frame"}
                       >
                         <Wand2 className="w-3.5 h-3.5" />
                         <span>
                           {isEditing ? 'Editing...' : selectedFrameIndices.length === 1 ? `Edit Frame ${selectedFrameIndices[0] + 1}` : 'Magic Edit'}
                         </span>
                       </button>
                     )}
                  </div>
               </div>
               
               {/* Magic Edit Bar */}
               {showEditBar && onEdit && imageSrc && (
                 <div className="absolute top-[4.5rem] left-4 right-4 z-30 pointer-events-auto">
                   <div className={cn(
                     "bg-white dark:bg-slate-900 border rounded-xl p-2 shadow-2xl flex gap-2",
                     selectedFrameIndices.length === 1 ? 'border-orange-500/50' : 'border-orange-500/50'
                   )}>
                     <div className="flex items-center pl-2 pr-1">
                       <Wand2 className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                     </div>
                     <input 
                       type="text" 
                       value={editPrompt}
                       onChange={(e) => setEditPrompt(e.target.value)}
                       placeholder={selectedFrameIndices.length === 1 ? "Tell AI what to do with this sprite (e.g. 'Center the character', 'Fix face')..." : "Edit entire sheet (e.g. 'Make outlines thicker')..."}
                       className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                       onKeyDown={(e) => {
                         e.stopPropagation(); 
                         if (e.key === 'Enter') handleSubmitEdit();
                       }}
                       autoFocus
                     />
                     <button
                       onClick={async () => {
                         if (!editPrompt.trim() || isEditing || isEnhancingPrompt) return;

                         setIsEnhancingPrompt(true);
                         try {
                           const enhanced = await enhancePrompt(editPrompt);
                           setEditPrompt(enhanced);
                           toast.success("Prompt enhanced with AI!");
                         } catch (error) {
                           console.error('Enhancement failed:', error);
                           toast.error("Enhancement failed. Please try again.");
                         } finally {
                           setIsEnhancingPrompt(false);
                         }
                       }}
                       disabled={!editPrompt.trim() || isEditing || isEnhancingPrompt}
                       className={cn(
                         "flex items-center justify-center p-2 rounded-lg transition-all",
                         !editPrompt.trim() || isEditing || isEnhancingPrompt
                           ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                           : "bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 text-white hover:shadow-lg hover:shadow-orange-500/30"
                       )}
                       title="AI Enhance - Use Gemini to make prompt more precise and detailed"
                     >
                       {isEnhancingPrompt ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : (
                         <Sparkles className="w-4 h-4" />
                       )}
                     </button>
                     <button 
                       onClick={handleSubmitEdit}
                       disabled={!editPrompt.trim() || isEditing}
                       className="p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <Check className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => setShowEditBar(false)}
                       className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                     >
                       <XCircle className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               )}

               {/* Sprite Sheet Container with Grid Overlay */}
               <div
                 ref={spriteContainerRef}
                 className={cn(
                   "flex-1 overflow-auto p-8 flex items-center justify-center relative overflow-hidden rounded-b-2xl",
                   isPanning ? 'cursor-grabbing' : (zoom !== 1 ? 'cursor-grab' : 'cursor-default')
                 )}
                 onMouseDown={handleMouseDown}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseUp}
                 onWheel={handleWheel}
               >
                 {/* Checkerboard background */}
                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(45deg,#000000_25%,transparent_25%,transparent_75%,#000000_75%,#000000),linear-gradient(45deg,#000000_25%,transparent_25%,transparent_75%,#000000_75%,#000000)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />
                 
                 {imageSrc && (
                   <div 
                     className="relative shadow-2xl rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700/50 transition-all w-fit mx-auto"
                     style={{
                       transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                       transformOrigin: 'center center'
                     }}
                   >
                     <img 
                       src={imageSrc} 
                       alt="Generated Sprite Sheet" 
                       className="max-w-full max-h-[60vh] object-contain block [image-rendering:pixelated]"
                     />
                     
                     {/* Full Sheet Edit Loading Overlay */}
                     {isEditing && selectedFrameIndices.length !== 1 && (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/60 backdrop-blur-sm">
                         <div className="flex flex-col items-center gap-3">
                           <div className="relative">
                             <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                             <Wand2 className="w-8 h-8 text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                           </div>
                           <span className="text-sm font-bold text-white uppercase tracking-wide">AI Editing Sheet...</span>
                         </div>
                       </div>
                     )}
                     
                     {/* Grid Overlay */}
                     <div 
                       className="absolute inset-0 pointer-events-auto cursor-crosshair grid"
                       style={{
                         gridTemplateColumns: `repeat(${cols}, 1fr)`,
                         gridTemplateRows: `repeat(${rows}, 1fr)`
                       }}
                     >
                       {Array.from({ length: totalFrames }).map((_, i) => {
                         const isSelected = selectedFrameIndices.includes(i);
                         const isActive = activeFrameIndex === i;
                         const isBeingEdited = isEditing && selectedFrameIndices.length === 1 && selectedFrameIndices[0] === i;
                         
                         return (
                           <div 
                             key={i} 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleFrameClick(i + 1);
                             }}
                             className={cn(
                               "relative border transition-all duration-75 overflow-hidden",
                               isSelected 
                                 ? 'border-orange-500/80 bg-orange-500/5 z-10' 
                                 : 'border-orange-500/10 hover:bg-white/5 dark:hover:bg-white/5'
                             )}
                           >
                             {/* Moving Playhead Marker - RED */}
                             {isActive && (
                               <div className="absolute inset-0 border-[3px] border-red-600 dark:border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] z-30 pointer-events-none" />
                             )}
                             
                             {/* Selection Indicator */}
                             {isSelected && !isBeingEdited && (
                               <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)] z-20" />
                             )}
                             
                             {/* Loading Indicator for Frame Being Edited */}
                             {isBeingEdited && (
                               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                 <div className="flex flex-col items-center gap-3">
                                   <div className="relative w-16 h-16">
                                     {/* Outer glow */}
                                     <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 animate-pulse" />

                                     {/* Spinning rings */}
                                     <div className="absolute inset-2 border-2 border-purple-500/40 border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                                     <div className="absolute inset-4 border-2 border-pink-500/40 border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '1s', animationDirection: 'reverse' }} />

                                     {/* Magic particles */}
                                     <div className="absolute inset-0">
                                       {[...Array(6)].map((_, i) => (
                                         <div
                                           key={i}
                                           className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping"
                                           style={{
                                             top: '50%',
                                             left: '50%',
                                             animationDelay: `${i * 0.2}s`,
                                             animationDuration: '1.5s',
                                             transform: `rotate(${i * 60}deg) translateY(-20px)`
                                           }}
                                         />
                                       ))}
                                     </div>

                                     {/* Center wand */}
                                     <Wand2 className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                   </div>
                                   <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-lg">AI Editing</span>
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
                 
                 {/* Floating Zoom/Pan Toolbar */}
                 {imageSrc && (
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-2xl border border-slate-700 pointer-events-auto">
                     <button
                       onClick={handleZoomOut}
                       disabled={zoom <= 0.5}
                       className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                       title="Zoom Out (or scroll wheel down)"
                     >
                       <ZoomOut className="w-3.5 h-3.5" />
                     </button>
                     
                     <div className="px-2 text-[10px] font-mono font-bold text-slate-400 min-w-[3rem] text-center" title="Scroll to zoom, drag to pan">
                       {Math.round(zoom * 100)}%
                     </div>
                     
                     <button
                       onClick={handleZoomIn}
                       disabled={zoom >= 3}
                       className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                       title="Zoom In (or scroll wheel up)"
                     >
                       <ZoomIn className="w-3.5 h-3.5" />
                     </button>
                     
                     <div className="w-px h-4 bg-slate-700 mx-1" />
                     
                     <button
                       onClick={handleResetView}
                       disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                       className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                       title="Reset View (zoom: 100%, center)"
                     >
                       <Maximize2 className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 )}
               </div>
            </div>
         </div>
         
         {/* RIGHT: Animation Preview */}
         <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="flex items-center justify-between min-h-[32px] shrink-0">
               <div className="flex items-center gap-3">
                 <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Animation Preview</h4>
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                   <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono">Space</kbd>
                   <span>play/pause</span>
                   <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono">←→</kbd>
                   <span>navigate</span>
                 </div>
               </div>
               
               {/* Controls */}
               <div className="flex items-center gap-2 relative">
                  <button
                     onClick={handleTransparentToggle}
                     className={cn(
                       "p-1.5 rounded-lg border transition-all",
                       isTransparent
                         ? "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                         : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                     )}
                     title={
                       isTransparent
                         ? "Disable sprite transparency (keep background)"
                         : "Enable sprite transparency (show background through transparent areas)"
                     }
                  >
                     <Grid className="w-4 h-4" />
                  </button>

                  <div className="relative" ref={backgroundSettingsRef}>
                    <button
                       onClick={() => setShowBackgroundSettings(!showBackgroundSettings)}
                       className={cn(
                         "p-1.5 rounded-lg border transition-all",
                         backgroundImageUrl || backgroundColor !== '#6f7281'
                           ? "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                           : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                       )}
                       title="Background settings"
                    >
                       <Palette className="w-4 h-4" />
                    </button>

                    {/* Background Settings Dropdown */}
                    {showBackgroundSettings && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Background Settings
                          </h3>
                          <button
                            onClick={() => setShowBackgroundSettings(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>

                        {/* Color Picker Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            Background Color
                          </label>
                          
                          {/* Preset Colors */}
                          <div className="grid grid-cols-4 gap-2">
                            {BACKGROUND_PRESETS.map((preset) => (
                              <button
                                key={preset.color}
                                onClick={() => handleBackgroundColorChange(preset.color)}
                                className={cn(
                                  "h-8 rounded-lg border-2 transition-all hover:scale-105",
                                  backgroundColor === preset.color
                                    ? "border-orange-500 dark:border-orange-400 ring-2 ring-orange-500/20"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                )}
                                style={{ backgroundColor: preset.color }}
                                title={preset.name}
                              />
                            ))}
                          </div>

                          {/* Custom Color Picker */}
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => handleBackgroundColorChange(e.target.value)}
                              className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Custom color"
                            />
                            <input
                              type="text"
                              value={backgroundColor}
                              onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                  handleBackgroundColorChange(e.target.value);
                                }
                              }}
                              className="w-24 px-2 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="#6f7281"
                            />
                          </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            Background Image
                          </label>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleBackgroundImageClick}
                              className={cn(
                                "flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium flex items-center justify-center gap-2",
                                backgroundImageUrl
                                  ? "bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50"
                                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                            >
                              <Upload className="w-4 h-4" />
                              {backgroundImageUrl ? 'Change Image' : 'Upload Image'}
                            </button>
                            
                            {backgroundImageUrl && (
                              <button
                                onClick={handleClearBackgroundImage}
                                className="p-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove image"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <input
                            ref={backgroundImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundImageChange}
                            className="hidden"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <button
                            onClick={handleSetDefaultBackground}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                            title="Save current background as default"
                          >
                            <Save className="w-4 h-4" />
                            Set as Default
                          </button>
                          
                          {(backgroundImageUrl || backgroundColor !== '#6f7281') && (
                            <button
                              onClick={handleClearBackground}
                              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                              title="Clear background and reset to default"
                            >
                              <XCircle className="w-4 h-4" />
                              Clear Background
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-orange-500/30 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg min-h-0">
               {/* Background - Always show if set, otherwise show checkerboard when transparent */}
               {backgroundImageUrl ? (
                 /* Background Image */
                 <div
                   className="absolute inset-0"
                   style={{ 
                     backgroundImage: `url(${backgroundImageUrl})`,
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     backgroundRepeat: 'no-repeat',
                     willChange: 'transform'
                   }}
                 />
               ) : backgroundColor !== '#6f7281' || !isTransparent ? (
                 /* Solid Color Background with Pattern Overlay */
                 <>
                   <div 
                     className="absolute inset-0"
                     style={{ backgroundColor: backgroundColor }}
                   />
                   {/* Subtle dot pattern overlay for texture */}
                   <div 
                     className="absolute inset-0 opacity-30"
                     style={{
                       backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
                       backgroundSize: '20px 20px'
                     }}
                   />
                 </>
               ) : (
                 /* Checkerboard for transparency when no background is set */
                 <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0ea5e9_0.5px,transparent_0.5px),radial-gradient(#0ea5e9_0.5px,#e5e5f7_0.5px)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />
               )}
               
               <motion.div 
                 key={selectedFrame || 'anim'}
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ type: "spring", stiffness: 260, damping: 20 }}
                 className="relative z-10 w-full h-full flex items-end justify-center p-8 pb-16 [image-rendering:pixelated]"
                 onMouseMove={handlePreviewMouseMove}
                 onMouseUp={handlePreviewMouseUp}
                 onMouseLeave={handlePreviewMouseUp}
               >
                 {selectedFrame !== null && selectedFrame > 0 && selectedFrame <= frames.length && frames[selectedFrame - 1] ? (
                   <div 
                     className={cn(
                       "flex flex-col items-center gap-4 relative group",
                       isDraggingPreview ? 'cursor-grabbing' : 'cursor-grab'
                     )}
                     style={{
                       transform: `translate(${previewPosition.x}px, ${previewPosition.y}px)`,
                       transition: isDraggingPreview ? 'none' : 'transform 0.2s ease-out'
                     }}
                     onMouseDown={handlePreviewMouseDown}
                   >
                     {/* Frame Label Indicator - Moved Above */}
                     <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg pointer-events-none">
                       <span>Frame {selectedFrame}</span>
                     </div>
                     <canvas
                       ref={canvasRef}
                       className="max-w-full max-h-[300px] object-contain shadow-2xl [image-rendering:pixelated] pointer-events-none"
                     />
                     {/* Drag Hint - Show on hover when centered */}
                     {(previewPosition.x === 0 && previewPosition.y === 0) && (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                       >
                         Drag to reposition
                       </motion.div>
                     )}
                     {/* Reset Position Button - Only show when position is not centered and not playing */}
                     {(previewPosition.x !== 0 || previewPosition.y !== 0) && !isPlaying && (
                       <motion.button
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         onClick={(e) => {
                           e.stopPropagation();
                           handleResetPreviewPosition();
                         }}
                         className="absolute -top-2 -right-2 p-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full shadow-lg border border-slate-700 backdrop-blur-sm transition-all hover:scale-110 z-20"
                         title="Reset Position"
                       >
                         <RotateCcw className="w-3.5 h-3.5" />
                       </motion.button>
                     )}
                   </div>
                 ) : frames.length > 0 ? (
                   <div 
                     className={cn(
                       "relative group",
                       isDraggingPreview ? 'cursor-grabbing' : 'cursor-grab'
                     )}
                     style={{
                       transform: `translate(${previewPosition.x}px, ${previewPosition.y}px)`,
                       transition: isDraggingPreview ? 'none' : 'transform 0.2s ease-out'
                     }}
                     onMouseDown={handlePreviewMouseDown}
                   >
                     <canvas
                       ref={canvasRef}
                       className="max-w-full max-h-[300px] object-contain [image-rendering:pixelated] drop-shadow-2xl pointer-events-none"
                       style={{ 
                         transform: backgroundImageUrl ? 'translateY(0)' : 'none'
                       }}
                     />
                     {!isPlaying && (
                       <button
                         onClick={() => setIsPlaying(true)}
                         className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-lg transition-colors pointer-events-auto"
                       >
                         <Play className="w-12 h-12 text-white opacity-80" />
                       </button>
                     )}
                     {/* Drag Hint - Show on hover when centered */}
                     {(previewPosition.x === 0 && previewPosition.y === 0) && (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                       >
                         Drag to reposition
                       </motion.div>
                     )}
                     {/* Reset Position Button - Only show when position is not centered and not playing */}
                     {(previewPosition.x !== 0 || previewPosition.y !== 0) && !isPlaying && (
                       <motion.button
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         onClick={(e) => {
                           e.stopPropagation();
                           handleResetPreviewPosition();
                         }}
                         className="absolute -top-2 -right-2 p-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full shadow-lg border border-slate-700 backdrop-blur-sm transition-all hover:scale-110 z-20 pointer-events-auto"
                         title="Reset Position"
                       >
                         <RotateCcw className="w-3.5 h-3.5" />
                       </motion.button>
                     )}
                   </div>
                 ) : (
                   <div className="w-32 h-32 bg-gradient-to-br from-orange-500 via-orange-400 to-blue-500 rounded-lg shadow-[0_0_50px_rgba(249,115,22,0.6)] flex items-center justify-center text-white font-bold border-4 border-white dark:border-orange-400 text-center text-sm p-2 animate-bounce-slow">
                      ANIMATION PREVIEW
                   </div>
                 )}
               </motion.div>

               <div className="absolute bottom-4 z-20 flex items-center gap-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-mono group/fps-control transition-all hover:bg-black/80">
                  <button
                    onClick={() => {
                      if (selectedFrame) {
                        // Don't reset preview position when deselecting frame
                        setSelectedFrame(null);
                      } else {
                        setIsPlaying(!isPlaying);
                      }
                    }}
                    className={cn("flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/20 transition-colors flex-shrink-0", selectedFrame ? "cursor-pointer hover:text-orange-400" : "cursor-pointer")}
                    title={selectedFrame ? "Click to return to animation preview" : isPlaying ? "Pause" : "Play"}
                  >
                     {selectedFrame ? (
                        <MousePointer2 className="w-3 h-3 text-orange-400" />
                     ) : (
                        <Play className={cn("w-3 h-3", isPlaying && "fill-current")} />
                     )}
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="min-w-[40px] text-center">{fps} FPS</span>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value))}
                        className="w-20 opacity-40 group-hover/fps-control:opacity-100 group-hover/fps-control:w-24 transition-all duration-200 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-orange-500"
                      />
                  </div>
               </div>
            </div>
         </div>

      </div>

      {/* Prompt Viewer Modal */}
      <AnimatePresence>
        {showPromptModal && generationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPromptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generation Details</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Exact prompt and model used for this sprite sheet
                  </p>
                </div>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Model Info */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                        Model Used
                      </p>
                      <p className="text-lg font-mono font-bold text-purple-900 dark:text-purple-100">
                        {generationModel || 'Not specified'}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                    </div>
                  </div>
                </div>

                {/* Character Description */}
                {generationCharacterDescription && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Character Description
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {generationCharacterDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* Full Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Full Prompt Sent to Gemini
                    </p>
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-900 dark:bg-black rounded-lg p-4 border border-slate-700 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                      {generationPrompt}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

