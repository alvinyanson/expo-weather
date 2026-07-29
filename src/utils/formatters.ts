import { i18n } from '@/services/i18n';

export type AppLocale = 'en' | 'ja' | string;

// Returns active locale string derived from i18n.locale ('en', 'ja', etc.)
export const getAppLocale = (): string => {
  return i18n.locale || 'en';
};

// Return: "1,234.56"
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string,
): string => {
  const targetLocale = locale ?? getAppLocale();
  return new Intl.NumberFormat(targetLocale, options).format(value);
};

// Return: "24"
export const formatRound = (value: number, locale?: string): string => {
  return formatNumber(Math.round(value), undefined, locale);
};

// Return: "June 26" / "6月26日"
export const formatDateFull = (dateStr?: string | number | Date, locale?: string): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const targetLocale = locale ?? getAppLocale();
  return date.toLocaleDateString(targetLocale, { month: 'long', day: 'numeric' });
};

// Return: "Thursday" / "木曜日"
export const formatDayName = (dateStr: string | number | Date, locale?: string): string => {
  const date = new Date(dateStr);
  const targetLocale = locale ?? getAppLocale();
  return date.toLocaleDateString(targetLocale, { weekday: 'long' });
};

// Return: "10:30 AM" / "午前10:30"
export const formatTime = (dateStr: string | number | Date, locale?: string): string => {
  const date = new Date(dateStr);
  const targetLocale = locale ?? getAppLocale();
  return date.toLocaleTimeString(targetLocale, { hour: 'numeric', minute: '2-digit' });
};

// Return: "10AM" / "午前10時"
export const formatHourlyTime = (dateStr: string | number | Date, locale?: string): string => {
  const date = new Date(dateStr);
  const targetLocale = locale ?? getAppLocale();
  return date.toLocaleTimeString(targetLocale, { hour: 'numeric', hour12: true }).replace(' ', '');
};

// Return: "5 minutes ago" / "5分前"
export const formatRelativeTime = (dateStr: string | number | Date, locale?: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const targetLocale = locale ?? getAppLocale();

  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    try {
      const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });
      const absDiff = Math.abs(diffInSeconds);
      if (absDiff < 60) {
        return rtf.format(diffInSeconds, 'second');
      }
      const diffInMinutes = Math.round(diffInSeconds / 60);
      if (Math.abs(diffInMinutes) < 60) {
        return rtf.format(diffInMinutes, 'minute');
      }
      const diffInHours = Math.round(diffInSeconds / 3600);
      if (Math.abs(diffInHours) < 24) {
        return rtf.format(diffInHours, 'hour');
      }
      const diffInDays = Math.round(diffInSeconds / 86400);
      return rtf.format(diffInDays, 'day');
    } catch {
      // Fallback
    }
  }

  const absDiff = Math.abs(diffInSeconds);
  if (absDiff < 60) return `${absDiff}s ago`;
  const diffInMinutes = Math.round(absDiff / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.round(absDiff / 3600);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.round(absDiff / 86400);
  return `${diffInDays}d ago`;
};

// Return: "14.5995, 120.9842"
export const formatCoordinates = (lat: number, lon: number, locale?: string): string => {
  const formattedLat = formatNumber(
    lat,
    { minimumFractionDigits: 4, maximumFractionDigits: 4 },
    locale,
  );
  const formattedLon = formatNumber(
    lon,
    { minimumFractionDigits: 4, maximumFractionDigits: 4 },
    locale,
  );
  return `${formattedLat}, ${formattedLon}`;
};

// Return: "1013"
export const formatPressure = (value: number, locale?: string): string => {
  return formatNumber(Math.round(value), { useGrouping: false }, locale);
};
