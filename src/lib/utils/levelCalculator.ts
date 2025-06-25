// src/lib/utils/levelCalculator.ts

/**
 * Calculates user level based on total points
 * Level = Math.floor(totalPoints / 1000) + 1
 * Examples:
 * - 0-999 points = Level 1
 * - 1000-1999 points = Level 2
 * - 2000-2999 points = Level 3
 * - etc.
 */
export function calculateLevel(totalPoints: number): number {
  if (totalPoints < 0) return 1;
  return Math.floor(totalPoints / 1000) + 1;
}

/**
 * Gets the points needed for the next level
 */
export function getPointsForNextLevel(totalPoints: number): number {
  const currentLevel = calculateLevel(totalPoints);
  const nextLevelPoints = currentLevel * 1000;
  return nextLevelPoints - totalPoints;
}

/**
 * Gets the points range for a specific level
 */
export function getLevelRange(level: number): { min: number; max: number } {
  const min = (level - 1) * 1000;
  const max = level * 1000 - 1;
  return { min, max };
}

/**
 * Gets progress percentage towards next level
 */
export function getLevelProgress(totalPoints: number): number {
  const currentLevelMin = Math.floor(totalPoints / 1000) * 1000;
  const progressInCurrentLevel = totalPoints - currentLevelMin;
  return (progressInCurrentLevel / 1000) * 100;
}
