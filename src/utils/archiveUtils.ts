/**
 * Archive Utilities
 * Functions for exporting sprite sheets as ZIP archives
 */
import JSZip from 'jszip';
import { getAllSpriteSheets } from './spriteStorage';

/**
 * Export all sprite sheets as ZIP with individual PNGs + metadata
 */
export async function exportAllSpritesToZip(): Promise<Blob> {
  const zip = new JSZip();
  const allSprites = await getAllSpriteSheets();

  if (allSprites.length === 0) {
    throw new Error('No sprite sheets to export');
  }

  // Create sprites folder
  const spritesFolder = zip.folder('sprites');

  if (!spritesFolder) {
    throw new Error('Failed to create sprites folder');
  }

  // Add each sprite as PNG
  allSprites.forEach((sprite) => {
    // Extract base64 data from data URL
    const base64Data = sprite.imageData.split(',')[1];
    spritesFolder.file(sprite.name, base64Data, { base64: true });
  });

  // Create metadata.json with all sprite metadata
  const metadata = allSprites.map(s => ({
    name: s.name,
    createdAt: s.createdAt,
    prompt: s.prompt,
    characterDescription: s.characterDescription,
    selectedAction: s.selectedAction,
    selectedExpression: s.selectedExpression,
    artStyle: s.artStyle,
    gridRows: s.gridRows,
    gridCols: s.gridCols,
    fps: s.fps,
    isTransparent: s.isTransparent,
    modelId: s.modelId,
  }));

  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Download ZIP file with timestamp
 */
export async function downloadSpriteArchive(): Promise<void> {
  const blob = await exportAllSpritesToZip();
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `woujamind-sprites-${timestamp}.zip`;

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
