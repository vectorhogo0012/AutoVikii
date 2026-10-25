import test from 'node:test';
import assert from 'node:assert';
import { indexedDbStorage } from './indexedDb';
import { InspectionRecord, PhotoEvidence } from '../../types/inspection';
import { createDefaultInspectionItems } from '../../features/checklist/checklistTemplates';

test('IndexedDbService saves, retrieves, and clears inspections in fallback memory mode', async () => {
  await indexedDbStorage.clearAll();

  const record: InspectionRecord = {
    id: 'test_insp_1',
    trackingCode: 'IR-2026-TEST',
    vehicle: {
      make: 'پژو',
      model: '207i اتوماتیک',
      year: 1402,
      color: 'سفید',
      plate: { prefix: '12', letter: 'ب', suffix: '345', provinceCode: '77' },
      mileage: 18500,
      inspectionDate: '1403/01/15',
    },
    items: createDefaultInspectionItems(),
    status: 'in_progress',
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inspectorName: 'مهندس کمالی',
  };

  await indexedDbStorage.saveInspection(record);

  const retrieved = await indexedDbStorage.getInspection('test_insp_1');
  assert.ok(retrieved !== null);
  assert.strictEqual(retrieved?.id, 'test_insp_1');
  assert.strictEqual(retrieved?.vehicle.model, '207i اتوماتیک');

  const all = await indexedDbStorage.getAllInspections();
  assert.strictEqual(all.length, 1);
});

test('IndexedDbService saves and deletes photos with cascade', async () => {
  await indexedDbStorage.clearAll();

  const record: InspectionRecord = {
    id: 'test_insp_2',
    trackingCode: 'IR-2026-TEST2',
    vehicle: {
      make: 'تارا',
      model: 'V4 اتوماتیک',
      year: 1403,
      color: 'مشکی آبنوس',
      plate: { prefix: '33', letter: 'د', suffix: '890', provinceCode: '11' },
      mileage: 5000,
      inspectionDate: '1403/02/01',
    },
    items: createDefaultInspectionItems(),
    status: 'in_progress',
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inspectorName: 'مهندس کمالی',
  };

  await indexedDbStorage.saveInspection(record);

  const photo: PhotoEvidence = {
    id: 'photo_test_1',
    inspectionId: 'test_insp_2',
    itemId: 'bp_hood',
    filename: 'hood_dent.jpg',
    fileSize: 45000,
    mimeType: 'image/jpeg',
    thumbnailDataUrl: 'data:image/jpeg;base64,mock',
    createdAt: new Date().toISOString(),
    syncStatus: 'synced',
  };

  const mockBlob = new Blob(['mock-binary-data'], { type: 'image/jpeg' });
  await indexedDbStorage.savePhoto(photo, mockBlob);

  const photosBefore = await indexedDbStorage.getPhotosForInspection('test_insp_2');
  assert.strictEqual(photosBefore.length, 1);
  assert.strictEqual(photosBefore[0].id, 'photo_test_1');

  // Cascade delete when inspection is deleted
  await indexedDbStorage.deleteInspection('test_insp_2');
  const photosAfter = await indexedDbStorage.getPhotosForInspection('test_insp_2');
  assert.strictEqual(photosAfter.length, 0);

  const remainingInsp = await indexedDbStorage.getAllInspections();
  assert.strictEqual(remainingInsp.length, 0);
});
