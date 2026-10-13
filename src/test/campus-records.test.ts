import { describe, it, expect } from 'vitest';
import { formatActivity, newRefCode } from '@/lib/campus/records';

describe('Shared campus record adapter', () => {
  it('gives every record kind its own reference prefix', () => {
    expect(newRefCode('maintenance')).toMatch(/^MT-[0-9A-F]{4}$/);
    expect(newRefCode('community')).toMatch(/^CR-[0-9A-F]{4}$/);
    expect(newRefCode('security')).toMatch(/^SC-[0-9A-F]{4}$/);
  });

  it('labels today entries with a clock time', () => {
    expect(formatActivity('Report created', new Date().toISOString())).toMatch(/^.* · Report created$/);
  });

  it('labels yesterday entries and older dates without a clock time', () => {
    const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
    expect(formatActivity('Reported', yesterday)).toBe('Yesterday · Reported');
    const older = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatActivity('Resolved', older)).toMatch(/ · Resolved$/);
    expect(formatActivity('Resolved', older)).not.toMatch(/^Yesterday/);
  });

  it('keeps an unreadable timestamp as the plain note', () => {
    expect(formatActivity('Imported note', 'not-a-date')).toBe('Imported note');
  });
});
