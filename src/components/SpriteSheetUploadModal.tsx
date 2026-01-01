/**
 * Sprite Sheet Upload Modal
 * Allows users to upload existing sprite sheets with smart grid detection
 */

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Upload, LayoutGrid, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { smartDetectGrid, validateSpriteSheetFile, GridDetectionResult } from '../utils/gridDetection';
import { toast } from 'sonner';

interface SpriteSheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, rows: number, cols: number) => void;
}

type UploadStep = 'select' | 'detect' | 'manual';

export default function SpriteSheetUploadModal({ isOpen, onClose, onUpload }: SpriteSheetUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const [detectionResult, setDetectionResult] = useState<GridDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualRows, setManualRows] = useState(2);
  const [manualCols, setManualCols] = useState(4);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewImage(null);
      setDetectionResult(null);
      setIsDetecting(false);
      setManualRows(2);
      setManualCols(4);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Draw grid overlay on canvas
  useEffect(() => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Always use manualRows/manualCols since they're editable in both steps
    const rows = manualRows;
    const cols = manualCols;

    canvas.width = previewImage.naturalWidth;
    canvas.height = previewImage.naturalHeight;

    // Draw image
    ctx.drawImage(previewImage, 0, 0);

    // Draw grid overlay
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
  }, [previewImage, detectionResult, step, manualRows, manualCols]);

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

      // Run grid detection
      setIsDetecting(true);
      try {
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
    onUpload(selectedFile, manualRows, manualCols);
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

    onUpload(selectedFile, manualRows, manualCols);
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
          <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                  <div className="lg:col-span-2">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto border border-slate-200 dark:border-slate-800 rounded-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />
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
                          {Math.floor(previewImage.naturalWidth / manualCols)} ×{' '}
                          {Math.floor(previewImage.naturalHeight / manualRows)} px
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Frames</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {manualRows * manualCols}
                        </p>
                      </div>
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
                  <div className="lg:col-span-2">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto border border-slate-200 dark:border-slate-800 rounded-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />
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
                          {manualRows * manualCols}
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
  );
}
