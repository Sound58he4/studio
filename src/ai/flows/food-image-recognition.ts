
'use server';
/**
 * @fileOverview Recognizes food items in an image and estimates their nutritional content.
 * It first lets AI identify food items and their nutrition, then attempts to override with local data if available.
 *
 * - foodImageRecognition - A function that handles the food image recognition process.
 * - FoodImageRecognitionInput - The input type for the foodImageRecognition function.
 * - FoodImageRecognitionOutput - The return type for the foodImageRecognition function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { findInLocalDatabase, LocalFoodItem } from '@/data/local-food-data'; // Import local DB lookup

// Define the structure for a single food item's nutrition
const NutritionSchema = z.object({
      calories: z.number().min(0).describe('Estimated calories in kcal.'),
      protein: z.number().min(0).describe('Estimated protein in grams.'),
      carbohydrates: z.number().min(0).describe('Estimated carbohydrates in grams.'),
      fat: z.number().min(0).describe('Estimated fat in grams.'),
    });
export type Nutrition = z.infer<typeof NutritionSchema>;

// Input Schema
const FoodImageRecognitionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FoodImageRecognitionInput = z.infer<typeof FoodImageRecognitionInputSchema>;

// Output schema: Array of identified food items with their nutrition
const FoodImageRecognitionOutputSchema = z.object({
  foodItems: z
    .array(
        z.object({
            foodItem: z.string().describe('The specific name of the identified food item (e.g., "Grilled Salmon", "Steamed Broccoli", "Quinoa Salad"). Be specific.'),
            nutrition: NutritionSchema.describe('The estimated nutritional information (calories, protein, carbs, fat) for this specific food item.')
        })
    )
    .min(1, "At least one food item must be identified.") // Ensure the array is not empty
    .describe('A list of distinct food items identified in the image, each with its estimated nutritional content. Be as accurate and detailed as possible with quantities and preparation methods visible.'),
});
export type FoodImageRecognitionOutput = z.infer<typeof FoodImageRecognitionOutputSchema>;

// Exported wrapper function
export async function foodImageRecognition(input: FoodImageRecognitionInput): Promise<FoodImageRecognitionOutput> {
  return foodImageRecognitionFlow(input);
}

// Define the Genkit prompt
const foodImageRecognitionPrompt = ai.definePrompt({
  name: 'foodImageRecognitionPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17', // Ensure Flash model is used
  input: { schema: FoodImageRecognitionInputSchema },
  output: { schema: FoodImageRecognitionOutputSchema }, // AI should output the final structure directly
  prompt: `You are a highly accurate food recognition and nutrition analysis expert AI.

  Analyze the provided image of a meal meticulously. Identify each distinct food item present. Be specific with the names (e.g., "Scrambled Eggs" not just "Eggs", "Whole Wheat Toast" not just "Toast"). If you identify a common food item that likely has standard nutrition data (e.g., 'Idli', 'Apple', 'Rice'), be very precise with its name for potential database lookup.

  For EACH identified item, estimate its portion size based on visual cues (e.g., "1 cup", "4 oz", "1 slice") and then provide your BEST estimate of its nutritional content (calories, protein, carbohydrates, fat) as accurately as possible for that portion. Consider preparation methods if discernible (e.g., fried vs. grilled).

  Image: {{media url=photoDataUri}}

  Return the results as a JSON object strictly matching the provided schema: an array named 'foodItems'. Each object in the array must contain:
  1.  'foodItem': A string with the specific name of the identified food.
  2.  'nutrition': An object with 'calories', 'protein', 'carbohydrates', and 'fat' as non-negative numbers.

  Example Output Format (Ensure your output matches this structure exactly):
  {
    "foodItems": [
      { "foodItem": "Grilled Salmon Fillet (approx 4 oz)", "nutrition": { "calories": 230, "protein": 25, "carbohydrates": 0, "fat": 14 } },
      { "foodItem": "Steamed Asparagus (approx 1 cup)", "nutrition": { "calories": 40, "protein": 4, "carbohydrates": 7, "fat": 0.5 } }
    ]
  }

  Return ONLY the valid JSON object conforming to the schema. Do not add any explanations or introductory text. Ensure all nutritional values are non-negative numbers. If you cannot identify any food items, return an empty 'foodItems' array: { "foodItems": [] } (though the schema requires at least one). Try your best to identify at least one item.`,
});

// Define the Genkit flow
const foodImageRecognitionFlow = ai.defineFlow<
  typeof FoodImageRecognitionInputSchema,
  typeof FoodImageRecognitionOutputSchema
>(
  {
    name: 'foodImageRecognitionFlow',
    inputSchema: FoodImageRecognitionInputSchema,
    outputSchema: FoodImageRecognitionOutputSchema,
  },
  async input => {
    const {output: aiOutput} = await foodImageRecognitionPrompt(input);

    if (!aiOutput || !aiOutput.foodItems || aiOutput.foodItems.length === 0) {
        throw new Error("AI failed to identify any food items or provide valid nutrition data from the image.");
    }

    const processedFoodItems = aiOutput.foodItems.map(item => {
        const normalizedFoodName = item.foodItem.toLowerCase().trim();
        const localMatch: LocalFoodItem | null = findInLocalDatabase(normalizedFoodName);

        let finalNutrition: Nutrition;

        if (localMatch) {
            console.log(`[Food Image Reco] Found local match for "${item.foodItem}" as "${localMatch.displayName}". Overriding AI nutrition.`);
            finalNutrition = {
                calories: Math.max(0, Math.round(localMatch.nutrition.calories)),
                protein: Math.max(0, parseFloat(localMatch.nutrition.protein.toFixed(1))),
                carbohydrates: Math.max(0, parseFloat(localMatch.nutrition.carbohydrates.toFixed(1))),
                fat: Math.max(0, parseFloat(localMatch.nutrition.fat.toFixed(1))),
            };
        } else {
            console.log(`[Food Image Reco] No local match for "${item.foodItem}". Using AI estimated nutrition.`);
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
  }
);
