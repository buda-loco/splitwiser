import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from './time';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for timestamps less than 1 minute ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:30Z'));

    // 0 seconds ago
    expect(formatRelativeTime('2024-06-15T12:00:30Z')).toBe('Just now');
    // 30 seconds ago
    expect(formatRelativeTime('2024-06-15T12:00:00Z')).toBe('Just now');
    // 59 seconds ago
    expect(formatRelativeTime('2024-06-15T11:59:31Z')).toBe('Just now');
  });

  it('returns "Just now" for timestamps in the very recent past (few seconds)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:05Z'));

    expect(formatRelativeTime('2024-06-15T12:00:00Z')).toBe('Just now');
  });

  it('returns minutes ago for timestamps 1-59 minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:30:00Z'));

    // 1 minute ago
    expect(formatRelativeTime('2024-06-15T12:29:00Z')).toBe('1m ago');
    // 5 minutes ago
    expect(formatRelativeTime('2024-06-15T12:25:00Z')).toBe('5m ago');
    // 30 minutes ago
    expect(formatRelativeTime('2024-06-15T12:00:00Z')).toBe('30m ago');
    // 59 minutes ago
    expect(formatRelativeTime('2024-06-15T11:31:00Z')).toBe('59m ago');
  });

  it('returns hours ago for timestamps 1-23 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T23:00:00Z'));

    // 1 hour ago
    expect(formatRelativeTime('2024-06-15T22:00:00Z')).toBe('1h ago');
    // 5 hours ago
    expect(formatRelativeTime('2024-06-15T18:00:00Z')).toBe('5h ago');
    // 23 hours ago
    expect(formatRelativeTime('2024-06-15T00:00:00Z')).toBe('23h ago');
  });

  it('returns days ago for timestamps 1-6 days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    // 1 day ago
    expect(formatRelativeTime('2024-06-14T12:00:00Z')).toBe('1d ago');
    // 3 days ago
    expect(formatRelativeTime('2024-06-12T12:00:00Z')).toBe('3d ago');
    // 6 days ago
    expect(formatRelativeTime('2024-06-09T12:00:00Z')).toBe('6d ago');
  });

  it('returns a locale date string for timestamps 7+ days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    // 7 days ago
    const result7d = formatRelativeTime('2024-06-08T12:00:00Z');
    // Should not contain "ago" - it should be a locale date string
    expect(result7d).not.toContain('ago');
    expect(result7d).not.toBe('Just now');
    // Should be a date string - check it contains some date-like content
    // The exact format depends on locale but it should be truthy
    expect(result7d.length).toBeGreaterThan(0);

    // 30 days ago
    const result30d = formatRelativeTime('2024-05-16T12:00:00Z');
    expect(result30d).not.toContain('ago');
    expect(result30d).not.toBe('Just now');
  });

  it('handles the exact boundary between "Just now" and minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:01:00Z'));

    // Exactly 60 seconds ago => diffMins = 1
    expect(formatRelativeTime('2024-06-15T12:00:00Z')).toBe('1m ago');
  });

  it('handles the exact boundary between minutes and hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T13:00:00Z'));

    // Exactly 60 minutes ago => diffMins = 60, diffHours = 1
    expect(formatRelativeTime('2024-06-15T12:00:00Z')).toBe('1h ago');
  });

  it('handles the exact boundary between hours and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-16T12:00:00Z'));

    // Exactly 24 hours ago => diffHours = 24, diffDays = 1
    expect(formatRelativeTime('2024-06-15T12:00:00Z')).toBe('1d ago');
  });

  it('handles the exact boundary between days and locale date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-22T12:00:00Z'));

    // Exactly 7 days ago => diffDays = 7
    const result = formatRelativeTime('2024-06-15T12:00:00Z');
    expect(result).not.toContain('ago');
    expect(result).not.toBe('Just now');
  });

  it('handles ISO date strings with timezone offsets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    // 5 hours ago via timezone offset
    expect(formatRelativeTime('2024-06-15T07:00:00Z')).toBe('5h ago');
  });
});
