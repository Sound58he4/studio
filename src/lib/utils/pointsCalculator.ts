// src/lib/utils/pointsCalculator.ts
import { StoredFoodLogEntry } from '@/app/dashboard/types';
import { countUnhealthyFoods, calculateUnhealthyFoodPenalty } from '@/data/food-categories';
import { format } from 'date-fns';

export interface TodayProgress {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface DailyNutritionTargets {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface PointsData {
  todayPoints: number;
  totalPoints: number;
  lastUpdated: string;
  perfectDayBonusClaimed?: boolean;
}

/**
 * Calculate today's nutrition progress from food logs
 */
export function calculateTodayProgress(foodLogs: StoredFoodLogEntry[]): TodayProgress {
  return foodLogs.reduce(
    (totals: TodayProgress, log: StoredFoodLogEntry) => ({
      calories: totals.calories + log.calories,
      protein: totals.protein + log.protein,
      carbohydrates: totals.carbohydrates + log.carbohydrates,
      fat: totals.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
  );
}

/**
 * Calculate points from today's progress, targets, and food logs
 */
export function calculatePointsFromProgress(
  progress: TodayProgress, 
  targets: DailyNutritionTargets, 
  foodLogs: StoredFoodLogEntry[]
): number {
  let points = 0;

  // Calculate percentage achievements
  const caloriesPercent = targets.calories > 0 ? (progress.calories / targets.calories) * 100 : 0;
  const proteinPercent = targets.protein > 0 ? (progress.protein / targets.protein) * 100 : 0;
  const carbsPercent = targets.carbohydrates > 0 ? (progress.carbohydrates / targets.carbohydrates) * 100 : 0;
  const fatPercent = targets.fat > 0 ? (progress.fat / targets.fat) * 100 : 0;

  // Progressive points system for each nutrient
  // Calories: 25%=7pts, 50%=15pts, 75%=22pts, 100%=30pts
  if (caloriesPercent >= 25) points += 7;
  if (caloriesPercent >= 50) points += 8; // 15 total
  if (caloriesPercent >= 75) points += 7; // 22 total
  if (caloriesPercent >= 100) points += 8; // 30 total

  // Protein: 25%=6pts, 50%=12pts, 75%=18pts, 100%=25pts
  if (proteinPercent >= 25) points += 6;
  if (proteinPercent >= 50) points += 6; // 12 total
  if (proteinPercent >= 75) points += 6; // 18 total
  if (proteinPercent >= 100) points += 7; // 25 total

  // Carbs: 25%=4pts, 50%=8pts, 75%=11pts, 100%=15pts
  if (carbsPercent >= 25) points += 4;
  if (carbsPercent >= 50) points += 4; // 8 total
  if (carbsPercent >= 75) points += 3; // 11 total
  if (carbsPercent >= 100) points += 4; // 15 total

  // Fat: 25%=3pts, 50%=5pts, 75%=7pts, 100%=10pts
  if (fatPercent >= 25) points += 3;
  if (fatPercent >= 50) points += 2; // 5 total
  if (fatPercent >= 75) points += 2; // 7 total
  if (fatPercent >= 100) points += 3; // 10 total

  // Bonus points for meeting all goals (healthy eating)
  if (caloriesPercent >= 100 && proteinPercent >= 100 && carbsPercent >= 100 && fatPercent >= 100) {
    points += 10;
  }

  // Calculate unhealthy food penalty
  const unhealthyFoodCount = countUnhealthyFoods(foodLogs);
  const penalty = calculateUnhealthyFoodPenalty(unhealthyFoodCount);
  points -= penalty;

  return Math.max(0, Math.min(points, 100)); // Ensure points are between 0 and 100
}

/**
 * Calculate current points data including Perfect Day bonus
 */
export function calculateCurrentPoints(
  progress: TodayProgress,
  targets: DailyNutritionTargets,
  foodLogs: StoredFoodLogEntry[],
  perfectDayBonusClaimed: boolean = false
): number {
  let basePoints = calculatePointsFromProgress(progress, targets, foodLogs);
  
  // Add Perfect Day bonus if claimed
  if (perfectDayBonusClaimed) {
    basePoints += 10;
  }
  
  return basePoints;
}

/**
 * Process points data for a new day - transfers yesterday's points to total
 */
export function processPointsForNewDay(existingPoints: PointsData | null): PointsData {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  if (!existingPoints) {
    return {
      todayPoints: 0,
      totalPoints: 0,
      lastUpdated: today,
      perfectDayBonusClaimed: false
    };
  }

  // Check if we need to update for new day
  if (existingPoints.lastUpdated !== today) {
    // New day - transfer yesterday's points to total and reset today's points
    return {
      todayPoints: 0, // Will be calculated separately
      totalPoints: existingPoints.totalPoints + existingPoints.todayPoints, // Add yesterday's points to total
      lastUpdated: today,
      perfectDayBonusClaimed: false, // Reset bonus for new day
    };
  }

  return existingPoints;
}