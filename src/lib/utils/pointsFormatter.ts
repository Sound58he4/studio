// src/lib/utils/pointsFormatter.ts

/**
 * Formats points to display in a readable format
 * - 1000+ points are displayed as "1k", "1.2k", etc.
 * - 1000000+ points are displayed as "1m", "1.2m", etc.
 * - Numbers below 1000 are displayed as-is
 */
export function formatPoints(points: number): string {
  if (points >= 1000000) {
    const millions = points / 1000000;
    return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
  } else if (points >= 1000) {
    const thousands = points / 1000;
    return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
  } else {
    return points.toString();
  }
}
