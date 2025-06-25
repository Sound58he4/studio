// Test file for badge calculation
import { calculateBadgesAdvanced, getDayOfWeek, type DailyPointsRecord } from '../src/lib/utils/badgeCalculator';

// Test case 1: Basic 3-day streak
const testData1: DailyPointsRecord[] = [
  { date: '2025-01-01', points: 100, dayOfWeek: 3 }, // Wednesday
  { date: '2025-01-02', points: 100, dayOfWeek: 4 }, // Thursday  
  { date: '2025-01-03', points: 100, dayOfWeek: 5 }, // Friday
];

// Test case 2: Including a Sunday (should be skipped)
const testData2: DailyPointsRecord[] = [
  { date: '2025-01-01', points: 100, dayOfWeek: 3 }, // Wednesday
  { date: '2025-01-02', points: 100, dayOfWeek: 4 }, // Thursday  
  { date: '2025-01-03', points: 100, dayOfWeek: 5 }, // Friday
  { date: '2025-01-04', points: 50, dayOfWeek: 6 },  // Saturday - below threshold
  { date: '2025-01-05', points: 200, dayOfWeek: 0 }, // Sunday - should be skipped
  { date: '2025-01-06', points: 100, dayOfWeek: 1 }, // Monday
  { date: '2025-01-07', points: 100, dayOfWeek: 2 }, // Tuesday
  { date: '2025-01-08', points: 100, dayOfWeek: 3 }, // Wednesday
];

// Test case 3: Multiple badge streaks
const testData3: DailyPointsRecord[] = [
  { date: '2025-01-01', points: 100, dayOfWeek: 3 }, // Wed - Start first streak
  { date: '2025-01-02', points: 100, dayOfWeek: 4 }, // Thu
  { date: '2025-01-03', points: 100, dayOfWeek: 5 }, // Fri - Complete first badge
  { date: '2025-01-04', points: 50, dayOfWeek: 6 },  // Sat - Reset (below threshold)
  { date: '2025-01-05', points: 200, dayOfWeek: 0 }, // Sun - Skipped
  { date: '2025-01-06', points: 100, dayOfWeek: 1 }, // Mon - Start second streak  
  { date: '2025-01-07', points: 100, dayOfWeek: 2 }, // Tue
  { date: '2025-01-08', points: 100, dayOfWeek: 3 }, // Wed - Complete second badge
  { date: '2025-01-09', points: 100, dayOfWeek: 4 }, // Thu - Start third streak
  { date: '2025-01-10', points: 100, dayOfWeek: 5 }, // Fri
  { date: '2025-01-11', points: 100, dayOfWeek: 6 }, // Sat - Complete third badge
];

// Test case 4: Example from user requirement
const testData4: DailyPointsRecord[] = [
  { date: '2025-01-01', points: 100, dayOfWeek: 1 }, // Day 1
  { date: '2025-01-02', points: 100, dayOfWeek: 2 }, // Day 2  
  { date: '2025-01-03', points: 100, dayOfWeek: 3 }, // Day 3 - Should get 1 badge
];

// Test case 5: Broken streak example
const testData5: DailyPointsRecord[] = [
  // First 16 badges worth of data (simulated)
  ...Array.from({length: 48}, (_, i) => ({
    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
    points: 100,
    dayOfWeek: (i + 1) % 7 === 0 ? 0 : (i + 1) % 7 // Skip Sundays
  })).filter(record => record.dayOfWeek !== 0), // Remove Sundays
  
  // Days 56-58 from example
  { date: '2025-02-25', points: 100, dayOfWeek: 1 }, // Day 56
  { date: '2025-02-26', points: 100, dayOfWeek: 2 }, // Day 57
  { date: '2025-02-27', points: 10, dayOfWeek: 3 },  // Day 58 - breaks streak
];

console.log('=== Badge Calculation Tests ===\n');

console.log('Test 1 - Basic 3-day streak (should get 1 badge):');
console.log('Result:', calculateBadgesAdvanced(testData1), 'badges\n');

console.log('Test 2 - With Sunday (should get 2 badges):');
console.log('Result:', calculateBadgesAdvanced(testData2), 'badges\n');

console.log('Test 3 - Multiple streaks (should get 3 badges):');
console.log('Result:', calculateBadgesAdvanced(testData3), 'badges\n');

console.log('Test 4 - User requirement example (should get 1 badge):');
console.log('Result:', calculateBadgesAdvanced(testData4), 'badges\n');

console.log('Test 5 - Broken streak (should still be 16 badges):');
console.log('Result:', calculateBadgesAdvanced(testData5), 'badges\n');

// Test day of week calculation
console.log('=== Day of Week Tests ===');
console.log('2025-01-05 (Sunday):', getDayOfWeek('2025-01-05')); // Should be 0
console.log('2025-01-06 (Monday):', getDayOfWeek('2025-01-06')); // Should be 1
console.log('2025-01-07 (Tuesday):', getDayOfWeek('2025-01-07')); // Should be 2
