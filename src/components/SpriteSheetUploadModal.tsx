/**
 * Sprite Sheet Upload Modal
 * Allows users to upload existing sprite sheets with smart grid detection
 */

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Upload, LayoutGrid, ChevronRight, ChevronLeft, Check, Sparkles, Edit2, Trash2, Plus, Save, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { smartDetectGrid, validateSpriteSheetFile, GridDetectionResult } from '../utils/gridDetection';
import { detectVariableFrames, VariableFrame, VariableFrameDetectionResult } from '../utils/variableFrameDetection';
import { toast } from 'sonner';

interface SpriteSheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, rows: number, cols: number, variableFrames?: VariableFrame[]) => void;
}

type UploadStep = 'select' | 'detect' | 'manual';

export default function SpriteSheetUploadModal({ isOpen, onClose, onUpload }: SpriteSheetUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const [detectionResult, setDetectionResult] = useState<GridDetectionResult | null>(null);
  const [variableFrameResult, setVariableFrameResult] = useState<VariableFrameDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualRows, setManualRows] = useState(2);
  const [manualCols, setManualCols] = useState(4);
  const [isDragging, setIsDragging] = useState(false);
  const [useVariableFrames, setUseVariableFrames] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [newFrameStart, setNewFrameStart] = useState<{ x: number; y: number } | null>(null);
  const [editingFrame, setEditingFrame] = useState<VariableFrame | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewImage(null);
      setDetectionResult(null);
      setVariableFrameResult(null);
      setIsDetecting(false);
      setManualRows(2);
      setManualCols(4);
      setIsDragging(false);
      setUseVariableFrames(false);
      setSelectedFrameIndex(null);
      setIsAddingFrame(false);
      setNewFrameStart(null);
      setEditingFrame(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsPanning(false);
    }
  }, [isOpen]);

  // Handle zoom with mouse wheel
  const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current || e.shiftKey) return; // Don't zoom if shift is held (for horizontal scroll)
    
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY;
    const zoomSpeed = 0.1;
    const zoomFactor = delta > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
    
    if (newZoom !== zoom) {
      // Zoom towards mouse position
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomRatio = newZoom / zoom;
      const newPanX = pan.x - (mouseX - pan.x) * (zoomRatio - 1);
      const newPanY = pan.y - (mouseY - pan.y) * (zoomRatio - 1);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Handle pan with mouse drag (container level)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle panning - let canvas handle clicks and frame drawing
    if (e.button === 1 || (e.button === 0 && (e.metaKey || e.ctrlKey || e.shiftKey || zoom !== 1))) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMovePan = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (isAddingFrame && newFrameStart && canvasRef.current && previewImage) {
      // Update drawing preview during mouse move
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = ((e.clientX - rect.left - pan.x) / zoom) * scaleX;
      const y = ((e.clientY - rect.top - pan.y) / zoom) * scaleY;
      
      // Redraw canvas with preview
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(previewImage, 0, 0);
        // Redraw existing frames
        if (variableFrameResult) {
          for (const frame of variableFrameResult.frames) {
            const isSelected = selectedFrameIndex === frame.index;
            ctx.strokeStyle = isSelected ? 'rgba(59, 130, 246, 1)' : 'rgba(249, 115, 22, 0.8)';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
          }
        }
        // Draw new frame preview
        ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const startX = Math.min(newFrameStart.x, x);
        const startY = Math.min(newFrameStart.y, y);
        const width = Math.abs(x - newFrameStart.x);
        const height = Math.abs(y - newFrameStart.y);
        ctx.strokeRect(startX, startY, width, height);
        ctx.setLineDash([]);
      }
    }
  };

  const handleCanvasMouseUpPan = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.1, prev / 1.2));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Draw grid overlay on canvas
  useEffect(() => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = previewImage.naturalWidth;
    canvas.height = previewImage.naturalHeight;

    // Draw image
    ctx.drawImage(previewImage, 0, 0);

    // Draw overlay based on detection mode
    if (useVariableFrames && variableFrameResult && variableFrameResult.frames.length > 0) {
      // Sort frames by position (same as upload logic) to match extraction order
      const sortedFrames = [...variableFrameResult.frames]
        .sort((a, b) => {
          // Sort by position: top-to-bottom, left-to-right
          const rowTolerance = Math.max(a.height, b.height) * 0.3;
          if (Math.abs(a.y - b.y) < rowTolerance) {
            return a.x - b.x; // Same row, sort by x
          }
          return a.y - b.y; // Different rows, sort by y
        })
        .map((frame, i) => ({ ...frame, displayIndex: i })); // Add display index for labeling
      
      // Draw variable frame bounding boxes
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)'; // Orange
      ctx.lineWidth = 2;
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(249, 115, 22, 0.9)';
      ctx.textBaseline = 'top';

      for (const frame of sortedFrames) {
        const isSelected = selectedFrameIndex === frame.index;
        // Use editing frame coordinates if currently editing
        const displayFrame = (isSelected && editingFrame) ? editingFrame : frame;
        
        // Draw bounding box (highlighted if selected)
        ctx.strokeStyle = isSelected ? 'rgba(59, 130, 246, 1)' : 'rgba(249, 115, 22, 0.8)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(displayFrame.x, displayFrame.y, displayFrame.width, displayFrame.height);
        
        // Draw selection highlight
        if (isSelected) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.fillRect(displayFrame.x, displayFrame.y, displayFrame.width, displayFrame.height);
        }
        
        // Draw frame index label using displayIndex (matches extraction order)
        const label = `Frame ${frame.displayIndex + 1}`;
        const textMetrics = ctx.measureText(label);
        const labelWidth = textMetrics.width;
        const labelHeight = 16;
        
        // Draw background for label
        ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(displayFrame.x, displayFrame.y, labelWidth + 4, labelHeight);
        
        // Draw label text
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 1)' : 'rgba(249, 115, 22, 1)';
        ctx.fillText(label, displayFrame.x + 2, displayFrame.y + 2);
      }
      
      // Draw new frame being added
      if (isAddingFrame && newFrameStart && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // This will be updated by mouse move handler
      }
    } else {
      // Draw uniform grid overlay
      const rows = manualRows;
      const cols = manualCols;

      ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)'; // Orange
      ctx.lineWidth = 2;

      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      // Draw vertical lines
      for (let i = 1; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let i = 1; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(canvas.width, i * cellHeight);
        ctx.stroke();
      }
    }
  }, [previewImage, detectionResult, step, manualRows, manualCols, useVariableFrames, variableFrameResult, selectedFrameIndex, isAddingFrame, newFrameStart, editingFrame]);

  // Handle canvas mouse down (for frame selection and drawing - container handles pan)
  const handleCanvasMouseDownCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation(); // Prevent container pan handler from firing
    
    if (isAddingFrame) {
      // Start drawing new frame (accounting for zoom/pan)
      if (!canvasRef.current || !previewImage || !canvasContainerRef.current) return;
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      
      // Calculate position in canvas coordinates (accounting for zoom and pan)
      const x = (e.clientX - containerRect.left - pan.x) / zoom;
      const y = (e.clientY - containerRect.top - pan.y) / zoom;
      setNewFrameStart({ x, y });
    }
  };

  // Helper function to sort frames the same way they'll be sorted on upload
  const getSortedFrames = () => {
    if (!variableFrameResult || !variableFrameResult.frames.length) return [];
    return [...variableFrameResult.frames]
      .sort((a, b) => {
        // Sort by position: top-to-bottom, left-to-right
        const rowTolerance = Math.max(a.height, b.height) * 0.3;
        if (Math.abs(a.y - b.y) < rowTolerance) {
          return a.x - b.x; // Same row, sort by x
        }
        return a.y - b.y; // Different rows, sort by y
      })
      .map((frame, i) => ({ ...frame, displayIndex: i }));
  };

  // Handle canvas click to select frames (accounting for zoom/pan)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation(); // Prevent container handlers
    
    if (!canvasRef.current || !variableFrameResult || !useVariableFrames || isAddingFrame || isPanning || !canvasContainerRef.current) return;
    
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    
    // Calculate click position in canvas coordinates (accounting for zoom and pan)
    const x = (e.clientX - containerRect.left - pan.x) / zoom;
    const y = (e.clientY - containerRect.top - pan.y) / zoom;
    
    // Check if clicking on a frame (use original frames for hit detection)
    for (const frame of variableFrameResult.frames) {
      if (x >= frame.x && x <= frame.x + frame.width &&
          y >= frame.y && y <= frame.y + frame.height) {
        setSelectedFrameIndex(frame.index);
        setEditingFrame({ ...frame });
        return;
      }
    }
    
    // If clicking outside, deselect
    setSelectedFrameIndex(null);
    setEditingFrame(null);
  };

  // Handle frame deletion
  const handleDeleteFrame = () => {
    if (selectedFrameIndex === null || !variableFrameResult) return;
    
    const updatedFrames = variableFrameResult.frames
      .filter(f => f.index !== selectedFrameIndex)
      .map((f, i) => ({ ...f, index: i })); // Re-index
    
    setVariableFrameResult({
      ...variableFrameResult,
      frames: updatedFrames
    });
    setSelectedFrameIndex(null);
    setEditingFrame(null);
    toast.success('Frame deleted');
  };

  // Handle frame update
  const handleUpdateFrame = () => {
    if (!editingFrame || selectedFrameIndex === null || !variableFrameResult) return;
    
    const updatedFrames = variableFrameResult.frames.map(f => 
      f.index === selectedFrameIndex ? { ...editingFrame, index: selectedFrameIndex } : f
    );
    
    setVariableFrameResult({
      ...variableFrameResult,
      frames: updatedFrames
    });
    toast.success('Frame updated');
  };

  // Handle add new frame
  const handleStartAddFrame = () => {
    setIsAddingFrame(true);
    setSelectedFrameIndex(null);
    setEditingFrame(null);
  };

  // Handle canvas mouse move for adding frames
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAddingFrame || !canvasRef.current || !previewImage || !canvasContainerRef.current) return;
    
    const canvas = canvasRef.current;
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    
    // Calculate position in canvas coordinates (accounting for zoom and pan)
    const x = (e.clientX - containerRect.left - pan.x) / zoom;
    const y = (e.clientY - containerRect.top - pan.y) / zoom;
    
    if (newFrameStart) {
      // Redraw canvas to show the rectangle being drawn
      const ctx = canvas.getContext('2d');
      if (ctx && previewImage) {
        ctx.drawImage(previewImage, 0, 0);
        // Redraw all existing frames
        if (variableFrameResult) {
          for (const frame of variableFrameResult.frames) {
            const isSelected = selectedFrameIndex === frame.index;
            ctx.strokeStyle = isSelected ? 'rgba(59, 130, 246, 1)' : 'rgba(249, 115, 22, 0.8)';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
          }
        }
        // Draw the new frame being created
        ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const startX = Math.min(newFrameStart.x, x);
        const startY = Math.min(newFrameStart.y, y);
        const width = Math.abs(x - newFrameStart.x);
        const height = Math.abs(y - newFrameStart.y);
        ctx.strokeRect(startX, startY, width, height);
        ctx.setLineDash([]);
      }
    }
  };

  // Handle canvas mouse up for adding frames (accounting for zoom/pan)
  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAddingFrame || !newFrameStart || !canvasRef.current || !variableFrameResult || !previewImage || !canvasContainerRef.current) return;
    
    const canvas = canvasRef.current;
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    
    // Calculate position in canvas coordinates (accounting for zoom and pan)
    const endX = (e.clientX - containerRect.left - pan.x) / zoom;
    const endY = (e.clientY - containerRect.top - pan.y) / zoom;
    
    const x = Math.min(newFrameStart.x, endX);
    const y = Math.min(newFrameStart.y, endY);
    const width = Math.abs(endX - newFrameStart.x);
    const height = Math.abs(endY - newFrameStart.y);
    
    // Only add if frame is large enough
    if (width >= 16 && height >= 16) {
      const newFrame: VariableFrame = {
        x: Math.max(0, Math.min(x, canvas.width - width)),
        y: Math.max(0, Math.min(y, canvas.height - height)),
        width: Math.min(width, canvas.width - x),
        height: Math.min(height, canvas.height - y),
        index: variableFrameResult.frames.length,
        confidence: 0.5
      };
      
      const updatedFrames = [...variableFrameResult.frames, newFrame]
        .sort((a, b) => {
          if (Math.abs(a.y - b.y) < 10) return a.x - b.x;
          return a.y - b.y;
        })
        .map((f, i) => ({ ...f, index: i }));
      
      setVariableFrameResult({
        ...variableFrameResult,
        frames: updatedFrames
      });
      
      setSelectedFrameIndex(newFrame.index);
      setEditingFrame({ ...newFrame, index: newFrame.index });
      toast.success('Frame added');
    }
    
    setIsAddingFrame(false);
    setNewFrameStart(null);
    
    // Canvas will automatically redraw via useEffect when variableFrameResult changes
  };

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = await validateSpriteSheetFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    // Check for JPEG (no transparency)
    if (file.type === 'image/jpeg') {
      toast('JPEG uploaded. Transparency effects will show white background.', { icon: 'ℹ️' });
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Load image for detection
    const img = new Image();
    img.onload = async () => {
      setPreviewImage(img);

      // Run both grid and variable frame detection
      setIsDetecting(true);
      try {
        let detectedVariableFrames: VariableFrameDetectionResult | null = null;
        
        // Try variable frame detection first (for non-uniform sprite sheets)
        try {
          const variableResult = await detectVariableFrames(img, {
            // minSize will be calculated dynamically based on image dimensions
            backgroundThreshold: 40, // Increased for better background detection
            padding: 2
          });
          
          if (variableResult.frames.length > 0) {
            detectedVariableFrames = variableResult;
            setVariableFrameResult(variableResult);
            console.log(`[SpriteSheetUpload] Detected ${variableResult.frames.length} variable frames using ${variableResult.method}`);
          }
        } catch (varError) {
          console.warn('Variable frame detection failed:', varError);
          // Continue with grid detection
        }

        // Also run grid detection (for uniform sprite sheets)
        const result = await smartDetectGrid(img);
        setDetectionResult(result);

        // Initialize manual values from detection
        setManualRows(result.detected.rows);
        setManualCols(result.detected.cols);

        // Warn about large grids
        if (result.detected.rows * result.detected.cols > 100) {
          toast.warning('Large frame count may impact performance. Recommended maximum: 100 frames.');
        }

        // Warn about non-grid images
        if (result.detected.rows === 1 && result.detected.cols === 1 && result.confidence === 'low') {
          toast.warning('This appears to be a single image. Is this a sprite sheet?');
        }

        // If variable frames detected, suggest using them
        if (detectedVariableFrames && detectedVariableFrames.frames.length > 0) {
          toast.info(`Detected ${detectedVariableFrames.frames.length} variable-sized frames. Toggle "Variable Frames" to use them.`, { duration: 5000 });
        }

        // Move to detection preview step
        setStep('detect');
      } catch (error) {
        console.error('Grid detection failed:', error);
        toast.error('Failed to detect grid. You can configure it manually.');
        setDetectionResult({
          detected: { rows: 2, cols: 4 },
          confidence: 'low',
          suggestions: []
        });
        setStep('detect');
      } finally {
        setIsDetecting(false);
      }
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUseDetected = () => {
    if (!selectedFile) return;

    // Warn about odd dimensions
    if (previewImage) {
      const frameWidth = previewImage.naturalWidth / manualCols;
      const frameHeight = previewImage.naturalHeight / manualRows;

      if (frameWidth % 1 !== 0 || frameHeight % 1 !== 0) {
        toast.warning(`Frames will be ${Math.floor(frameWidth)}×${Math.floor(frameHeight)}px. Some pixels may be cropped.`);
      }
    }

    // Use the manually editable values (which start from detected values)
    if (useVariableFrames && variableFrameResult && variableFrameResult.frames.length > 0) {
      // Ensure frames are sorted and properly indexed before passing
      const sortedFrames = [...variableFrameResult.frames]
        .sort((a, b) => {
          // Sort by position: top-to-bottom, left-to-right
          const rowTolerance = Math.max(a.height, b.height) * 0.3;
          if (Math.abs(a.y - b.y) < rowTolerance) {
            return a.x - b.x; // Same row, sort by x
          }
          return a.y - b.y; // Different rows, sort by y
        })
        .map((frame, i) => ({ ...frame, index: i })); // Re-index to ensure sequential indices
      
      const frameCount = sortedFrames.length;
      const estimatedCols = Math.ceil(Math.sqrt(frameCount));
      const estimatedRows = Math.ceil(frameCount / estimatedCols);
      
      console.log(`[SpriteSheetUpload] Uploading ${frameCount} variable frames with indices:`, sortedFrames.map(f => f.index));
      onUpload(selectedFile, estimatedRows, estimatedCols, sortedFrames);
    } else {
      onUpload(selectedFile, manualRows, manualCols);
    }
  };

  const handleUseManual = () => {
    if (!selectedFile) return;

    // Warn about odd dimensions
    if (previewImage) {
      const frameWidth = previewImage.naturalWidth / manualCols;
      const frameHeight = previewImage.naturalHeight / manualRows;

      if (frameWidth % 1 !== 0 || frameHeight % 1 !== 0) {
        toast.warning(`Frames will be ${Math.floor(frameWidth)}×${Math.floor(frameHeight)}px. Some pixels may be cropped.`);
      }
    }

    if (useVariableFrames && variableFrameResult && variableFrameResult.frames.length > 0) {
      // Ensure frames are sorted and properly indexed before passing (same as handleUseDetected)
      const sortedFrames = [...variableFrameResult.frames]
        .sort((a, b) => {
          // Sort by position: top-to-bottom, left-to-right
          const rowTolerance = Math.max(a.height, b.height) * 0.3;
          if (Math.abs(a.y - b.y) < rowTolerance) {
            return a.x - b.x; // Same row, sort by x
          }
          return a.y - b.y; // Different rows, sort by y
        })
        .map((frame, i) => ({ ...frame, index: i })); // Re-index to ensure sequential indices
      
      const frameCount = sortedFrames.length;
      const estimatedCols = Math.ceil(Math.sqrt(frameCount));
      const estimatedRows = Math.ceil(frameCount / estimatedCols);
      
      console.log(`[SpriteSheetUpload] Uploading ${frameCount} variable frames with indices:`, sortedFrames.map(f => f.index));
      onUpload(selectedFile, estimatedRows, estimatedCols, sortedFrames);
    } else {
      onUpload(selectedFile, manualRows, manualCols);
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colors[confidence]}`}>
        {confidence.toUpperCase()} Confidence
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(148 163 184);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgb(100 116 139);
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgb(71 85 105);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgb(51 65 85);
          }
        }
      `}</style>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Load Sprite Sheet</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {step === 'select' && 'Select a sprite sheet to upload'}
                  {step === 'detect' && 'Review detected grid configuration'}
                  {step === 'manual' && 'Manually configure grid layout'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div 
            className="p-6 max-h-[70vh] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(148 163 184) transparent'
            }}
          >
            <style>{`
              .overflow-y-auto::-webkit-scrollbar {
                width: 8px;
              }
              .overflow-y-auto::-webkit-scrollbar-track {
                background: transparent;
              }
              .overflow-y-auto::-webkit-scrollbar-thumb {
                background-color: rgb(148 163 184);
                border-radius: 4px;
              }
              .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                background-color: rgb(100 116 139);
              }
              @media (prefers-color-scheme: dark) {
                .overflow-y-auto::-webkit-scrollbar-thumb {
                  background-color: rgb(71 85 105);
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                  background-color: rgb(51 65 85);
                }
              }
            `}</style>
            {/* Step 1: File Selection */}
            {step === 'select' && (
              <div className="space-y-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                    ${isDragging
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-slate-300 dark:border-slate-700 hover:border-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {isDragging ? 'Drop your sprite sheet here' : 'Drag & drop or click to browse'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Supported: PNG, JPG, GIF, WebP (max 50MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {isDetecting && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-slate-700 border-t-orange-500 mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Analyzing sprite sheet...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Grid Detection Preview */}
            {step === 'detect' && detectionResult && previewImage && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Preview */}
                  <div className="lg:col-span-2 relative">
                    {/* Zoom Controls */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleZoomIn}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                      <button
                        onClick={handleResetView}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Reset View"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <div className="text-xs text-center text-slate-500 dark:text-slate-400 px-1 py-0.5">
                        {Math.round(zoom * 100)}%
                      </div>
                    </div>
                    
                    {/* Canvas Container with Zoom/Pan */}
                    <div
                      ref={canvasContainerRef}
                      onWheel={handleCanvasWheel}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMovePan}
                      onMouseUp={handleCanvasMouseUpPan}
                      onMouseLeave={handleCanvasMouseUpPan}
                      className="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950"
                      style={{ 
                        cursor: isPanning ? 'grabbing' : (isAddingFrame ? 'crosshair' : (zoom !== 1 ? 'grab' : (useVariableFrames ? 'pointer' : 'default')))
                      }}
                    >
                      <div
                        style={{
                          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                          transformOrigin: '0 0',
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleCanvasMouseDownCanvas}
                          onClick={handleCanvasClick}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          className="block"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detection Info */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Detected Grid</span>
                        {getConfidenceBadge(detectionResult.confidence)}
                      </div>

                      {/* Editable Grid Dimensions */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Rows</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={manualRows}
                            onChange={(e) => {
                              const value = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
                              setManualRows(value);
                              if (detectionResult) {
                                setDetectionResult({
                                  ...detectionResult,
                                  detected: { ...detectionResult.detected, rows: value }
                                });
                              }
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Columns</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={manualCols}
                            onChange={(e) => {
                              const value = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
                              setManualCols(value);
                              if (detectionResult) {
                                setDetectionResult({
                                  ...detectionResult,
                                  detected: { ...detectionResult.detected, cols: value }
                                });
                              }
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {detectionResult.detected.reason || 'Grid detected'} - Adjust values above if needed
                      </p>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Frame Size</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {useVariableFrames && variableFrameResult 
                            ? 'Variable (detected)' 
                            : `${Math.floor(previewImage.naturalWidth / manualCols)} × ${Math.floor(previewImage.naturalHeight / manualRows)} px`}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Frames</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {useVariableFrames && variableFrameResult 
                            ? variableFrameResult.frames.length 
                            : manualRows * manualCols}
                        </p>
                      </div>

                      {/* Variable Frame Detection Toggle */}
                      {variableFrameResult && variableFrameResult.frames.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useVariableFrames}
                              onChange={(e) => setUseVariableFrames(e.target.checked)}
                              className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                            />
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                Variable Frames ({variableFrameResult.frames.length} detected)
                              </span>
                            </div>
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                            Use detected variable-sized frames instead of uniform grid
                          </p>
                        </div>
                      )}

                      {/* Frame Editing Panel */}
                      {useVariableFrames && variableFrameResult && variableFrameResult.frames.length > 0 && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Edit Frames</h4>
                            <div className="flex gap-2">
                              <button
                                onClick={handleStartAddFrame}
                                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5"
                                title="Add new frame by drawing on canvas"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Frame
                              </button>
                            </div>
                          </div>
                          
                          {isAddingFrame && (
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                              <span>Click and drag on the canvas to draw a new frame</span>
                              <button
                                onClick={() => {
                                  setIsAddingFrame(false);
                                  setNewFrameStart(null);
                                  // Redraw canvas
                                  if (canvasRef.current && previewImage) {
                                    const canvas = canvasRef.current;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(previewImage, 0, 0);
                                      // Redraw frames
                                      if (variableFrameResult) {
                                        for (const frame of variableFrameResult.frames) {
                                          const isSelected = selectedFrameIndex === frame.index;
                                          ctx.strokeStyle = isSelected ? 'rgba(59, 130, 246, 1)' : 'rgba(249, 115, 22, 0.8)';
                                          ctx.lineWidth = isSelected ? 3 : 2;
                                          ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
                                        }
                                      }
                                    }
                                  }
                                }}
                                className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {selectedFrameIndex !== null && editingFrame && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  Editing Frame {selectedFrameIndex + 1}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateFrame}
                                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                                    title="Save changes"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleDeleteFrame}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Delete frame"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">X</label>
                                  <input
                                    type="number"
                                    value={editingFrame.x}
                                    onChange={(e) => setEditingFrame({ ...editingFrame, x: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Y</label>
                                  <input
                                    type="number"
                                    value={editingFrame.y}
                                    onChange={(e) => setEditingFrame({ ...editingFrame, y: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Width</label>
                                  <input
                                    type="number"
                                    value={editingFrame.width}
                                    onChange={(e) => setEditingFrame({ ...editingFrame, width: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Height</label>
                                  <input
                                    type="number"
                                    value={editingFrame.height}
                                    onChange={(e) => setEditingFrame({ ...editingFrame, height: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {detectionResult.suggestions.length > 0 && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Other Suggestions
                        </p>
                        <div className="space-y-1">
                          {detectionResult.suggestions.slice(0, 3).map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-slate-500 dark:text-slate-400"
                            >
                              • {suggestion.rows}×{suggestion.cols} - {suggestion.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Manual Grid Configuration */}
            {step === 'manual' && previewImage && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Preview */}
                  <div className="lg:col-span-2 relative">
                    {/* Zoom Controls */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleZoomIn}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                      <button
                        onClick={handleResetView}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Reset View"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                      <div className="text-xs text-center text-slate-500 dark:text-slate-400 px-1 py-0.5">
                        {Math.round(zoom * 100)}%
                      </div>
                    </div>
                    
                    {/* Canvas Container with Zoom/Pan */}
                    <div
                      ref={canvasContainerRef}
                      onWheel={handleCanvasWheel}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMovePan}
                      onMouseUp={handleCanvasMouseUpPan}
                      onMouseLeave={handleCanvasMouseUpPan}
                      className="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950"
                      style={{ 
                        cursor: isPanning ? 'grabbing' : (isAddingFrame ? 'crosshair' : (zoom !== 1 ? 'grab' : (useVariableFrames ? 'pointer' : 'default')))
                      }}
                    >
                      <div
                        style={{
                          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                          transformOrigin: '0 0',
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleCanvasMouseDownCanvas}
                          onClick={handleCanvasClick}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          className="block"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual Controls */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
                          Rows
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={manualRows}
                          onChange={(e) => setManualRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
                          Columns
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={manualCols}
                          onChange={(e) => setManualCols(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Frame Size</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {Math.floor(previewImage.naturalWidth / manualCols)} ×{' '}
                          {Math.floor(previewImage.naturalHeight / manualRows)} px
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Frames</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {useVariableFrames && variableFrameResult 
                            ? variableFrameResult.frames.length 
                            : manualRows * manualCols}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Quick Presets</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { rows: 1, cols: 4, label: '1×4' },
                          { rows: 2, cols: 4, label: '2×4' },
                          { rows: 4, cols: 4, label: '4×4' },
                          { rows: 8, cols: 8, label: '8×8' },
                          { rows: 1, cols: 8, label: '1×8' },
                          { rows: 2, cols: 3, label: '2×3' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setManualRows(preset.rows);
                              setManualCols(preset.cols);
                            }}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              {step !== 'select' && (
                <button
                  onClick={() => setStep(step === 'manual' ? 'detect' : 'select')}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {step === 'detect' && (
                <button
                  onClick={() => setStep('manual')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Use Manual
                </button>
              )}

              {step === 'detect' && (
                <button
                  onClick={handleUseDetected}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  Load
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 'manual' && (
                <button
                  onClick={handleUseManual}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  Load
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    </>
  );
}
