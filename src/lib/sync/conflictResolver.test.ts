import test from 'node:test';
import assert from 'node:assert';
import {
  detectItemConflicts,
  mergeInspectionRecords,
  resolveInspectionConflict,
} from './conflictResolver';
import { InspectionRecord, ConflictRecordInfo } from '../../types/inspection';
import { createDefaultInspectionItems } from '../../features/checklist/checklistTemplates';

function createMockRecord(id: string, revision = 1): InspectionRecord {
  return {
    id,
    workspaceId: 'ws_dealer_tehran',
    trackingCode: 'IR-2026-TEST',
    vehicle: {
      make: 'تارا',
      model: 'V4',
      year: 1403,
      color: 'سفید',
      plate: { prefix: '11', letter: 'س', suffix: '222', provinceCode: '21' },
      mileage: 10000,
      inspectionDate: '1403/02/01',
    },
    items: createDefaultInspectionItems(),
    status: 'in_progress',
    inspectorName: 'مهندس کمالی',
    revision,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
  };
}

test('detectItemConflicts finds items edited with different statuses on both devices', () => {
  const local = createMockRecord('insp_1', 2);
  const cloud = createMockRecord('insp_1', 2);

  // Device 1 marked hood as healthy
  local.items[0].status = 'healthy';
  local.items[0].note = 'سالم و بدون موج';

  // Device 2 marked hood as defective
  cloud.items[0].status = 'defective';
  cloud.items[0].note = 'رنگ‌شدگی گلگیر و کاپوت';

  const conflicts = detectItemConflicts(local, cloud);
  assert.strictEqual(conflicts.length, 1);
  assert.strictEqual(conflicts[0].itemId, local.items[0].id);
  assert.strictEqual(conflicts[0].localStatus, 'healthy');
  assert.strictEqual(conflicts[0].cloudStatus, 'defective');
});

test('mergeInspectionRecords cleanly auto-merges independent edits on different items', () => {
  const local = createMockRecord('insp_2', 1);
  const cloud = createMockRecord('insp_2', 1);

  // Device 1 inspected item 0 (hood)
  local.items[0].status = 'healthy';
  local.items[0].note = 'کاپوت فابریک';

  // Device 2 inspected item 1 (roof)
  cloud.items[1].status = 'needs_review';
  cloud.items[1].note = 'مات‌شدگی جزئی کیلر سقف';

  const result = mergeInspectionRecords(local, cloud);
  assert.strictEqual(result.hasConflicts, false);
  assert.strictEqual(result.conflicts.length, 0);

  // Both items should be merged into result
  assert.strictEqual(result.mergedRecord.items[0].status, 'healthy');
  assert.strictEqual(result.mergedRecord.items[1].status, 'needs_review');
  assert.strictEqual(result.mergedRecord.revision, 2);
});

test('resolveInspectionConflict allows keep_local, accept_cloud, or custom selection', () => {
  const local = createMockRecord('insp_3', 3);
  const cloud = createMockRecord('insp_3', 3);

  local.items[0].status = 'healthy';
  cloud.items[0].status = 'defective';

  const conflictInfo: ConflictRecordInfo = {
    inspectionId: 'insp_3',
    localRecord: local,
    cloudRecord: cloud,
    conflictedItems: detectItemConflicts(local, cloud),
  };

  // 1. Keep Local
  const keptLocal = resolveInspectionConflict(conflictInfo, 'keep_local');
  assert.strictEqual(keptLocal.items[0].status, 'healthy');
  assert.strictEqual(keptLocal.revision, 4);

  // 2. Accept Cloud
  const acceptedCloud = resolveInspectionConflict(conflictInfo, 'accept_cloud');
  assert.strictEqual(acceptedCloud.items[0].status, 'defective');
  assert.strictEqual(acceptedCloud.revision, 4);

  // 3. Custom Item Resolution
  const custom = resolveInspectionConflict(conflictInfo, 'custom_items', {
    [local.items[0].id]: 'cloud',
  });
  assert.strictEqual(custom.items[0].status, 'defective');
});
