import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatArabicHour, getStoreStatusLabel } from '@/lib/store-status';

describe('Store Status Label', () => {
  test('formats hours in Arabic dayparts', () => {
    assert.equal(formatArabicHour(9), '9:00 صباحاً');
    assert.equal(formatArabicHour(12), '12:00 ظهراً');
    assert.equal(formatArabicHour(13), '1:00 ظهراً');
    assert.equal(formatArabicHour(23), '11:00 مساءً');
    assert.equal(formatArabicHour(9, 30), '9:30 صباحاً');
  });

  // 28 نوفمبر 2026 سبت، وغزة على UTC+2 في نوفمبر
  test('open on Saturday morning shows closing time', () => {
    const status = getStoreStatusLabel(new Date('2026-11-28T08:30:00Z')); // 10:30 غزة
    assert.equal(status.isOpen, true);
    assert.equal(status.label, 'مفتوح الآن حتى 11:00 مساءً');
  });

  test('before opening says opens today', () => {
    const status = getStoreStatusLabel(new Date('2026-11-28T05:30:00Z')); // 07:30 غزة
    assert.equal(status.isOpen, false);
    assert.equal(status.label, 'مغلق حالياً، نفتح اليوم 9:00 صباحاً');
  });

  test('after closing says opens tomorrow with the next day rule', () => {
    const status = getStoreStatusLabel(new Date('2026-11-28T21:30:00Z')); // 23:30 غزة سبت
    assert.equal(status.isOpen, false);
    assert.equal(status.label, 'مغلق حالياً، نفتح غداً 9:00 صباحاً');
  });

  test('Friday morning points to the 13:00 Friday opening', () => {
    const status = getStoreStatusLabel(new Date('2026-11-27T08:00:00Z')); // 10:00 غزة جمعة
    assert.equal(status.isOpen, false);
    assert.equal(status.label, 'مغلق حالياً، نفتح اليوم 1:00 ظهراً');
  });

  test('Thursday after closing points to Friday hours', () => {
    const status = getStoreStatusLabel(new Date('2026-11-26T21:30:00Z')); // 23:30 غزة خميس
    assert.equal(status.isOpen, false);
    assert.equal(status.label, 'مغلق حالياً، نفتح غداً 1:00 ظهراً');
  });
});
