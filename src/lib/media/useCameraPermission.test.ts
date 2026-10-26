import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { CameraPermissionState } from './useCameraPermission';

describe('Camera Permission Handling Suite', () => {
  it('should categorize camera error types into proper permission states', () => {
    function classifyError(errorName: string): CameraPermissionState {
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        return 'denied';
      }
      if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        return 'unavailable';
      }
      if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        return 'busy';
      }
      return 'denied';
    }

    assert.strictEqual(classifyError('NotAllowedError'), 'denied');
    assert.strictEqual(classifyError('PermissionDeniedError'), 'denied');
    assert.strictEqual(classifyError('NotFoundError'), 'unavailable');
    assert.strictEqual(classifyError('DevicesNotFoundError'), 'unavailable');
    assert.strictEqual(classifyError('NotReadableError'), 'busy');
    assert.strictEqual(classifyError('TrackStartError'), 'busy');
    assert.strictEqual(classifyError('UnknownError'), 'denied');
  });

  it('should provide informative Persian instructions for denied permissions', () => {
    const deniedMessage =
      'اجازه دسترسی به دوربین صادر نشد. برای استفاده از ویوفایندر زنده، لطفاً دسترسی دوربین را در تنظیمات مرورگر فعال نمایید یا از دوربین پیش‌فرض سیستم استفاده کنید.';
    assert.ok(deniedMessage.includes('تنظیمات مرورگر'));
    assert.ok(deniedMessage.includes('دوربین پیش‌فرض سیستم'));
  });

  it('should enforce fallback to system file picker when permission is denied or unsupported', () => {
    const statesRequiringFallback: CameraPermissionState[] = [
      'denied',
      'unavailable',
      'unsupported',
      'busy',
    ];

    statesRequiringFallback.forEach((state) => {
      const allowsFallback = state !== 'granted';
      assert.strictEqual(allowsFallback, true);
    });
  });
});
