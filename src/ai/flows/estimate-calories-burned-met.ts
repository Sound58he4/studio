'use server';
/**
 * @fileOverview Estimates calories burned for a specific exercise based on its details and user profile.
 * Now uses MET-based calculations instead of AI for faster, more accurate results.
 *
 * - estimateCaloriesBurned - Function to estimate calories burned.
 * - EstimateCaloriesBurnedInput - Input type for the function.
 * - EstimateCaloriesBurnedOutput - Return type for the function.
 */

import { estimateCaloriesBurnedMET } from '@/lib/calorie-calculation';
import { z } from 'zod';

// Input schema for the flow (keeping same interface for compatibility)
const EstimateCaloriesBurnedInputSchema = z.object({
  exerciseName: z.string().min(1, "Exercise name is required."),
  exerciseType: z.enum(["cardio", "strength", "flexibility", "other"]).describe("Type of exercise."),
  duration: z.number().min(0).optional().describe("Duration of the exercise in minutes (primary for cardio/flexibility)."),
  distance: z.number().min(0).optional().describe("Distance covered in km/miles (relevant for cardio)."),
  sets: z.number().int().min(0).optional().describe("Number of sets (relevant for strength)."),
  reps: z.number().int().min(0).optional().describe("Number of repetitions per set (relevant for strength)."),
  weight: z.number().min(0).optional().describe("Weight used in kg/lbs (relevant for strength)."),
  userWeight: z.coerce.number().min(1, "User weight is required for estimation.").describe("User's body weight in kilograms."),
  notes: z.string().optional().describe("Any additional notes about intensity or variations."),
});
export type EstimateCaloriesBurnedInput = z.infer<typeof EstimateCaloriesBurnedInputSchema>;

// Output schema
const EstimateCaloriesBurnedOutputSchema = z.object({
  estimatedCalories: z.number().min(0).describe("Estimated calories burned during the exercise session (kcal)."),
});
export type EstimateCaloriesBurnedOutput = z.infer<typeof EstimateCaloriesBurnedOutputSchema>;

// Main function - now uses MET-based calculation instead of AI
export async function estimateCaloriesBurned(input: EstimateCaloriesBurnedInput): Promise<EstimateCaloriesBurnedOutput> {
  // Basic validation
  if (!input.userWeight) {
    throw new Error("User weight is required to estimate calories burned.");
  }
  
  console.log("[Calorie Estimation] Using MET-based calculation for:", input.exerciseName);
  
  try {
    // Use MET-based calculation instead of AI
    const result = estimateCaloriesBurnedMET({
      exerciseName: input.exerciseName,
      exerciseType: input.exerciseType,
      duration: input.duration,
      sets: input.sets,
      reps: input.reps,
      weight: input.weight,
      userWeight: input.userWeight,
      notes: input.notes,
    });

    // Validate result
    const validatedOutput: EstimateCaloriesBurnedOutput = {
      estimatedCalories: Math.max(0, Math.round(result.estimatedCalories)),
    };

    // Sanity checks (same as before)
    if (input.duration && input.duration < 15 && validatedOutput.estimatedCalories > 500) {
      console.warn("[Calorie Estimation] Potentially high calorie estimate for short duration:", validatedOutput, input);
    }
    if (validatedOutput.estimatedCalories > 2000 && (!input.duration || input.duration < 60)) {
      console.warn("[Calorie Estimation] Potentially very high calorie estimate detected:", validatedOutput, input);
    }

    console.log(`[Calorie Estimation] ${input.exerciseName}: ${validatedOutput.estimatedCalories} kcal`);
    return validatedOutput;
    
  } catch (error) {
    console.error("[Calorie Estimation] Error in MET calculation:", error);
    
    // Fallback calculation if MET fails
    const fallbackCalories = calculateFallbackCalories(input);
    return { estimatedCalories: fallbackCalories };
  }
}

/**
 * Simple fallback calculation if MET system fails
 */
function calculateFallbackCalories(input: EstimateCaloriesBurnedInput): number {
  const { exerciseType, userWeight, duration, sets, reps } = input;
  
  // Basic calories per minute based on exercise type and user weight
  let caloriesPerMinute: number;
  
  switch (exerciseType) {
    case 'cardio':
      caloriesPerMinute = userWeight * 0.1; // ~6 kcal/min for 70kg person
      break;
    case 'strength':
      caloriesPerMinute = userWeight * 0.07; // ~5 kcal/min for 70kg person
      break;
    case 'flexibility':
      caloriesPerMinute = userWeight * 0.035; // ~2.5 kcal/min for 70kg person
      break;
    default:
      caloriesPerMinute = userWeight * 0.06; // ~4 kcal/min for 70kg person
  }
  
  // Calculate duration
  let estimatedDuration: number;
  if (duration && duration > 0) {
    estimatedDuration = duration;
  } else if (sets && reps) {
    // Estimate duration for strength: 2.5 sec per rep + 90 sec rest between sets
    estimatedDuration = ((sets * reps * 2.5) + ((sets - 1) * 90)) / 60;
  } else {
    // Default durations
    estimatedDuration = exerciseType === 'cardio' ? 30 : 15;
  }
  
  const totalCalories = caloriesPerMinute * estimatedDuration;
  return Math.round(Math.max(1, totalCalories));
}
