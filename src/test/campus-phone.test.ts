import { describe, expect, it } from 'vitest';
import { isValidE164Phone, normalizeCampusPhone } from '@/lib/campus/phone';

describe('campus phone numbers', () => {
  it('adds India country code to a 10-digit local mobile number', () => {
    expect(normalizeCampusPhone('8528880050')).toBe('+918528880050');
    expect(normalizeCampusPhone('08528880050')).toBe('+918528880050');
  });

  it('preserves explicit international country codes', () => {
    expect(normalizeCampusPhone('+1 (415) 555-2671')).toBe('+14155552671');
    expect(normalizeCampusPhone('0091 85288 80050')).toBe('+918528880050');
  });

  it('validates E.164 numbers before sending a phone OTP', () => {
    expect(isValidE164Phone('+918528880050')).toBe(true);
    expect(isValidE164Phone('+14155552671')).toBe(true);
    expect(isValidE164Phone('+01234567')).toBe(false);
    expect(isValidE164Phone('+1234567')).toBe(false);
  });
});
