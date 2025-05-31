// src/app/dashboard/types.ts
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import type { CalculateTargetsOutput } from '@/ai/flows/dashboard-update';

export type Gender = "male" | "female" | "other" | "prefer_not_say";
export const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" }, { value: "female", label: "Female" },
  { value: "other", label: "Other" }, { value: "prefer_not_say", label: "Prefer not to say" },
];

export type FitnessGoal = "weight_loss" | "weight_gain" | "muscle_building" | "recomposition" | "stay_fit";
export const fitnessGoalValues: [FitnessGoal, ...FitnessGoal[]] = ["weight_loss", "weight_gain", "muscle_building", "recomposition", "stay_fit"];

export type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
export const activityLevelValues: [ActivityLevel, ...ActivityLevel[]] = ["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"];

export type DietaryStyle = "vegetarian" | "non_vegetarian" | "vegan" | "eggetarian" | "jain" | "pescatarian";
export const dietaryStyleValues: DietaryStyle[] = ["vegetarian", "non_vegetarian", "vegan", "eggetarian", "jain", "pescatarian"];

export type CommonAllergy = "peanuts" | "gluten" | "dairy" | "soy" | "shellfish";
export const commonAllergyValues: CommonAllergy[] = ["peanuts", "gluten", "dairy", "soy", "shellfish"];

export type ProgressViewPermission = 'private' | 'request_only' | 'public';
export const progressViewPermissionValues: ProgressViewPermission[] = ['private', 'request_only', 'public'];

export type TranslatePreference = 'en' | 'ta-Latn' | 'ta';
export const translatePreferenceOptions: { value: TranslatePreference; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ta-Latn', label: 'Tamil (Latin Script)' },
    { value: 'ta', label: 'Tamil (Tamil Script)' },
];

export interface AppSettings {
  theme?: 'light' | 'dark' | 'system';
  progressViewPermission?: ProgressViewPermission;
}

export interface StoredUserProfile {
  email?: string | null;
  displayName?: string | null;
  lowercaseDisplayName?: string | null;
  photoURL?: string | null;
  height?: number | null;
  weight?: number | null;
  age?: number | null;
  gender?: Gender | null;
  fitnessGoal?: FitnessGoal | null;
  activityLevel?: ActivityLevel | null;
  preferFewerRestDays?: boolean;
  foodPreferences?: string;
  foodHistory?: string; // For AI context, if ever needed
  localFoodStyle?: string;
  dietaryStyles?: DietaryStyle[];
  allergies?: CommonAllergy[];
  otherAllergies?: string;
  foodDislikes?: string;
  useAiTargets?: boolean;
  manualTargetCalories?: number | null;
  manualTargetProtein?: number | null;
  manualTargetCarbs?: number | null;
  manualTargetFat?: number | null;
  manualTargetActivityCalories?: number | null;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFat?: number | null;
  targetActivityCalories?: number | null;
  maintenanceCalories?: number | null;
  settings?: AppSettings;
  translatePreference?: TranslatePreference;
  isAI?: boolean;

  // Today's aggregated nutritional data, managed by logService
  todayCalories?: number;
  todayProtein?: number;
  todayCarbohydrates?: number;
  todayFat?: number;
  todayEntryCount?: number;
  todayLastUpdated?: Timestamp | string | null; // Firestore Timestamp on server, ISO string on client/cache
}

export interface DailyNutritionSummary {
    id?: string; // Document ID (date YYYY-MM-DD)
    totalCalories: number;
    totalProtein: number;
    totalCarbohydrates: number;
    totalFat: number;
    entryCount: number;
    lastUpdated: Timestamp | string; // ISO string on client
}

export interface StoredFoodLogEntry {
  id: string;
  foodItem: string;
  identifiedFoodName?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  timestamp: string; // ISO String
  logMethod: 'image' | 'voice' | 'manual' | 'quick_log' | 'history'; // Removed 'personal_intake'
  originalDescription?: string;
}

export interface StoredExerciseLogEntry {
  id: string;
  exerciseName: string;
  exerciseType: "cardio" | "strength" | "flexibility" | "other";
  timestamp: string; // ISO String
  duration?: number;
  distance?: number;
  sets?: number | null; // Allow null
  reps?: number | string | null; // Allow null
  weight?: number | null; // Allow null
  estimatedCaloriesBurned?: number;
  notes?: string;
}

// For writing to Firestore, timestamp can be Date or serverTimestamp
export interface FirestoreFoodLogData {
  foodItem: string;
  identifiedFoodName?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  timestamp: string | Date | Timestamp; // Allow serverTimestamp for writes, ISO string for reads/client
  logMethod: 'image' | 'voice' | 'manual' | 'quick_log' | 'history'; // Removed 'personal_intake'
  originalDescription?: string;
}

export interface FirestoreExerciseLogData {
  exerciseName: string;
  exerciseType: "cardio" | "strength" | "flexibility" | "other";
  timestamp: string | Date | Timestamp;
  duration?: number;
  distance?: number;
  sets?: number | null;
  reps?: number | string | null;
  weight?: number | null;
  estimatedCaloriesBurned?: number | null;
  notes?: string;
}

export interface CompletedWorkoutEntry {
    completed: boolean;
    loggedCalories?: number | null;
    isEstimated?: boolean | null;
    timestamp: string; // ISO string
    logId: string | null;
}

export interface CompletedWorkouts {
    [exerciseName: string]: CompletedWorkoutEntry | undefined; // Allow undefined for type safety
}

export interface PeriodTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  caloriesBurned: number;
}

export interface FitnessTipData {
    id: number;
    type: 'do' | 'dont';
    text: string;
}

export interface SearchResultUser {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  requestStatus?: 'none' | 'pending' | 'following' | 'is_self';
}

export interface ViewRequest {
  id: string; // This is the requestingUserId
  requestingUserId: string;
  requestingUserDisplayName?: string;
  requestingUserPhotoURL?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string; // ISO string
}

export interface UserFriend {
    id: string;
    displayName?: string;
    photoURL?: string | null;
    since?: string; // ISO string
    isAI?: boolean;
}

export const AI_ASSISTANT_ID = "ai_assistant";
export const aiFriendProfile: UserFriend = {
    id: AI_ASSISTANT_ID,
    displayName: 'Bago AI Assistant',
    photoURL: null, // Consider adding a default AI bot avatar URL
    isAI: true,
};

// Exercise Detail for Workout Plans
export interface ExerciseDetail {
    id?: string; // Optional: if fetched from DB, it will have an ID
    exercise: string;
    sets: number | null;
    reps: string | null; // Can be range "8-12" or duration "30s"
    notes?: string;
    youtubeLink?: string | null;
    weight?: number | null;
    restTime?: string | null; // e.g., "60s"
    rpe?: number | null; // Rate of Perceived Exertion
    tempo?: string | null; // e.g., "4010"
    tags?: string[]; // e.g., ["Compound", "Chest"]
    equipment?: string[]; // e.g., ["Barbell", "Bench"]
}

export interface WeeklyWorkoutPlan {
    Monday: ExerciseDetail[];
    Tuesday: ExerciseDetail[];
    Wednesday: ExerciseDetail[];
    Thursday: ExerciseDetail[];
    Friday: ExerciseDetail[];
    Saturday: ExerciseDetail[];
    Sunday: ExerciseDetail[];
    [key: string]: ExerciseDetail[]; // Index signature
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string; // ISO string
    isAI?: boolean;
}

// Schema for AI Calorie Adjustment Suggestion
export const SuggestCalorieAdjustmentInputSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  currentCaloriesConsumed: z.number().min(0).describe("Calories consumed so far today."),
  currentCaloriesBurned: z.number().min(0).describe("Calories burned from exercise so far today."),
  targetCalories: z.number().min(1).describe("User's daily calorie target for their goal."),
  targetActivityCalories: z.number().min(0).optional().describe("User's daily target for calories burned from exercise (kcal). If not set, AI will use general activity level to guide advice."),
  maintenanceCalories: z.number().min(1).describe("User's estimated daily maintenance calories (TDEE)."),
  fitnessGoal: z.enum(fitnessGoalValues).describe("User's primary fitness goal."),
  activityLevel: z.enum(activityLevelValues).optional().describe("User's general activity level (for contextual advice)."),
});
export type SuggestCalorieAdjustmentInput = z.infer<typeof SuggestCalorieAdjustmentInputSchema>;

export const SuggestCalorieAdjustmentOutputSchema = z.object({
  actionTitle: z.string().describe("A short, actionable title (e.g., 'Activity Needed', 'Eat More', 'On Track!')."),
  actionValue: z.number().nullable().describe("The amount of calories for the action (e.g., 300 kcal to burn/eat to reach target). Null if no specific caloric action needed."),
  actionUnit: z.string().nullable().describe("Unit for the action value (e.g., 'kcal to burn', 'kcal to eat', 'kcal deficit achieved', 'kcal surplus achieved'). Null if actionValue is null."),
  statusMessage: z.string().describe("A brief message describing the current status or progress towards the daily target (e.g., 'You're close to your deficit goal!', 'Well done on hitting your surplus!', 'Keep up the good work maintaining balance.')."),
  motivationalTip: z.string().describe("A short, contextual, and encouraging tip for the user based on their situation and goal."),
});
export type SuggestCalorieAdjustmentOutput = z.infer<typeof SuggestCalorieAdjustmentOutputSchema>;

// Weekly Exercise Summary Types
export interface WeeklyExerciseSummaryData {
    strengthWorkouts: number;
    cardioWorkouts: number;
    flexibilityWorkouts: number;
    otherWorkouts: number;
    totalCaloriesBurned: number;
    mostFrequentType?: string;
}

// Quick Log Types
export interface FirestoreQuickLogData { // This is what's written to Firestore
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  servingSizeDescription?: string;
  createdAt: Timestamp; // Firestore Timestamp for creation
}

export interface StoredQuickLogItem extends Omit<FirestoreQuickLogData, 'createdAt'> { // This is what's used in client-side state/cache
  id: string;
  createdAt: string; // ISO string on client
}

// Dashboard Page specific types
export interface DashboardData {
  userProfile: StoredUserProfile | null;
  dailyTargets: CalculateTargetsOutput | null;
  weeklyWorkoutPlan: WeeklyWorkoutPlan | null;
  completedWorkouts: CompletedWorkouts;
  dailyFoodLogs: StoredFoodLogEntry[];
  dailyExerciseLogs: StoredExerciseLogEntry[];
  allWeeklyFoodLogs: StoredFoodLogEntry[]; // Aggregated from daily summaries or full fetch
  allWeeklyExerciseLogs: StoredExerciseLogEntry[];
  calorieAdjustmentSuggestion: SuggestCalorieAdjustmentOutput | null;
  goldPointsToday: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: React.ElementType;
  currentValue: number;
  targetValue: number;
  unit: string;
  color?: 'orange' | 'red' | 'yellow' | 'green' | 'blue' | 'purple';
}

export interface DashboardMainContentProps {
    error: string | null;
    userProfile: StoredUserProfile | null;
    dailyTargets: CalculateTargetsOutput | null;
    periodTotals: PeriodTotals; // Kept for potential re-use, but direct values are preferred now
    activePeriodTab: 'daily' | 'weekly';
    setActivePeriodTab: (tab: 'daily' | 'weekly') => void;
    handleRecalculateAiTargets: () => void;
    isCalculatingTargets: boolean; // AI Target calculation specifically
    isLoadingTotals: boolean; // General loading for period totals
    weeklyWorkoutPlan: WeeklyWorkoutPlan | null;
    isGeneratingPlan: boolean;
    completedWorkouts: CompletedWorkouts;
    handleToggleWorkoutComplete: (exerciseName: string, currentStatus: boolean) => void;
    handleLogCompletedWorkout: (exercise: ExerciseDetail, burnedCalories?: number, isEstimated?: boolean) => void;
    canRegenerateWorkoutPlan: boolean;
    isEstimatingCalories?: string | null;
    estimateAndLogCalories: (exercise: ExerciseDetail) => Promise<void>;
    targetActivityCaloriesToday: number | null;
    actualBurnForDisplay: number; // This is daily total burn for the activity card
    goldPointsToday: number;
    // Removed calorieAdjustmentSuggestion and isLoadingSuggestion as CalorieBalanceCard is commented out
}
