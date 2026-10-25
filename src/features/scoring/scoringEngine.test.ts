import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInspectionScore, STATUS_MULTIPLIERS } from './scoringEngine';
import { createDefaultInspectionItems } from '../checklist/checklistTemplates';
import { InspectionItem } from '../../types/inspection';

test('Status multipliers match specification exactly', () => {
  assert.equal(STATUS_MULTIPLIERS.healthy, 1.0);
  assert.equal(STATUS_MULTIPLIERS.needs_review, 0.6);
  assert.equal(STATUS_MULTIPLIERS.defective, 0.0);
  assert.equal(STATUS_MULTIPLIERS.uninspected, 0.0);
});

test('Default template starts every single item as uninspected', () => {
  const items = createDefaultInspectionItems();
  assert.ok(items.length > 20);
  for (const item of items) {
    assert.equal(item.status, 'uninspected', `Item ${item.id} must start uninspected`);
  }
});

test('Zero inspected items safely returns score 0, never 100, and marked provisional', () => {
  const items = createDefaultInspectionItems();
  const result = calculateInspectionScore(items);

  assert.equal(result.currentScore, 0, 'Score must be 0 for an uninspected vehicle');
  assert.equal(result.coveragePercent, 0, 'Coverage must be 0%');
  assert.equal(result.isProvisional, true, 'Score must be flagged as provisional');
  assert.equal(result.inspectedItemsCount, 0);
  assert.equal(result.uninspectedItemsCount, items.length);
  assert.equal(result.grade, 'N/A');
});

test('Empty items array handled safely without division by zero', () => {
  const result = calculateInspectionScore([]);
  assert.equal(result.currentScore, 0);
  assert.equal(result.coveragePercent, 0);
  assert.equal(result.isProvisional, true);
});

test('All healthy items yields score of 100 and complete coverage', () => {
  const items = createDefaultInspectionItems().map(item => ({
    ...item,
    status: 'healthy' as const,
  }));

  const result = calculateInspectionScore(items);
  assert.equal(result.currentScore, 100);
  assert.equal(result.coveragePercent, 100);
  assert.equal(result.isProvisional, false);
  assert.equal(result.grade, 'A+');
  assert.equal(result.defectiveItems.length, 0);
  assert.equal(result.needsReviewItems.length, 0);
});

test('Provisional score calculated accurately for partial inspection', () => {
  const items: InspectionItem[] = [
    {
      id: 'item1',
      category: 'body_paint',
      label: 'کاپوت',
      status: 'healthy',
      note: '',
      weight: 10,
    },
    {
      id: 'item2',
      category: 'engine_mechanics',
      label: 'موتور',
      status: 'needs_review',
      note: 'نشتی جزئی',
      weight: 10,
    },
    {
      id: 'item3',
      category: 'interior',
      label: 'صندلی',
      status: 'uninspected',
      note: '',
      weight: 20,
    },
  ];

  // Inspected items: item1 (10 * 1.0 = 10) + item2 (10 * 0.6 = 6) = 16 earned out of 20 inspected weight
  // Score = (16 / 20) * 100 = 80
  // Total weight = 40, inspected weight = 20 -> coverage = 50%
  const result = calculateInspectionScore(items);

  assert.equal(result.currentScore, 80);
  assert.equal(result.coveragePercent, 50);
  assert.equal(result.isProvisional, true);
  assert.equal(result.inspectedItemsCount, 2);
  assert.equal(result.uninspectedItemsCount, 1);
  assert.equal(result.needsReviewItems.length, 1);
  assert.equal(result.needsReviewItems[0].item.id, 'item2');
});

test('Defective items award 0.0 points and are extracted into defective list', () => {
  const items: InspectionItem[] = [
    {
      id: 'bp_hood',
      category: 'body_paint',
      label: 'کاپوت',
      status: 'defective',
      note: 'تعویض با قطعه غیرفابریک و بتونه‌کاری سنگین',
      weight: 20,
    },
    {
      id: 'em_engine',
      category: 'engine_mechanics',
      label: 'موتور',
      status: 'healthy',
      note: '',
      weight: 20,
    },
  ];

  // item1: 20 * 0 = 0
  // item2: 20 * 1 = 20
  // Total inspected: 40
  // Score = 20 / 40 * 100 = 50
  const result = calculateInspectionScore(items);

  assert.equal(result.currentScore, 50);
  assert.equal(result.defectiveItemsCount, 1);
  assert.equal(result.defectiveItems.length, 1);
  assert.equal(result.defectiveItems[0].item.note, 'تعویض با قطعه غیرفابریک و بتونه‌کاری سنگین');
});
