// src/services/firestore/friendNutritionService.ts
import { db } from '@/lib/firebase/exports';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import type { StoredUserProfile, DailyNutritionSummary } from '@/app/dashboard/types';

export interface FriendWeeklyGoal {
  userId: string;
  displayName?: string;
  weeklyTargets: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  weeklyActuals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  progress: {
    calories: number; // percentage
    protein: number;  // percentage
    carbohydrates: number; // percentage
    fat: number; // percentage
  };
}

/**
 * Get a friend's weekly nutrition goal based on their daily targets
 */
export async function getFriendWeeklyGoal(friendUserId: string): Promise<FriendWeeklyGoal | null> {
  try {
    // Get friend's profile to access their daily targets
    const profileSnap = await getDoc(doc(db, 'users', friendUserId));
    
    if (!profileSnap.exists()) {
      console.log(`[FriendNutritionService] Profile not found for user ${friendUserId}`);
      return null;
    }

    const profile = profileSnap.data() as StoredUserProfile;
    
    // Check if they have daily targets set
    if (!profile.targetCalories || !profile.targetProtein || !profile.targetCarbs || !profile.targetFat) {
      console.log(`[FriendNutritionService] User ${friendUserId} doesn't have complete daily targets`);
      return null;
    }

    // Calculate weekly targets (daily targets * 7)
    const weeklyTargets = {
      calories: profile.targetCalories * 7,
      protein: profile.targetProtein * 7,
      carbohydrates: profile.targetCarbs * 7,
      fat: profile.targetFat * 7,
    };

    // Get current week's actual nutrition data
    const currentDate = new Date();
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

    // Get daily nutrition summaries for the current week
    const weeklyActuals = await getWeeklyNutritionActuals(friendUserId, weekStart, weekEnd);

    // Calculate progress percentages
    const progress = {
      calories: weeklyTargets.calories > 0 ? Math.round((weeklyActuals.calories / weeklyTargets.calories) * 100) : 0,
      protein: weeklyTargets.protein > 0 ? Math.round((weeklyActuals.protein / weeklyTargets.protein) * 100) : 0,
      carbohydrates: weeklyTargets.carbohydrates > 0 ? Math.round((weeklyActuals.carbohydrates / weeklyTargets.carbohydrates) * 100) : 0,
      fat: weeklyTargets.fat > 0 ? Math.round((weeklyActuals.fat / weeklyTargets.fat) * 100) : 0,
    };

    return {
      userId: friendUserId,
      displayName: profile.displayName || 'Unknown User',
      weeklyTargets,
      weeklyActuals,
      progress,
    };

  } catch (error) {
    console.error(`[FriendNutritionService] Error fetching weekly goal for user ${friendUserId}:`, error);
    return null;
  }
}

/**
 * Get weekly nutrition actuals for a user by summing their daily nutrition summaries
 */
async function getWeeklyNutritionActuals(userId: string, weekStart: Date, weekEnd: Date): Promise<{
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}> {
  try {
    const summariesRef = collection(db, 'users', userId, 'dailyNutritionSummaries');
    
    // Generate date strings for the week
    const dateStrings: string[] = [];
    const currentDate = new Date(weekStart);
    while (currentDate <= weekEnd) {
      dateStrings.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Query for summaries in the date range
    const summariesQuery = query(
      summariesRef,
      where('__name__', 'in', dateStrings)
    );

    const summariesSnap = await getDocs(summariesQuery);
    
    // Sum up the nutrition data
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbohydrates = 0;
    let totalFat = 0;

    summariesSnap.forEach(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DailyNutritionSummary;
        totalCalories += Number(data.totalCalories) || 0;
        totalProtein += Number(data.totalProtein) || 0;
        totalCarbohydrates += Number(data.totalCarbohydrates) || 0;
        totalFat += Number(data.totalFat) || 0;
      }
    });

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbohydrates: totalCarbohydrates,
      fat: totalFat,
    };

  } catch (error) {
    console.error(`[FriendNutritionService] Error fetching weekly actuals for user ${userId}:`, error);
    return {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
    };
  }
}

/**
 * Get weekly goals for multiple friends
 */
export async function getFriendsWeeklyGoals(friendUserIds: string[]): Promise<FriendWeeklyGoal[]> {
  const goals = await Promise.all(
    friendUserIds.map(friendId => getFriendWeeklyGoal(friendId))
  );
  
  // Filter out null results
  return goals.filter((goal): goal is FriendWeeklyGoal => goal !== null);
}
