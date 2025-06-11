/**
 * @fileOverview BMR and TDEE-based nutritional target calculation system
 * Uses established formulas to calculate daily calorie, protein, carb, and fat targets
 * Replaces AI-based target calculation with mathematical precision
 */

import type { FitnessGoal, ActivityLevel, Gender } from '@/app/dashboard/types';

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// Goal-based calorie adjustments
const GOAL_ADJUSTMENTS = {
  weight_loss: -500,      // 500 calorie deficit
  weight_gain: 400,       // 400 calorie surplus
  muscle_building: 350,   // 350 calorie surplus
  recomposition: 0,       // Maintain calories
  stay_fit: -250,         // Slight deficit
};

// Target activity calories by goal and activity level
const TARGET_ACTIVITY_CALORIES = {
  weight_loss: { min: 300, max: 500 },
  weight_gain: { min: 200, max: 400 },
  muscle_building: { min: 300, max: 500 },
  recomposition: { min: 250, max: 450 },
  stay_fit: { min: 200, max: 400 },
};

interface TargetCalculationInput {
  height: number;         // cm
  weight: number;         // kg
  age: number;           // years
  gender: Gender;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
  foodPreferences?: string;
  localFoodStyle?: string;
}

interface TargetCalculationResult {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetActivityCalories: number;
  bmr: number;
  tdee: number;
  calculationDetails: {
    bmrFormula: string;
    tdeeCalculation: string;
    goalAdjustment: string;
    macroDistribution: string;
  };
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  let bmr: number;
  
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    // Use female formula for female, other, and prefer_not_say
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  
  return Math.round(bmr);
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate target calories based on fitness goal
 */
function calculateTargetCalories(tdee: number, fitnessGoal: FitnessGoal, gender: Gender): number {
  const adjustment = GOAL_ADJUSTMENTS[fitnessGoal];
  let targetCalories = tdee + adjustment;
  
  // Apply minimum calorie thresholds
  const minCalories = gender === 'male' ? 1500 : 1200;
  targetCalories = Math.max(minCalories, targetCalories);
  
  return Math.round(targetCalories);
}

/**
 * Calculate target activity calories based on goal and activity level
 */
function calculateTargetActivityCalories(fitnessGoal: FitnessGoal, activityLevel: ActivityLevel): number {
  const range = TARGET_ACTIVITY_CALORIES[fitnessGoal];
  
  // Adjust based on activity level
  let baseTarget: number;
  switch (activityLevel) {
    case 'sedentary':
      baseTarget = range.min;
      break;
    case 'lightly_active':
      baseTarget = range.min + (range.max - range.min) * 0.25;
      break;
    case 'moderately_active':
      baseTarget = range.min + (range.max - range.min) * 0.5;
      break;
    case 'very_active':
      baseTarget = range.min + (range.max - range.min) * 0.75;
      break;
    case 'extra_active':
      baseTarget = range.max;
      break;
    default:
      baseTarget = range.min + (range.max - range.min) * 0.5;
  }
  
  return Math.round(baseTarget);
}

/**
 * Calculate macronutrient targets based on calories and fitness goal
 */
function calculateMacronutrients(
  targetCalories: number, 
  weight: number, 
  fitnessGoal: FitnessGoal,
  localFoodStyle?: string
): { protein: number; carbs: number; fat: number } {
  
  // Protein target: 1.6 - 2.2g per kg body weight
  let proteinPerKg: number;
  switch (fitnessGoal) {
    case 'muscle_building':
    case 'recomposition':
      proteinPerKg = 2.2; // Higher end for muscle building
      break;
    case 'weight_loss':
      proteinPerKg = 2.0; // Higher protein for satiety and muscle preservation
      break;
    case 'weight_gain':
    case 'stay_fit':
      proteinPerKg = 1.8; // Moderate protein
      break;
    default:
      proteinPerKg = 1.8;
  }
  
  let targetProtein = weight * proteinPerKg;
  
  // Ensure protein is 20-35% of total calories
  const minProteinCals = targetCalories * 0.20;
  const maxProteinCals = targetCalories * 0.35;
  const proteinCals = targetProtein * 4;
  
  if (proteinCals < minProteinCals) {
    targetProtein = minProteinCals / 4;
  } else if (proteinCals > maxProteinCals) {
    targetProtein = maxProteinCals / 4;
  }
  
  // Fat target: 20-35% of total calories
  let fatPercentage: number;
  switch (fitnessGoal) {
    case 'weight_loss':
      fatPercentage = 0.25; // Moderate fat for satiety
      break;
    case 'muscle_building':
    case 'weight_gain':
      fatPercentage = 0.30; // Higher fat for calories
      break;
    case 'recomposition':
    case 'stay_fit':
      fatPercentage = 0.28; // Balanced approach
      break;
    default:
      fatPercentage = 0.28;
  }
  
  // Adjust slightly for local food styles (subtle influence)
  if (localFoodStyle) {
    const styleUpper = localFoodStyle.toUpperCase();
    if (styleUpper.includes('SOUTH INDIAN') || styleUpper.includes('TAMIL') || styleUpper.includes('KERALA')) {
      // South Indian cuisine tends to be higher in carbs (rice-based)
      fatPercentage = Math.max(0.20, fatPercentage - 0.03);
    } else if (styleUpper.includes('MEDITERRANEAN') || styleUpper.includes('KETO')) {
      // Higher fat cuisines
      fatPercentage = Math.min(0.35, fatPercentage + 0.05);
    }
  }
  
  const targetFat = (targetCalories * fatPercentage) / 9;
  
  // Carbs: remaining calories
  const remainingCalories = targetCalories - (targetProtein * 4) - (targetFat * 9);
  const targetCarbs = Math.max(1, remainingCalories / 4); // Minimum 1g carbs
  
  return {
    protein: Math.round(Math.max(1, targetProtein)),
    carbs: Math.round(Math.max(1, targetCarbs)),
    fat: Math.round(Math.max(1, targetFat)),
  };
}

/**
 * Main function to calculate all nutritional targets
 */
export function calculateNutritionalTargets(input: TargetCalculationInput): TargetCalculationResult {
  const { height, weight, age, gender, activityLevel, fitnessGoal, localFoodStyle } = input;
  
  // Validate inputs
  if (height <= 0 || weight <= 0 || age <= 0) {
    throw new Error("Height, weight, and age must be positive values");
  }
  
  console.log(`[Target Calculation] Calculating targets for ${gender}, ${age}y, ${weight}kg, ${height}cm, ${activityLevel}, ${fitnessGoal}`);
  
  // Calculate BMR
  const bmr = calculateBMR(weight, height, age, gender);
  
  // Calculate TDEE
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // Calculate target calories
  const targetCalories = calculateTargetCalories(tdee, fitnessGoal, gender);
  
  // Calculate target activity calories
  const targetActivityCalories = calculateTargetActivityCalories(fitnessGoal, activityLevel);
  
  // Calculate macronutrients
  const macros = calculateMacronutrients(targetCalories, weight, fitnessGoal, localFoodStyle);
  
  // Validation checks
  const calculatedCaloriesFromMacros = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);
  const calorieDifference = Math.abs(targetCalories - calculatedCaloriesFromMacros);
  
  if (calorieDifference > Math.max(targetCalories * 0.1, 50)) {
    console.warn("[Target Calculation] Macro calculation inconsistency:", {
      targetCalories,
      calculatedFromMacros: calculatedCaloriesFromMacros,
      difference: calorieDifference,
      macros
    });
  }
  
  const result: TargetCalculationResult = {
    targetCalories,
    targetProtein: macros.protein,
    targetCarbs: macros.carbs,
    targetFat: macros.fat,
    targetActivityCalories,
    bmr,
    tdee,
    calculationDetails: {
      bmrFormula: gender === 'male' 
        ? `Men: (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) + 5 = ${bmr}`
        : `Women: (10 × ${weight}) + (6.25 × ${height}) - (5 × ${age}) - 161 = ${bmr}`,
      tdeeCalculation: `BMR (${bmr}) × Activity (${ACTIVITY_MULTIPLIERS[activityLevel]}) = ${tdee}`,
      goalAdjustment: `TDEE (${tdee}) ${GOAL_ADJUSTMENTS[fitnessGoal] >= 0 ? '+' : ''}${GOAL_ADJUSTMENTS[fitnessGoal]} (${fitnessGoal}) = ${targetCalories}`,
      macroDistribution: `P: ${macros.protein}g (${Math.round((macros.protein * 4 / targetCalories) * 100)}%), C: ${macros.carbs}g (${Math.round((macros.carbs * 4 / targetCalories) * 100)}%), F: ${macros.fat}g (${Math.round((macros.fat * 9 / targetCalories) * 100)}%)`
    }
  };
  
  console.log("[Target Calculation] Results:", result);
  return result;
}

/**
 * Function that matches the existing AI interface for compatibility
 */
export function calculateDailyTargetsMath(input: TargetCalculationInput): {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetActivityCalories: number;
} {
  const result = calculateNutritionalTargets(input);
  console.log(`[Math Calculation] ${input.fitnessGoal} targets: ${result.calculationDetails.goalAdjustment}`);
  
  return {
    targetCalories: result.targetCalories,
    targetProtein: result.targetProtein,
    targetCarbs: result.targetCarbs,
    targetFat: result.targetFat,
    targetActivityCalories: result.targetActivityCalories,
  };
}
