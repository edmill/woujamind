/**
 * Video Processing Utilities
 * Browser-native video frame extraction using HTML5 Video + Canvas APIs
 */

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export interface FrameExtractionOptions {
  frameCount: number;
  onProgress?: (current: number, total: number) => void;
  onFrameExtracted?: (frameIndex: number, canvas: HTMLCanvasElement) => void;
}

/**
 * Load a video element from a Blob URL
 * Returns the video element and its metadata
 */
export const loadVideoElement = (videoBlob: Blob): Promise<{ video: HTMLVideoElement; metadata: VideoMetadata }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    const url = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30 // Seedance outputs at 30 FPS
      };

      resolve({ video, metadata });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };

    video.src = url;
  });
};

/**
 * Calculate which frame times to sample for even distribution
 * For example: 8 frames from a 5-second video at 30 FPS (150 total frames)
 * Returns timestamps in seconds
 */
export const calculateFrameSampling = (
  videoDuration: number,
  totalFrameCount: number,
  desiredFrameCount: number
): number[] => {
  const timestamps: number[] = [];

  // If we want fewer frames than available, sample evenly
  if (desiredFrameCount >= totalFrameCount) {
    // Extract all frames
    const fps = totalFrameCount / videoDuration;
    for (let i = 0; i < totalFrameCount; i++) {
      timestamps.push(i / fps);
    }
  } else {
    // Sample evenly across the video duration
    // Add a small offset to avoid the very first and last frame (can be black)
    const startOffset = videoDuration * 0.05; // Skip first 5%
    const endOffset = videoDuration * 0.95;   // Skip last 5%
    const usableDuration = endOffset - startOffset;

    for (let i = 0; i < desiredFrameCount; i++) {
      const progress = i / (desiredFrameCount - 1);
      const timestamp = startOffset + (usableDuration * progress);
      timestamps.push(timestamp);
    }
  }

  return timestamps;
};

/**
 * Extract a single frame from video at a specific time
 * Returns a canvas with the frame rendered
 */
export const extractFrameAtTime = (
  video: HTMLVideoElement,
  timestamp: number,
  width: number,
  height: number
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    // Create canvas for this frame
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false, alpha: true });

    if (!ctx) {
      reject(new Error('Failed to create canvas context'));
      return;
    }

    // Set up seeked event listener
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);

      try {
        // Draw the current video frame to canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(video, 0, 0, width, height);
        resolve(canvas);
      } catch (error) {
        reject(new Error(`Failed to draw frame: ${error}`));
      }
    };

    const onError = () => {
      video.removeEventListener('error', onError);
      video.removeEventListener('seeked', onSeeked);
      reject(new Error('Video seek error'));
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Seek to the desired timestamp
    video.currentTime = timestamp;
  });
};

/**
 * Extract multiple frames from a video
 * Returns array of canvases, one per frame
 */
export const extractFrames = async (
  videoBlob: Blob,
  options: FrameExtractionOptions
): Promise<HTMLCanvasElement[]> => {
  const { frameCount, onProgress, onFrameExtracted } = options;

  // Load video and get metadata
  const { video, metadata } = await loadVideoElement(videoBlob);

  try {
    // Calculate total frames in video (assuming 30 FPS from Seedance)
    const totalFrames = Math.floor(metadata.duration * metadata.fps);

    // Calculate which timestamps to sample
    const timestamps = calculateFrameSampling(metadata.duration, totalFrames, frameCount);

    // Extract frames
    const frames: HTMLCanvasElement[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      onProgress?.(i + 1, timestamps.length);

      const canvas = await extractFrameAtTime(
        video,
        timestamps[i],
        metadata.width,
        metadata.height
      );

      frames.push(canvas);
      onFrameExtracted?.(i, canvas);
    }

    return frames;
  } finally {
    // Clean up: revoke object URL and remove video element
    URL.revokeObjectURL(video.src);
    video.remove();
  }
};

/**
 * Clean up video resources
 */
export const cleanupVideo = (video: HTMLVideoElement) => {
  if (video.src && video.src.startsWith('blob:')) {
    URL.revokeObjectURL(video.src);
  }
  video.remove();
};
