/**
 * File Library View Component
 * Displays saved sprite sheets grouped by date
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoredSpriteSheet } from '../utils/spriteStorage';
import { SpriteCardPreview } from './SpriteCardPreview';
import { SpriteListItem } from './SpriteListItem';

export type ViewMode = 'grid' | 'list';

interface FileLibraryViewProps {
  sprites: {
    today: StoredSpriteSheet[];
    yesterday: StoredSpriteSheet[];
    thisWeek: StoredSpriteSheet[];
    thisMonth: StoredSpriteSheet[];
    older: StoredSpriteSheet[];
  };
  onOpenSprite: (sprite: StoredSpriteSheet) => void;
  onDeleteSprite: (id: string) => void;
  viewMode?: ViewMode;
  activeImageData?: string | null;
}

export function FileLibraryView({ sprites, onOpenSprite, onDeleteSprite, viewMode = 'grid', activeImageData }: FileLibraryViewProps) {
  const sections = [
    { title: 'Today', data: sprites.today },
    { title: 'Yesterday', data: sprites.yesterday },
    { title: 'This Week', data: sprites.thisWeek },
    { title: 'This Month', data: sprites.thisMonth },
    { title: 'Older', data: sprites.older },
  ].filter(section => section.data.length > 0);

  if (sections.length === 0) {
    return null; // Should show EmptyStateView instead
  }

  return (
    <motion.div
      key={viewMode}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full overflow-y-auto px-6 py-4 sprite-scroll"
    >
      <div className="space-y-10">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-300 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-2 pl-2 z-10">
              {section.title}
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({section.data.length})
              </span>
            </h3>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                  {section.data.map((sprite, index) => (
                    <motion.div
                      key={sprite.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        delay: index * 0.05,
                        layout: { duration: 0.3 }
                      }}
                    >
                      <SpriteCardPreview
                        sprite={sprite}
                        onOpen={onOpenSprite}
                        onDelete={onDeleteSprite}
                        isActive={activeImageData === sprite.imageData}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {section.data.map((sprite, index) => (
                    <motion.div
                      key={sprite.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        delay: index * 0.05,
                        layout: { duration: 0.3 }
                      }}
                    >
                      <SpriteListItem
                        sprite={sprite}
                        onOpen={onOpenSprite}
                        onDelete={onDeleteSprite}
                        isActive={activeImageData === sprite.imageData}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
