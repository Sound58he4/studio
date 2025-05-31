'use server';
/**
 * @fileOverview Calculates personalized daily nutritional targets and activity calorie burn target based on user profile data.
 *
 * - calculateDailyTargets - A function that calculates daily calorie, protein, carb, fat, and activity calorie targets.
 * - CalculateTargetsInput - The input type for the calculateDailyTargets function.
 * - CalculateTargetsOutput - The return type for the calculateDailyTargets function.
 */

import {ai}from '@/ai/ai-instance';
import {z}from 'genkit';

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

// Exported wrapper function
export async function calculateDailyTargets(input: CalculateTargetsInput): Promise<CalculateTargetsOutput> {
  if (!input.height || !input.weight || !input.age) {
      throw new Error("Height, weight, and age are required to calculate targets.");
  }
  return calculateTargetsFlow(input);
}

// Define the Genkit prompt
const calculateTargetsPrompt = ai.definePrompt({
  name: 'calculateTargetsPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17', 
  input: { schema: CalculateTargetsInputSchema },
  output: { schema: CalculateTargetsOutputSchema },
  prompt: `You are an expert nutritionist and fitness coach AI. Your task is to calculate precise, personalized daily nutritional targets (calories, protein, carbohydrates, fat) AND a target for calories burned through dedicated exercise, for a user based on their profile.

**Calculation Steps:**

1.  **Calculate Basal Metabolic Rate (BMR):** Use the Mifflin-St Jeor equation:
    *   Men: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) + 5
    *   Women: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) - 161
    *   For "other" or "prefer_not_say" gender, use the female formula as a default or an average if appropriate, but acknowledge it.

2.  **Calculate Total Daily Energy Expenditure (TDEE):** Multiply BMR by the appropriate activity factor:
    *   sedentary: 1.2
    *   lightly_active: 1.375
    *   moderately_active: 1.55
    *   very_active: 1.725
    *   extra_active: 1.9

3.  **Adjust TDEE for Fitness Goal (Target Intake Calories):**
    *   weight_loss: TDEE - 500 calories (aim for a 15-25% deficit). Ensure calories don't drop below a safe minimum (e.g., 1200 kcal for women, 1500 kcal for men). This is the \`targetCalories\`.
    *   weight_gain: TDEE + 300 to 500 calories (aim for a 10-20% surplus). This is the \`targetCalories\`.
    *   muscle_building: TDEE + 250 to 500 calories (slight surplus focused on protein). This is the \`targetCalories\`.
    *   recomposition: TDEE (maintain calories, focus on macro split and exercise). This is the \`targetCalories\`.
    *   stay_fit: TDEE - 250 calories (slight deficit, ensure adequate protein). This is the \`targetCalories\`.

4.  **Determine Macronutrient Split (based on adjusted TDEE / \`targetCalories\`):**
    *   **Protein:** Target 1.6 - 2.2 grams per kg of body weight. Prioritize the higher end for muscle building, recomposition, and weight loss. Ensure this constitutes 20-35% of total calories.
    *   **Fat:** Target 20-35% of total calories. (Fat grams = (\`targetCalories\` * %Fat) / 9).
    *   **Carbohydrates:** Allocate the remaining calories. (Carb grams = (\`targetCalories\` - (Protein grams * 4) - (Fat grams * 9)) / 4).
    *   If {{localFoodStyle}} is specified, consider its typical macro balance subtly. For example, if it's a traditionally higher-carb cuisine like 'South Indian', you might lean towards the higher end of the carbohydrate range if it still fits the goal, but always prioritize the fitness goal and protein/fat targets first.

5.  **Calculate Target Activity Calories (\`targetActivityCalories\`):** This is the amount of calories the user should aim to burn through *dedicated exercise* per day.
    *   **weight_loss:** Suggest 300-500 kcal. This is IN ADDITION to the deficit created by diet.
    *   **weight_gain:** Suggest 200-400 kcal (from resistance training primarily).
    *   **muscle_building:** Suggest 300-500 kcal (from resistance training primarily).
    *   **recomposition:** Suggest 250-450 kcal (mix of resistance and some cardio).
    *   **stay_fit:** Suggest 200-400 kcal (general activity and some structured exercise).
    *   Base this on their \`activityLevel\` as well. A 'sedentary' person aiming for weight loss might start at 300 kcal, while a 'very_active' person might already be burning more but could target this for *structured* workouts. This field is for conscious exercise effort. If activityLevel is very high, this can be moderate (250-300), representing structured workouts on top of an active lifestyle.

6.  **Final Checks:**
    *   Ensure \`targetCalories\` is at least 1200 kcal (women or default for other/prefer_not_say) / 1500 kcal (men). Adjust upwards if calculation results in lower.
    *   Ensure all macronutrient grams are at least 1 gram.
    *   Ensure \`targetActivityCalories\` is a non-negative integer (can be 0 if AI deems it appropriate for the specific profile, e.g., extreme medical condition which is not an input here, so typically suggest at least a small amount like 100-200 for sedentary unless goal is extreme weight gain with minimal activity).
    *   Round all final targets to the nearest whole number (integer).

**User Profile:**
- Height: {{height}} cm
- Weight: {{weight}} kg
- Age: {{age}} years
- Gender: {{gender}}
- Activity Level: {{activityLevel}}
- Fitness Goal: {{fitnessGoal}}
{{#if foodPreferences}}- Food Preferences: {{foodPreferences}}{{/if}}
{{#if foodHistory}}- Diet History: {{foodHistory}}{{/if}}
{{#if localFoodStyle}}- Local Food Style: {{localFoodStyle}}{{/if}}

**Output:**
Calculate the \`targetCalories\`, \`targetProtein\`, \`targetCarbs\`, \`targetFat\`, AND \`targetActivityCalories\` based *strictly* on the steps and formulas above. Return ONLY the valid JSON object containing these five integer values, conforming exactly to the output schema. Do not add any explanations or commentary.
`,
});

// Define the Genkit flow
const calculateTargetsFlow = ai.defineFlow<
  typeof CalculateTargetsInputSchema,
  typeof CalculateTargetsOutputSchema
>(
  {
    name: 'calculateTargetsFlow',
    inputSchema: CalculateTargetsInputSchema,
    outputSchema: CalculateTargetsOutputSchema,
  },
  async (input) => {
    if (input.height <= 0 || input.weight <= 0 || input.age <= 0) {
        console.error("[AI Flow - Calc Targets] Invalid input to calculateTargetsFlow:", input);
        throw new Error("Invalid input: Height, weight, and age must be positive.");
    }

    console.log("[AI Flow - Calc Targets] Calling calculateTargetsPrompt with input:", input);
    const { output, usage, finishReason } = await calculateTargetsPrompt(input);
    console.log("[AI Flow - Calc Targets] AI Usage for Target Calculation:", usage);

    if (!output || finishReason !== 'stop' || output.targetActivityCalories === undefined) { // Check for targetActivityCalories
      console.error("[AI Flow - Calc Targets] AI failed to generate targets or response was not 'stop' or missing activity cals. Finish Reason:", finishReason, "Output:", output);
      throw new Error("AI failed to generate nutritional and activity targets. Please check your profile and try again, or contact support if the issue persists.");
    }
    
    console.log("[AI Flow - Calc Targets] AI Raw Output for Target Calculation:", output);

    const minCalories = (input.gender === 'male') ? 1500 : 1200;

    const validatedOutput = {
       targetCalories: Math.max(minCalories, Math.round(output.targetCalories)),
       targetProtein: Math.max(1, Math.round(output.targetProtein)),
       targetCarbs: Math.max(1, Math.round(output.targetCarbs)),
       targetFat: Math.max(1, Math.round(output.targetFat)),
       targetActivityCalories: Math.max(0, Math.round(output.targetActivityCalories)), // Validate activity cals
     };

     const calculatedCaloriesFromMacros = (validatedOutput.targetProtein * 4) + (validatedOutput.targetCarbs * 4) + (validatedOutput.targetFat * 9);
     const calorieDifference = Math.abs(validatedOutput.targetCalories - calculatedCaloriesFromMacros);

     if (calorieDifference > Math.max(validatedOutput.targetCalories * 0.1, 50)) { 
         console.warn("[AI Flow - Calc Targets] AI Macro calculation inconsistency:", validatedOutput, "Calculated Cals from macros:", calculatedCaloriesFromMacros, "Difference:", calorieDifference);
     }

     if (validatedOutput.targetProtein < 30 || validatedOutput.targetCarbs < 30 || validatedOutput.targetFat < 15) {
        console.warn("[AI Flow - Calc Targets] AI generated potentially low macro targets (P<30g, C<30g, or F<15g):", validatedOutput);
     }
     if (validatedOutput.targetActivityCalories < 100 && validatedOutput.targetActivityCalories > 0) {
        console.warn("[AI Flow - Calc Targets] AI generated a low targetActivityCalories (<100):", validatedOutput.targetActivityCalories);
     }


    console.log("[AI Flow - Calc Targets] Validated Nutritional and Activity Targets:", validatedOutput);
    return validatedOutput;
  }
);
