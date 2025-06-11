'use server';
/**
 * @fileOverview Calculates personalized daily nutritional targets and activity calorie burn target based on user profile data.
 * Now uses mathematical formulas instead of AI for faster, more accurate, and consistent results.
 *
 * - calculateDailyTargets - A function that calculates daily calorie, protein, carb, fat, and activity calorie targets.
 * - CalculateTargetsInput - The input type for the calculateDailyTargets function.
 * - CalculateTargetsOutput - The return type for the calculateDailyTargets function.
 */

import { calculateDailyTargetsMath } from '@/lib/target-calculation';
import { z } from 'zod';

// Input schema based on Profile Page data
const CalculateTargetsInputSchema = z.object({
  height: z.coerce.number().min(1, "Height must be positive").describe("User's height in centimeters."),
  weight: z.coerce.number().min(1, "Weight must be positive").describe("User's weight in kilograms."),
  age: z.coerce.number().int().min(1, "Age must be positive").describe("User's age in years."),
  gender: z.enum(["male", "female", "other", "prefer_not_say"]).describe("User's gender."), 
  activityLevel: z.enum([
      "sedentary", 
      "lightly_active", 
      "moderately_active", 
      "very_active", 
      "extra_active" 
    ]).describe("User's physical activity level."),
   fitnessGoal: z.enum([
       "weight_loss",
       "weight_gain",
       "muscle_building",
       "recomposition", 
       "stay_fit" 
    ]).describe("User's primary fitness goal."),
   foodPreferences: z.string().optional().describe("User's food preferences or restrictions (e.g., vegetarian, allergies)."),
   foodHistory: z.string().optional().describe("User's typical diet history (e.g., high protein, low carb)."),
   localFoodStyle: z.string().optional().describe("User's preferred local food style (e.g., Tamil Nadu, South Indian)."),
});
export type CalculateTargetsInput = z.infer<typeof CalculateTargetsInputSchema>;

// Output schema for daily targets including activity calories
const CalculateTargetsOutputSchema = z.object({
  targetCalories: z.number().int().min(1).describe("Estimated daily calorie target (kcal)."),
  targetProtein: z.number().int().min(1).describe("Estimated daily protein target (grams)."),
  targetCarbs: z.number().int().min(1).describe("Estimated daily carbohydrate target (grams)."),
  targetFat: z.number().int().min(1).describe("Estimated daily fat target (grams)."),
  targetActivityCalories: z.number().int().min(0).describe("Estimated daily target calories to burn from dedicated exercise (kcal)."),
});
export type CalculateTargetsOutput = z.infer<typeof CalculateTargetsOutputSchema>;

// Main function - now uses mathematical calculations instead of AI
export async function calculateDailyTargets(input: CalculateTargetsInput): Promise<CalculateTargetsOutput> {
  // Validate inputs
  if (!input.height || !input.weight || !input.age) {
    throw new Error("Height, weight, and age are required to calculate targets.");
  }
  
  if (input.height <= 0 || input.weight <= 0 || input.age <= 0) {
    throw new Error("Height, weight, and age must be positive values.");
  }
  
  console.log("[Target Calculation] Using mathematical formulas for:", {
    gender: input.gender,
    age: input.age,
    weight: input.weight,
    height: input.height,
    activityLevel: input.activityLevel,
    fitnessGoal: input.fitnessGoal,
    localFoodStyle: input.localFoodStyle
  });
  
  try {
    // Use mathematical calculation instead of AI
    const result = calculateDailyTargetsMath({
      height: input.height,
      weight: input.weight,
      age: input.age,
      gender: input.gender,
      activityLevel: input.activityLevel,
      fitnessGoal: input.fitnessGoal,
      foodPreferences: input.foodPreferences,
      localFoodStyle: input.localFoodStyle,
    });

    // Validate results (same checks as before)
    const validatedOutput: CalculateTargetsOutput = {
      targetCalories: Math.max(input.gender === 'male' ? 1500 : 1200, Math.round(result.targetCalories)),
      targetProtein: Math.max(1, Math.round(result.targetProtein)),
      targetCarbs: Math.max(1, Math.round(result.targetCarbs)),
      targetFat: Math.max(1, Math.round(result.targetFat)),
      targetActivityCalories: Math.max(0, Math.round(result.targetActivityCalories)),
    };

    // Validation checks
    const calculatedCaloriesFromMacros = (validatedOutput.targetProtein * 4) + (validatedOutput.targetCarbs * 4) + (validatedOutput.targetFat * 9);
    const calorieDifference = Math.abs(validatedOutput.targetCalories - calculatedCaloriesFromMacros);

    if (calorieDifference > Math.max(validatedOutput.targetCalories * 0.1, 50)) { 
      console.warn("[Target Calculation] Macro calculation inconsistency:", {
        targets: validatedOutput,
        calculatedFromMacros: calculatedCaloriesFromMacros,
        difference: calorieDifference
      });
    }

    if (validatedOutput.targetProtein < 30 || validatedOutput.targetCarbs < 30 || validatedOutput.targetFat < 15) {
      console.warn("[Target Calculation] Generated potentially low macro targets:", validatedOutput);
    }
    
    if (validatedOutput.targetActivityCalories < 100 && validatedOutput.targetActivityCalories > 0) {
      console.warn("[Target Calculation] Generated low targetActivityCalories (<100):", validatedOutput.targetActivityCalories);
    }

    console.log("[Target Calculation] Mathematical calculation completed:", validatedOutput);
    return validatedOutput;
    
  } catch (error) {
    console.error("[Target Calculation] Error in mathematical calculation:", error);
    throw new Error(`Failed to calculate nutritional targets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fallback function for compatibility - calls the main function
 */
export async function calculateTargetsFlow(input: CalculateTargetsInput): Promise<CalculateTargetsOutput> {
  return calculateDailyTargets(input);
}
