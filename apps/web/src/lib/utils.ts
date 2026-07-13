import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with clsx and tailwind-merge to handle
 * Tailwind CSS class conflicts automatically.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a byte count into a human-readable string (e.g. "1.5 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  const index = Math.min(exponent, units.length - 1);
  const value = bytes / Math.pow(base, index);

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

/**
 * Format a date string or Date object into a localized date string.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a duration in seconds into a human-readable string (e.g. "2h 15m 30s").
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Truncate a string to a given length, appending an ellipsis if truncated.
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}…`;
}

/**
 * Safely parse channel names from a project object into a string array.
 */
export function getChannelNames(project: any): string[] {
  if (!project || !project.channelNames) {
    return ['accel_x', 'accel_y', 'accel_z'];
  }
  const cn = project.channelNames;
  if (Array.isArray(cn)) {
    return cn.map(String);
  }
  if (typeof cn === 'string') {
    try {
      const parsed = JSON.parse(cn);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return cn.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return ['accel_x', 'accel_y', 'accel_z'];
}
