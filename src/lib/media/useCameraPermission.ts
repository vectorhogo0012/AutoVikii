import { useState, useEffect, useCallback, useRef } from 'react';

export type CameraPermissionState =
  | 'prompt'        // Initial or awaiting user decision
  | 'requesting'    // getUserMedia prompt in flight
  | 'granted'       // Access granted, stream active
  | 'denied'        // Permission blocked/denied
  | 'unavailable'   // No camera hardware found
  | 'unsupported'   // Browser lacks getUserMedia support
  | 'busy';         // Hardware in use by another app

export interface CameraPermissionHookResult {
  permissionState: CameraPermissionState;
  stream: MediaStream | null;
  errorMessage: string | null;
  facingMode: 'environment' | 'user';
  isRequesting: boolean;
  requestCamera: (facing?: 'environment' | 'user') => Promise<MediaStream | null>;
  stopCamera: () => void;
  toggleFacingMode: () => Promise<void>;
  resetPermissionState: () => void;
}

export function useCameraPermission(autoRequest = false): CameraPermissionHookResult {
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('prompt');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);

  // Safely stop all active camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop failure
        }
      });
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Check initial browser permission status if supported
  useEffect(() => {
    let isMounted = true;

    // Check mediaDevices support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unsupported');
      setErrorMessage(
        'مرورگر شما از تصویربرداری زنده وب پشتیبانی نمی‌کند. لطفاً از دوربین سیستمی استفاده فرمایید.'
      );
      return;
    }

    // Try to query Permissions API for camera
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((permissionStatus) => {
          if (!isMounted) return;

          if (permissionStatus.state === 'granted') {
            if (autoRequest) {
              requestCamera('environment');
            } else {
              setPermissionState('prompt');
            }
          } else if (permissionStatus.state === 'denied') {
            setPermissionState('denied');
            setErrorMessage(
              'دسترسی به دوربین توسط مرورگر مسدود شده است. لطفاً در تنظیمات مرورگر به این سایت اجازه دسترسی دهید.'
            );
          } else {
            setPermissionState('prompt');
          }

          // Listen for permission change (e.g. user toggles in site settings)
          permissionStatus.onchange = () => {
            if (!isMounted) return;
            if (permissionStatus.state === 'granted') {
              setPermissionState('granted');
              setErrorMessage(null);
            } else if (permissionStatus.state === 'denied') {
              stopCamera();
              setPermissionState('denied');
              setErrorMessage(
                'دسترسی به دوربین توسط مرورگر مسدود شده است. لطفاً در تنظیمات مرورگر به این سایت اجازه دسترسی دهید.'
              );
            } else {
              setPermissionState('prompt');
            }
          };
        })
        .catch(() => {
          // Permissions.query('camera') not supported in this browser engine (e.g. Safari / Firefox)
          setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [autoRequest, stopCamera]);

  // Request camera access using getUserMedia
  const requestCamera = useCallback(
    async (targetFacing: 'environment' | 'user' = facingMode): Promise<MediaStream | null> => {
      stopCamera();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionState('unsupported');
        setErrorMessage(
          'مرورگر شما از وب‌کم زنده پشتیبانی نمی‌کند. لطفاً از گزینه دوربین سیستمی استفاده کنید.'
        );
        return null;
      }

      setIsRequesting(true);
      setPermissionState('requesting');
      setErrorMessage(null);

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setFacingMode(targetFacing);
        setPermissionState('granted');
        setIsRequesting(false);
        return mediaStream;
      } catch (err: unknown) {
        setIsRequesting(false);
        const error = err as { name?: string; message?: string };
        const errorName = error?.name || '';

        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setPermissionState('denied');
          setErrorMessage(
            'اجازه دسترسی به دوربین صادر نشد. برای استفاده از ویوفایندر زنده، لطفاً دسترسی دوربین را در تنظیمات مرورگر فعال نمایید یا از دوربین پیش‌فرض سیستم استفاده کنید.'
          );
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setPermissionState('unavailable');
          setErrorMessage('سخت‌افزار دوربین روی این دستگاه یافت نشد یا متصل نیست.');
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setPermissionState('busy');
          setErrorMessage('دوربین توسط برنامه دیگری در سیستم در حال استفاده است یا قفل شده است.');
        } else {
          setPermissionState('denied');
          setErrorMessage(`خطا در راه‌اندازی دوربین: ${error?.message || 'نامشخص'}`);
        }

        return null;
      }
    },
    [facingMode, stopCamera]
  );

  // Toggle between rear and front camera
  const toggleFacingMode = useCallback(async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    await requestCamera(nextFacing);
  }, [facingMode, requestCamera]);

  const resetPermissionState = useCallback(() => {
    stopCamera();
    setPermissionState('prompt');
    setErrorMessage(null);
  }, [stopCamera]);

  return {
    permissionState,
    stream,
    errorMessage,
    facingMode,
    isRequesting,
    requestCamera,
    stopCamera,
    toggleFacingMode,
    resetPermissionState,
  };
}
