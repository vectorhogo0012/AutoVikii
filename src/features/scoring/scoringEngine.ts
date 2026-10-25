import {
  ChecklistCategory,
  InspectionGrade,
  InspectionItem,
  ItemStatus,
  ScoreResult,
  CategoryScoreSummary,
} from '../../types/inspection';
import { CATEGORY_DEFINITIONS } from '../checklist/checklistTemplates';

export const CATEGORY_MAX_WEIGHTS: Record<ChecklistCategory, number> = {
  body_paint: 30,
  engine_mechanics: 35,
  interior: 20,
  tires: 15,
};

export const STATUS_MULTIPLIERS: Record<ItemStatus, number> = {
  healthy: 1.0,
  needs_review: 0.6,
  defective: 0.0,
  uninspected: 0.0,
};

/**
 * Map numerical score (0-100) to standard inspection grade
 */
export function determineGrade(score: number, isProvisional: boolean, coverage: number): InspectionGrade {
  if (coverage === 0) return 'N/A';
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

/**
 * Pure, transparent scoring engine for vehicle inspections.
 * 
 * Rules:
 * - Category weights: Body 30%, Engine 35%, Interior 20%, Tires 15%.
 * - Status multipliers: Healthy 1.0, Needs Review 0.6, Defective 0.0.
 * - Uninspected items are excluded from the current earned denominator.
 * - Current Score = 100 * (earned points / inspected weight).
 * - Safe zero handling: When zero items are inspected, score is 0 (never 100).
 * - Provisional flag: True whenever weighted coverage is less than 100%.
 */
export function calculateInspectionScore(items: InspectionItem[]): ScoreResult {
  if (!items || items.length === 0) {
    return createEmptyScoreResult();
  }

  const categoryKeys: ChecklistCategory[] = ['body_paint', 'engine_mechanics', 'interior', 'tires'];

  const categoryBreakdown: Record<ChecklistCategory, CategoryScoreSummary> = {
    body_paint: createEmptyCategorySummary('body_paint'),
    engine_mechanics: createEmptyCategorySummary('engine_mechanics'),
    interior: createEmptyCategorySummary('interior'),
    tires: createEmptyCategorySummary('tires'),
  };

  let totalWeight = 0;
  let inspectedWeight = 0;
  let earnedPoints = 0;

  let totalItems = items.length;
  let inspectedItemsCount = 0;
  let uninspectedItemsCount = 0;
  let healthyItemsCount = 0;
  let needsReviewItemsCount = 0;
  let defectiveItemsCount = 0;

  const defectiveItems: { item: InspectionItem; categoryTitle: string }[] = [];
  const needsReviewItems: { item: InspectionItem; categoryTitle: string }[] = [];

  for (const item of items) {
    const itemWeight = typeof item.weight === 'number' && item.weight > 0 ? item.weight : 0;
    const catSummary = categoryBreakdown[item.category];

    totalWeight += itemWeight;
    if (catSummary) {
      catSummary.totalCount += 1;
    }

    if (item.status === 'uninspected') {
      uninspectedItemsCount += 1;
      continue;
    }

    // Item is inspected
    inspectedItemsCount += 1;
    inspectedWeight += itemWeight;

    const multiplier = STATUS_MULTIPLIERS[item.status] ?? 0;
    const itemEarned = itemWeight * multiplier;
    earnedPoints += itemEarned;

    if (catSummary) {
      catSummary.inspectedCount += 1;
      catSummary.inspectedWeight += itemWeight;
      catSummary.earnedPoints += itemEarned;
    }

    if (item.status === 'healthy') {
      healthyItemsCount += 1;
    } else if (item.status === 'needs_review') {
      needsReviewItemsCount += 1;
      needsReviewItems.push({
        item,
        categoryTitle: CATEGORY_DEFINITIONS[item.category]?.title || item.category,
      });
    } else if (item.status === 'defective') {
      defectiveItemsCount += 1;
      defectiveItems.push({
        item,
        categoryTitle: CATEGORY_DEFINITIONS[item.category]?.title || item.category,
      });
    }
  }

  // Calculate percentage coverage based on actual weights
  // Total assigned weight is 100
  const coveragePercent = totalWeight > 0 
    ? Math.min(100, Math.round((inspectedWeight / totalWeight) * 100))
    : 0;

  const isProvisional = coveragePercent < 100;

  // Safe score calculation:
  // If no items have been inspected yet, score is strictly 0 (never 100 for an uninspected vehicle)
  let currentScore = 0;
  if (inspectedWeight > 0) {
    const rawScore = (earnedPoints / inspectedWeight) * 100;
    currentScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10)); // 1 decimal precision
  }

  // Finalize each category breakdown percentages
  for (const catKey of categoryKeys) {
    const summary = categoryBreakdown[catKey];
    if (summary.inspectedWeight > 0) {
      summary.scorePercentage = Math.round((summary.earnedPoints / summary.inspectedWeight) * 100);
    } else {
      summary.scorePercentage = 0;
    }
    summary.coveragePercentage = summary.totalCount > 0
      ? Math.round((summary.inspectedCount / summary.totalCount) * 100)
      : 0;
  }

  const grade = determineGrade(currentScore, isProvisional, coveragePercent);

  return {
    currentScore,
    isProvisional,
    coveragePercent,
    totalItems,
    inspectedItemsCount,
    uninspectedItemsCount,
    healthyItemsCount,
    needsReviewItemsCount,
    defectiveItemsCount,
    totalWeight: Math.round(totalWeight),
    inspectedWeight: Math.round(inspectedWeight * 10) / 10,
    earnedPoints: Math.round(earnedPoints * 10) / 10,
    grade,
    defectiveItems,
    needsReviewItems,
    categoryBreakdown,
  };
}

function createEmptyCategorySummary(category: ChecklistCategory): CategoryScoreSummary {
  return {
    category,
    title: CATEGORY_DEFINITIONS[category]?.title || category,
    maxWeight: CATEGORY_MAX_WEIGHTS[category] || 0,
    earnedPoints: 0,
    inspectedWeight: 0,
    scorePercentage: 0,
    inspectedCount: 0,
    totalCount: 0,
    coveragePercentage: 0,
  };
}

function createEmptyScoreResult(): ScoreResult {
  return {
    currentScore: 0,
    isProvisional: true,
    coveragePercent: 0,
    totalItems: 0,
    inspectedItemsCount: 0,
    uninspectedItemsCount: 0,
    healthyItemsCount: 0,
    needsReviewItemsCount: 0,
    defectiveItemsCount: 0,
    totalWeight: 100,
    inspectedWeight: 0,
    earnedPoints: 0,
    grade: 'N/A',
    defectiveItems: [],
    needsReviewItems: [],
    categoryBreakdown: {
      body_paint: createEmptyCategorySummary('body_paint'),
      engine_mechanics: createEmptyCategorySummary('engine_mechanics'),
      interior: createEmptyCategorySummary('interior'),
      tires: createEmptyCategorySummary('tires'),
    },
  };
}
