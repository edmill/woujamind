/**
 * IndexedDB Storage for Sprite Sheets
 * Local browser storage for sprite sheet persistence
 */

export interface StoredSpriteSheet {
  id: string;                          // UUID
  name: string;                        // Auto: date-timestamp.png
  imageData: string;                   // Base64 data URL
  createdAt: Date;
  updatedAt: Date;

  // Generation metadata
  prompt: string;
  characterDescription?: string;
  selectedAction: string;
  selectedExpression?: string;
  artStyle: string;
  directionCount?: 1 | 4 | 8;         // NEW: Track how many directions were generated

  // Grid configuration
  gridRows: number;
  gridCols: number;

  // Animation settings
  fps: number;
  isTransparent: boolean;
  hasDropShadow?: boolean;

  // AI model info
  modelId: string;

  // History for undo/redo
  history: string[];
  historyIndex: number;

  // Frame selection metadata (for Replicate/video-based generation)
  totalExtractedFrames?: number;      // Total frames extracted from video (e.g., 150)
  selectedFrameIndices?: number[];    // Indices of frames selected for sprite sheet
  frameSelectionMethod?: 'auto' | 'manual'; // How frames were selected
  allExtractedFramesData?: string[];  // Base64 data URLs of all extracted frames (for Frame Gallery)
}

const DB_NAME = 'woujamind_sprites';
const DB_VERSION = 1;
const STORE_NAME = 'sprite_sheets';

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Create indexes
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `sprite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate auto-name with timestamp
 */
function generateName(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${timestamp}.png`;
}

/**
 * Save sprite sheet to IndexedDB
 */
export async function saveSpriteSheet(
  data: Omit<StoredSpriteSheet, 'id' | 'name' | 'createdAt' | 'updatedAt'>
): Promise<StoredSpriteSheet> {
  const db = await initDB();

  const sprite: StoredSpriteSheet = {
    id: generateId(),
    name: generateName(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(sprite);

    request.onsuccess = () => resolve(sprite);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update existing sprite sheet
 */
export async function updateSpriteSheet(
  id: string,
  updates: Partial<Omit<StoredSpriteSheet, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await initDB();

  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Get existing sprite
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error('Sprite not found'));
        return;
      }

      // Merge updates
      const updated: StoredSpriteSheet = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Get single sprite sheet by ID
 */
export async function getSpriteSheet(id: string): Promise<StoredSpriteSheet | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all sprite sheets
 */
export async function getAllSpriteSheets(): Promise<StoredSpriteSheet[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by createdAt descending
      const sprites = (request.result || []) as StoredSpriteSheet[];
      sprites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(sprites);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete sprite sheet
 */
export async function deleteSpriteSheet(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get sprite sheets grouped by date
 */
export async function getSpriteSheetsByDate() {
  const allSprites = await getAllSpriteSheets();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return {
    today: allSprites.filter(s => new Date(s.createdAt) >= today),
    yesterday: allSprites.filter(s => {
      const date = new Date(s.createdAt);
      return date >= yesterday && date < today;
    }),
    thisWeek: allSprites.filter(s => {
      const date = new Date(s.createdAt);
      return date >= weekAgo && date < yesterday;
    }),
    thisMonth: allSprites.filter(s => {
      const date = new Date(s.createdAt);
      return date >= monthAgo && date < weekAgo;
    }),
    older: allSprites.filter(s => new Date(s.createdAt) < monthAgo),
  };
}

/**
 * Clear all sprite sheets (for testing/reset)
 */
export async function clearAllSprites(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  count: number;
  estimatedSize: number;
}> {
  const allSprites = await getAllSpriteSheets();

  // Estimate size based on image data length
  const estimatedSize = allSprites.reduce((total, sprite) => {
    return total + (sprite.imageData?.length || 0) + (sprite.history?.join('').length || 0);
  }, 0);

  return {
    count: allSprites.length,
    estimatedSize: Math.round(estimatedSize / 1024 / 1024 * 100) / 100, // MB
  };
}
