// src/lib/utils/badgeCalculator.ts

/**
 * Badge System Rules:
 * - To earn 1 badge: 100+ points per day for 3 consecutive days (300+ total points in 3 continuous days)
 * - Sundays and rest days are excluded from the calculation
 * - Each 3-day consecutive streak earns 1 badge
 */

export interface DailyPointsRecord {
  date: string; // YYYY-MM-DD format
  points: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

/**
 * Calculates the number of badges earned based on daily points history
 * @param dailyPointsHistory Array of daily points records, sorted by date (oldest first)
 * @returns Number of badges earned
 */
export function calculateBadges(dailyPointsHistory: DailyPointsRecord[]): number {
  if (dailyPointsHistory.length < 3) return 0;

  let badges = 0;
  let consecutiveDays = 0;
  let i = 0;

  while (i < dailyPointsHistory.length) {
    const record = dailyPointsHistory[i];
    
    // Skip Sundays (day 0)
    if (record.dayOfWeek === 0) {
      i++;
      continue;
    }

    // Check if this day meets the criteria (100+ points)
    if (record.points >= 100) {
      consecutiveDays++;
      
      // Award badge every 3 consecutive qualifying days
      if (consecutiveDays >= 3) {
        badges++;
        consecutiveDays = 0; // Reset for next badge calculation
      }
    } else {
      // Reset streak if day doesn't meet criteria
      consecutiveDays = 0;
    }
    
    i++;
  }

  return badges;
}

/**
 * Determines if a date is a "rest day" (currently only Sunday)
 * Can be extended to include user-defined rest days
 */
export function isRestDay(date: Date): boolean {
  return date.getDay() === 0; // Sunday
}

/**
 * Converts date string to day of week number
 */
export function getDayOfWeek(dateString: string): number {
  return new Date(dateString).getDay();
}

/**
 * Checks if two dates are consecutive (accounting for weekends/rest days)
 */
export function areConsecutiveWorkingDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Calculate difference in days
  const timeDiff = d2.getTime() - d1.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // For consecutive working days, the difference should be 1 day
  // or 2 days if one of them is followed by Sunday
  if (daysDiff === 1) {
    // Check if the second date is not Sunday
    return d2.getDay() !== 0;
  }
  
  // If difference is 2 days, check if Sunday is in between
  if (daysDiff === 2) {
    const middleDate = new Date(d1.getTime() + (1000 * 60 * 60 * 24));
    return middleDate.getDay() === 0; // Sunday is in between
  }
  
  return false;
}

/**
 * Calculates badges from a more complex algorithm that properly handles
 * consecutive working days while skipping Sundays
 */
export function calculateBadgesAdvanced(dailyPointsHistory: DailyPointsRecord[]): number {
  if (dailyPointsHistory.length < 3) return 0;

  let badges = 0;
  let currentStreak = 0;
  
  // Filter out Sundays first
  const workingDays = dailyPointsHistory.filter(record => record.dayOfWeek !== 0);
  
  for (let i = 0; i < workingDays.length; i++) {
    const record = workingDays[i];
    
    if (record.points >= 100) {
      currentStreak++;
      
      // Check if we have 3 consecutive working days with 100+ points
      if (currentStreak >= 3) {
        badges++;
        currentStreak = 0; // Reset streak after earning a badge
      }
    } else {
      currentStreak = 0; // Reset streak if criteria not met
    }
  }
  
  return badges;
}

/**
 * Formats badge count for display
 */
export function formatBadgeCount(badges: number): string {
  if (badges === 0) return "No badges";
  if (badges === 1) return "1 badge";
  return `${badges} badges`;
}

/**
 * Calculates points needed for next badge
 */
export function getPointsNeededForNextBadge(
  dailyPointsHistory: DailyPointsRecord[]
): { daysNeeded: number; pointsNeeded: number } {
  // Filter out Sundays
  const workingDays = dailyPointsHistory.filter(record => record.dayOfWeek !== 0);
  
  // Count current consecutive days with 100+ points
  let consecutiveDays = 0;
  for (let i = workingDays.length - 1; i >= 0; i--) {
    if (workingDays[i].points >= 100) {
      consecutiveDays++;
    } else {
      break;
    }
  }
  
  const daysNeeded = Math.max(0, 3 - consecutiveDays);
  const pointsNeeded = daysNeeded * 100;
  
  return { daysNeeded, pointsNeeded };
}
