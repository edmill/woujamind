/**
 * Woujamind Component
 * Main orchestrator for the sprite generation interface.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  Zap,
  Grid,
  List,
  Settings2,
  Sparkles
} from 'lucide-react';

import { BackgroundParticles } from './components/BackgroundParticles';
import { BlobPreview } from './components/BlobPreview';
import { PricingModal } from './components/PricingModal';
import { SettingsModal, getStoredApiKey, getStoredRules } from './components/SettingsModal';
import { Header } from './components/Header';
import { InputSidebar } from './components/InputSidebar';
import { ResultView } from './components/ResultView';
import SpriteSheetUploadModal from './components/SpriteSheetUploadModal';
import { FileLibraryView, ViewMode } from './components/FileLibraryView';
import { EmptyStateView } from './components/EmptyStateView';
import { OpenFileIndicator } from './components/OpenFileIndicator';
import { CreditDisplay } from './components/CreditDisplay';
import { CreditStore } from './components/CreditStore';
import { FrameGallery } from './components/FrameGallery';
import { ACTIONS } from './constants';
import { TabMode, ActionType, ExpressionType, Theme, ArtStyle, SpriteDirection, MultiViewData, DirectionCount, DirectionSelection, UserCredits, ViewType } from './types';
import { cn } from './utils';
import { generateSpriteSheet, editSpriteSheet, generateInBetweenFrame, analyzeCharacter, generateReferenceImage } from './services/geminiService';
import { generateSpriteSheetFromImage, calculateGridDimensions } from './services/replicateService';
import { extractFrames, createGifBlob, cropFrame, pasteFrame, alignFrameInSheet, alignWholeSheet, cleanSpriteSheet, aiSmartAlignSpriteSheet, insertFrame, removeFrame, replaceFrameWithImage } from './utils/imageUtils';
import { framesToDataUrls, dataUrlsToFrames } from './utils/frameSelection';
import { initDB, saveSpriteSheet, getSpriteSheetsByDate, deleteSpriteSheet, StoredSpriteSheet } from './utils/spriteStorage';
import { migrateLocalStorage } from './utils/localStorageMigration';
import { getUserCredits, deductCredits, calculateGenerationCost, hasSufficientCredits } from './services/creditService';

export default function Woujamind() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const [tabMode, setTabMode] = useState<TabMode>('action');
  const [selectedAction, setSelectedAction] = useState<ActionType>('idle');
  const [selectedExpression, setSelectedExpression] = useState<ExpressionType>('neutral');
  const [selectedArtStyle, setSelectedArtStyle] = useState<ArtStyle>('pixel');
  const [selectedDirection, setSelectedDirection] = useState<SpriteDirection>('right');
  const [multiViewData, setMultiViewData] = useState<MultiViewData | null>(null);
  const [selectedViewType, setSelectedViewType] = useState<ViewType>('side-view'); // Default to side-view
  const [selectedDirectionCount, setSelectedDirectionCount] = useState<DirectionSelection>(1); // Default to 1 direction

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<boolean>(false);
  const [hasResult, setHasResult] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('');
  const [displayStatusText, setDisplayStatusText] = useState<string>('');
  
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

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadSource, setUploadSource] = useState<'generated' | 'uploaded'>('generated');
  const [showNewConfirm, setShowNewConfirm] = useState<boolean>(false);

  // Frame Gallery State (for advanced frame selection)
  const [allExtractedFrames, setAllExtractedFrames] = useState<HTMLCanvasElement[]>([]);
  const [autoSelectedFrameIndices, setAutoSelectedFrameIndices] = useState<number[]>([]);
  const [isFrameGalleryOpen, setIsFrameGalleryOpen] = useState<boolean>(false);

  // Handler for frame gallery selection changes
  const handleFrameGallerySelectionChange = (newIndices: number[]) => {
    setAutoSelectedFrameIndices(newIndices);
  };

  // Handler to apply frame gallery selection - NO CHARGE, just reorganizes existing frames
  const handleApplyFrameSelection = async () => {
    if (allExtractedFrames.length === 0 || autoSelectedFrameIndices.length === 0) {
      toast.error('No frames selected');
      return;
    }

    // Use setIsEditing instead of setIsGenerating - this is just rearranging existing frames
    setIsEditing(true);
    setStatusText('Updating sprite sheet with selected frames...');
    setIsFrameGalleryOpen(false);

    try {
      // Import required utilities
      const { FrameCenteringService } = await import('./utils/frameCentering');
      const { createSpriteSheetFromFrames, calculateGridDimensions } = await import('./services/replicateService');

      // Extract selected frames - these are already generated and paid for!
      const selectedFrames = autoSelectedFrameIndices.map(idx => allExtractedFrames[idx]);

      // Center the selected frames
      const centeringService = new FrameCenteringService({
        targetWidth: 256,
        targetHeight: 256,
        paddingPercent: 0.1,
        debug: true
      });

      const centeredFrames = await centeringService.centerFramesBatch(selectedFrames);

      // Calculate new grid dimensions
      const { rows, cols } = calculateGridDimensions(selectedFrames.length);

      // Create new sprite sheet from existing frames with background removal
      const spriteSheet = await createSpriteSheetFromFrames(centeredFrames, rows, cols, true);
      const spriteSheetBase64 = spriteSheet.toDataURL('image/png');

      // Update state with new sprite sheet
      pushToHistory(spriteSheetBase64);
      setResult(true);
      setHasResult(true);
      
      // Serialize all extracted frames for persistent storage
      const allFramesData = framesToDataUrls(allExtractedFrames);

      // Save the manually selected sprite sheet
      await saveSpriteSheet({
        imageData: spriteSheetBase64,
        prompt: generationPrompt,
        characterDescription: generationCharacterDescription,
        selectedAction,
        selectedExpression,
        artStyle: selectedArtStyle,
        directionCount: selectedDirectionCount,
        gridRows: rows,
        gridCols: cols,
        fps,
        isTransparent,
        hasDropShadow,
        modelId: generationModel,
        history: [spriteSheetBase64],
        historyIndex: 0,
        // Frame selection metadata - marked as manual
        totalExtractedFrames: allExtractedFrames.length,
        selectedFrameIndices: autoSelectedFrameIndices,
        frameSelectionMethod: 'manual',
        allExtractedFramesData: allFramesData, // Store all frames for Frame Gallery
      });
      await reloadSprites();
      
      toast.success(`Sprite sheet updated with ${selectedFrames.length} frames!`);
    } catch (error) {
      console.error('[handleApplyFrameSelection] Error:', error);
      toast.error('Failed to update sprite sheet');
    } finally {
      setIsEditing(false);
      setStatusText("");
    }
  };

  // New states for download options
  const [fps, setFps] = useState<number>(8);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [hasDropShadow, setHasDropShadow] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Sphere state management
  type SphereState = 'hidden' | 'idle' | 'working' | 'swoosh';
  const [sphereState, setSphereState] = useState<SphereState>('idle');

  // Credit System State
  const [userCredits, setUserCredits] = useState<UserCredits>(getUserCredits());
  const [isCreditStoreOpen, setIsCreditStoreOpen] = useState(false);
  const [currentGenerationJobId, setCurrentGenerationJobId] = useState<string | null>(null);

  // Rate Limiting (SECURITY: Prevent API cost explosions from spam/bugs)
  const lastGenerationTime = useRef<number>(0);
  const MIN_GENERATION_INTERVAL_MS = 10000; // 10 seconds between generations

  // Legacy: Keep for backward compatibility (can be removed later)
  const [tokens, setTokens] = useState<number>(1); // Deprecated - use credits instead
  const [showPricing, setShowPricing] = useState(false); // Deprecated
  const [_hasAccount, _setHasAccount] = useState(false); // Mock user account state (reserved for future)

  // Grid configuration
  const [gridRows, _setGridRows] = useState<number>(2);
  const [gridCols, _setGridCols] = useState<number>(4);

  // Calculate optimal frame count based on action and direction count
  const calculateOptimalFrameCount = (action: ActionType, directionCount: DirectionSelection): number => {
    // Use the actual frame counts from ACTIONS constant to avoid mismatches
    const actionData = ACTIONS.find(a => a.id === action);
    const framesPerDirection = actionData?.frames || 8;
    return framesPerDirection * directionCount;
  };

  // Saved sprites state
  const [savedSprites, setSavedSprites] = useState<{
    today: StoredSpriteSheet[];
    yesterday: StoredSpriteSheet[];
    thisWeek: StoredSpriteSheet[];
    thisMonth: StoredSpriteSheet[];
    older: StoredSpriteSheet[];
  }>({
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  });
  const [isLoadingSprites, setIsLoadingSprites] = useState(true);

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

  // Migrate localStorage from old keys to new keys (runs once on mount)
  useEffect(() => {
    migrateLocalStorage();
  }, []);

  // Auto-adjust direction count when view type changes
  useEffect(() => {
    if (selectedViewType === 'side-view') {
      // For side-view games, default to 1 direction
      setSelectedDirectionCount(1);
    } else if (selectedViewType === 'top-down') {
      // For top-down games, default to 4 directions if currently at 1
      if (selectedDirectionCount === 1) {
        setSelectedDirectionCount(4);
      }
    }
  }, [selectedViewType]);

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

  // Rotating fun status messages during generation
  const statusTextRef = useRef<string>('');
  const messageIndexRef = useRef<number>(0);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isGenerating) {
      setDisplayStatusText('');
      statusTextRef.current = '';
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
      return;
    }

    const funMessages = [
      "Summoning pixel magic...",
      "Brewing animation frames...",
      "Polishing sprites to perfection...",
      "Channeling creative energy...",
      "Weaving animation sequences...",
      "Crafting your sprite masterpiece...",
      "Adding that extra sparkle...",
      "Fine-tuning every pixel...",
      "Bringing characters to life...",
      "Optimizing frame transitions...",
      "Applying artistic flair...",
      "Ensuring pixel-perfect quality...",
      "Creating smooth animations...",
      "Working our magic...",
      "Almost there, just a moment...",
    ];

    // When statusText changes, show it immediately
    if (statusText && statusText !== statusTextRef.current) {
      statusTextRef.current = statusText;
      setDisplayStatusText(statusText);
      
      // Clear any existing timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      
      // After 2.5 seconds, go back to rotating fun messages
      statusTimeoutRef.current = setTimeout(() => {
        messageIndexRef.current = (messageIndexRef.current + 1) % funMessages.length;
        setDisplayStatusText(funMessages[messageIndexRef.current]);
      }, 2500);
    }

    // Rotate through fun messages every 2 seconds (only if no status override)
    const interval = setInterval(() => {
      if (!statusText || statusText === statusTextRef.current) {
        messageIndexRef.current = (messageIndexRef.current + 1) % funMessages.length;
        setDisplayStatusText(funMessages[messageIndexRef.current]);
      }
    }, 2000);

    // Set initial message if no status text
    if (!statusText) {
      setDisplayStatusText(funMessages[0]);
    }

    return () => {
      clearInterval(interval);
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, [isGenerating, statusText]);

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

  // Effect: Load saved sprites from IndexedDB
  useEffect(() => {
    const loadSprites = async () => {
      try {
        await initDB();
        const sprites = await getSpriteSheetsByDate();
        setSavedSprites(sprites);
      } catch (error) {
        console.error('Failed to load sprites:', error);
        toast.error('Failed to load saved sprite sheets');
      } finally {
        setIsLoadingSprites(false);
      }
    };

    loadSprites();
  }, []);

  // Manage sphere state based on sprites and generation status
  useEffect(() => {
    const hasSprites = !isLoadingSprites && Object.values(savedSprites).some(arr => arr.length > 0);

    // During generation, the main sphere animation is in ResultView overlay
    // So we keep the header sphere idle or hidden
    if (isGenerating) {
      // Hide header sphere during generation (main show is in ResultView)
      setSphereState('hidden');
    } else if (!hasSprites) {
      // No sprites and not generating - hide sphere
      setSphereState('hidden');
    } else {
      // Has sprites, not generating - show idle
      setSphereState('idle');
    }
  }, [isLoadingSprites, savedSprites, isGenerating]);

  // Handler for when swoosh animation completes
  const handleSwooshComplete = () => {
    setSphereState('idle');
  };

  // Helper function to reload sprites
  const reloadSprites = async () => {
    try {
      const sprites = await getSpriteSheetsByDate();
      setSavedSprites(sprites);
    } catch (error) {
      console.error('Failed to reload sprites:', error);
    }
  };

  // Handler to open saved sprite in ResultView
  const handleOpenSprite = async (sprite: StoredSpriteSheet) => {
    console.log('[Open Sprite] Loading sprite:', sprite.id);
    
    // Load sprite data into current state
    setGeneratedImage(sprite.imageData);
    setHistory(sprite.history);
    setHistoryIndex(sprite.historyIndex);
    setResult(true);
    setHasResult(true);
    _setGridRows(sprite.gridRows);
    _setGridCols(sprite.gridCols);
    setFps(sprite.fps);
    setIsTransparent(sprite.isTransparent);
    setHasDropShadow(sprite.hasDropShadow || false);
    setGenerationPrompt(sprite.prompt);
    setGenerationCharacterDescription(sprite.characterDescription || '');
    setGenerationModel(sprite.modelId);
    setSelectedAction(sprite.selectedAction as ActionType);
    if (sprite.selectedExpression) {
      setSelectedExpression(sprite.selectedExpression as ExpressionType);
    }
    setSelectedArtStyle(sprite.artStyle as ArtStyle);

    // Restore extracted frames if available (for Frame Gallery)
    if (sprite.allExtractedFramesData && sprite.allExtractedFramesData.length > 0) {
      console.log('[Open Sprite] Restoring', sprite.allExtractedFramesData.length, 'extracted frames');
      try {
        const restoredFrames = await dataUrlsToFrames(sprite.allExtractedFramesData);
        setAllExtractedFrames(restoredFrames);
        
        // Restore selected frame indices
        if (sprite.selectedFrameIndices && sprite.selectedFrameIndices.length > 0) {
          setAutoSelectedFrameIndices(sprite.selectedFrameIndices);
          console.log('[Open Sprite] Restored frame selection:', sprite.selectedFrameIndices.length, 'frames');
        }
        
        toast.success(`Opened ${sprite.name} with ${restoredFrames.length} frames in Frame Gallery`);
      } catch (error) {
        console.error('[Open Sprite] Failed to restore frames:', error);
        toast.error('Failed to restore frame data');
      }
    } else {
      // No frame data - clear frame state
      setAllExtractedFrames([]);
      setAutoSelectedFrameIndices([]);
      toast.success(`Opened ${sprite.name}`);
    }
  };

  // Handler to delete saved sprite
  const handleDeleteSprite = async (id: string) => {
    try {
      console.log('[Delete Sprite] Deleting sprite:', id);
      await deleteSpriteSheet(id);
      await reloadSprites();

      // Check if there are any sprites left after deletion
      const updatedSprites = await getSpriteSheetsByDate();
      const hasAnySprites = Object.values(updatedSprites).some(arr => arr.length > 0);
      console.log('[Delete Sprite] Sprites remaining:', hasAnySprites, 'hasResult:', hasResult);

      // If there are no more sprites and we have a result loaded, clear it
      if (!hasAnySprites && hasResult) {
        console.log('[Delete Sprite] No sprites left, clearing result');
        // Clear the loaded sprite and return to editor
        setGeneratedImage('');
        setResult(false);
        setHasResult(false);
        setHistory([]);
        setHistoryIndex(-1);
      }

      toast.success('Sprite sheet deleted');
    } catch (error) {
      console.error('Failed to delete sprite:', error);
      toast.error('Failed to delete sprite sheet');
    }
  };

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

  // Helper: Refresh user credits from storage
  const refreshCredits = () => {
    const credits = getUserCredits();
    setUserCredits(credits);
  };

  // Helper: Handle credit purchase completion
  const handleCreditPurchaseComplete = () => {
    refreshCredits();
    toast.success('Credits added to your account!');
  };

  const handleGenerate = async () => {
    if (!prompt && !selectedFile) return;
    if (!hasApiKey) {
      alert("Please connect your API key first");
      return;
    }

    // SECURITY: Rate limiting - prevent rapid-fire API cost explosions
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGenerationTime.current;
    if (timeSinceLastGeneration < MIN_GENERATION_INTERVAL_MS) {
      const waitSeconds = Math.ceil((MIN_GENERATION_INTERVAL_MS - timeSinceLastGeneration) / 1000);
      toast.error(`Please wait ${waitSeconds} seconds before generating again to prevent accidental charges.`);
      return;
    }
    lastGenerationTime.current = now;

    // Calculate optimal frame count based on action and direction
    const optimalFrameCount = calculateOptimalFrameCount(selectedAction, selectedDirectionCount);

    // Calculate cost based on direction count
    const estimate = calculateGenerationCost(selectedDirectionCount);

    // Check if user has sufficient credits
    if (!hasSufficientCredits(estimate.creditsRequired)) {
      toast.error(`Insufficient credits. You need ${estimate.creditsRequired} credits to generate this sprite.`);
      setIsCreditStoreOpen(true);
      return;
    }

    // Generate job ID for tracking (for logging purposes only - no deduction yet)
    const jobId = crypto.randomUUID();
    setCurrentGenerationJobId(jobId);

    setIsGenerating(true);
    setStatusText("Preparing your request...");
    // Immediately transition to ResultView to show loading overlay
    setResult(true);
    setHasResult(false);
    setGeneratedImage(null);
    setSelectedFrameIndices([]);
    setActiveFrameIndex(null);

    try {
      // Convert file to base64 if provided, OR generate a reference image from prompt
      let imageBase64: string | null = null;
      if (selectedFile) {
        setStatusText("Processing reference image...");
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      } else {
        // No image uploaded - generate a reference image with Gemini
        setStatusText("Generating reference character image with Gemini AI...");
        console.log('[handleGenerate] No reference image uploaded, generating with Gemini');
        try {
          imageBase64 = await generateReferenceImage(
            prompt,
            selectedArtStyle,
            'gemini-2.5-flash-image'
          );
          setStatusText("Reference image generated successfully!");
        } catch (error) {
          console.error('[handleGenerate] Failed to generate reference image:', error);
          throw new Error(`Failed to generate reference image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setStatusText("Analyzing character design and action requirements...");

      // Reset history for new generation
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedFrameIndices([]);
      setActiveFrameIndex(null);
      setSelectedFrame(null);

      // STEP 1: Analyze character (now always runs since we always have an image)
      let characterDescription = prompt;
      let styleParams = undefined;
      if (imageBase64) {
        try {
          const analysis = await analyzeCharacter(imageBase64, prompt);
          characterDescription = analysis.characterDescription;
          styleParams = analysis.styleParameters;
          setStatusText("Character analyzed successfully!");
        } catch (error) {
          console.warn('[handleGenerate] Character analysis failed, continuing with user prompt', error);
        }
      }

      // Calculate grid dimensions based on optimal frame count
      const { rows, cols } = calculateGridDimensions(optimalFrameCount);

      setStatusText(`Generating ${optimalFrameCount} frame sprite sheet with ${selectedAction} animation (${selectedDirectionCount} ${selectedDirectionCount === 1 ? 'direction' : 'directions'})...`);

      // ALWAYS use Replicate for video-based generation
      // Generates video → extracts 150 frames → perfect alignment + Frame Gallery
      // Reference image is now guaranteed (either uploaded or generated by Gemini)
      const useReplicate = true; // ✅ Always enabled - uses Replicate Seedance

      let spriteSheetBase64: string;
      let generatedPrompt: string;
      let generatedModel: string;
      let generatedCharacterDesc: string;

      if (useReplicate) {
        // Ensure we have a reference image (should always be true now)
        if (!imageBase64) {
          throw new Error('Reference image is required for Replicate generation');
        }

        // STEP 2-7: Generate sprite sheet using Replicate Seedance pipeline
        const replicateResult = await generateSpriteSheetFromImage(
          imageBase64,
          characterDescription,
          selectedAction,
          `${selectedDirectionCount} ${selectedDirectionCount === 1 ? 'direction' : 'directions'}`, // Pass direction count
          optimalFrameCount, // Use calculated frame count
          styleParams,
          (status) => setStatusText(status), // Progress callback
          undefined // Frame progress callback (optional)
        );
        
        // Store all extracted frames for user selection
        setAllExtractedFrames(replicateResult.allFrames);
        setAutoSelectedFrameIndices(replicateResult.selectedIndices);
        
        spriteSheetBase64 = replicateResult.spriteSheet.toDataURL('image/png');
        generatedPrompt = characterDescription;
        generatedModel = 'replicate-seedance-1-pro-fast';
        generatedCharacterDesc = characterDescription;
      } else {
        // Use Gemini-based generation (works in browser)
        setStatusText('Generating sprite sheet with Gemini AI...');
        const geminiResult = await generateSpriteSheet(
          imageBase64,           // imageBase64
          selectedAction,        // actionId
          selectedExpression,    // expressionId
          selectedArtStyle,      // artStyleId
          characterDescription,  // userPrompt (character description)
          selectedDirection,     // direction
          rows,                  // rows
          cols                   // cols
        );
        spriteSheetBase64 = geminiResult.imageData;
        generatedPrompt = geminiResult.prompt;
        generatedModel = geminiResult.modelId;
        generatedCharacterDesc = geminiResult.characterDescription;
      }

      // Store generation metadata
      setGenerationPrompt(generatedPrompt);
      setGenerationModel(generatedModel);
      setGenerationCharacterDescription(generatedCharacterDesc);

      setStatusText("Sprite sheet generated! Running intelligent alignment analysis...");

      // Post-process: AI-powered alignment and cleaning
      // This ensures smooth animations by detecting and fixing alignment issues
      const alignmentResult = await aiSmartAlignSpriteSheet(
        spriteSheetBase64,
        rows,
        cols,
        (status) => setStatusText(status) // Progress callback
      );
      
      // Save aligned sprite sheet to history
      pushToHistory(alignmentResult.aligned);
      setResult(true);
      setHasResult(true);
      
      // Deduct credits ONLY after successful generation
      const deductionSuccess = deductCredits(
        estimate.creditsRequired,
        `Sprite generation (${selectedDirectionCount} ${selectedDirectionCount === 1 ? 'direction' : 'directions'}, ${selectedAction} animation)`,
        jobId
      );

      if (!deductionSuccess) {
        console.warn('[handleGenerate] Failed to deduct credits after successful generation');
        // Non-fatal - generation succeeded, just log warning
      }

      // Refresh credit display
      refreshCredits();
      setTokens(prev => Math.max(0, prev - 1));

      setStatusText("Saving sprite sheet to local storage...");

      // Auto-save to IndexedDB
      try {
        // Serialize all extracted frames for persistent storage
        const allFramesData = allExtractedFrames.length > 0 
          ? framesToDataUrls(allExtractedFrames) 
          : undefined;

        await saveSpriteSheet({
          imageData: alignmentResult.aligned,
          prompt: generatedPrompt,
          characterDescription: generatedCharacterDesc,
          selectedAction,
          selectedExpression,
          artStyle: selectedArtStyle,
          directionCount: selectedDirectionCount, // Track direction count
          gridRows: rows,
          gridCols: cols,
          fps,
          isTransparent,
          hasDropShadow,
          modelId: generatedModel,
          history: [alignmentResult.aligned],
          historyIndex: 0,
          // Frame selection metadata (for Replicate/video-based generation)
          totalExtractedFrames: allExtractedFrames.length > 0 ? allExtractedFrames.length : undefined,
          selectedFrameIndices: autoSelectedFrameIndices.length > 0 ? autoSelectedFrameIndices : undefined,
          frameSelectionMethod: allExtractedFrames.length > 0 ? 'auto' : undefined,
          allExtractedFramesData: allFramesData, // Store all 150 frames for Frame Gallery
        });
        await reloadSprites();
        console.log('Sprite sheet auto-saved to local storage');
      } catch (error) {
        console.error('Failed to auto-save sprite sheet:', error);
        // Don't show error to user - non-critical failure
      }

      // Show appropriate success message with alignment details
      if (alignmentResult.hadIssues && alignmentResult.fixedIssues.length > 0) {
        const issueCount = alignmentResult.fixedIssues.length;
        const mainIssues = alignmentResult.fixedIssues.slice(0, 3).join(', ');
        const moreText = issueCount > 3 ? ` and ${issueCount - 3} more` : '';
        toast.success(`Sprite sheet generated and aligned! Fixed: ${mainIssues}${moreText}`);
      } else {
        toast.success("Sprite sheet generated successfully! 🎉");
      }
      
      // Log AI analysis recommendations if available
      if (alignmentResult.analysis.recommendations.length > 0) {
        console.log('[AI Alignment] Recommendations:', alignmentResult.analysis.recommendations);
      }
      
    } catch (error: any) {
      console.error("Generation failed:", error);
      const errorMessage = error.message || JSON.stringify(error);

      // No refund needed - credits are only deducted on successful generation
      setCurrentGenerationJobId(null);

      if (errorMessage.match(/(Requested entity was not found|PERMISSION_DENIED|UNAUTHENTICATED|API keys are not supported|API_KEY_MISSING|401|403)/)) {
        setHasApiKey(false);
        toast.error("Authentication failed. Please connect a valid API Key.", {
          description: "No credits were charged"
        });
      } else {
        toast.error(errorMessage || "Generation failed. Please try again.", {
          description: "No credits were charged"
        });
      }

      // Return to editor view on error
      setResult(false);
      setHasResult(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
      setSelectedArtStyle('inherited');
      setResult(false);
      setGeneratedImage(null);

      // Analyze for multi-view detection
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          const analysis = await analyzeCharacter(base64, '');
          if (analysis.isMultiView && analysis.viewData) {
            setMultiViewData(analysis.viewData);
            toast.info(`Detected ${analysis.viewData.viewCount} character views! You can select which angle to use.`);
          } else {
            setMultiViewData(null);
          }
        };
        reader.readAsDataURL(file);
      } catch (e) {
        console.warn('Multi-view analysis failed', e);
        setMultiViewData(null);
      }
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

    console.log('=== FRAME EDIT STARTED ===');
    console.log('Edit prompt:', trimmedPrompt);
    console.log('Selected frame indices:', selectedFrameIndices);
    console.log('Grid configuration:', { rows: gridRows, cols: gridCols });
    console.log('Total frames:', gridRows * gridCols);

    setIsEditing(true);
    try {
      if (selectedFrameIndices.length === 1) {
        // SINGLE FRAME EDIT MODE
        const targetIndex = selectedFrameIndices[0];
        console.log('--- SINGLE FRAME EDIT MODE ---');
        console.log('Editing frame index:', targetIndex);
        console.log('Frame number (1-based):', targetIndex + 1);
        setStatusText(`Isolating frame ${targetIndex + 1} from sprite sheet...`);

        // 1. Crop
        console.log('Step 1: Cropping frame...');
        const croppedFrame = await cropFrame(generatedImage, targetIndex, gridRows, gridCols);
        console.log('Cropped frame data URL length:', croppedFrame.length);

        setStatusText(`Applying AI edits to frame ${targetIndex + 1}: "${trimmedPrompt}"...`);

        // 2. Edit
        const modelId = 'gemini-2.5-pro-image';
        console.log('Step 2: Editing with AI...');
        console.log('Model:', modelId);
        console.log('Edit prompt being sent:', trimmedPrompt);
        const editedFrame = await editSpriteSheet(croppedFrame, trimmedPrompt, modelId);
        console.log('Edited frame data URL length:', editedFrame.length);

        setStatusText(`Integrating edited frame ${targetIndex + 1} back into sprite sheet...`);

        // 3. Paste
        console.log('Step 3: Pasting edited frame back...');
        console.log('Pasting to frame index:', targetIndex);
        const updatedSheet = await pasteFrame(generatedImage, editedFrame, targetIndex, gridRows, gridCols);
        console.log('Updated sheet data URL length:', updatedSheet.length);

        pushToHistory(updatedSheet);
        console.log('=== SINGLE FRAME EDIT COMPLETED ===');
        toast.success(`Frame ${targetIndex + 1} edited successfully!`);
      } else if (selectedFrameIndices.length > 1) {
        // MULTI-FRAME BATCH EDIT MODE
        console.log('--- MULTI-FRAME BATCH EDIT MODE ---');
        console.log('Number of frames to edit:', selectedFrameIndices.length);
        console.log('Frame indices:', selectedFrameIndices);
        setStatusText(`Preparing batch edit of ${selectedFrameIndices.length} frames...`);
        const modelId = 'gemini-2.5-pro-image';
        let currentSheet = generatedImage;

        // Edit each selected frame sequentially
        for (let i = 0; i < selectedFrameIndices.length; i++) {
          const frameIndex = selectedFrameIndices[i];
          console.log(`Processing frame ${i + 1}/${selectedFrameIndices.length}:`, frameIndex);
          setStatusText(`Processing frame ${frameIndex + 1} of ${selectedFrameIndices.length}: "${trimmedPrompt}"...`);

          console.log('  Cropping frame:', frameIndex);
          const croppedFrame = await cropFrame(currentSheet, frameIndex, gridRows, gridCols);
          console.log('  Editing with prompt:', trimmedPrompt);
          const editedFrame = await editSpriteSheet(croppedFrame, trimmedPrompt, modelId);
          console.log('  Pasting back to frame:', frameIndex);
          currentSheet = await pasteFrame(currentSheet, editedFrame, frameIndex, gridRows, gridCols);
          console.log('  Frame', frameIndex, 'completed');
        }

        pushToHistory(currentSheet);
        console.log('=== MULTI-FRAME EDIT COMPLETED ===');
        toast.success(`${selectedFrameIndices.length} frames edited successfully!`);
      } else {
        // FULL SHEET EDIT MODE (no frames selected)
        console.log('--- FULL SHEET EDIT MODE ---');
        console.log('Editing entire sprite sheet');
        setStatusText(`Applying AI edits to entire ${gridRows}×${gridCols} sprite sheet...`);
        const modelId = 'gemini-2.5-pro-image';
        console.log('Model:', modelId);
        console.log('Edit prompt being sent:', trimmedPrompt);
        const rawEdited = await editSpriteSheet(generatedImage, trimmedPrompt, modelId);
        console.log('Raw edited sheet data URL length:', rawEdited.length);

        // Post-process edited sheet too
        setStatusText("Running quality check and alignment cleanup on edited sheet...");
        console.log('Cleaning sprite sheet...');
        const { cleaned, hadIssues, issues } = await cleanSpriteSheet(rawEdited, gridRows, gridCols);
        console.log('Cleaning results:', { hadIssues, issues });

        pushToHistory(cleaned);
        console.log('=== FULL SHEET EDIT COMPLETED ===');

        if (hadIssues && issues.length > 0) {
          toast.success(`Sheet edited! Fixed: ${issues.join(', ')}`);
        } else {
          toast.success("Sprite sheet edited successfully!");
        }
      }
    } catch (error: any) {
      console.error('=== EDIT FAILED ===');
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast.error(error.message || "Edit failed. Please try again.");
    } finally {
      setIsEditing(false);
      setStatusText("");
      console.log('Edit process finished, isEditing set to false');
    }
  };

  const handleCleanBackground = async () => {
    if (!generatedImage) return;

    console.log('=== CLEAN BACKGROUND STARTED ===');
    console.log('Selected frame indices:', selectedFrameIndices);
    console.log('Grid configuration:', { rows: gridRows, cols: gridCols });

    setIsEditing(true);
    try {
      if (selectedFrameIndices.length === 1) {
        // SINGLE FRAME CLEAN MODE
        const targetIndex = selectedFrameIndices[0];
        console.log('--- SINGLE FRAME CLEAN MODE ---');
        console.log('Cleaning frame index:', targetIndex);
        setStatusText(`Removing background from frame ${targetIndex + 1}...`);

        // 1. Crop frame
        const croppedFrame = await cropFrame(generatedImage, targetIndex, gridRows, gridCols);

        // 2. Apply background removal
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = croppedFrame;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        if (!ctx) {
          throw new Error('Failed to create canvas context');
        }

        ctx.drawImage(img, 0, 0);

        // Import processRemoveBackground from imageHelpers
        const { processRemoveBackground } = await import('./utils/imageHelpers');
        processRemoveBackground(ctx, canvas.width, canvas.height);

        const cleanedFrame = canvas.toDataURL('image/png');

        // 3. Paste back
        setStatusText(`Updating sprite sheet with cleaned frame ${targetIndex + 1}...`);
        const updatedSheet = await pasteFrame(generatedImage, cleanedFrame, targetIndex, gridRows, gridCols);

        pushToHistory(updatedSheet);
        console.log('=== SINGLE FRAME CLEAN COMPLETED ===');
        toast.success(`Frame ${targetIndex + 1} background cleaned!`);

      } else if (selectedFrameIndices.length > 1) {
        // MULTI-FRAME BATCH CLEAN MODE
        console.log('--- MULTI-FRAME BATCH CLEAN MODE ---');
        console.log('Number of frames to clean:', selectedFrameIndices.length);
        setStatusText(`Cleaning background from ${selectedFrameIndices.length} frames...`);
        let currentSheet = generatedImage;

        // Import processRemoveBackground once
        const { processRemoveBackground } = await import('./utils/imageHelpers');

        // Clean each selected frame sequentially
        for (let i = 0; i < selectedFrameIndices.length; i++) {
          const frameIndex = selectedFrameIndices[i];
          console.log(`Processing frame ${i + 1}/${selectedFrameIndices.length}:`, frameIndex);
          setStatusText(`Cleaning frame ${frameIndex + 1} of ${selectedFrameIndices.length}...`);

          // Crop frame
          const croppedFrame = await cropFrame(currentSheet, frameIndex, gridRows, gridCols);

          // Load to canvas
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = croppedFrame;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

          if (!ctx) continue;

          ctx.drawImage(img, 0, 0);
          processRemoveBackground(ctx, canvas.width, canvas.height);

          const cleanedFrame = canvas.toDataURL('image/png');

          // Paste back
          currentSheet = await pasteFrame(currentSheet, cleanedFrame, frameIndex, gridRows, gridCols);
        }

        pushToHistory(currentSheet);
        console.log('=== MULTI-FRAME CLEAN COMPLETED ===');
        toast.success(`${selectedFrameIndices.length} frames cleaned!`);

      } else {
        // FULL SHEET CLEAN MODE
        console.log('--- FULL SHEET CLEAN MODE ---');
        setStatusText('Removing background from entire sprite sheet...');

        // Load entire sheet to canvas
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = generatedImage;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        if (!ctx) {
          throw new Error('Failed to create canvas context');
        }

        ctx.drawImage(img, 0, 0);

        // Import and apply background removal to entire sheet
        const { processRemoveBackground } = await import('./utils/imageHelpers');
        processRemoveBackground(ctx, canvas.width, canvas.height);

        const cleanedSheet = canvas.toDataURL('image/png');

        pushToHistory(cleanedSheet);
        console.log('=== FULL SHEET CLEAN COMPLETED ===');
        toast.success('Sprite sheet background cleaned!');
      }
    } catch (error: any) {
      console.error('=== CLEAN BACKGROUND FAILED ===');
      console.error("Error details:", error);
      toast.error(error.message || "Failed to clean background. Please try again.");
    } finally {
      setIsEditing(false);
      setStatusText("");
      console.log('Clean background process finished');
    }
  };

  /**
   * Re-process background removal on entire sprite sheet
   * Uses the improved background removal algorithm to fix green backgrounds and shadows
   * This is useful for existing sprite sheets that need better background removal
   */
  const handleReprocessBackground = async () => {
    if (!generatedImage) return;

    console.log('=== REPROCESS BACKGROUND STARTED ===');
    console.log('Grid configuration:', { rows: gridRows, cols: gridCols });

    setIsEditing(true);
    setStatusText('Re-processing background removal on all frames...');

    try {
      const totalFrames = gridRows * gridCols;
      const { processRemoveBackground } = await import('./utils/imageHelpers');

      // Process each frame individually for best results
      let currentSheet = generatedImage;

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        setStatusText(`Re-processing frame ${frameIndex + 1} of ${totalFrames}...`);
        console.log(`Processing frame ${frameIndex + 1}/${totalFrames}`);

        // 1. Crop frame
        const croppedFrame = await cropFrame(currentSheet, frameIndex, gridRows, gridCols);

        // 2. Load to canvas
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = croppedFrame;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

        if (!ctx) {
          console.error(`Failed to create canvas for frame ${frameIndex}`);
          continue;
        }

        ctx.drawImage(img, 0, 0);

        // 3. Apply improved background removal
        processRemoveBackground(ctx, canvas.width, canvas.height);

        const cleanedFrame = canvas.toDataURL('image/png');

        // 4. Paste back into sheet
        currentSheet = await pasteFrame(currentSheet, cleanedFrame, frameIndex, gridRows, gridCols);
      }

      pushToHistory(currentSheet);
      console.log('=== REPROCESS BACKGROUND COMPLETED ===');
      toast.success(`All ${totalFrames} frames reprocessed with improved background removal!`);

    } catch (error: any) {
      console.error('=== REPROCESS BACKGROUND FAILED ===');
      console.error("Error details:", error);
      toast.error(error.message || "Failed to reprocess background. Please try again.");
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

  const handleInsertFrame = async (index: number, position: 'before' | 'after') => {
    if (!generatedImage) return;

    console.log('=== INSERT FRAME STARTED ===');
    console.log('Insert index:', index);
    console.log('Position:', position);
    console.log('Current grid:', { rows: gridRows, cols: gridCols });

    setIsEditing(true);
    setStatusText(`Analyzing surrounding frames for transition...`);

    try {
      // Determine which frames to use as references
      const totalFrames = gridRows * gridCols;
      let frameBefore: string | null = null;
      let frameAfter: string | null = null;

      if (position === 'before') {
        // Inserting before index
        // frameAfter is at index, frameBefore is at index-1 (if exists)
        frameAfter = await cropFrame(generatedImage, index, gridRows, gridCols);
        if (index > 0) {
          frameBefore = await cropFrame(generatedImage, index - 1, gridRows, gridCols);
        }
        console.log('Insert Before - References:', {
          hasBefore: !!frameBefore,
          hasAfter: !!frameAfter,
          beforeIndex: index - 1,
          afterIndex: index
        });
      } else {
        // Inserting after index
        // frameBefore is at index, frameAfter is at index+1 (if exists)
        frameBefore = await cropFrame(generatedImage, index, gridRows, gridCols);
        if (index < totalFrames - 1) {
          frameAfter = await cropFrame(generatedImage, index + 1, gridRows, gridCols);
        }
        console.log('Insert After - References:', {
          hasBefore: !!frameBefore,
          hasAfter: !!frameAfter,
          beforeIndex: index,
          afterIndex: index + 1
        });
      }

      setStatusText(`Generating smooth transition frame ${position} frame ${index + 1}...`);

      // Generate the in-between frame using AI
      console.log('Generating in-between frame with AI...');
      const modelId = 'gemini-2.5-pro-image';
      const newFrameDataUrl = await generateInBetweenFrame(
        frameBefore,
        frameAfter,
        selectedAction,
        prompt,
        selectedArtStyle,
        modelId
      );
      console.log('Generated frame data URL length:', newFrameDataUrl.length);

      setStatusText(`Integrating new frame into sprite sheet grid...`);

      // Insert the frame into the sprite sheet
      console.log('Inserting frame into sprite sheet...');
      const { newSheetSrc, newCols } = await insertFrame(
        generatedImage,
        newFrameDataUrl,
        index,
        position,
        gridRows,
        gridCols
      );
      console.log('New grid dimensions:', { rows: gridRows, cols: newCols });

      // Update the sprite sheet and grid dimensions
      _setGridCols(newCols);
      pushToHistory(newSheetSrc);

      // Clear frame selection
      setSelectedFrameIndices([]);
      setActiveFrameIndex(null);
      setSelectedFrame(null);

      console.log('=== INSERT FRAME COMPLETED ===');
      toast.success(`New frame inserted ${position} Frame ${index + 1}!`);
    } catch (error: any) {
      console.error('=== INSERT FRAME FAILED ===');
      console.error('Error:', error);
      toast.error(error.message || 'Failed to insert frame. Please try again.');
    } finally {
      setIsEditing(false);
      setStatusText('');
    }
  };

  const handleRemoveFrame = async (index: number) => {
    if (!generatedImage) return;

    console.log('=== REMOVE FRAME STARTED ===');
    console.log('Remove index:', index);
    console.log('Current grid:', { rows: gridRows, cols: gridCols });

    // Validate we can remove (need at least 2 frames to maintain animation)
    const totalFrames = gridRows * gridCols;
    if (totalFrames <= 2) {
      toast.error('Cannot remove frame: sprite sheet must have at least 2 frames');
      return;
    }

    setIsEditing(true);
    setStatusText(`Removing Frame ${index + 1}...`);

    try {
      // Remove the frame from the sprite sheet
      console.log('Removing frame from sprite sheet...');
      const { newSheetSrc, newCols } = await removeFrame(
        generatedImage,
        index,
        gridRows,
        gridCols
      );
      console.log('Grid dimensions unchanged:', { rows: gridRows, cols: newCols });

      // Update the sprite sheet (grid dimensions stay the same to preserve frame size)
      // The removed frame's slot will be empty/transparent
      pushToHistory(newSheetSrc);

      // Clear frame selection
      setSelectedFrameIndices([]);
      setActiveFrameIndex(null);
      setSelectedFrame(null);

      console.log('=== REMOVE FRAME COMPLETED ===');
      toast.success(`Frame ${index + 1} removed successfully!`);
    } catch (error: any) {
      console.error('=== REMOVE FRAME FAILED ===');
      console.error('Error:', error);
      toast.error(error.message || 'Failed to remove frame. Please try again.');
    } finally {
      setIsEditing(false);
      setStatusText('');
    }
  };

  const handleReplaceFrameWithImage = async (index: number, imageFile: File) => {
    if (!generatedImage) return;

    console.log('=== REPLACE FRAME WITH IMAGE STARTED ===');
    console.log('Replace index:', index);
    console.log('Image file:', imageFile.name, imageFile.type, imageFile.size);
    console.log('Current grid:', { rows: gridRows, cols: gridCols });

    setIsEditing(true);
    setStatusText(`Inserting custom image into Frame ${index + 1}...`);

    try {
      // Convert the uploaded file to data URL
      const customImageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read image file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(imageFile);
      });
      console.log('Custom image loaded, data URL length:', customImageDataUrl.length);

      // Replace the frame with the custom image
      console.log('Replacing frame with custom image...');
      const newSheetSrc = await replaceFrameWithImage(
        generatedImage,
        customImageDataUrl,
        index,
        gridRows,
        gridCols
      );
      console.log('Frame replaced, new sheet data URL length:', newSheetSrc.length);

      // Update the sprite sheet
      pushToHistory(newSheetSrc);

      // Clear frame selection
      setSelectedFrameIndices([]);
      setActiveFrameIndex(null);
      setSelectedFrame(null);

      console.log('=== REPLACE FRAME WITH IMAGE COMPLETED ===');
      toast.success(`Frame ${index + 1} replaced with custom image!`);
    } catch (error: any) {
      console.error('=== REPLACE FRAME WITH IMAGE FAILED ===');
      console.error('Error:', error);
      toast.error(error.message || 'Failed to replace frame. Please try again.');
    } finally {
      setIsEditing(false);
      setStatusText('');
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
    setUploadSource('generated');
  };

  const handleConfirmNew = () => {
    setPrompt('');
    setSelectedFile(null);
    setFilePreview(null);
    reset();
    setShowNewConfirm(false);
  };

  const handleSpriteSheetUpload = async (file: File, rows: number, cols: number) => {
    try {
      // Convert file to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update grid dimensions
      _setGridRows(rows);
      _setGridCols(cols);

      // Set as uploaded source
      setUploadSource('uploaded');

      // Initialize history with uploaded image
      setHistory([dataUrl]);
      setHistoryIndex(0);
      setGeneratedImage(dataUrl);

      // Clear generation metadata since this is uploaded
      setGenerationPrompt('');
      setGenerationModel('');
      setGenerationCharacterDescription('');

      // Auto-save uploaded sprite sheet to IndexedDB (creates project)
      try {
        await saveSpriteSheet({
          imageData: dataUrl,
          prompt: '', // No prompt for uploaded files
          characterDescription: '', // No character description for uploaded files
          selectedAction,
          selectedExpression,
          artStyle: selectedArtStyle,
          directionCount: selectedDirectionCount, // Track direction count for uploaded files too
          gridRows: rows,
          gridCols: cols,
          fps,
          isTransparent,
          hasDropShadow,
          modelId: '', // No model ID for uploaded files
          history: [dataUrl],
          historyIndex: 0,
        });
        await reloadSprites();
        console.log('Uploaded sprite sheet auto-saved to local storage');
      } catch (error) {
        console.error('Failed to auto-save uploaded sprite sheet:', error);
        // Don't show error to user - non-critical failure
      }

      // Navigate to ResultView
      setResult(true);
      setHasResult(true);

      // Close modal
      setIsUploadModalOpen(false);

      // Clear frame selection
      setSelectedFrameIndices([]);
      setActiveFrameIndex(null);
      setSelectedFrame(null);

      toast.success(`Sprite sheet loaded! ${rows}×${cols} grid (${rows * cols} frames)`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to load sprite sheet. Please try again.');
    }
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

      const frames = extractFrames(img, gridRows, gridCols, gridRows * gridCols, isTransparent, hasDropShadow);
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
        <SpriteSheetUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleSpriteSheetUpload}
        />

        {/* New Animation Confirmation Dialog */}
        <AnimatePresence>
          {showNewConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewConfirm(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-orange-500 dark:border-orange-500/50 max-w-md w-full overflow-hidden"
              >
                {/* Header */}
                <div className="relative bg-orange-500 dark:bg-orange-600 p-6 pb-8">
                  <div className="flex items-center gap-4">
                    {/* Animated Icon */}
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="w-16 h-16 bg-white/30 dark:bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-white">
                      Start New Animation?
                    </h2>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    This will clear your current sprite sheet. Make sure you've saved it first!
                  </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => setShowNewConfirm(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmNew}
                    className="flex-1 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    Start New
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-[96%] 2xl:max-w-[1800px] mx-auto relative z-10 flex-1 flex flex-col min-h-0">
          
          <Header
            tokens={tokens}
            setShowPricing={setShowPricing}
            theme={theme}
            toggleTheme={toggleTheme}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onNewClick={() => {
              if (hasResult) {
                setShowNewConfirm(true);
              } else {
                // No result, just reset immediately
                setPrompt('');
                setSelectedFile(null);
                setFilePreview(null);
                reset();
              }
            }}
            onLoadSpriteSheet={() => setIsUploadModalOpen(true)}
            sphereState={sphereState}
            onSwooshComplete={handleSwooshComplete}
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
              selectedDirection={selectedDirection}
              setSelectedDirection={setSelectedDirection}
              multiViewData={multiViewData}
              selectedViewType={selectedViewType}
              setSelectedViewType={setSelectedViewType}
              selectedDirectionCount={selectedDirectionCount}
              setSelectedDirectionCount={setSelectedDirectionCount}
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
                     {/* Show indicator when sprite sheet is open in edit mode but viewing home page */}
                     {hasResult && generatedImage && !result && (
                       <OpenFileIndicator 
                         onReturnToEditor={() => setResult(true)}
                         theme={theme}
                       />
                     )}

                     {/* Only show view mode toggle when sprites exist */}
                     {!isLoadingSprites && Object.values(savedSprites).some(arr => arr.length > 0) && (
                       <div className="flex items-center justify-end mb-2 shrink-0">
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                               <Settings2 className="w-3 h-3" />
                               <span>View Mode</span>
                            </div>
                            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                  viewMode === 'grid'
                                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                              >
                                <Grid className="w-3.5 h-3.5" />
                                <span>Grid</span>
                              </button>
                              <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                  viewMode === 'list'
                                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                              >
                                <List className="w-3.5 h-3.5" />
                                <span>List</span>
                              </button>
                            </div>
                         </div>
                       </div>
                     )}
                     
                     <div
                        className={cn(
                          "flex-1 relative rounded-2xl transition-all overflow-hidden min-h-[400px] h-full border border-slate-200 dark:border-slate-800 shadow-sm",
                          hasResult && !isLoadingSprites && Object.values(savedSprites).some(arr => arr.length > 0) ? "cursor-pointer group ring-offset-4 ring-offset-slate-50 dark:ring-offset-[#0a0a0e]" : ""
                        )}
                        onClick={() => {
                          // Only navigate to result if we have sprites and a result
                          const hasSprites = !isLoadingSprites && Object.values(savedSprites).some(arr => arr.length > 0);
                          if (hasResult && hasSprites) {
                            setResult(true);
                          }
                        }}
                     >
                        {!isLoadingSprites && Object.values(savedSprites).some(arr => arr.length > 0) ? (
                          <FileLibraryView
                            sprites={savedSprites}
                            onOpenSprite={handleOpenSprite}
                            onDeleteSprite={handleDeleteSprite}
                            viewMode={viewMode}
                            activeImageData={hasResult ? generatedImage : null}
                          />
                        ) : (
                          <EmptyStateView
                            isGenerating={isGenerating}
                            statusText={displayStatusText || statusText}
                            isLoadingSprites={isLoadingSprites}
                          />
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
                     onCleanBackground={handleCleanBackground}
                     onReprocessBackground={handleReprocessBackground}
                     onUndo={handleUndo}
                     onRedo={handleRedo}
                     canUndo={historyIndex > 0}
                     canRedo={historyIndex < history.length - 1}
                     isEditing={isEditing}
                     isGenerating={isGenerating}
                     statusText={displayStatusText || statusText}
                     fps={fps}
                     setFps={setFps}
                     isTransparent={isTransparent}
                     setIsTransparent={setIsTransparent}
                     hasDropShadow={hasDropShadow}
                     setHasDropShadow={setHasDropShadow}
                     onDownloadSheet={handleDownloadSheet}
                     onDownloadGif={handleDownloadGif}
                     onRegenerate={handleRegenerate}
                     onClearResult={backToEditor}
                     onAutoAlign={handleAutoAlignFrame}
                     onAlignAll={handleAutoAlignSheet}
                     onInsertFrame={handleInsertFrame}
                     onRemoveFrame={handleRemoveFrame}
                     onReplaceFrameWithImage={handleReplaceFrameWithImage}
                     generationPrompt={generationPrompt}
                     generationModel={generationModel}
                     generationCharacterDescription={generationCharacterDescription}
                     selectedArtStyle={selectedArtStyle}
                     onArtStyleChange={setSelectedArtStyle}
                     hasExtractedFrames={allExtractedFrames.length > 0}
                     extractedFrameCount={allExtractedFrames.length}
                     onOpenFrameGallery={() => setIsFrameGalleryOpen(true)}
                  />
                 )}
              </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Credit Store Modal */}
        <CreditStore
          isOpen={isCreditStoreOpen}
          onClose={() => setIsCreditStoreOpen(false)}
          onPurchaseComplete={handleCreditPurchaseComplete}
        />

        {/* Frame Gallery Modal - Advanced frame selection */}
        <FrameGallery
          allFrames={allExtractedFrames}
          selectedIndices={autoSelectedFrameIndices}
          onSelectionChange={handleFrameGallerySelectionChange}
          onClose={() => setIsFrameGalleryOpen(false)}
          onApply={handleApplyFrameSelection}
          isOpen={isFrameGalleryOpen}
        />

        {/* Fixed Credit Display (bottom-right corner) */}
        <div className="fixed bottom-6 right-6 z-50">
          <CreditDisplay
            credits={userCredits}
            onBuyClick={() => setIsCreditStoreOpen(true)}
            onHistoryClick={() => {
              toast.info('Transaction history feature coming soon!');
            }}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}
