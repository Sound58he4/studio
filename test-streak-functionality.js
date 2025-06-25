// test-streak-functionality.js
// Run this in Node.js to test the streak calculation logic

const { format, parseISO, subDays, addDays } = require('date-fns');

// Mock data to simulate daily points
const mockDailyPoints = [
  { date: '2025-06-20', points: 15 }, // Met threshold
  { date: '2025-06-21', points: 25 }, // Met threshold
  { date: '2025-06-22', points: 5 },  // Didn't meet threshold
  { date: '2025-06-23', points: 20 }, // Met threshold (streak resets)
  { date: '2025-06-24', points: 12 }, // Met threshold
  { date: '2025-06-25', points: 18 }, // Met threshold
];

const DAILY_POINTS_THRESHOLD = 10;

function calculateStreakFromHistory(dailyHistory) {
  // Sort by date descending (most recent first)
  const sortedHistory = dailyHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastUpdatedDate = '';
  
  // Calculate current streak (from most recent day backwards)
  for (let i = 0; i < sortedHistory.length; i++) {
    const record = sortedHistory[i];
    const metThreshold = record.points >= DAILY_POINTS_THRESHOLD;
    
    if (metThreshold) {
      currentStreak++;
      if (i === 0) lastUpdatedDate = record.date;
    } else {
      break; // Streak is broken
    }
  }
  
  // Calculate longest streak (go chronologically)
  const chronologicalHistory = [...dailyHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  for (const record of chronologicalHistory) {
    const metThreshold = record.points >= DAILY_POINTS_THRESHOLD;
    
    if (metThreshold) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return {
    currentStreak,
    longestStreak,
    lastUpdatedDate
  };
}

// Test the calculation
console.log('Testing streak calculation with mock data:');
console.log('Daily Points:', mockDailyPoints);

const result = calculateStreakFromHistory(mockDailyPoints);
console.log('Result:', result);

// Expected:
// - Current streak should be 3 (June 23, 24, 25 all meet threshold)
// - Longest streak should be 3 (same as current in this case)
// - Last updated date should be 2025-06-25

console.log('\nExpected: Current streak = 3, Longest streak = 3, Last updated = 2025-06-25');
console.log('Actual:', `Current streak = ${result.currentStreak}, Longest streak = ${result.longestStreak}, Last updated = ${result.lastUpdatedDate}`);

if (result.currentStreak === 3 && result.longestStreak === 3 && result.lastUpdatedDate === '2025-06-25') {
  console.log('✅ Test PASSED!');
} else {
  console.log('❌ Test FAILED!');
}
