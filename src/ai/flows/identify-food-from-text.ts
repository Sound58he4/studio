
'use server';
/**
 * @fileOverview Identifies the most likely standard food item name from a free-form text description.
 * It first attempts to find a direct match in a local database. If not found, or if a more general
 * name is needed (e.g., from "2 idlis" to "Idli"), it uses AI.
 *
 * - identifyFoodFromText - Function to identify food name from text.
 * - IdentifyFoodInput - Input type for the function.
 * - IdentifyFoodOutput - Return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { findInLocalDatabase, LocalFoodItem } from '@/data/local-food-data'; // Import local DB lookup

// Input schema for the flow
const IdentifyFoodInputSchema = z.object({
  foodDescription: z.string().min(1, "Food description seems too short.").max(500, "Description is too long, please shorten.")
    .describe("A free-form textual description of the food item or meal provided by the user, e.g., 'big bowl of cereal with milk and banana slices', 'chicken curry rice', 'apple', 'black coffee', '2 idlis'."),
});
export type IdentifyFoodInput = z.infer<typeof IdentifyFoodInputSchema>;

// Output schema
const IdentifyFoodOutputSchema = z.object({
  identifiedFoodName: z.string().describe("The single, most likely standardized name of the food item identified from the description (e.g., 'Oatmeal with Berries and Nuts', 'Grilled Chicken Salad', 'Apple', 'Black Coffee', 'Idli'). Be concise and use common food names. If multiple items, provide a combined name or the most prominent one."),
  // Optional: Add a field to indicate if it was a local DB match, for UI.
  // matchedServingSize: z.string().optional().describe("Serving size if matched from local DB, e.g., 'per 1 piece'"),
});
export type IdentifyFoodOutput = z.infer<typeof IdentifyFoodOutputSchema>;

// Exported wrapper function
export async function identifyFoodFromText(input: IdentifyFoodInput): Promise<IdentifyFoodOutput> {
  const { foodDescription } = input;
  if (!foodDescription || foodDescription.trim().length === 0) {
    throw new Error("Food description is required.");
  }

  // 1. Attempt a direct match in the local database using the full description.
  // This is useful if the user types an exact key like "rava idli".
  const normalizedDescription = foodDescription.toLowerCase().trim();
  const localMatch: LocalFoodItem | null = findInLocalDatabase(normalizedDescription);

  if (localMatch) {
    console.log(`[Identify Food] Direct local match for "${foodDescription}" as "${localMatch.displayName}".`);
    // If a direct match (e.g., user typed 'idli' and 'idli' is a key), use its displayName.
    return {
      identifiedFoodName: localMatch.displayName, // Use the displayName from local DB for user clarity
      // matchedServingSize: localMatch.servingSizeDescription
    };
  }

  // 2. If no direct local match, use AI to get a standardized name.
  // The AI might interpret "2 idlis" as "Idli" or "Idlis", which is good for general naming.
  // The nutrition estimation step will then handle the quantity "2".
  console.log(`[Identify Food] No direct local match for "${foodDescription}". Using AI for name standardization.`);
  return identifyFoodFlow(input);
}

// Define the Genkit prompt
const identifyFoodPrompt = ai.definePrompt({
  name: 'identifyFoodPrompt',
  model: 'googleai/gemini-2.5-flash', // Use Flash model for faster identification
  input: { schema: IdentifyFoodInputSchema },
  output: { schema: IdentifyFoodOutputSchema },
  prompt: `You are an AI assistant specialized in food recognition from text. Given the user's description of a food item or meal, identify the single, most concise, and standardized name for that food item.

User Description: {{foodDescription}}

Analyze the description and determine the most appropriate common name.
- Focus on the primary components.
- Be concise. For example, if the input is "2 large chicken biryanis with raita", the output should be "Chicken Biryani with Raita".
- If the input is "one idli", output "Idli".
- If multiple distinct items are clearly listed (e.g., "idli and sambar"), provide a combined name like "Idli with Sambar" or the most prominent item if one stands out.

Return ONLY the JSON object strictly matching the provided output schema with the 'identifiedFoodName'. Do not add explanations or commentary.

Example Input: "Large bowl of oatmeal with berries and nuts"
Example Output: { "identifiedFoodName": "Oatmeal with Berries and Nuts" }

Example Input: "Grilled chicken salad with vinaigrette"
Example Output: { "identifiedFoodName": "Grilled Chicken Salad" }

Example Input: "two slices ww toast w scrambled egg"
Example Output: { "identifiedFoodName": "Scrambled Eggs with Whole Wheat Toast" }

Example Input: "black coffee"
Example Output: { "identifiedFoodName": "Black Coffee" }

Example Input: "2 idlis and a small bowl of sambar"
Example Output: { "identifiedFoodName": "Idli with Sambar" }
`,
});

// Define the Genkit flow
const identifyFoodFlow = ai.defineFlow<
  typeof IdentifyFoodInputSchema,
  typeof IdentifyFoodOutputSchema
>(
  {
    name: 'identifyFoodFlow',
    inputSchema: IdentifyFoodInputSchema,
    outputSchema: IdentifyFoodOutputSchema,
  },
  async (input) => {
    const { output } = await identifyFoodPrompt(input);

    if (!output || !output.identifiedFoodName) {
      throw new Error("AI failed to identify the food name from the text description.");
    }

     if (output.identifiedFoodName.length > 100) {
        console.warn("AI generated a very long food name:", output.identifiedFoodName);
     }

    return {
        identifiedFoodName: output.identifiedFoodName.trim(),
    };
  }
);