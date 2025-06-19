
'use server';

/**
 * @fileOverview An AI agent that identifies food items and estimates their nutritional content from voice input.
 * It first lets AI identify food items and their nutrition, then attempts to override with local data if available.
 *
 * - voiceFoodLogging - A function that handles the food logging process from voice input.
 * - VoiceFoodLoggingInput - The input type for the voiceFoodLogging function.
 * - VoiceFoodLoggingOutput - The return type for the voiceFoodLogging function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { findInLocalDatabase, LocalFoodItem } from '@/data/local-food-data'; // Import local DB lookup

// Re-use or define the Nutrition schema
const NutritionSchema = z.object({
  calories: z.number().min(0).describe('Estimated calories in kcal.'),
  protein: z.number().min(0).describe('Estimated protein in grams.'),
  carbohydrates: z.number().min(0).describe('Estimated carbohydrates in grams.'),
  fat: z.number().min(0).describe('Estimated fat in grams.'),
});
export type Nutrition = z.infer<typeof NutritionSchema>;

// Input Schema
const VoiceFoodLoggingInputSchema = z.object({
  voiceRecordingDataUri: z
    .string()
    .describe(
      'A voice recording of the user describing their meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // keep the backslashes for escaping
    ),
});
export type VoiceFoodLoggingInput = z.infer<typeof VoiceFoodLoggingInputSchema>;

// Output schema: Array of identified food items with their nutrition
const VoiceFoodLoggingOutputSchema = z.object({
   foodItems: z.array(
    z.object({
      foodItem: z.string().describe('The specific name of the food item identified from the voice recording (e.g., "Bowl of Oatmeal", "Two Scrambled Eggs", "Coffee with Milk"). Be specific.'),
      nutrition: NutritionSchema.describe('The estimated nutritional information (calories, protein, carbs, fat) for this specific food item.')
    })
  )
  .min(1, "At least one food item must be identified.") // Ensure the array is not empty
  .describe('A list of distinct food items identified in the voice recording, each with its estimated nutritional content. Infer quantities and preparation methods where possible.'),
});
export type VoiceFoodLoggingOutput = z.infer<typeof VoiceFoodLoggingOutputSchema>;

// Exported wrapper function
export async function voiceFoodLogging(input: VoiceFoodLoggingInput): Promise<VoiceFoodLoggingOutput> {
  return voiceFoodLoggingFlow(input);
}

// Define the Genkit prompt
const voiceFoodPrompt = ai.definePrompt({
  name: 'voiceFoodPrompt',
  model: 'googleai/gemini-2.5-flash', // Ensure Flash model is used
  input: { schema: VoiceFoodLoggingInputSchema },
  output: { schema: VoiceFoodLoggingOutputSchema }, // AI outputs the final structure
  prompt: `You are an AI assistant expert in analyzing voice recordings of meal descriptions to accurately identify food items and estimate their nutrition.

  Listen carefully to the following voice recording where a user describes what they ate. Identify each distinct food item mentioned. Be specific with names (e.g., "Greek Yogurt" not just "Yogurt"). If you identify a common food item that likely has standard nutrition data (e.g., 'Idli', 'Apple', 'Rice'), be very precise with its name for potential database lookup.

  Infer portion sizes and preparation methods if mentioned or implied (e.g., "a large bowl", "fried", "with dressing"). Based on the identified item and inferred details, provide your BEST estimate of its nutritional content (calories, protein, carbohydrates, fat) as accurately as possible for that portion.

  Voice Recording: {{media url=voiceRecordingDataUri}}

  Return the results as a JSON object strictly matching the provided schema: an array named 'foodItems'. Each object in the array must contain:
  1.  'foodItem': A string with the specific name of the identified food.
  2.  'nutrition': An object with 'calories', 'protein', 'carbohydrates', and 'fat' as non-negative numbers.

  Example Output Format (Ensure your output matches this structure exactly):
  {
    "foodItems": [
      { "foodItem": "Large bowl of oatmeal with blueberries", "nutrition": { "calories": 350, "protein": 10, "carbohydrates": 60, "fat": 8 } },
      { "foodItem": "Black coffee", "nutrition": { "calories": 2, "protein": 0, "carbohydrates": 0, "fat": 0 } }
    ]
  }

  Return ONLY the valid JSON object conforming to the schema. Do not add any explanations or introductory text. Ensure all nutritional values are non-negative numbers. If you cannot identify any food items, return an empty 'foodItems' array: { "foodItems": [] } (though the schema requires at least one). Try your best to identify at least one item.`,
});

// Define the Genkit flow
const voiceFoodLoggingFlow = ai.defineFlow<
  typeof VoiceFoodLoggingInputSchema,
  typeof VoiceFoodLoggingOutputSchema
>({
  name: 'voiceFoodLoggingFlow',
  inputSchema: VoiceFoodLoggingInputSchema,
  outputSchema: VoiceFoodLoggingOutputSchema,
}, async input => {
  const { output: aiOutput } = await voiceFoodPrompt(input);

   if (!aiOutput || !aiOutput.foodItems || aiOutput.foodItems.length === 0) {
       throw new Error("AI failed to identify any food items or provide valid nutrition data from the voice recording.");
   }

   const processedFoodItems = aiOutput.foodItems.map(item => {
       const normalizedFoodName = item.foodItem.toLowerCase().trim();
       const localMatch: LocalFoodItem | null = findInLocalDatabase(normalizedFoodName);

       let finalNutrition: Nutrition;

       if (localMatch) {
            console.log(`[Voice Food Log] Found local match for "${item.foodItem}" as "${localMatch.displayName}". Overriding AI nutrition.`);
           finalNutrition = {
               calories: Math.max(0, Math.round(localMatch.nutrition.calories)),
               protein: Math.max(0, parseFloat(localMatch.nutrition.protein.toFixed(1))),
               carbohydrates: Math.max(0, parseFloat(localMatch.nutrition.carbohydrates.toFixed(1))),
               fat: Math.max(0, parseFloat(localMatch.nutrition.fat.toFixed(1))),
           };
       } else {
            console.log(`[Voice Food Log] No local match for "${item.foodItem}". Using AI estimated nutrition.`);
           finalNutrition = {
               calories: Math.max(0, Math.round(item.nutrition.calories)),
               protein: Math.max(0, parseFloat(item.nutrition.protein.toFixed(1))),
               carbohydrates: Math.max(0, parseFloat(item.nutrition.carbohydrates.toFixed(1))),
               fat: Math.max(0, parseFloat(item.nutrition.fat.toFixed(1))),
           };
       }
       return { foodItem: item.foodItem, nutrition: finalNutrition };
   });

   return { foodItems: processedFoodItems };
});

