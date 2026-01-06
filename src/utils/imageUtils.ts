/**
 * Image Utilities - Main Export
 * Re-exports all image processing utilities from focused modules
 *
 * This file maintains backward compatibility while organizing code into smaller, focused files:
 * - imageHelpers.ts: Helper functions for bounding boxes, colors, image loading
 * - frameExtraction.ts: Extract frames from sprite sheets and create GIFs
 * - frameManipulation.ts: Crop, paste, insert, remove, replace frames
 * - spriteAlignment.ts: Clean and align sprite sheets
 */

// Helper functions
export {
  getVisualBoundingBox,
  getBackgroundColor,
  loadImage,
  processRemoveBackground
} from './imageHelpers';

// Frame extraction and GIF creation
export { extractVariableFrames } from './frameExtraction';
export {
  extractFrames,
  createGifBlob
} from './frameExtraction';

// Frame manipulation
export {
  cropFrame,
  pasteFrame,
  insertFrame,
  removeFrame,
  replaceFrameWithImage
} from './frameManipulation';

// Sprite sheet cleaning and alignment
export {
  cleanSpriteSheet,
  alignFrameInSheet,
  alignWholeSheet,
  aiSmartAlignSpriteSheet,
  type SmartAlignmentResult
} from './spriteAlignment';

// Frame centering for smooth animations
export {
  FrameCenteringService,
  centerFrames,
  type FrameCenteringOptions,
  type CharacterBounds
} from './frameCentering';
