// Free mode services - Browser storage replacements for Firebase operations
// This file provides localStorage-based implementations for all Firebase operations

import { browserStorage } from '@/lib/browser-storage';
import type { 
  StoredUserProfile, 
  StoredFoodLogEntry, 
  WeeklyWorkoutPlan,
  ExerciseDetail,
  StoredExerciseLogEntry,
  FirestoreFoodLogData,
  DailyNutritionSummary
} from '@/app/dashboard/types';

// User Profile Operations
export const getUserProfile = async (userId: string): Promise<StoredUserProfile | null> => {
  console.log('[Free Mode] Getting user profile from localStorage:', userId);
  
  let profile = browserStorage.getUserProfile(userId);
  
  // If no profile exists, create a default one
  if (!profile) {
    const defaultProfile: StoredUserProfile = {
      email: `user-${userId}@example.com`,
      displayName: `User ${userId.slice(0, 8)}`,
      isPro: true, // Always Pro in free mode
      // Default nutrition targets
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 67,
      fitnessGoal: 'stay_fit' as const,
      // Initialize nutrition data
      todayCalories: 0,
      todayProtein: 0,
      todayCarbohydrates: 0,
      todayFat: 0,
      todayEntryCount: 0,
      todayLastUpdated: new Date().toISOString()
    };
    
    browserStorage.setUserProfile(userId, defaultProfile);
    profile = defaultProfile;
  }
  
  return profile;
};

export const saveUserProfile = async (userId: string, profileData: Partial<StoredUserProfile>): Promise<boolean> => {
  console.log('[Free Mode] Saving user profile to localStorage:', userId);
  
  const existingProfile = await getUserProfile(userId);
  const updatedProfile: StoredUserProfile = {
    ...existingProfile!,
    ...profileData,
    isPro: true // Always Pro in free mode
  };
  
  return browserStorage.setUserProfile(userId, updatedProfile);
};

export const isDisplayNameTaken = async (displayName: string, currentUserId?: string): Promise<boolean> => {
  console.log('[Free Mode] Checking display name availability (always available):', displayName);
  // In free mode, all display names are available
  return false;
};

// Food Log Operations
export const addFoodLog = async (userId: string, logData: FirestoreFoodLogData): Promise<string> => {
  console.log('[Free Mode] Adding food log to localStorage:', userId);
  
  const today = new Date().toISOString().split('T')[0];
  const existingLogs = browserStorage.getFoodLogs(userId, today);
  
  const newLogEntry: StoredFoodLogEntry = {
    ...logData,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  const updatedLogs = [...existingLogs, newLogEntry];
  browserStorage.setFoodLogs(userId, updatedLogs, today);
  
  // Update user profile nutrition totals
  await updateDailyNutritionTotals(userId, today);
  
  return newLogEntry.id;
};

export const getFoodLogs = async (userId: string, date?: string): Promise<StoredFoodLogEntry[]> => {
  console.log('[Free Mode] Getting food logs from localStorage:', userId, date);
  
  const targetDate = date || new Date().toISOString().split('T')[0];
  return browserStorage.getFoodLogs(userId, targetDate);
};

// Workout Plan Operations
export const getWorkoutPlan = async (userId: string): Promise<WeeklyWorkoutPlan | null> => {
  console.log('[Free Mode] Getting workout plan from localStorage:', userId);
  
  const stored = browserStorage.get(`workout_plan_${userId}`);
  return stored || null;
};

export const saveWorkoutPlan = async (userId: string, workoutPlan: WeeklyWorkoutPlan): Promise<boolean> => {
  console.log('[Free Mode] Saving workout plan to localStorage:', userId);
  
  return browserStorage.set(`workout_plan_${userId}`, {
    ...workoutPlan,
    lastUpdated: new Date().toISOString()
  });
};

// Exercise Log Operations
export const getExerciseLogs = async (userId: string, date?: string): Promise<StoredExerciseLogEntry[]> => {
  console.log('[Free Mode] Getting exercise logs from localStorage:', userId, date);
  
  const targetDate = date || new Date().toISOString().split('T')[0];
  const stored = browserStorage.get(`exercise_logs_${userId}_${targetDate}`);
  return stored || [];
};

export const addExerciseLog = async (userId: string, exerciseData: any): Promise<string> => {
  console.log('[Free Mode] Adding exercise log to localStorage:', userId);
  
  const today = new Date().toISOString().split('T')[0];
  const existingLogs = await getExerciseLogs(userId, today);
  
  const newLogEntry: StoredExerciseLogEntry = {
    id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    date: today,
    timestamp: new Date().toISOString(),
    ...exerciseData
  };
  
  const updatedLogs = [...existingLogs, newLogEntry];
  browserStorage.set(`exercise_logs_${userId}_${today}`, updatedLogs);
  
  return newLogEntry.id;
};

// Log Management Operations
export const deleteLogEntry = async (userId: string, entryId: string, logType: 'food' | 'exercise'): Promise<boolean> => {
  console.log('[Free Mode] Deleting log entry from localStorage:', userId, entryId, logType);
  
  const today = new Date().toISOString().split('T')[0];
  
  if (logType === 'food') {
    const logs = browserStorage.getFoodLogs(userId, today);
    const filteredLogs = logs.filter(log => log.id !== entryId);
    browserStorage.setFoodLogs(userId, filteredLogs, today);
    await updateDailyNutritionTotals(userId, today);
  } else {
    const logs = await getExerciseLogs(userId, today);
    const filteredLogs = logs.filter(log => log.id !== entryId);
    browserStorage.set(`exercise_logs_${userId}_${today}`, filteredLogs);
  }
  
  return true;
};

export const clearAllLogs = async (userId: string): Promise<boolean> => {
  console.log('[Free Mode] Clearing all logs from localStorage:', userId);
  
  // Clear food logs for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    browserStorage.setFoodLogs(userId, [], dateStr);
    browserStorage.set(`exercise_logs_${userId}_${dateStr}`, []);
  }
  
  // Reset user profile nutrition totals
  const profile = await getUserProfile(userId);
  if (profile) {
    await saveUserProfile(userId, {
      todayCalories: 0,
      todayProtein: 0,
      todayCarbohydrates: 0,
      todayFat: 0,
      todayEntryCount: 0,
      todayLastUpdated: new Date().toISOString()
    });
  }
  
  return true;
};

// Nutrition Summary Operations
export const getDailyNutritionSummary = async (userId: string, date?: string): Promise<DailyNutritionSummary> => {
  console.log('[Free Mode] Getting daily nutrition summary from localStorage:', userId, date);
  
  const targetDate = date || new Date().toISOString().split('T')[0];
  const logs = browserStorage.getFoodLogs(userId, targetDate);
  
  const summary: DailyNutritionSummary = {
    id: targetDate,
    totalCalories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
    totalProtein: logs.reduce((sum, log) => sum + (log.protein || 0), 0),
    totalCarbohydrates: logs.reduce((sum, log) => sum + (log.carbohydrates || 0), 0),
    totalFat: logs.reduce((sum, log) => sum + (log.fat || 0), 0),
    entryCount: logs.length,
    lastUpdated: new Date().toISOString()
  };
  
  return summary;
};

// Helper function to update daily nutrition totals in user profile
const updateDailyNutritionTotals = async (userId: string, date: string): Promise<void> => {
  const summary = await getDailyNutritionSummary(userId, date);
  const today = new Date().toISOString().split('T')[0];
  
  // Only update if it's today's data
  if (date === today) {
    await saveUserProfile(userId, {
      todayCalories: summary.totalCalories,
      todayProtein: summary.totalProtein,
      todayCarbohydrates: summary.totalCarbohydrates,
      todayFat: summary.totalFat,
      todayEntryCount: summary.entryCount,
      todayLastUpdated: summary.lastUpdated
    });
  }
};

// Dashboard data fetching
export const getDashboardData = async (userId: string) => {
  console.log('[Free Mode] Getting dashboard data from localStorage:', userId);
  
  const [profile, todayFoodLogs, todayExerciseLogs, workoutPlan] = await Promise.all([
    getUserProfile(userId),
    getFoodLogs(userId),
    getExerciseLogs(userId),
    getWorkoutPlan(userId)
  ]);
  
  return {
    profile,
    todayFoodLogs,
    todayExerciseLogs,
    workoutPlan,
    nutritionSummary: await getDailyNutritionSummary(userId)
  };
};

// Completed Workouts Operations
export const getCompletedWorkoutsForDate = async (userId: string, date: string) => {
  console.log('[Free Mode] Getting completed workouts from localStorage:', userId, date);
  
  const stored = browserStorage.get(`completed_workouts_${userId}_${date}`);
  return stored || {};
};

export const saveCompletedWorkout = async (userId: string, date: string, exercise: string, completed: boolean): Promise<boolean> => {
  console.log('[Free Mode] Saving completed workout to localStorage:', userId, date, exercise, completed);
  
  const existing = await getCompletedWorkoutsForDate(userId, date);
  const updated = {
    ...existing,
    [exercise]: { completed, timestamp: new Date().toISOString() }
  };
  
  return browserStorage.set(`completed_workouts_${userId}_${date}`, updated);
};

export const deleteCompletedWorkout = async (userId: string, date: string, exercise: string): Promise<boolean> => {
  console.log('[Free Mode] Deleting completed workout from localStorage:', userId, date, exercise);
  
  const existing = await getCompletedWorkoutsForDate(userId, date);
  delete existing[exercise];
  
  return browserStorage.set(`completed_workouts_${userId}_${date}`, existing);
};

// Daily Nutrition Summaries (plural version for compatibility)
export const getDailyNutritionSummaries = async (userId: string, startDate?: string, endDate?: string) => {
  console.log('[Free Mode] Getting daily nutrition summaries from localStorage:', userId);
  
  const summaries = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  const end = endDate ? new Date(endDate) : new Date();
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const summary = await getDailyNutritionSummary(userId, dateStr);
    if (summary.entryCount > 0) {
      summaries.push(summary);
    }
  }
  
  return summaries;
};

// Settings operations
export const getUserSettings = async (userId: string) => {
  console.log('[Free Mode] Getting user settings from localStorage:', userId);
  
  const settings = browserStorage.get(`settings_${userId}`) || {
    notifications: true,
    darkMode: false,
    units: 'metric',
    language: 'en'
  };
  
  return settings;
};

export const saveUserSettings = async (userId: string, settings: any): Promise<boolean> => {
  console.log('[Free Mode] Saving user settings to localStorage:', userId);
  
  return browserStorage.set(`settings_${userId}`, {
    ...settings,
    lastUpdated: new Date().toISOString()
  });
};

// Social Features (disabled in free mode)
export const searchUsers = async (query: string) => {
  console.log('[Free Mode] Social features disabled - searchUsers');
  return [];
};

export const sendViewRequest = async (fromUserId: string, toUserId: string) => {
  console.log('[Free Mode] Social features disabled - sendViewRequest');
  return false;
};

export const getIncomingViewRequests = async (userId: string) => {
  console.log('[Free Mode] Social features disabled - getIncomingViewRequests');
  return [];
};

export const acceptViewRequest = async (userId: string, requestId: string) => {
  console.log('[Free Mode] Social features disabled - acceptViewRequest');
  return false;
};

export const declineViewRequest = async (userId: string, requestId: string) => {
  console.log('[Free Mode] Social features disabled - declineViewRequest');
  return false;
};

export const getFriends = async (userId: string) => {
  console.log('[Free Mode] Social features disabled - getFriends');
  return [];
};

export const removeFriend = async (userId: string, friendId: string) => {
  console.log('[Free Mode] Social features disabled - removeFriend');
  return false;
};

// Error handling utility for compatibility
export const createFirestoreServiceError = (message: string, code: string) => {
  console.warn('[Free Mode] Firestore error simulated:', message, code);
  return new Error(`${code}: ${message}`);
};