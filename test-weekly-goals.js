// test-weekly-goals.js
// Test script to validate the weekly goal calculation logic

const testWeeklyGoalCalculation = () => {
  console.log("Testing Weekly Goal Calculation Logic");
  console.log("=====================================");

  // Mock daily targets from dashboard
  const mockDailyTargets = {
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFat: 67
  };

  // Calculate weekly targets (daily * 7)
  const weeklyTargets = {
    calories: mockDailyTargets.targetCalories * 7,
    protein: mockDailyTargets.targetProtein * 7,
    carbohydrates: mockDailyTargets.targetCarbs * 7,
    fat: mockDailyTargets.targetFat * 7,
  };

  console.log("Daily Targets:", mockDailyTargets);
  console.log("Weekly Targets:", weeklyTargets);

  // Mock weekly actuals (simulating 5 days of logged data)
  const weeklyActuals = {
    calories: 1800 * 5,  // 5 days of 1800 calories
    protein: 140 * 5,    // 5 days of 140g protein
    carbohydrates: 220 * 5, // 5 days of 220g carbs
    fat: 60 * 5,         // 5 days of 60g fat
  };

  console.log("Weekly Actuals:", weeklyActuals);

  // Calculate progress percentages
  const progress = {
    calories: weeklyTargets.calories > 0 ? Math.round((weeklyActuals.calories / weeklyTargets.calories) * 100) : 0,
    protein: weeklyTargets.protein > 0 ? Math.round((weeklyActuals.protein / weeklyTargets.protein) * 100) : 0,
    carbohydrates: weeklyTargets.carbohydrates > 0 ? Math.round((weeklyActuals.carbohydrates / weeklyTargets.carbohydrates) * 100) : 0,
    fat: weeklyTargets.fat > 0 ? Math.round((weeklyActuals.fat / weeklyTargets.fat) * 100) : 0,
  };

  console.log("Progress Percentages:", progress);

  // Calculate overall average progress
  const averageProgress = Math.round(
    (progress.calories + progress.protein + progress.carbohydrates + progress.fat) / 4
  );

  console.log("Average Progress:", averageProgress + "%");

  // Expected results
  console.log("\nExpected Results:");
  console.log("- Calories: 64% (9000/14000)");
  console.log("- Protein: 67% (700/1050)");
  console.log("- Carbs: 63% (1100/1750)");
  console.log("- Fat: 64% (300/469)");
  console.log("- Average: 64%");

  // Validation
  const isValid = 
    progress.calories === 64 &&
    progress.protein === 67 &&
    progress.carbohydrates === 63 &&
    progress.fat === 64 &&
    averageProgress === 64;

  console.log("\nValidation:", isValid ? "✅ PASSED" : "❌ FAILED");

  return {
    weeklyTargets,
    weeklyActuals,
    progress,
    averageProgress,
    isValid
  };
};

// Test the friend weekly goal structure
const testFriendWeeklyGoalStructure = () => {
  console.log("\nTesting Friend Weekly Goal Structure");
  console.log("===================================");

  const mockFriendWeeklyGoal = {
    userId: "friend123",
    displayName: "John Doe",
    weeklyTargets: {
      calories: 14000,
      protein: 1050,
      carbohydrates: 1750,
      fat: 469,
    },
    weeklyActuals: {
      calories: 9000,
      protein: 700,
      carbohydrates: 1100,
      fat: 300,
    },
    progress: {
      calories: 64,
      protein: 67,
      carbohydrates: 63,
      fat: 64,
    },
  };

  console.log("Mock Friend Weekly Goal:", JSON.stringify(mockFriendWeeklyGoal, null, 2));

  // Test compact view data
  const nutritionData = [
    {
      name: 'Calories',
      current: mockFriendWeeklyGoal.weeklyActuals.calories,
      target: mockFriendWeeklyGoal.weeklyTargets.calories,
      progress: mockFriendWeeklyGoal.progress.calories,
      unit: '',
      shortName: 'Cal'
    },
    {
      name: 'Protein',
      current: mockFriendWeeklyGoal.weeklyActuals.protein,
      target: mockFriendWeeklyGoal.weeklyTargets.protein,
      progress: mockFriendWeeklyGoal.progress.protein,
      unit: 'g',
      shortName: 'Pro'
    },
    {
      name: 'Carbs',
      current: mockFriendWeeklyGoal.weeklyActuals.carbohydrates,
      target: mockFriendWeeklyGoal.weeklyTargets.carbohydrates,
      progress: mockFriendWeeklyGoal.progress.carbohydrates,
      unit: 'g',
      shortName: 'Carbs'
    },
    {
      name: 'Fat',
      current: mockFriendWeeklyGoal.weeklyActuals.fat,
      target: mockFriendWeeklyGoal.weeklyTargets.fat,
      progress: mockFriendWeeklyGoal.progress.fat,
      unit: 'g',
      shortName: 'Fat'
    }
  ];

  console.log("Nutrition Data for Display:", nutritionData);

  return mockFriendWeeklyGoal;
};

// Run tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testWeeklyGoalCalculation,
    testFriendWeeklyGoalStructure
  };
} else {
  // Browser environment
  testWeeklyGoalCalculation();
  testFriendWeeklyGoalStructure();
}
