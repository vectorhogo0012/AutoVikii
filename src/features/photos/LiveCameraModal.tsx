import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Check,
  Loader2,
  SwitchCamera,
  FileImage,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCameraPermission } from '../../lib/media/useCameraPermission';
import { CameraPermissionCard } from './CameraPermissionCard';

export interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob | File) => Promise<void>;
  itemLabel: string;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  itemLabel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const {
    permissionState,
    stream,
    errorMessage,
    facingMode,
    isRequesting,
    requestCamera,
    stopCamera,
    toggleFacingMode,
    resetPermissionState,
  } = useCameraPermission(false);

  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // When modal opens, auto-request camera or prompt
  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null);
      setCapturedPreviewUrl(null);
      setSaveError(null);
      requestCamera('environment');
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, requestCamera, stopCamera]);

  // Bind stream to video element when granted
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {
        // Handled if interrupted
      });
    }
  }, [stream]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  // Capture frame from video onto canvas
  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPreviewUrl(previewUrl);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  // Retake photo: discard snapshot and restart camera
  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
    setSaveError(null);
    requestCamera(facingMode);
  };

  // Confirm and pass captured blob to upload handler
  const handleConfirmSave = async () => {
    if (!capturedBlob) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onCapture(capturedBlob);
      handleClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'خطا در ذخیره‌سازی تصویر');
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
    }
    setCapturedBlob(null);
    setCapturedPreviewUrl(null);
    setIsSaving(false);
    setSaveError(null);
    resetPermissionState();
    onClose();
  };

  // Mobile fallback using native camera capture file input
  const handleFallbackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsSaving(true);
    setSaveError(null);
    try {
      await onCapture(file);
      handleClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'خطا در ثبت تصویر');
      setIsSaving(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const isLiveStreamActive = permissionState === 'granted' && stream !== null && !capturedPreviewUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4"
    >
      {/* Hidden mobile fallback inputs */}
      <input
        ref={fallbackCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFallbackFileChange}
        className="hidden"
        aria-label="عکسبرداری با دوربین سیستم"
      />
      <input
        ref={fallbackGalleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFallbackFileChange}
        className="hidden"
        aria-label="انتخاب از گالری"
      />

      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 z-10">
          <div className="flex items-center gap-2 text-right">
            <Camera className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 id="camera-modal-title" className="text-sm font-bold text-white">
                دوربین زنده کارشناسی خودرو
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                مورد: {itemLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLiveStreamActive && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 text-slate-300 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
                title="تغییر دوربین جلو / پشت"
                aria-label="تغییر دوربین جلو یا پشت"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 text-slate-300 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
              title="بستن"
              aria-label="بستن دوربین"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview / Permission Card Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] sm:min-h-[460px] overflow-hidden p-3 sm:p-4">
          {/* 1. Permission Card when permission is not granted or error */}
          {permissionState !== 'granted' && !capturedPreviewUrl && (
            <div className="w-full flex items-center justify-center">
              <CameraPermissionCard
                permissionState={permissionState}
                errorMessage={errorMessage}
                onRequestPermission={() => requestCamera('environment')}
                onFallbackSystemCamera={() => fallbackCameraInputRef.current?.click()}
                onFallbackGallery={() => fallbackGalleryInputRef.current?.click()}
                itemLabel={itemLabel}
              />
            </div>
          )}

          {/* 2. Loading Spinner while initializing stream */}
          {isRequesting && permissionState === 'requesting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-20 text-white">
              <Loader2 className="w-9 h-9 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">در حال برقراری ارتباط با دوربین...</p>
            </div>
          )}

          {/* 3. Live Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover rounded-2xl ${
              isLiveStreamActive ? 'block' : 'hidden'
            }`}
          />

          {/* 4. Viewfinder Frame Guide Overlay */}
          {isLiveStreamActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
              <div className="w-4/5 h-4/5 border-2 border-emerald-500/40 rounded-3xl relative">
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-4 inset-x-0 text-center">
                  <span className="text-[11px] bg-black/70 text-white/90 px-3.5 py-1.5 rounded-full backdrop-blur-xs font-medium">
                    قطعه یا نقص موردنظر را درون کادر تنظیم کنید
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Frozen Snapshot Review */}
          {capturedPreviewUrl && (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
              <img
                src={capturedPreviewUrl}
                alt="تصویر ثبت شده"
                className="max-w-full max-h-[60vh] object-contain rounded-2xl"
              />
              <div className="absolute top-3 right-3 bg-emerald-600/95 text-white text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <Check className="w-4 h-4" />
                <span>تصویر ثبت شد</span>
              </div>
              {saveError && (
                <div className="absolute bottom-3 inset-x-4 bg-rose-900/90 text-rose-200 text-xs p-2.5 rounded-xl text-center">
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls (Only visible when live stream is active or reviewing snapshot) */}
        {(isLiveStreamActive || capturedPreviewUrl) && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center">
            {capturedPreviewUrl ? (
              /* Review Controls */
              <div className="flex items-center gap-3 w-full max-w-sm">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] text-white border-slate-700 hover:bg-slate-800"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleRetake}
                  disabled={isSaving}
                >
                  ثبت مجدد
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 font-bold"
                  leftIcon={
                    isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                  }
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'در حال ذخیره‌سازی...' : 'تایید و پیوست به پرونده'}
                </Button>
              </div>
            ) : (
              /* Capture Controls */
              <div className="flex items-center justify-between w-full max-w-md px-4">
                {/* Fallback button to system camera */}
                <button
                  type="button"
                  onClick={() => fallbackCameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition text-[11px] cursor-pointer"
                  title="دوربین پیش‌فرض سیستم"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                    <FileImage className="w-5 h-5 text-slate-300" />
                  </div>
                  <span>دوربین سیستمی</span>
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 bg-white/20 hover:bg-white/30 active:scale-95 transition cursor-pointer"
                  aria-label="عکسبرداری"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 transition" />
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition text-[11px] cursor-pointer"
                  aria-label="انصراف"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                    <X className="w-5 h-5 text-slate-300" />
                  </div>
                  <span>انصراف</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
