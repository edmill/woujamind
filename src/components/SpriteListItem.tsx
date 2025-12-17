/**
 * Sprite List Item Component
 * Horizontal list view for sprite sheets
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, Download, FileImage, Film, Calendar, Grid as GridIcon } from 'lucide-react';
import { StoredSpriteSheet } from '../utils/spriteStorage';
import { cn } from '../utils';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { downloadSpriteSheetPNG, downloadSpriteSheetGIF, downloadSpriteSheetWebM, getCleanFilename } from '../utils/downloadUtils';
import { toast } from 'sonner';

interface SpriteListItemProps {
  sprite: StoredSpriteSheet;
  onOpen: (sprite: StoredSpriteSheet) => void;
  onDelete: (id: string) => void;
}

export function SpriteListItem({ sprite, onOpen, onDelete }: SpriteListItemProps) {
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
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer shadow-md hover:shadow-xl",
          isHovered
            ? "border-orange-500 dark:border-orange-400 bg-orange-50/50 dark:bg-orange-950/20"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50",
          (isDeleting || isDownloading) && "opacity-50 pointer-events-none"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !isDeleting && !isDownloading && onOpen(sprite)}
      >
        {/* Thumbnail */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
          <img
            src={sprite.imageData}
            alt={sprite.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <Play className="w-12 h-12 text-white opacity-80" />
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {formatDate(sprite.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <GridIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {sprite.gridRows}x{sprite.gridCols} • {sprite.fps} FPS
                </p>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-500 truncate">
                <span className="font-medium text-slate-700 dark:text-slate-300">{sprite.selectedAction}</span>
                {' • '}
                {sprite.artStyle}
              </p>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 flex-shrink-0"
            >
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
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting || isDownloading}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg"
                title="Delete sprite sheet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Loading Indicator */}
        {(isDeleting || isDownloading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl gap-2">
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
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
