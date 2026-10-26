import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  HANDOVER_CATEGORIES,
  HANDOVER_TEMPLATE_ITEMS,
  createDefaultHandoverItems,
  calculateHandoverSummary,
} from './handoverTemplates';
import { calculateInspectionScore } from '../scoring/scoringEngine';
import { createDefaultInspectionItems } from './checklistTemplates';

describe('Vehicle Handover Checklist Suite', () => {
  it('should have exactly 5 delivery categories', () => {
    assert.strictEqual(HANDOVER_CATEGORIES.length, 5);
    const categoryIds = HANDOVER_CATEGORIES.map(c => c.id);
    assert.deepStrictEqual(categoryIds, [
      'safety_emergency',
      'accessories_keys',
      'cabin_comfort',
      'exterior_equipment',
      'tire_tools',
    ]);
  });

  it('should have exactly 32 equipment items defined', () => {
    assert.strictEqual(HANDOVER_TEMPLATE_ITEMS.length, 32);
  });

  it('should have unique IDs for all handover items', () => {
    const ids = HANDOVER_TEMPLATE_ITEMS.map(i => i.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 32);
  });

  it('should match category counts according to delivery standard', () => {
    const safetyItems = HANDOVER_TEMPLATE_ITEMS.filter(i => i.categoryId === 'safety_emergency');
    const accessoriesItems = HANDOVER_TEMPLATE_ITEMS.filter(i => i.categoryId === 'accessories_keys');
    const cabinItems = HANDOVER_TEMPLATE_ITEMS.filter(i => i.categoryId === 'cabin_comfort');
    const exteriorItems = HANDOVER_TEMPLATE_ITEMS.filter(i => i.categoryId === 'exterior_equipment');
    const toolItems = HANDOVER_TEMPLATE_ITEMS.filter(i => i.categoryId === 'tire_tools');

    assert.strictEqual(safetyItems.length, 3, 'Safety items count');
    assert.strictEqual(accessoriesItems.length, 10, 'Accessories items count');
    assert.strictEqual(cabinItems.length, 6, 'Cabin items count');
    assert.strictEqual(exteriorItems.length, 10, 'Exterior items count');
    assert.strictEqual(toolItems.length, 3, 'Tire change & tool items count');
  });

  it('should create default handover items all initialized to uninspected status', () => {
    const items = createDefaultHandoverItems();
    assert.strictEqual(items.length, 32);
    items.forEach(item => {
      assert.strictEqual(item.status, 'uninspected');
      assert.strictEqual(item.note, '');
    });
  });

  it('should calculate handover summary correctly', () => {
    const items = createDefaultHandoverItems();
    items[0].status = 'present_healthy';
    items[1].status = 'present_healthy';
    items[2].status = 'missing';
    items[3].status = 'present_defective';

    const summary = calculateHandoverSummary(items);
    assert.strictEqual(summary.total, 32);
    assert.strictEqual(summary.presentHealthy, 2);
    assert.strictEqual(summary.missing, 1);
    assert.strictEqual(summary.presentDefective, 1);
    assert.strictEqual(summary.uninspected, 28);
  });

  it('handover checklist items MUST NOT affect mechanical inspection score', () => {
    const mechanicalItems = createDefaultInspectionItems();
    const baseScore = calculateInspectionScore(mechanicalItems);

    // Mechanical score remains completely identical and separate
    assert.strictEqual(baseScore.currentScore, 0);
    assert.strictEqual(baseScore.inspectedItemsCount, 0);

    // Set one mechanical item to healthy
    mechanicalItems[0].status = 'healthy';
    const scoreWithOneMechanical = calculateInspectionScore(mechanicalItems);
    assert.strictEqual(scoreWithOneMechanical.inspectedItemsCount, 1);
    assert.ok(scoreWithOneMechanical.currentScore > 0);

    // Handover items are isolated in handoverItems on InspectionRecord
    const handoverItems = createDefaultHandoverItems();
    handoverItems[0].status = 'missing';
    handoverItems[1].status = 'present_defective';

    // Verify mechanical score is not modified by handover state
    const scoreRecheck = calculateInspectionScore(mechanicalItems);
    assert.strictEqual(scoreRecheck.currentScore, scoreWithOneMechanical.currentScore);
    assert.strictEqual(scoreRecheck.inspectedItemsCount, scoreWithOneMechanical.inspectedItemsCount);
  });
});
