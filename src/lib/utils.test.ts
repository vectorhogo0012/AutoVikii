import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatEnglishDigits,
  formatVehiclePlate,
  calculateInspectionGrade,
  getRecordStatusDetails,
  getItemStatusDetails,
  cn,
} from './utils';

test('formatEnglishDigits formats numbers with standard English comma grouping', () => {
  assert.equal(formatEnglishDigits(1234567), '1,234,567');
  assert.equal(formatEnglishDigits('89000'), '89,000');
  assert.equal(formatEnglishDigits(0), '0');
  assert.equal(formatEnglishDigits(''), '0');
});

test('calculateInspectionGrade maps score ranges correctly', () => {
  assert.equal(calculateInspectionGrade(95), 'A+');
  assert.equal(calculateInspectionGrade(90), 'A+');
  assert.equal(calculateInspectionGrade(85), 'A');
  assert.equal(calculateInspectionGrade(70), 'B');
  assert.equal(calculateInspectionGrade(55), 'C');
  assert.equal(calculateInspectionGrade(40), 'D');
});

test('formatVehiclePlate builds formatted Iranian plate string', () => {
  const plate = {
    prefix: '21',
    letter: 'ب',
    suffix: '365',
    provinceCode: '10',
  };
  assert.equal(formatVehiclePlate(plate), 'ایران 10 | 21 ب 365');
  assert.equal(formatVehiclePlate(undefined), '---');
});

test('getRecordStatusDetails returns proper Persian labels and variants', () => {
  assert.deepEqual(getRecordStatusDetails('completed'), {
    label: 'تکمیل شده',
    variant: 'success',
  });
  assert.deepEqual(getRecordStatusDetails('in_progress'), {
    label: 'در حال بازرسی',
    variant: 'warning',
  });
});

test('getItemStatusDetails returns Section 02 item statuses correctly', () => {
  assert.equal(getItemStatusDetails('uninspected').variant, 'neutral');
  assert.equal(getItemStatusDetails('uninspected').label, 'بررسی‌نشده');
  assert.equal(getItemStatusDetails('healthy').variant, 'success');
  assert.equal(getItemStatusDetails('needs_review').variant, 'warning');
  assert.equal(getItemStatusDetails('defective').variant, 'danger');
});

test('cn combines classes cleanly ignoring falsy values', () => {
  assert.equal(cn('btn', false && 'hidden', 'btn-primary', null, undefined), 'btn btn-primary');
});
