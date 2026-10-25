import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import { PhotoEvidence } from '../../types/inspection';
import { Button } from '../../components/ui/Button';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { formatByteSize } from '../../lib/media/imageCompression';

export interface PhotoEvidenceManagerProps {
  itemId: string;
  itemLabel: string;
  photos: PhotoEvidence[];
  onAddPhoto: (itemId: string, file: File) => Promise<PhotoEvidence | void>;
  onRemovePhoto: (photoId: string, itemId: string) => Promise<void>;
  isDefectiveOrNeedsReview?: boolean;
}

export const PhotoEvidenceManager: React.FC<PhotoEvidenceManagerProps> = ({
  itemId,
  itemLabel,
  photos,
  onAddPhoto,
  onRemovePhoto,
  isDefectiveOrNeedsReview = false,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<PhotoEvidence | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await onAddPhoto(itemId, file);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'خطا در ثبت و فشرده‌سازی تصویر');
    } finally {
      setIsProcessing(false);
      // Reset input value so user can upload the same file again if desired
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="pt-2 text-right space-y-2">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilesSelected}
        className="hidden"
        aria-label="عکس با دوربین"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        aria-label="انتخاب از گالری"
      />

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>مستندات تصویری ({photos.length} تصویر)</span>
          {isDefectiveOrNeedsReview && photos.length === 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
              (ثبت تصویر نقص توصیه می‌شود)
            </span>
          )}
        </div>

        {/* Upload Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            leftIcon={<Camera className="w-3.5 h-3.5" />}
            disabled={isProcessing}
            className="text-xs h-8 px-2.5"
          >
            دوربین
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => galleryInputRef.current?.click()}
            leftIcon={<ImagePlus className="w-3.5 h-3.5" />}
            disabled={isProcessing}
            className="text-xs h-8 px-2.5"
          >
            گالری
          </Button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isProcessing && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>در حال پردازش و فشرده‌سازی تصویر در حافظه محلی...</span>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Photos Thumbnail Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-emerald-900/60 bg-slate-100 dark:bg-[#0c1611] shadow-xs hover:border-emerald-500 transition-all cursor-pointer"
              onClick={() => setSelectedPhotoForPreview(photo)}
            >
              <img
                src={photo.thumbnailDataUrl}
                alt={`${itemLabel} تصویر ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Size Tag Overlay */}
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] text-white font-latin-num">
                {formatByteSize(photo.fileSize)}
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedPhotoForPreview(photo);
                  }}
                  aria-label="بزرگ‌نمایی تصویر"
                  className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onRemovePhoto(photo.id, itemId);
                  }}
                  aria-label="حذف این تصویر"
                  className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <PhotoLightboxModal
        isOpen={selectedPhotoForPreview !== null}
        photo={selectedPhotoForPreview}
        itemLabel={itemLabel}
        onClose={() => setSelectedPhotoForPreview(null)}
        onDelete={photoId => onRemovePhoto(photoId, itemId)}
      />
    </div>
  );
};
