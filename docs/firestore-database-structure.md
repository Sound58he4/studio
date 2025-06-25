# Firebase Firestore Database Structure

> **Last Updated**: May 31, 2025  
> **Purpose**: Documentation of the current Firestore database structure for Bago Fitness AI app

## Overview

This document outlines the complete Firebase Firestore database structure used by the Bago Fitness AI application. This structure supports nutrition logging, workout planning, social features, AI chat assistance, and progress tracking.

## 📊 Database Architecture

### Root Collections

#### 1. `users/` Collection
**Document ID**: `{userId}` (Firebase Auth UID)

Each user document contains profile information, preferences, and aggregated daily nutrition data.

##### Main Document Fields

```typescript
{
  // Profile Information
  email: string | null
  displayName: string | null
  lowercaseDisplayName: string | null  // For case-insensitive search indexing
  photoURL: string | null
  height: number | null                // in cm
  weight: number | null                // in kg
  age: number | null
  gender: "male" | "female" | "other" | "prefer_not_say" | null
  
  // Fitness Goals & Activity
  fitnessGoal: "weight_loss" | "weight_gain" | "muscle_building" | "recomposition" | "stay_fit" | null
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | null
  preferFewerRestDays: boolean
  
  // Food Preferences & Restrictions
  foodPreferences: string              // Free text description
  foodHistory: string                  // AI context for food recommendations
  localFoodStyle: string               // Regional cuisine preferences
  dietaryStyles: DietaryStyle[]        // ["vegetarian", "vegan", "eggetarian", "jain", "pescatarian", "non_vegetarian"]
  allergies: CommonAllergy[]           // ["peanuts", "gluten", "dairy", "soy", "shellfish"]
  otherAllergies: string               // Custom allergies not in common list
  foodDislikes: string                 // Foods to avoid
  
  // Nutrition Targets Management
  useAiTargets: boolean                // If true, use AI-calculated targets
  
  // Manual Override Targets (when useAiTargets = false)
  manualTargetCalories: number | null
  manualTargetProtein: number | null
  manualTargetCarbs: number | null
  manualTargetFat: number | null
  manualTargetActivityCalories: number | null
  
  // Current Active Targets (calculated by AI or set manually)
  targetCalories: number | null
  targetProtein: number | null         // in grams
  targetCarbs: number | null           // in grams
  targetFat: number | null             // in grams
  targetActivityCalories: number | null // calories to burn through exercise
  maintenanceCalories: number | null   // TDEE calculation
  
  // Today's Aggregated Nutrition Data (managed by logService)
  todayCalories: number                // Running total for current day
  todayProtein: number                 // Running total for current day
  todayCarbohydrates: number           // Running total for current day
  todayFat: number                     // Running total for current day
  todayEntryCount: number              // Number of food logs today
  todayLastUpdated: Timestamp | string | null  // Last update time
  
  // Application Settings
  settings: {
    theme: "light" | "dark" | "system"
    progressViewPermission: "private" | "request_only" | "public"  // Social feature permissions
  }
  translatePreference: "en" | "ta-Latn" | "ta"  // Language preference
}
```

##### User Sub-collections

###### `users/{userId}/foodLog/` Sub-collection
**Purpose**: Individual food intake entries  
**Document ID**: Auto-generated

```typescript
{
  foodItem: string                     // Name of the food
  identifiedFoodName?: string          // AI-identified standardized name
  calories: number
  protein: number                      // in grams
  carbohydrates: number               // in grams
  fat: number                         // in grams
  timestamp: string                   // ISO string format
  logMethod: "image" | "voice" | "manual" | "quick_log" | "history"
  originalDescription?: string        // User's original input (for image/voice)
}
```

**Required Index**: `(timestamp, desc)` for efficient date range queries

###### `users/{userId}/exerciseLog/` Sub-collection
**Purpose**: Individual exercise/workout entries  
**Document ID**: Auto-generated

```typescript
{
  exerciseName: string
  exerciseType: "cardio" | "strength" | "flexibility" | "other"
  timestamp: string                   // ISO string format
  duration?: number                   // in minutes
  distance?: number                   // in km (for cardio)
  sets?: number | null               // for strength training
  reps?: number | string | null      // can be "8-12" range or "30s" duration
  weight?: number | null             // in kg (for strength training)
  estimatedCaloriesBurned?: number
  notes?: string                     // User notes
}
```

**Required Index**: `(timestamp, desc)` for efficient date range queries

###### `users/{userId}/dailyNutritionSummaries/` Sub-collection
**Purpose**: Daily aggregated nutrition data for efficient weekly/monthly queries  
**Document ID**: `YYYY-MM-DD` format

```typescript
{
  totalCalories: number
  totalProtein: number
  totalCarbohydrates: number
  totalFat: number
  entryCount: number                 // Number of food logs for this day
  lastUpdated: Timestamp
}
```

###### `users/{userId}/workoutPlan/` Sub-collection
**Purpose**: User's weekly workout plan  
**Document ID**: `current` (single document)

```typescript
{
  Monday: ExerciseDetail[]
  Tuesday: ExerciseDetail[]
  Wednesday: ExerciseDetail[]
  Thursday: ExerciseDetail[]
  Friday: ExerciseDetail[]
  Saturday: ExerciseDetail[]
  Sunday: ExerciseDetail[]
}
```

**ExerciseDetail Structure**:
```typescript
{
  exercise: string                   // Exercise name
  sets: number | null               // Number of sets
  reps: string | null               // e.g., "8-12", "30s", "AMRAP"
  notes?: string                    // Exercise notes/instructions
  youtubeLink?: string | null       // Tutorial video link
  weight?: number | null            // Weight in kg
  restTime?: string | null          // e.g., "60s", "2min"
  rpe?: number | null               // Rate of Perceived Exertion (1-10)
  tempo?: string | null             // e.g., "4010" (eccentric-pause-concentric-pause)
  tags?: string[]                   // ["Compound", "Chest", "Push"]
  equipment?: string[]              // ["Barbell", "Bench", "Dumbbell"]
}
```

###### `users/{userId}/completedWorkouts/` Sub-collection
**Purpose**: Track workout completion status by date  
**Document ID**: `YYYY-MM-DD` format

```typescript
{
  [exerciseName]: {
    completed: boolean
    timestamp: string               // ISO string when marked complete
    logId: string | null           // Reference to exerciseLog entry
    loggedCalories?: number | null  // Calories burned (if logged)
    isEstimated?: boolean | null    // Whether calories were AI-estimated
  }
}
```

###### `users/{userId}/quickLogItems/` Sub-collection
**Purpose**: User's saved quick-log food items for fast logging  
**Document ID**: Auto-generated

```typescript
{
  foodName: string
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  servingSizeDescription?: string    // e.g., "1 cup", "100g"
  createdAt: Timestamp
}
```

###### `users/{userId}/points/` Sub-collection
**Purpose**: Gamification points system  
**Document ID**: `current` (single document)

```typescript
{
  todayPoints: number               // Points earned today
  totalPoints: number               // Lifetime points
  lastUpdated: string              // ISO string
}
```

###### `users/{userId}/dailyPoints/` Sub-collection
**Purpose**: Daily points tracking for badge calculation  
**Document ID**: `YYYY-MM-DD` format

```typescript
{
  date: string                     // YYYY-MM-DD format
  points: number                   // Points earned on this day
  dayOfWeek: number               // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  lastUpdated: string             // ISO string when last updated
}
```

**Badge Calculation Rules**:
- To earn 1 badge: 100+ points per day for 3 consecutive working days
- Sundays (dayOfWeek: 0) are excluded from badge calculations
- Each 3-day consecutive streak of 100+ points earns 1 badge

###### `users/{userId}/friends/` Sub-collection
**Purpose**: User's friend connections  
**Document ID**: `{friendUserId}`

```typescript
{
  displayName?: string
  photoURL?: string | null
  since?: string                   // ISO string when friendship started
  isAI?: boolean                   // true for AI assistant
}
```

###### `users/{userId}/viewRequests/` Sub-collection
**Purpose**: Incoming friend/progress view requests  
**Document ID**: `{requestingUserId}`

```typescript
{
  requestingUserId: string
  requestingUserDisplayName?: string
  requestingUserPhotoURL?: string | null
  status: "pending" | "accepted" | "declined"
  timestamp: string               // ISO string when request was sent
}
```

#### 2. `chats/` Collection
**Purpose**: Chat conversations between users and AI assistant

##### Chat Document Structure
**Document ID Formats**:
- AI chats: `ai_{userId}`
- User-to-user chats: `{userId1}_{userId2}` (userIds sorted alphabetically)

```typescript
{
  participants: string[]           // [userId1, userId2] or [userId, "ai_assistant"]
  createdAt: Timestamp
  lastMessageTimestamp: Timestamp | null
  isAIChat: boolean               // true for AI assistant chats
}
```

##### `chats/{chatId}/messages/` Sub-collection
**Purpose**: Individual chat messages  
**Document ID**: Auto-generated

```typescript
{
  senderId: string                // userId or "ai_assistant"
  text: string                    // Message content
  timestamp: string               // ISO string
  isAI?: boolean                  // true for AI messages
}
```

## 🔧 Performance Optimizations

### Required Firestore Indexes

Based on query patterns in the codebase, these composite indexes are required:

1. **Food Log Queries**:
   ```
   Collection: users/{userId}/foodLog
   Fields: timestamp (Descending), __name__ (Ascending)
   ```

2. **Exercise Log Queries**:
   ```
   Collection: users/{userId}/exerciseLog  
   Fields: timestamp (Descending), __name__ (Ascending)
   ```

3. **User Search**:
   ```
   Collection: users
   Fields: lowercaseDisplayName (Ascending), __name__ (Ascending)
   ```

### Data Access Patterns

1. **Daily Dashboard**: Primarily uses `todayCalories`, `todayProtein`, etc. from user document + today's individual logs
2. **Weekly Reports**: Uses `dailyNutritionSummaries` collection for efficient aggregation
3. **Social Features**: Uses `lowercaseDisplayName` for case-insensitive user search
4. **Chat System**: Real-time updates using Firestore listeners on messages sub-collection

### Caching Strategy

- **LocalStorage**: User profiles cached with key `bago-user-profile-{userId}`
- **Client-side**: Daily totals cached in user profile document
- **Aggregation**: Daily summaries pre-calculated to avoid heavy queries

## 🤖 Special Constants

- **AI Assistant ID**: `"ai_assistant"`
- **AI Chat Document Prefix**: `ai_`
- **Date Format**: `YYYY-MM-DD` for daily documents
- **Timestamp Format**: ISO strings for client-side, Firestore Timestamps for server-side

## 🔐 Security Considerations

- Users can only access their own data (enforced by Firestore Security Rules)
- Social features require explicit permission via `progressViewPermission` setting
- AI chat conversations are user-specific and isolated
- Friend requests go through approval process

## 📈 Scalability Notes

1. **Daily Summaries**: Pre-aggregated data prevents expensive queries over large date ranges
2. **Pagination**: Exercise/food logs use cursor-based pagination for large datasets  
3. **Indexing**: Strategic indexes minimize query costs
4. **Denormalization**: User display names stored in multiple places for efficient lookups

## 🚀 Future Optimization Opportunities

1. **Batch Operations**: Group related writes (food log + daily summary + user profile update)
2. **Cloud Functions**: Move daily summary calculations to server-side triggers
3. **Firestore Bundles**: Pre-package common data for faster initial loads
4. **Data Archiving**: Archive old logs to separate collections for active users
5. **Search Enhancement**: Consider Algolia integration for advanced user search
6. **Real-time Features**: WebSocket or Server-Sent Events for live workout sessions

## 📝 Maintenance Notes

- **Data Migration**: Use Firestore batch operations for schema updates
- **Monitoring**: Track query performance and costs via Firebase Console
- **Backup Strategy**: Automated daily exports to Cloud Storage
- **Testing**: Use Firestore Emulator for integration tests

---

> **Note**: This structure supports approximately 10,000+ active users with current performance characteristics. For larger scale, consider the optimization opportunities listed above.
