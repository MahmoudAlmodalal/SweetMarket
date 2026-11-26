import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ConciergeBriefSchema,
  normalizePalestinianPhone,
  isValidPalestinianPhone,
  TrackOrderFormSchema,
} from './validations';

const validBrief = {
  occasion: 'حفل زفاف',
  quantityOrBudget: '50 ضيف',
  phone: '0599123456',
};

describe('normalizePalestinianPhone (unified client normalizer)', () => {
  it('normalizes local, international, spaced and Eastern-digit formats identically', () => {
    assert.equal(normalizePalestinianPhone('0599123456'), '0599123456');
    assert.equal(normalizePalestinianPhone('+970 59 912 3456'), '0599123456');
    assert.equal(normalizePalestinianPhone('٠٥٩٩١٢٣٤٥٦'), '0599123456');
    assert.equal(normalizePalestinianPhone('0568987654'), '0568987654');
  });

  it('rejects invalid numbers', () => {
    assert.equal(isValidPalestinianPhone('0501234567'), false);
    assert.equal(isValidPalestinianPhone('059123'), false);
    assert.equal(isValidPalestinianPhone(''), false);
  });
});

describe('TrackOrderFormSchema phone handling', () => {
  it('accepts the same formats the unified normalizer accepts', () => {
    for (const phone of ['0599123456', '+970 59 912 3456', '٠٥٩٩١٢٣٤٥٦']) {
      const result = TrackOrderFormSchema.safeParse({ orderNumber: 'CL-2026-1001', phone });
      assert.equal(result.success, true, `track schema should accept ${phone}`);
    }
  });
});

describe('ConciergeBriefSchema phone handling', () => {
  it('accepts every format the unified normalizer accepts, not only raw 10 digits', () => {
    // A customer who typed their number with the international prefix, spaces,
    // or Eastern digits at checkout hits no error; the concierge form must agree.
    for (const phone of ['0599123456', '+970 59 912 3456', '0599 123 456', '٠٥٩٩١٢٣٤٥٦']) {
      const result = ConciergeBriefSchema.safeParse({ ...validBrief, phone });
      assert.equal(result.success, true, `concierge schema should accept ${phone}`);
    }
  });

  it('still rejects invalid numbers', () => {
    for (const phone of ['0501234567', '059123', 'abc']) {
      const result = ConciergeBriefSchema.safeParse({ ...validBrief, phone });
      assert.equal(result.success, false, `concierge schema should reject ${phone}`);
    }
  });
});
