/**
 * Sprite Card Preview Component
 * Individual sprite sheet card with hover effects and actions
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, Download, FileImage, Film } from 'lucide-react';
import { StoredSpriteSheet } from '../utils/spriteStorage';
import { cn } from '../utils';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { downloadSpriteSheetPNG, downloadSpriteSheetGIF, downloadSpriteSheetWebM, getCleanFilename } from '../utils/downloadUtils';
import { toast } from 'sonner';

interface SpriteCardPreviewProps {
  sprite: StoredSpriteSheet;
  onOpen: (sprite: StoredSpriteSheet) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
}

export function SpriteCardPreview({ sprite, onOpen, onDelete, isActive = false }: SpriteCardPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await onDelete(sprite.id);
    } catch (error) {
      console.error('Failed to delete sprite:', error);
      toast.error('Failed to delete sprite sheet');
      setIsDeleting(false);
    }
  };

  const handleDownloadPNG = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const filename = getCleanFilename(sprite.name);
      downloadSpriteSheetPNG(sprite.imageData, filename);
      toast.success('Downloaded sprite sheet as PNG');
    } catch (error) {
      console.error('Failed to download PNG:', error);
      toast.error('Failed to download PNG');
    }
  };

  const handleDownloadGIF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const filename = getCleanFilename(sprite.name);
      await downloadSpriteSheetGIF(
        sprite.imageData,
        filename,
        sprite.gridRows,
        sprite.gridCols,
        sprite.fps
      );
      toast.success('Downloaded animated GIF');
    } catch (error) {
      console.error('Failed to download GIF:', error);
      toast.error('Failed to create GIF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadWebM = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const filename = getCleanFilename(sprite.name);
      await downloadSpriteSheetWebM(
        sprite.imageData,
        filename,
        sprite.gridRows,
        sprite.gridCols,
        sprite.fps
      );
      toast.success('Downloaded WebM video');
    } catch (error) {
      console.error('Failed to download WebM:', error);
      toast.error('Failed to create WebM');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-md hover:shadow-xl",
        isHovered
          ? "border-orange-500 dark:border-orange-400"
          : "border-slate-200 dark:border-slate-700",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      style={isActive ? {
        boxShadow: '0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)'
      } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(sprite)}
    >
      {/* Sprite Sheet Image */}
      <img
        src={sprite.imageData}
        alt={sprite.name}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 flex items-center justify-center"
      >
        <Play className="w-16 h-16 text-white opacity-80" />
      </motion.div>

      {/* Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent pointer-events-none">
        <p className="text-xs text-white truncate font-medium">
          {formatDate(sprite.createdAt)}
        </p>
        <p className="text-[10px] text-slate-300 truncate">
          {sprite.selectedAction} • {sprite.artStyle}
        </p>
      </div>

      {/* Action Buttons (visible on hover) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-2 left-2 right-2 flex justify-between pointer-events-auto"
      >
        {/* Download buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPNG}
            disabled={isDeleting || isDownloading}
            className="p-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg"
            title="Download PNG sprite sheet"
          >
            <FileImage className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadGIF}
            disabled={isDeleting || isDownloading}
            className="p-2 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg"
            title="Download as animated GIF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadWebM}
            disabled={isDeleting || isDownloading}
            className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg"
            title="Download as WebM video"
          >
            <Film className="w-4 h-4" />
          </button>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting || isDownloading}
          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg"
          title="Delete sprite sheet"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Loading Indicator */}
      {(isDeleting || isDownloading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
          />
          {isDownloading && (
            <p className="text-xs text-white font-medium">Creating file...</p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </motion.div>
  );
}
