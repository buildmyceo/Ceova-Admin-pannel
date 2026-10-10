/**
 * Universal Client-Side Compression Utility for CEOVA Management OS
 * 
 * Compresses images and media before uploading to Supabase Storage,
 * saving 70% to 90% storage space, speeding up uploads, and reducing database bloat.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (recommended: 0.8)
  mimeType?: 'image/jpeg' | 'image/webp';
  fileName?: string;
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
  mimeType: 'image/jpeg',
  fileName: 'compressed.jpg',
  backgroundColor: '#ffffff'
};

/**
 * Loads an image from a Blob, File, or Data URL.
 */
function loadImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression.'));
    };
  });
}

/**
 * Compresses an image Blob, File, or Data URL using an HTML5 Canvas pipeline.
 * Returns compressed File, Blob, DataUrl, and size savings stats.
 */
export async function compressImage(
  source: File | Blob | string,
  options?: CompressionOptions
): Promise<{
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> {
  const mergedOptions: Required<CompressionOptions> = {
    ...DEFAULT_OPTIONS,
    ...(options || {})
  };

  const originalSize = typeof source === 'string' 
    ? Math.round((source.length * 3) / 4) 
    : source.size;

  const originalName = source instanceof File ? source.name : mergedOptions.fileName;

  try {
    const img = await loadImage(source);

    let { width, height } = img;
    const maxW = mergedOptions.maxWidth;
    const maxH = mergedOptions.maxHeight;

    // Scale dimensions maintaining aspect ratio
    if (width > maxW || height > maxH) {
      const ratio = Math.min(maxW / width, maxH / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Minimum dimensions guard
    width = Math.max(1, width);
    height = Math.max(1, height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // Enable bicubic interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If JPEG, fill background to prevent transparent backgrounds turning black
    if (mergedOptions.mimeType === 'image/jpeg') {
      ctx.fillStyle = mergedOptions.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Export compressed data
    const dataUrl = canvas.toDataURL(mergedOptions.mimeType, mergedOptions.quality);

    // Convert to Blob & File
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob conversion failed'));
        },
        mergedOptions.mimeType,
        mergedOptions.quality
      );
    });

    const compressedSize = blob.size;
    const compressionRatio = originalSize > 0 
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

    // Generate output file name with appropriate extension
    const ext = mergedOptions.mimeType === 'image/webp' ? '.webp' : '.jpg';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const finalFileName = `${baseName}${ext}`;

    const file = new File([blob], finalFileName, {
      type: mergedOptions.mimeType,
      lastModified: Date.now()
    });

    return {
      file,
      blob,
      dataUrl,
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (err) {
    console.warn('Image compression fallback to original:', err);
    // Safe fallback: return original uncompressed if canvas fails
    if (source instanceof File) {
      return {
        file: source,
        blob: source,
        dataUrl: typeof source === 'string' ? source : '',
        originalSize: source.size,
        compressedSize: source.size,
        compressionRatio: 0
      };
    }
    const fallbackBlob = source instanceof Blob ? source : new Blob([]);
    const fallbackFile = new File([fallbackBlob], originalName, { type: fallbackBlob.type || 'image/jpeg' });
    return {
      file: fallbackFile,
      blob: fallbackBlob,
      dataUrl: typeof source === 'string' ? source : '',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0
    };
  }
}

/**
 * Helper: Smart compression for any file being uploaded to Supabase Storage or Task Attachments.
 * - If the file is a compressible image (PNG, JPEG, WebP), downsizes & compresses to WebP/JPEG.
 * - If SVG, GIF animation, PDF, or document, returns the original file.
 * - Always ensures that the resulting file is never larger than the original.
 */
export async function compressFileForUpload(
  file: File,
  customOptions?: CompressionOptions
): Promise<File> {
  const mime = file.type.toLowerCase();

  // Don't compress SVGs or animated GIFs
  if (mime === 'image/svg+xml' || mime === 'image/gif') {
    return file;
  }

  // Only compress raster images
  if (mime.startsWith('image/')) {
    try {
      const res = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        mimeType: 'image/jpeg',
        ...customOptions
      });

      // If compressed is smaller than original, return compressed file
      if (res.file && res.compressedSize < file.size) {
        return res.file;
      }
    } catch (err) {
      console.warn('Compression failed, using original file:', err);
    }
  }

  return file;
}

/**
 * Helper: Compresses a DataURL (e.g. from ImageCropModal or Camera capture)
 * and returns both the compressed Blob and Public-ready File.
 */
export async function compressDataUrlForUpload(
  dataUrl: string,
  options?: CompressionOptions
): Promise<{ file: File; blob: Blob; dataUrl: string }> {
  const result = await compressImage(dataUrl, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.82,
    mimeType: 'image/jpeg',
    ...options
  });

  return {
    file: result.file,
    blob: result.blob,
    dataUrl: result.dataUrl
  };
}
