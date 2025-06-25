# Badge System Implementation

## Badge Calculation Rules

To earn **1 badge**, a user must:
- Gain **100+ points per day** for **3 consecutive days**
- Total of **300+ points** in 3 continuous working days
- **Sundays are excluded** from badge calculations (rest days)

## Examples

### Example 1: Basic Badge Earning
```
Day 1 (Mon) – Today's Points: 100 → Total = 100
Day 2 (Tue) – Today's Points: 100 → Total = 200  
Day 3 (Wed) – Today's Points: 100 → Total = 300 → +1 Badge
```

### Example 2: Broken Streak
```
16 Badges Previously Earned

Day 56 (Mon) – Today's Points: 100 → Total Points = 5000
Day 57 (Tue) – Today's Points: 100 → Total Points = 5100  
Day 58 (Wed) – Today's Points: 10  → Total Points = 5110
→ Still 16 Badges, no badge added (streak broken)
```

## Implementation Details

### 1. Database Structure

**New Collection**: `users/{userId}/dailyPoints/`
- **Document ID**: `YYYY-MM-DD` format
- **Fields**:
  - `date`: string (YYYY-MM-DD)
  - `points`: number (points earned that day)
  - `dayOfWeek`: number (0=Sunday, 1=Monday, etc.)
  - `lastUpdated`: string (ISO timestamp)

### 2. Badge Calculation Algorithm

```typescript
function calculateBadgesAdvanced(dailyPointsHistory: DailyPointsRecord[]): number {
  // Filter out Sundays (dayOfWeek !== 0)
  const workingDays = dailyPointsHistory.filter(record => record.dayOfWeek !== 0);
  
  let badges = 0;
  let currentStreak = 0;
  
  for (const record of workingDays) {
    if (record.points >= 100) {
      currentStreak++;
      if (currentStreak >= 3) {
        badges++;
        currentStreak = 0; // Reset for next badge
      }
    } else {
      currentStreak = 0; // Reset streak
    }
  }
  
  return badges;
}
```

### 3. Files Modified

#### Core Badge System
- `src/lib/utils/badgeCalculator.ts` - Badge calculation logic
- `src/services/firestore/dailyPointsService.ts` - Daily points tracking service

#### Data Models
- `src/app/dashboard/types.ts` - Added `badges` field to UserFriend and SearchResultUser

#### Social Features  
- `src/services/firestore/socialService.ts` - Updated to fetch and calculate badges for friends

#### UI Updates
- `src/app/friends/page.tsx` - Display badges in both mobile and desktop views

#### Documentation
- `docs/firestore-database-structure.md` - Added dailyPoints collection documentation

### 4. UI Display

**Mobile View**:
```
John Doe                          Level 5
Online • 2,500 pts • 3 badges
```

**Desktop View**:
```
John Doe                          Level 5
Active now • 2,500 pts • 3 badges

Progress Stats:
3        [Badge Icon]
Badges
```

### 5. Performance Considerations

- **Batch Badge Calculation**: Process multiple users in batches of 5 to avoid overwhelming Firestore
- **Efficient Queries**: Limit daily points history to last 365 days
- **Error Handling**: Graceful fallbacks if badge calculation fails (default to 0 badges)
- **Caching**: Badge results are calculated once per friends list load

### 6. Future Enhancements

- **Badge Notifications**: Alert users when they earn new badges
- **Badge Types**: Different badge categories (consistency, high performance, etc.)
- **Badge Leaderboards**: Compare badge counts among friends
- **Badge Progress**: Show current streak progress toward next badge
- **Custom Rest Days**: Allow users to set custom rest days beyond Sunday

## Testing

The system includes test files:
- `test-badge-calculator.js` - Tests badge calculation logic with various scenarios
- Covers edge cases like Sunday exclusions, broken streaks, and multiple badge earning

## Integration Requirements

To fully activate the badge system:

1. **Daily Points Tracking**: The points service needs to update `dailyPoints` collection whenever points are earned
2. **Badge Refresh**: Consider periodically recalculating badges for accuracy
3. **Database Indexes**: May need Firestore indexes for efficient daily points queries:
   ```
   Collection: users/{userId}/dailyPoints
   Fields: date (ascending)
   ```

## Badge Earning Flow

1. User earns points through app activities
2. Points service updates both `points/current` and `dailyPoints/{date}`
3. Badge calculation reads last 365 days of daily points
4. Algorithm finds 3-consecutive-day streaks of 100+ points (excluding Sundays)
5. Each valid streak awards 1 badge
6. Badge count is displayed in Friends page and user profiles
