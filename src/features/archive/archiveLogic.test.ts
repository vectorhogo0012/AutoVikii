import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterArchiveRecords,
  sortArchiveRecords,
  paginateRecords,
  ProcessedArchiveRecord,
} from './archiveLogic';
import { InspectionRecord, ScoreResult } from '../../types/inspection';

const mockScore = (score: number, defective: number = 0, needsReview: number = 0): ScoreResult => ({
  currentScore: score,
  totalWeight: 100,
  inspectedWeight: 100,
  earnedPoints: score,
  isProvisional: false,
  coveragePercent: 100,
  inspectedItemsCount: 30,
  uninspectedItemsCount: 0,
  healthyItemsCount: 30 - defective - needsReview,
  needsReviewItemsCount: needsReview,
  defectiveItemsCount: defective,
  totalItems: 30,
  grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 65 ? 'B' : 'C',
  categoryBreakdown: {} as any,
  defectiveItems: [],
  needsReviewItems: [],
});

const createMockRecord = (
  id: string,
  model: string,
  plateSuffix: string,
  createdAt: string,
  status: InspectionRecord['status'],
  score: number,
  defects: number = 0,
  needsReview: number = 0
): ProcessedArchiveRecord => ({
  record: {
    id,
    trackingCode: `IR-${id}`,
    vehicle: {
      make: 'پژو',
      model,
      year: 1401,
      color: 'سفید',
      plate: { prefix: '21', letter: 'ب', suffix: plateSuffix, provinceCode: '11' },
      mileage: 45000,
      inspectionDate: '1403/08/01',
      vin: `IRVIN${id}`,
      clientName: `مشتری ${model}`,
    },
    status,
    items: [],
    inspectorName: 'مهندس رضایی',
    revision: 1,
    createdAt,
    updatedAt: createdAt,
  },
  score: mockScore(score, defects, needsReview),
});

const sampleData: ProcessedArchiveRecord[] = [
  createMockRecord('1', '206 تیپ ۲', '123', '2024-01-01T10:00:00Z', 'completed', 92, 0, 0),
  createMockRecord('2', '207 اتوماتیک', '456', '2024-01-02T10:00:00Z', 'in_progress', 60, 2, 1),
  createMockRecord('3', 'پارس سال', '789', '2024-01-03T10:00:00Z', 'draft', 45, 4, 2),
  createMockRecord('4', 'تارا V2', '321', '2024-01-04T10:00:00Z', 'completed', 85, 0, 1),
];

test('filterArchiveRecords filters by text search query', () => {
  const result = filterArchiveRecords(sampleData, {
    searchQuery: 'تارا',
    statusFilter: 'all',
    scoreFilter: 'all',
    findingsFilter: 'all',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].record.id, '4');
});

test('filterArchiveRecords filters by plate number', () => {
  const result = filterArchiveRecords(sampleData, {
    searchQuery: '456',
    statusFilter: 'all',
    scoreFilter: 'all',
    findingsFilter: 'all',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].record.id, '2');
});

test('filterArchiveRecords filters by inspection status', () => {
  const completed = filterArchiveRecords(sampleData, {
    searchQuery: '',
    statusFilter: 'completed',
    scoreFilter: 'all',
    findingsFilter: 'all',
  });
  assert.equal(completed.length, 2);
});

test('filterArchiveRecords filters by score ranges', () => {
  const highScores = filterArchiveRecords(sampleData, {
    searchQuery: '',
    statusFilter: 'all',
    scoreFilter: 'high',
    findingsFilter: 'all',
  });
  assert.equal(highScores.length, 2); // 92 and 85

  const lowScores = filterArchiveRecords(sampleData, {
    searchQuery: '',
    statusFilter: 'all',
    scoreFilter: 'low',
    findingsFilter: 'all',
  });
  assert.equal(lowScores.length, 1); // 45
  assert.equal(lowScores[0].record.id, '3');
});

test('filterArchiveRecords filters by defect findings', () => {
  const withDefects = filterArchiveRecords(sampleData, {
    searchQuery: '',
    statusFilter: 'all',
    scoreFilter: 'all',
    findingsFilter: 'has_defects',
  });
  assert.equal(withDefects.length, 2); // record 2 (2 defects) & record 3 (4 defects)

  const clean = filterArchiveRecords(sampleData, {
    searchQuery: '',
    statusFilter: 'all',
    scoreFilter: 'all',
    findingsFilter: 'clean',
  });
  assert.equal(clean.length, 2); // record 1 & record 4
});

test('sortArchiveRecords sorts by newest, oldest, highest_score, and lowest_score', () => {
  const newest = sortArchiveRecords(sampleData, 'newest');
  assert.equal(newest[0].record.id, '4'); // 2024-01-04

  const oldest = sortArchiveRecords(sampleData, 'oldest');
  assert.equal(oldest[0].record.id, '1'); // 2024-01-01

  const highestScore = sortArchiveRecords(sampleData, 'highest_score');
  assert.equal(highestScore[0].score.currentScore, 92);

  const lowestScore = sortArchiveRecords(sampleData, 'lowest_score');
  assert.equal(lowestScore[0].score.currentScore, 45);
});

test('paginateRecords slices pages accurately', () => {
  const page1 = paginateRecords(sampleData, 1, 2);
  assert.equal(page1.length, 2);
  assert.equal(page1[0].record.id, '1');
  assert.equal(page1[1].record.id, '2');

  const page2 = paginateRecords(sampleData, 2, 2);
  assert.equal(page2.length, 2);
  assert.equal(page2[0].record.id, '3');
  assert.equal(page2[1].record.id, '4');

  const page3 = paginateRecords(sampleData, 3, 2);
  assert.equal(page3.length, 0);
});
