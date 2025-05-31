
'use server';
/**
 * @fileOverview Estimates nutritional content (calories, protein, carbs, fat) from a text description of a food item or meal.
 * It first checks a local database of common foods, and if not found, uses an AI model for estimation.
 *
 * - estimateNutritionFromText - Function to estimate nutrition from text.
 * - EstimateNutritionInput - Input type for the function.
 * - EstimateNutritionOutput - Return type for the function (matches Nutrition interface).
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { Nutrition } from '@/services/nutrition'; // Re-use the Nutrition type
import { findInLocalDatabase, LocalFoodItem } from '@/data/local-food-data'; // Import local DB lookup

// Define the Nutrition schema using Zod for input/output validation if needed within the flow
const NutritionSchema = z.object({
  calories: z.number().min(0).describe('Estimated calories in kcal.'),
  protein: z.number().min(0).describe('Estimated protein in grams.'),
  carbohydrates: z.number().min(0).describe('Estimated carbohydrates in grams.'),
  fat: z.number().min(0).describe('Estimated fat in grams.'),
});

// Input schema for the flow
const EstimateNutritionInputSchema = z.object({
  foodDescription: z.string().min(1, "Food description cannot be empty.").max(500, "Description is too long, please shorten.")
    .describe("A detailed textual description of the food item or meal, e.g., 'Large bowl of oatmeal with berries and nuts', 'Grilled chicken salad with vinaigrette', '1 apple', 'cup of black coffee'. Quantities are important."),
  localFoodStyle: z.string().optional().describe("User's typical local food style or cuisine (e.g., 'Tamil Nadu style', 'South Indian', 'Mediterranean') to help with context."),
});
export type EstimateNutritionInput = z.infer<typeof EstimateNutritionInputSchema>;

// Output schema matches the Nutrition interface (representing the TOTAL estimated nutrition for the described meal/item)
const EstimateNutritionOutputSchema = NutritionSchema;
export type EstimateNutritionOutput = Nutrition; // Use the existing Nutrition interface

// Exported wrapper function
export async function estimateNutritionFromText(input: EstimateNutritionInput): Promise<EstimateNutritionOutput> {
  const { foodDescription } = input;
  if (!foodDescription || foodDescription.trim().length === 0) {
    throw new Error("Food description is required.");
  }

  // 1. Try to find in local database (case-insensitive exact match on key)
  const normalizedDescription = foodDescription.toLowerCase().trim();
  const localMatch: LocalFoodItem | null = findInLocalDatabase(normalizedDescription);

  if (localMatch) {
    console.log(`[Estimate Nutrition] Found "${foodDescription}" in local database as "${localMatch.displayName}". Using stored values for serving: ${localMatch.servingSizeDescription}.`);
    return {
      calories: Math.max(0, Math.round(localMatch.nutrition.calories)),
      protein: Math.max(0, parseFloat(localMatch.nutrition.protein.toFixed(1))),
      carbohydrates: Math.max(0, parseFloat(localMatch.nutrition.carbohydrates.toFixed(1))),
      fat: Math.max(0, parseFloat(localMatch.nutrition.fat.toFixed(1))),
    };
  }

  // 2. If not found in local, proceed with AI estimation
  console.log(`[Estimate Nutrition] "${foodDescription}" not found in local database or did not match by key. Using AI estimation.`);
  return estimateNutritionFlow(input);
}

// Define the Genkit prompt
const estimateNutritionPrompt = ai.definePrompt({
  name: 'estimateNutritionPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17', // Use Flash model
  input: { schema: EstimateNutritionInputSchema },
  output: { schema: EstimateNutritionOutputSchema },
  prompt: `You are a highly accurate nutritional analysis AI. Given the following description of a food item or meal, and potentially the user's local food style, estimate its TOTAL nutritional content (calories, protein, carbohydrates, fat).

Food Description: {{foodDescription}}
{{#if localFoodStyle}}User's Local Food Style: {{localFoodStyle}}{{/if}}

Analyze the description carefully. Consider quantities (e.g., 'large bowl', 'two slices', '1 cup', '1 piece'), ingredients (e.g., 'berries', 'nuts', 'avocado', 'ghee', 'coconut milk'), and preparation methods (e.g., 'grilled', 'fried', 'sambar', 'kootu', 'with dressing') mentioned. Use the local food style as context if provided, as common ingredients and portion sizes can vary regionally (e.g., 'South Indian' style often uses coconut, rice).

Provide your best estimate for the *total* nutritional values for the entire description provided.

Return ONLY the JSON object strictly matching the provided schema with the estimated total 'calories', 'protein', 'carbohydrates', and 'fat'. Ensure all values are non-negative numbers. Do not add explanations or units in the response values, only in the schema descriptions.

Example Input: { foodDescription: "Large bowl of oatmeal with berries and nuts" }
Example Output: { "calories": 450, "protein": 15, "carbohydrates": 70, "fat": 15 }

Example Input: { foodDescription: "2 Idlis with Sambar" }
Example Output: { "calories": 180, "protein": 6, "carbohydrates": 35, "fat": 2 }

Example Input: { foodDescription: "Rice with sambar and potato fry", localFoodStyle: "Tamil Nadu style" }
Example Output: { "calories": 550, "protein": 12, "carbohydrates": 95, "fat": 15 }
`,
});

// Define the Genkit flow
const estimateNutritionFlow = ai.defineFlow<
  typeof EstimateNutritionInputSchema,
  typeof EstimateNutritionOutputSchema
>(
  {
    name: 'estimateNutritionFlow',
    inputSchema: EstimateNutritionInputSchema,
    outputSchema: EstimateNutritionOutputSchema,
  },
  async (input) => {
    const { output } = await estimateNutritionPrompt(input);

    if (!output) {
      throw new Error("AI failed to generate nutrition estimates for the text description.");
    }

    const validatedOutput: EstimateNutritionOutput = {
      calories: Math.max(0, Math.round(output.calories)),
      protein: Math.max(0, parseFloat(output.protein.toFixed(1))),
      carbohydrates: Math.max(0, parseFloat(output.carbohydrates.toFixed(1))),
      fat: Math.max(0, parseFloat(output.fat.toFixed(1))),
    };

     if (validatedOutput.calories > 5000 && input.foodDescription.length < 50) {
         console.warn("Potentially high calorie estimate for a short description:", validatedOutput, input.foodDescription);
     }
     if (validatedOutput.calories === 0 && validatedOutput.protein === 0 && validatedOutput.carbohydrates === 0 && validatedOutput.fat === 0 && input.foodDescription.toLowerCase() !== 'water' && !input.foodDescription.toLowerCase().includes('black coffee') && !input.foodDescription.toLowerCase().includes('zero calorie')) {
        console.warn("AI returned all zeros for nutrition on a non-zero item:", validatedOutput, input.foodDescription);
     }


    return validatedOutput;
  }
);

