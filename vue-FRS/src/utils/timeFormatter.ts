/**
 * 格式化日期为相对时间字符串
 * @param date - 日期对象、可解析的日期字符串、null 或 undefined
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (date == null) {
        return '-';
    }

    const inputDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(inputDate.getTime())) {
        return '-';
    }

    const now = new Date();
    // --- Use UTC for comparisons and formatting ---
    const nowTime = now.getTime();
    const inputTime = inputDate.getTime();
    const diffMilliseconds = nowTime - inputTime;
    const diffSeconds = Math.round(diffMilliseconds / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);

    const inputYearUTC = inputDate.getUTCFullYear();
    const currentYearUTC = now.getUTCFullYear();
    const inputMonthUTC = inputDate.getUTCMonth(); // 0-11
    const currentMonthUTC = now.getUTCMonth(); // 0-11
    const inputDayUTC = inputDate.getUTCDate();
    const currentDayUTC = now.getUTCDate();

    const hoursUTC = inputDate.getUTCHours().toString().padStart(2, '0');
    const minutesUTC = inputDate.getUTCMinutes().toString().padStart(2, '0');
    const timeStringUTC = `${hoursUTC}:${minutesUTC}`;

    // Handle future dates first (using raw time diff is fine)
    if (diffMilliseconds < 0) {
        const year = inputDate.getUTCFullYear();
        const month = (inputDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = inputDate.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${timeStringUTC}`;
    }

    // Handle recent past
    if (diffSeconds < 60) {
        return '刚刚';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
    } else if (diffHours < 24 && currentDayUTC === inputDayUTC && currentMonthUTC === inputMonthUTC && currentYearUTC === inputYearUTC) {
        // Only show hours ago if it's the same calendar day in UTC
        return `${diffHours}小时前`;
    }

    // Handle yesterday: Check based on UTC dates
    // Calculate the start of today and yesterday in UTC milliseconds
    const todayStartUTC = Date.UTC(currentYearUTC, currentMonthUTC, currentDayUTC);
    const yesterdayStartUTC = todayStartUTC - (24 * 60 * 60 * 1000);

    if (inputTime >= yesterdayStartUTC && inputTime < todayStartUTC) {
        return `昨天 ${timeStringUTC}`;
    }

    // Handle dates within the current year but before yesterday (UTC)
    if (inputYearUTC === currentYearUTC && inputTime < yesterdayStartUTC) {
        const month = (inputDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = inputDate.getUTCDate().toString().padStart(2, '0');
        return `${month}-${day} ${timeStringUTC}`; // Use MM-DD HH:mm format (UTC time)
    }

    // Handle dates in previous years (UTC)
    if (inputYearUTC < currentYearUTC) {
        const year = inputDate.getUTCFullYear();
        const month = (inputDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = inputDate.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${timeStringUTC}`; // Use YYYY-MM-DD HH:mm format (UTC time)
    }

    // Fallback: If none of the above conditions match (e.g., same day but > 24 hours due to rounding/DST),
    // return the full date and time in UTC for consistency.
    const year = inputDate.getUTCFullYear();
    const month = (inputDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = inputDate.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${timeStringUTC}`;

} 