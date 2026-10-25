import React from 'react';
import { X, Calendar, HardDrive, Trash2 } from 'lucide-react';
import { PhotoEvidence } from '../../types/inspection';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatByteSize } from '../../lib/media/imageCompression';

export interface PhotoLightboxModalProps {
  photo: PhotoEvidence | null;
  itemLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photo,
  itemLabel,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!isOpen || !photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#0f1a14] border border-slate-200 dark:border-emerald-900/50 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-right flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 id="photo-preview-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                مستند تصویری نقص
              </h3>
              {itemLabel && (
                <Badge variant="warning" size="sm">
                  {itemLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
              {photo.filename}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(photo.id);
                  onClose();
                }}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                حذف تصویر
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن پیش‌نمایش"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-slate-950/90 flex items-center justify-center min-h-[300px]">
          <img
            src={photo.thumbnailDataUrl}
            alt={`مستند تصویری ${itemLabel || photo.filename}`}
            className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
          />
        </div>

        {/* Footer Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50 dark:bg-[#0c1611] border-t border-slate-100 dark:border-emerald-950/60 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              حجم ذخیره: <span className="font-latin-num font-semibold">{formatByteSize(photo.fileSize)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              تاریخ ثبت: <span className="font-latin-num">{photo.createdAt.slice(0, 10)}</span>
            </span>
          </div>

          <Badge variant="neutral" size="sm">
            ذخیره محلی پایدار (IndexedDB)
          </Badge>
        </div>
      </div>
    </div>
  );
};
