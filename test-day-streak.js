// test-day-streak.js - Test script for Day Streak functionality
// Run with: node test-day-streak.js

const testDayStreak = () => {
  console.log("=== Day Streak Calculation Test ===\n");

  // Test Case 1: Basic streak building
  console.log("Test Case 1: Basic streak building");
  let currentStreak = 0;
  let longestStreak = 0;
  
  const dailyPoints = [
    { date: '2025-01-01', points: 15 },  // meets threshold (10+)
    { date: '2025-01-02', points: 25 },  // meets threshold
    { date: '2025-01-03', points: 8 },   // doesn't meet threshold
    { date: '2025-01-04', points: 12 },  // meets threshold (new streak)
    { date: '2025-01-05', points: 20 },  // meets threshold
  ];

  dailyPoints.forEach((day, index) => {
    const meetsThreshold = day.points >= 10;
    
    if (meetsThreshold) {
      if (index === 0 || dailyPoints[index - 1].points < 10) {
        // First day or previous day didn't meet threshold - start new streak
        currentStreak = 1;
      } else {
        // Continue streak
        currentStreak++;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    
    console.log(`${day.date}: ${day.points} points -> Streak: ${currentStreak} (Longest: ${longestStreak})`);
  });

  console.log(`Final: Current Streak = ${currentStreak}, Longest Streak = ${longestStreak}\n`);

  // Test Case 2: Consecutive days with threshold
  console.log("Test Case 2: Consecutive days with 10+ points");
  currentStreak = 0;
  longestStreak = 0;
  
  const consecutiveDays = [
    { date: '2025-01-01', points: 12 },
    { date: '2025-01-02', points: 15 },
    { date: '2025-01-03', points: 18 },
    { date: '2025-01-04', points: 22 },
    { date: '2025-01-05', points: 10 },  // exactly at threshold
  ];

  consecutiveDays.forEach((day, index) => {
    const meetsThreshold = day.points >= 10;
    
    if (meetsThreshold) {
      if (index === 0 || consecutiveDays[index - 1].points < 10) {
        currentStreak = 1;
      } else {
        currentStreak++;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    
    console.log(`${day.date}: ${day.points} points -> Streak: ${currentStreak} (Longest: ${longestStreak})`);
  });

  console.log(`Final: Current Streak = ${currentStreak}, Longest Streak = ${longestStreak}\n`);

  // Test Case 3: Edge cases
  console.log("Test Case 3: Edge cases");
  
  const edgeCases = [
    { points: 9, expected: "Should not count (below threshold)" },
    { points: 10, expected: "Should count (exactly at threshold)" },
    { points: 11, expected: "Should count (above threshold)" },
    { points: 0, expected: "Should not count (zero points)" },
    { points: 100, expected: "Should count (maximum points)" },
  ];

  edgeCases.forEach((testCase) => {
    const meetsThreshold = testCase.points >= 10;
    console.log(`${testCase.points} points: ${meetsThreshold ? 'COUNTS' : 'DOES NOT COUNT'} - ${testCase.expected}`);
  });

  console.log("\n=== Day Streak Business Rules ===");
  console.log("1. Daily Points Threshold: 10+ points");
  console.log("2. Streak increases by 1 when threshold is met");
  console.log("3. Streak resets to 0 when threshold is not met");
  console.log("4. Streak is calculated based on consecutive days");
  console.log("5. Maximum daily points: 100");
  console.log("6. Minimum points for streak: 10");
  
  console.log("\n=== Implementation Notes ===");
  console.log("- Streak is updated when user's daily points change");
  console.log("- Streak data is stored in: users/{userId}/streak/current");
  console.log("- Streak is displayed on Friends page for each friend");
  console.log("- Missing days (no point updates) break the streak");
  console.log("- Streak calculation is independent of badges (which require 100+ points)");
};

// Run the test
testDayStreak();
