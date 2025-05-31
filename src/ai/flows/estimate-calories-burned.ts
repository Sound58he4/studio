
'use server';
/**
 * @fileOverview Estimates calories burned for a specific exercise based on its details and user profile.
 *
 * - estimateCaloriesBurned - Function to estimate calories burned.
 * - EstimateCaloriesBurnedInput - Input type for the function.
 * - EstimateCaloriesBurnedOutput - Return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Input schema for the flow
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

// Exported wrapper function
export async function estimateCaloriesBurned(input: EstimateCaloriesBurnedInput): Promise<EstimateCaloriesBurnedOutput> {
  // Basic validation
  if (!input.userWeight) {
    throw new Error("User weight is required to estimate calories burned.");
  }
  if (!input.duration && !input.sets && !input.reps) {
     console.warn("Estimating calories with limited data (no duration/sets/reps). Accuracy might be low.");
     // We can still proceed, but the AI should be aware.
  }

  return estimateCaloriesBurnedFlow(input);
}

// Define the Genkit prompt
const estimateCaloriesPrompt = ai.definePrompt({
  name: 'estimateCaloriesPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17', // Use faster model
  input: { schema: EstimateCaloriesBurnedInputSchema },
  output: { schema: EstimateCaloriesBurnedOutputSchema },
  prompt: `You are a fitness expert AI specializing in calorie expenditure estimation. Based on the provided exercise details and user weight, estimate the total calories burned for this specific workout session.

**User Information:**
- Body Weight: {{userWeight}} kg

**Exercise Details:**
- Name: {{exerciseName}}
- Type: {{exerciseType}}
{{#if duration}}- Duration: {{duration}} minutes{{/if}}
{{#if distance}}- Distance: {{distance}} km/miles{{/if}}
{{#if sets}}- Sets: {{sets}}{{/if}}
{{#if reps}}- Reps: {{reps}}{{/if}}
{{#if weight}}- Weight Used: {{weight}} kg/lbs{{/if}}
{{#if notes}}- Notes/Intensity: {{notes}}{{/if}}

**Estimation Guidelines:**
1.  Consider the **exercise type**: Cardio generally burns more per minute than strength or flexibility.
2.  Factor in **duration**: Longer sessions burn more calories.
3.  Account for **intensity**:
    *   For **cardio**: Higher distance in a given duration implies higher intensity.
    *   For **strength**: Higher sets, reps, or weight imply higher intensity and potentially more calories burned (including EPOC).
    *   Use **notes** if they provide intensity cues (e.g., 'high intensity', 'easy pace').
4.  Use the **user's weight**: Heavier individuals generally burn more calories for the same activity.
5.  Provide a **reasonable estimate** in kcal. Avoid extreme values unless the input justifies it (e.g., very long duration marathon). If crucial information like duration or sets/reps is missing, make a conservative estimate based on the exercise type and name alone, acknowledging the lower accuracy.

Return ONLY the JSON object strictly matching the output schema with the 'estimatedCalories' (non-negative number). Do not add explanations or commentary.

Example Input (Cardio): { exerciseName: "Running", exerciseType: "cardio", duration: 30, distance: 5, userWeight: 70 }
Example Output: { "estimatedCalories": 350 }

Example Input (Strength): { exerciseName: "Bench Press", exerciseType: "strength", sets: 3, reps: 10, weight: 80, userWeight: 80, duration: 20 } // Duration here might include rest
Example Output: { "estimatedCalories": 120 }

Example Input (Flexibility): { exerciseName: "Yoga", exerciseType: "flexibility", duration: 45, userWeight: 60 }
Example Output: { "estimatedCalories": 150 }
`,
});

// Define the Genkit flow
const estimateCaloriesBurnedFlow = ai.defineFlow<
  typeof EstimateCaloriesBurnedInputSchema,
  typeof EstimateCaloriesBurnedOutputSchema
>(
  {
    name: 'estimateCaloriesBurnedFlow',
    inputSchema: EstimateCaloriesBurnedInputSchema,
    outputSchema: EstimateCaloriesBurnedOutputSchema,
  },
  async (input) => {
    const { output } = await estimateCaloriesPrompt(input);

    // Genkit handles basic schema validation.
    if (!output || typeof output.estimatedCalories !== 'number') {
        // Provide a default or throw error if AI fails
        console.error("AI failed to estimate calories burned for:", input.exerciseName);
        // throw new Error("AI failed to estimate calories burned.");
        return { estimatedCalories: 0 }; // Return 0 as a fallback
    }

    // Ensure calories are non-negative and rounded
    const validatedOutput: EstimateCaloriesBurnedOutput = {
      estimatedCalories: Math.max(0, Math.round(output.estimatedCalories)),
    };

    // Optional Sanity Check (e.g., if calories seem extremely high for a short duration)
    if (input.duration && input.duration < 15 && validatedOutput.estimatedCalories > 500) {
        console.warn("Potentially high calorie estimate for short duration:", validatedOutput, input);
        // Could potentially cap or adjust here if needed
    }
    if (validatedOutput.estimatedCalories > 2000 && (!input.duration || input.duration < 60)) {
        console.warn("Potentially very high calorie estimate detected:", validatedOutput, input);
    }


    return validatedOutput;
  }
);
