'use server';
/**
 * @fileOverview Suggests relevant food items based on user profile, especially local food style and fitness goal.
 * Provides estimated nutrition and reasoning for each suggestion.
 *
 * - suggestFoodItems - Function to get food suggestions.
 * - SuggestFoodItemsInput - Input type for the function.
 * - SuggestFoodItemsOutput - Return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { getUserProfile } from '@/services/firestore'; // Import function to get profile
// Import FitnessGoal type and helper array
import type { StoredUserProfile } from '@/app/dashboard/types';
import { fitnessGoalValues } from '@/app/dashboard/types'; // Import the helper array

// Input schema for the flow (external request)
const SuggestFoodItemsInputSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  // Optional: Add current day totals later if needed for more refinement
  // currentCalories: z.number().optional(),
  // currentProtein: z.number().optional(),
});
export type SuggestFoodItemsInput = z.infer<typeof SuggestFoodItemsInputSchema>;

// Schema for estimated nutrition within a suggestion
const SuggestionNutritionSchema = z.object({
    calories: z.number().min(0).describe('Estimated calories (kcal).'),
    protein: z.number().min(0).describe('Estimated protein (g).'),
    carbohydrates: z.number().min(0).describe('Estimated carbs (g).'),
    fat: z.number().min(0).describe('Estimated fat (g).'),
    fiber: z.number().min(0).optional().describe('Estimated fiber (g).'), // Added fiber
});

// Schema for a single suggestion item
const SuggestionItemSchema = z.object({
  suggestionName: z.string().max(50, "Suggestion name is too long.").describe("Concise name of the suggested food or meal."),
  estimatedNutrition: SuggestionNutritionSchema.describe("Estimated nutritional breakdown."),
  reason: z.string().max(100, "Reason is too long.").describe("Brief reason why this food is suggested (e.g., 'High protein for muscle gain', 'Good source of fiber for weight loss'). **MUST be 100 characters or less.**"),
  quantity: z.string().optional().describe("Typical serving size or quantity (e.g., '1 bowl (approx 150g)', '2 pieces', '1 cup')."), // Added quantity field
});
export type SuggestionItem = z.infer<typeof SuggestionItemSchema>;


// Output schema - Array of suggestion items
const SuggestFoodItemsOutputSchema = z.object({
  suggestions: z.array(SuggestionItemSchema)
    .min(3, "Must provide at least 3 suggestions.")
    .max(6, "Provide at most 6 suggestions.")
    .describe("A list of 5-6 food or meal suggestions relevant to the user's profile (local cuisine, goal, dietary needs), including estimated nutrition, reasoning, and quantity."), // Updated description
});
export type SuggestFoodItemsOutput = z.infer<typeof SuggestFoodItemsOutputSchema>;


// Internal type for the flow's direct input (profile context)
// Use z.enum with the imported helper array for FitnessGoal
const FlowInputSchema = z.object({
   fitnessGoal: z.enum(fitnessGoalValues).optional().describe("User's primary fitness goal."), // Use imported values
   localFoodStyle: z.string().optional().describe("User's preferred local cuisine."),
   dietaryStyles: z.string().optional().describe("Comma-separated list of dietary styles (e.g., vegetarian, vegan)."),
   foodPreferences: z.string().optional().describe("General food preferences or notes."),
});

// Exported wrapper function
export async function suggestFoodItems(input: SuggestFoodItemsInput): Promise<SuggestFoodItemsOutput> {
  const userProfile = await getUserProfile(input.userId);

  if (!userProfile) {
      throw new Error("User profile not found. Cannot generate suggestions.");
  }

  // Extract relevant profile info for the prompt context
  const promptInput: z.infer<typeof FlowInputSchema> = {
    fitnessGoal: userProfile.fitnessGoal, // Pass the goal
    localFoodStyle: userProfile.localFoodStyle || 'Not Specified',
    dietaryStyles: Array.isArray(userProfile.dietaryStyles) ? userProfile.dietaryStyles.join(', ') : 'Not Specified',
    foodPreferences: userProfile.foodPreferences || 'None',
    // Add more context if needed, e.g., activityLevel
  };

  return suggestFoodItemsFlow(promptInput); // Pass extracted info to the flow
}

// Define the Genkit prompt
const suggestFoodPrompt = ai.definePrompt({
  name: 'suggestFoodPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17', // Use faster model
  input: { schema: FlowInputSchema }, // Input is the profile context
  output: { schema: SuggestFoodItemsOutputSchema },
  prompt: `You are a helpful and knowledgeable nutrition assistant AI specializing in suggesting healthy and goal-oriented food options tailored to user profiles.

Based on the user's profile, suggest 5-6 relevant, common, and **healthy** food or meal ideas they might want to log manually. **Prioritize suggestions that strongly align with the user's fitness goal.**

**User Context:**
- Fitness Goal: {{fitnessGoal}}
- Local Food Style Preference: {{localFoodStyle}}
- Dietary Style(s): {{dietaryStyles}}
- General Food Preferences/Notes: {{foodPreferences}}

**Instructions:**
1.  **Fitness Goal is CRUCIAL:** This should be the primary driver for suggestions.
    *   **weight_loss/toning/stay_fit:** Focus on lower-calorie, high-fiber, high-protein options (lean proteins, vegetables, whole grains, legumes). Emphasize satiety and nutrient density.
    *   **weight_gain/muscle_building:** Suggest calorie-dense and high-protein options (nuts, seeds, healthy fats, complex carbs, sufficient protein sources like meats, fish, eggs, dairy, tofu, legumes).
    *   **recomposition:** Suggest balanced meals with adequate protein (higher end, ~1.8-2.2g/kg), moderate healthy fats, and controlled complex carbs, timed around workouts if possible.
2.  **Emphasize Healthy Choices:** Prioritize whole, minimally processed foods. Limit suggestions high in added sugar, refined grains, unhealthy fats, or excessive sodium unless specifically requested or typical for the local style (and mention it in the reason as a "treat" or "occasional" item).
3.  **Leverage Local Style:** If a 'Local Food Style' is specified (and not 'Not Specified' or 'None'), **strongly** bias suggestions towards common *healthy* dishes from that cuisine that *also fit the fitness goal*. (e.g., suggest 'Ragi Dosa with Sambar' for weight loss/South Indian, 'Chicken Chettinad with Brown Rice' for muscle gain/South Indian). If style is 'none', suggest generally healthy options.
4.  **Respect Dietary Style:** Ensure suggestions *strictly* adhere to dietary restrictions (e.g., only vegetarian/vegan items if specified). Suggest appropriate protein sources based on the diet (e.g., lentils/beans/tofu for vegan protein).
5.  **Keep it Simple & Common:** Suggest common, easily loggable items, not overly complex recipes. Aim for single items or simple meal names (e.g., "Grilled Salmon with Quinoa", "Lentil Soup", "Tofu Stir-fry", "Idli with Sambar").
6.  **Output Structure:** For EACH suggestion, provide:
    *   \`suggestionName\`: The concise name (max 50 chars).
    *   \`quantity\`: A typical serving size or quantity (e.g., '1 bowl (approx 150g)', '2 pieces', '1 cup'). Be reasonably specific.
    *   \`estimatedNutrition\`: Your best estimate for calories, protein, carbs, fat, and fiber (if applicable) for that *specific quantity*.
    *   \`reason\`: A *very brief* explanation (max 100 chars) **strictly under 100 characters** linking the suggestion to the user's fitness goal and mentioning health benefits (e.g., 'High protein for muscle repair', 'Fiber aids weight loss', 'Balanced energy for recomposition'). **DO NOT EXCEED 100 CHARACTERS.**
7.  **Format:** Return ONLY the valid JSON object strictly matching the output schema with 5-6 suggestion objects in the 'suggestions' array. Do not add explanations outside the JSON structure. Ensure the 'reason' field is 100 characters or less.

Example Output (Goal: Muscle Building, Style: South Indian):
{
  "suggestions": [
    { "suggestionName": "Egg Curry with Roti", "quantity": "2 roti, 1 bowl curry (approx 200g)", "estimatedNutrition": { "calories": 450, "protein": 25, "carbohydrates": 40, "fat": 20, "fiber": 5 }, "reason": "High protein supports muscle growth, balanced meal. Fits preference." },
    { "suggestionName": "Chicken Chettinad (lean)", "quantity": "1 serving (approx 150g chicken)", "estimatedNutrition": { "calories": 500, "protein": 35, "carbohydrates": 20, "fat": 30, "fiber": 4 }, "reason": "Excellent protein source, calorie-dense for gains." },
    { "suggestionName": "Paneer Tikka", "quantity": "5-6 cubes (approx 100g)", "estimatedNutrition": { "calories": 350, "protein": 20, "carbohydrates": 15, "fat": 25, "fiber": 3 }, "reason": "Good vegetarian protein for muscle building." },
    { "suggestionName": "Fish Curry with Brown Rice", "quantity": "1 bowl rice (approx 150g), 1 serving curry", "estimatedNutrition": { "calories": 550, "protein": 30, "carbohydrates": 60, "fat": 20, "fiber": 6 }, "reason": "Lean protein & complex carbs for energy." },
    { "suggestionName": "Lentil Sambar with Idli", "quantity": "3 idli, 1 bowl sambar", "estimatedNutrition": { "calories": 400, "protein": 15, "carbohydrates": 70, "fat": 8, "fiber": 10 }, "reason": "Plant-based protein and easily digestible carbs." },
    { "suggestionName": "Masala Dosa (extra sambar)", "quantity": "1 large dosa, extra sambar", "estimatedNutrition": { "calories": 380, "protein": 8, "carbohydrates": 65, "fat": 10, "fiber": 3 }, "reason": "Common carb source, add protein side." }
  ]
}
`,
});

// Define the Genkit flow (takes profile context as input now)
const suggestFoodItemsFlow = ai.defineFlow<
  typeof FlowInputSchema, // Internal flow input
  typeof SuggestFoodItemsOutputSchema
>(
  {
    name: 'suggestFoodItemsFlow',
    inputSchema: FlowInputSchema, // Use internal schema
    outputSchema: SuggestFoodItemsOutputSchema,
  },
  async (profileContext) => {
    console.log("[Suggest Flow] Received context:", profileContext); // Log input context
    const { output } = await suggestFoodPrompt(profileContext);

    // Genkit handles schema validation automatically.
    if (!output || !output.suggestions || output.suggestions.length < 3) {
      console.warn("[Suggest Flow] AI failed to generate sufficient valid food suggestions:", output);
      // Provide some generic fallbacks if AI fails
      // Fallback suggestions should also match the structure now
      const fallbackSuggestions: SuggestionItem[] = [
          { suggestionName: "Chicken Salad", quantity: "1 bowl", estimatedNutrition: { calories: 350, protein: 30, carbohydrates: 10, fat: 20, fiber: 5 }, reason: "Balanced protein and veggies." },
          { suggestionName: "Oatmeal with Berries", quantity: "1 cup", estimatedNutrition: { calories: 300, protein: 10, carbohydrates: 55, fat: 6, fiber: 8 }, reason: "Good source of fiber and carbs." },
          { suggestionName: "Apple with Peanut Butter", quantity: "1 apple, 2 tbsp PB", estimatedNutrition: { calories: 280, protein: 8, carbohydrates: 30, fat: 16, fiber: 7 }, reason: "Healthy fats and fiber." },
          { suggestionName: "Rice Bowl with Veggies", quantity: "1 bowl", estimatedNutrition: { calories: 450, protein: 10, carbohydrates: 80, fat: 10, fiber: 6 }, reason: "Simple carb and vegetable source." },
          { suggestionName: "Scrambled Eggs", quantity: "2 eggs", estimatedNutrition: { calories: 210, protein: 13, carbohydrates: 2, fat: 16, fiber: 0 }, reason: "High protein breakfast option." },
      ];
       return { suggestions: fallbackSuggestions.slice(0, 5) }; // Return 5 fallbacks
    }

    console.log("[Suggest Flow] AI generated suggestions:", output.suggestions);
    // Truncate reason field explicitly and round nutrition
    const validatedSuggestions = output.suggestions.map(item => {
        let reason = item.reason || "Goal-aligned suggestion."; // Default reason if missing
        if (reason.length > 100) {
            console.warn(`[Suggest Flow] Truncating reason for ${item.suggestionName}: "${reason}"`);
            reason = reason.substring(0, 97) + '...';
        }
        return {
            ...item,
            reason: reason,
            estimatedNutrition: {
                calories: Math.round(item.estimatedNutrition.calories),
                protein: parseFloat(item.estimatedNutrition.protein.toFixed(1)),
                carbohydrates: parseFloat(item.estimatedNutrition.carbohydrates.toFixed(1)),
                fat: parseFloat(item.estimatedNutrition.fat.toFixed(1)),
                fiber: item.estimatedNutrition.fiber ? parseFloat(item.estimatedNutrition.fiber.toFixed(1)) : undefined,
            }
        };
    });


    return { suggestions: validatedSuggestions };
  }
);
