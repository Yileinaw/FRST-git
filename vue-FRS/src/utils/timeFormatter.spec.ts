// src/utils/timeFormatter.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from './timeFormatter';

describe('formatRelativeTime', () => {
    // Mock Date.now() to ensure consistent results
    beforeEach(() => {
        // Mock current time to a fixed point: e.g., 2024-04-07 12:00:00 UTC
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-04-07T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers(); // Restore real timers after each test
    });

    it('should return "刚刚" for time within 1 minute', () => {
        const justNow = new Date('2024-04-07T11:59:30.000Z');
        expect(formatRelativeTime(justNow)).toBe('刚刚');
    });

    it('should return "x 分钟前" for time within 1 hour', () => {
        const fiveMinutesAgo = new Date('2024-04-07T11:55:00.000Z');
        expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分钟前');
        const fiftyNineMinutesAgo = new Date('2024-04-07T11:01:00.000Z');
        expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59分钟前');
    });

    it('should return "x 小时前" for time within 1 day', () => {
        const twoHoursAgo = new Date('2024-04-07T10:00:00.000Z');
        expect(formatRelativeTime(twoHoursAgo)).toBe('2小时前');
        const twentyThreeHoursAgo = new Date('2024-04-06T13:00:00.000Z');
        expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('昨天 13:00');
    });

    it('should return "昨天 HH:mm" for yesterday', () => {
        const yesterdayMorning = new Date('2024-04-06T09:30:00.000Z');
        // Note: The exact output depends on the system timezone where tests run if not UTC.
        // Assuming the formatting function handles localization or uses a consistent format.
        // Let's assume it outputs HH:mm in 24-hour format.
        expect(formatRelativeTime(yesterdayMorning)).toMatch(/^昨天 \d{2}:\d{2}$/);
        // Example specific check if output is predictable (e.g. always UTC offset 0)
        // expect(formatRelativeTime(yesterdayMorning)).toBe('昨天 09:30');
    });

    it('should return "MM-DD HH:mm" for dates within the current year but before yesterday', () => {
        const dayBeforeYesterday = new Date('2024-04-05T16:45:00.000Z');
        expect(formatRelativeTime(dayBeforeYesterday)).toMatch(/^04-05 \d{2}:\d{2}$/);
        const earlierThisYear = new Date('2024-01-15T10:00:00.000Z');
        expect(formatRelativeTime(earlierThisYear)).toMatch(/^01-15 \d{2}:\d{2}$/);
    });

    it('should return "YYYY-MM-DD HH:mm" for dates in previous years', () => {
        const lastYear = new Date('2023-12-25T08:00:00.000Z');
        expect(formatRelativeTime(lastYear)).toMatch(/^2023-12-25 \d{2}:\d{2}$/);
    });

    it('should handle invalid date input gracefully', () => {
        expect(formatRelativeTime('invalid date')).toBe('-'); // Or whatever the expected output is
        expect(formatRelativeTime(null)).toBe('-');
        expect(formatRelativeTime(undefined)).toBe('-');
    });

    it('should handle future dates', () => {
        // Decide how future dates should be handled. Often they show the full date.
        const tomorrow = new Date('2024-04-08T14:00:00.000Z');
        expect(formatRelativeTime(tomorrow)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/); // Expect full date format
    });
}); 