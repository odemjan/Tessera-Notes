import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, setLocale } from '@tessera/ui';
import { formatRelativeTime } from './hooks';

afterEach(() => setLocale('en'));

describe('formatRelativeTime', () => {
  const now = Date.UTC(2025, 0, 15, 12);

  it('uses "just now" for times within 45 seconds', () => {
    expect(formatRelativeTime(now + 44_000, now)).toBe('just now');
    expect(formatRelativeTime(now - 44_000, now)).toBe('just now');
  });

  it('formats nearby times in minutes, hours, and days', () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5 minutes ago');
    expect(formatRelativeTime(now + 2 * 60 * 60_000, now)).toBe('in 2 hours');
    expect(formatRelativeTime(now - 3 * 24 * 60 * 60_000, now)).toBe('3 days ago');
  });

  it('formats dates older than 30 days using the active locale', () => {
    expect(formatRelativeTime(Date.UTC(2024, 10, 1), now)).toBe(
      new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(Date.UTC(2024, 10, 1)),
    );
  });
});
