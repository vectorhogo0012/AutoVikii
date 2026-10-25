/**
 * Client-side image compression and thumbnail generation for vehicle inspection evidence
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompressedImageResult {
  fullBlob: Blob;
  thumbnailDataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  thumbMaxWidth?: number;
  thumbMaxHeight?: number;
  quality?: number;
  thumbQuality?: number;
}

export const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  thumbMaxWidth: 300,
  thumbMaxHeight: 300,
  quality: 0.82,
  thumbQuality: 0.7,
};

export const MAX_ALLOWED_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Calculates proportionally scaled dimensions constrained within maxWidth & maxHeight
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  if (origWidth <= 0 || origHeight <= 0) {
    return { width: Math.max(1, maxWidth), height: Math.max(1, maxHeight) };
  }

  if (origWidth <= maxWidth && origHeight <= maxHeight) {
    return { width: origWidth, height: origHeight };
  }

  const ratio = Math.min(maxWidth / origWidth, maxHeight / origHeight);
  return {
    width: Math.round(origWidth * ratio),
    height: Math.round(origHeight * ratio),
  };
}

/**
 * Formats byte count into human-readable Persian/English text
 */
export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Validates if the uploaded file is an accepted image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'هیچ فایلی انتخاب نشده است.' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'فرمت فایل نامعتبر است. لطفاً تنها تصویر انتخاب نمایید.' };
  }

  if (file.size > MAX_ALLOWED_FILE_SIZE) {
    return {
      valid: false,
      error: `حجم تصویر بیش از حد مجاز است (${formatByteSize(file.size)}). حداکثر حجم مجاز ۲۵ مگابایت می‌باشد.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image file in-browser using HTMLCanvasElement
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Load image into HTMLImageElement or ImageBitmap
  const imageBitmap = await createImageBitmapOrImage(file);
  const origWidth = imageBitmap.width;
  const origHeight = imageBitmap.height;

  // 1. Generate full-resolution compressed Blob
  const fullDim = calculateTargetDimensions(origWidth, origHeight, opts.maxWidth, opts.maxHeight);
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = fullDim.width;
  fullCanvas.height = fullDim.height;

  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) {
    throw new Error('عدم امکان پردازش گرافیکی تصویر');
  }

  fullCtx.drawImage(imageBitmap as CanvasImageSource, 0, 0, fullDim.width, fullDim.height);

  const fullBlob = await new Promise<Blob>((resolve, reject) => {
    fullCanvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('خطا در فشرده‌سازی تصویر'));
      },
      'image/jpeg',
      opts.quality
    );
  });

  // 2. Generate small thumbnail Data URL
  const thumbDim = calculateTargetDimensions(origWidth, origHeight, opts.thumbMaxWidth, opts.thumbMaxHeight);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbDim.width;
  thumbCanvas.height = thumbDim.height;

  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) {
    throw new Error('عدم امکان ایجاد پیش‌نمایش بندانگشتی');
  }

  thumbCtx.drawImage(imageBitmap as CanvasImageSource, 0, 0, thumbDim.width, thumbDim.height);
  const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', opts.thumbQuality);

  // Clean up if ImageBitmap has close method
  if ('close' in imageBitmap && typeof imageBitmap.close === 'function') {
    imageBitmap.close();
  }

  return {
    fullBlob,
    thumbnailDataUrl,
    originalSize: file.size,
    compressedSize: fullBlob.size,
    width: fullDim.width,
    height: fullDim.height,
    mimeType: 'image/jpeg',
  };
}

async function createImageBitmapOrImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback to Image element
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('خطا در خواندن فایل تصویر'));
    };
    img.src = url;
  });
}
