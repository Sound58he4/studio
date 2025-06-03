'use server';

/**
 * @fileOverview Optimized combined food logging flow that handles identification and nutrition estimation in a single AI call
 * This reduces API calls and improves performance by combining multiple operations.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { findInLocalDatabase, LocalFoodItem } from '@/data/local-food-data';

// Reuse nutrition schema
const NutritionSchema = z.object({
  calories: z.number().min(0).describe('Estimated calories in kcal.'),
  protein: z.number().min(0).describe('Estimated protein in grams.'),
  carbohydrates: z.number().min(0).describe('Estimated carbohydrates in grams.'),
  fat: z.number().min(0).describe('Estimated fat in grams.'),
});

export type Nutrition = z.infer<typeof NutritionSchema>;

// Combined input schema for optimized processing
const OptimizedFoodLoggingInputSchema = z.object({
  foodDescription: z.string().describe('Text description of the food item(s) to identify and estimate nutrition for.'),
  batchMode: z.boolean().optional().describe('Whether to process multiple items from the description.'),
});

export type OptimizedFoodLoggingInput = z.infer<typeof OptimizedFoodLoggingInputSchema>;

// Output schema for multiple identified and processed food items
const OptimizedFoodLoggingOutputSchema = z.object({
  foodItems: z.array(
    z.object({
      identifiedFoodName: z.string().describe('The specific, standardized name of the identified food item.'),
      originalDescription: z.string().describe('The original portion of text that described this food item.'),
      nutrition: NutritionSchema.describe('Estimated nutritional information for this food item.'),
      confidence: z.number().min(0).max(1).describe('Confidence level in the identification (0-1).'),
    })
  ).min(1).describe('Array of identified food items with their nutrition data.'),
  totalNutrition: NutritionSchema.describe('Combined nutrition totals for all items.'),
});

export type OptimizedFoodLoggingOutput = z.infer<typeof OptimizedFoodLoggingOutputSchema>;

// Optimized AI prompt that combines identification and nutrition estimation
const optimizedFoodPrompt = ai.definePrompt({
  name: 'optimizedFoodPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17',
  input: { schema: OptimizedFoodLoggingInputSchema },
  output: { schema: OptimizedFoodLoggingOutputSchema },
  prompt: `You are an expert AI nutritionist that efficiently identifies food items and estimates their nutritional content in a single analysis.

**Task:** Analyze the food description and simultaneously:
1. Identify each distinct food item mentioned
2. Estimate the nutritional content for each item
3. Provide confidence scores for accuracy

**Food Description:** {{foodDescription}}

**Instructions:**
- Extract each distinct food item from the description
- For each item, provide a standardized, specific name (e.g., "Greek Yogurt with Mixed Berries" not just "yogurt")
- Estimate realistic nutritional values based on typical serving sizes mentioned or implied
- If quantities are unclear, estimate based on common portion sizes
- For local/Indian foods (idli, dosa, roti, etc.), be very precise with names for database lookup
- Assign confidence scores based on how clearly the item and portion were described

**Output Requirements:**
- Return each identified food item with its nutrition estimate
- Calculate total combined nutrition for all items
- Ensure all nutritional values are realistic and non-negative
- Use proper portion estimation (e.g., "1 medium apple" = ~180g, "1 cup rice" = ~200g cooked)

**Example Input:** "I had 2 idlis with sambar and a glass of milk"
**Example Output:**
{
  "foodItems": [
    {
      "identifiedFoodName": "Idli",
      "originalDescription": "2 idlis",
      "nutrition": { "calories": 80, "protein": 3.8, "carbohydrates": 15.8, "fat": 0.4 },
      "confidence": 0.95
    },
    {
      "identifiedFoodName": "Sambar",
      "originalDescription": "sambar",
      "nutrition": { "calories": 120, "protein": 6, "carbohydrates": 18, "fat": 3 },
      "confidence": 0.85
    },
    {
      "identifiedFoodName": "Milk",
      "originalDescription": "glass of milk",
      "nutrition": { "calories": 150, "protein": 8, "carbohydrates": 12, "fat": 8 },
      "confidence": 0.9
    }
  ],
  "totalNutrition": { "calories": 350, "protein": 17.8, "carbohydrates": 45.8, "fat": 11.4 }
}

Return ONLY the valid JSON object. No additional text or explanations.`,
});

// Define the optimized flow
const optimizedFoodLoggingFlow = ai.defineFlow<
  typeof OptimizedFoodLoggingInputSchema,
  typeof OptimizedFoodLoggingOutputSchema
>({
  name: 'optimizedFoodLoggingFlow',
  inputSchema: OptimizedFoodLoggingInputSchema,
  outputSchema: OptimizedFoodLoggingOutputSchema,
}, async (input) => {
  console.log('[Optimized Food Logging] Processing:', input.foodDescription);
  
  const { output: aiOutput } = await optimizedFoodPrompt(input);

  if (!aiOutput || !aiOutput.foodItems || aiOutput.foodItems.length === 0) {
    throw new Error("AI failed to identify any food items from the description.");
  }

  // Enhance with local database lookups
  const enhancedFoodItems = aiOutput.foodItems.map(item => {
    const normalizedName = item.identifiedFoodName.toLowerCase().trim();
    const localMatch: LocalFoodItem | null = findInLocalDatabase(normalizedName);

    if (localMatch) {
      console.log(`[Optimized Food Logging] Found local match for "${item.identifiedFoodName}" as "${localMatch.displayName}"`);
      return {
        ...item,
        identifiedFoodName: localMatch.displayName,
        nutrition: {
          calories: Math.max(0, Math.round(localMatch.nutrition.calories)),
          protein: Math.max(0, parseFloat(localMatch.nutrition.protein.toFixed(1))),
          carbohydrates: Math.max(0, parseFloat(localMatch.nutrition.carbohydrates.toFixed(1))),
          fat: Math.max(0, parseFloat(localMatch.nutrition.fat.toFixed(1))),
        },
        confidence: Math.min(1, item.confidence + 0.1), // Boost confidence for local matches
      };
    }

    // Ensure nutrition values are properly formatted
    return {
      ...item,
      nutrition: {
        calories: Math.max(0, Math.round(item.nutrition.calories)),
        protein: Math.max(0, parseFloat(item.nutrition.protein.toFixed(1))),
        carbohydrates: Math.max(0, parseFloat(item.nutrition.carbohydrates.toFixed(1))),
        fat: Math.max(0, parseFloat(item.nutrition.fat.toFixed(1))),
      },
    };
  });

  // Recalculate total nutrition
  const totalNutrition = enhancedFoodItems.reduce(
    (total, item) => ({
      calories: total.calories + item.nutrition.calories,
      protein: total.protein + item.nutrition.protein,
      carbohydrates: total.carbohydrates + item.nutrition.carbohydrates,
      fat: total.fat + item.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
  );

  return {
    foodItems: enhancedFoodItems,
    totalNutrition: {
      calories: Math.round(totalNutrition.calories),
      protein: parseFloat(totalNutrition.protein.toFixed(1)),
      carbohydrates: parseFloat(totalNutrition.carbohydrates.toFixed(1)),
      fat: parseFloat(totalNutrition.fat.toFixed(1)),
    },
  };
});

// Exported wrapper function
export async function optimizedFoodLogging(input: OptimizedFoodLoggingInput): Promise<OptimizedFoodLoggingOutput> {
  return optimizedFoodLoggingFlow(input);
}

// Batch processing helper
export async function batchProcessFoodDescriptions(descriptions: string[]): Promise<OptimizedFoodLoggingOutput[]> {
  console.log('[Optimized Food Logging] Batch processing', descriptions.length, 'descriptions');
  
  const promises = descriptions.map(description => 
    optimizedFoodLogging({ foodDescription: description, batchMode: true })
  );
  
  return Promise.all(promises);
}
