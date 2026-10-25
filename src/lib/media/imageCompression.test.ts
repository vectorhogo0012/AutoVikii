import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTargetDimensions,
  formatByteSize,
  validateImageFile,
  MAX_ALLOWED_FILE_SIZE,
} from './imageCompression';

test('calculateTargetDimensions preserves dimensions when within bounds', () => {
  const result = calculateTargetDimensions(800, 600, 1600, 1600);
  assert.equal(result.width, 800);
  assert.equal(result.height, 600);
});

test('calculateTargetDimensions scales down landscape images maintaining aspect ratio', () => {
  const result = calculateTargetDimensions(4000, 2000, 1600, 1600);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 800);
});

test('calculateTargetDimensions scales down portrait images maintaining aspect ratio', () => {
  const result = calculateTargetDimensions(2000, 4000, 1600, 1600);
  assert.equal(result.width, 800);
  assert.equal(result.height, 1600);
});

test('calculateTargetDimensions handles square images correctly', () => {
  const result = calculateTargetDimensions(3000, 3000, 1600, 1600);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 1600);
});

test('calculateTargetDimensions handles thumbnail bounds', () => {
  const result = calculateTargetDimensions(1200, 800, 300, 300);
  assert.equal(result.width, 300);
  assert.equal(result.height, 200);
});

test('formatByteSize formats bytes, KB, and MB accurately', () => {
  assert.equal(formatByteSize(0), '0 B');
  assert.equal(formatByteSize(512), '512 B');
  assert.equal(formatByteSize(1024), '1.0 KB');
  assert.equal(formatByteSize(1024 * 1024), '1.0 MB');
  assert.equal(formatByteSize(5.5 * 1024 * 1024), '5.5 MB');
});

test('validateImageFile rejects non-image files', () => {
  const mockPdf = {
    name: 'document.pdf',
    type: 'application/pdf',
    size: 1024,
  } as unknown as File;

  const result = validateImageFile(mockPdf);
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes('فرمت فایل نامعتبر'));
});

test('validateImageFile rejects files over size limit', () => {
  const mockHugeFile = {
    name: 'large_photo.jpg',
    type: 'image/jpeg',
    size: MAX_ALLOWED_FILE_SIZE + 1024,
  } as unknown as File;

  const result = validateImageFile(mockHugeFile);
  assert.equal(result.valid, false);
  assert.ok(result.error?.includes('حجم تصویر بیش از حد مجاز'));
});

test('validateImageFile accepts valid JPEG image file', () => {
  const mockPhoto = {
    name: 'car_door.jpg',
    type: 'image/jpeg',
    size: 2 * 1024 * 1024,
  } as unknown as File;

  const result = validateImageFile(mockPhoto);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});
