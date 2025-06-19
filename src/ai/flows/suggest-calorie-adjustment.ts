'use server';
/**
 * @fileOverview Suggests calorie adjustments for the user based on their current intake, expenditure, nutritional targets, activity burn target, and fitness goal.
 *
 * - suggestCalorieAdjustment - Function to get calorie adjustment suggestions.
 * - SuggestCalorieAdjustmentInput - Input type for the function. (Now imported)
 * - SuggestCalorieAdjustmentOutput - Return type for the function. (Now imported)
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import types and schemas from the central types file
import {
    SuggestCalorieAdjustmentInputSchema,
    SuggestCalorieAdjustmentOutputSchema,
    type SuggestCalorieAdjustmentInput, 
    type SuggestCalorieAdjustmentOutput 
} from '@/app/dashboard/types';


// Exported wrapper function
export async function suggestCalorieAdjustment(input: SuggestCalorieAdjustmentInput): Promise<SuggestCalorieAdjustmentOutput> {
  // Basic validation for critical inputs
  if (!input.userId || input.targetCalories <= 0 || input.maintenanceCalories <= 0) {
    console.error("[AI Suggest Calorie Adjustment] Invalid input:", input);
    throw new Error("User ID, valid target calories, and maintenance calories are required.");
  }
  return suggestCalorieAdjustmentFlow(input);
}

const suggestCalorieAdjustmentPrompt = ai.definePrompt({
  name: 'suggestCalorieAdjustmentPrompt',
  model: 'googleai/gemini-2.5-flash', 
  input: { schema: SuggestCalorieAdjustmentInputSchema },
  output: { schema: SuggestCalorieAdjustmentOutputSchema },
  prompt: `You are Bago, an encouraging AI fitness coach. Your task is to analyze the user's current daily calorie balance and provide a clear, actionable suggestion to help them meet their *overall daily calorie target* for TODAY. The user has a separate *daily target for calories to burn from exercise*.

User's Data for Today:
- Fitness Goal: {{fitnessGoal}}
- Daily Calorie Target (for current goal): {{targetCalories}} kcal
- Estimated Daily Maintenance Calories (TDEE): {{maintenanceCalories}} kcal
- Target Exercise Calories Burned Today: {{#if targetActivityCalories}}{{targetActivityCalories}} kcal{{else}}Not specified (focus on general activity level){{/if}}
- Calories Consumed So Far: {{currentCaloriesConsumed}} kcal
- Calories Burned (from exercise) So Far: {{currentCaloriesBurned}} kcal
- General Activity Level: {{#if activityLevel}}{{activityLevel}}{{else}}Not specified{{/if}}

First, calculate the Net Caloric Intake (NCI) = (Calories Consumed So Far) - (Calories Burned So Far).
Then, determine the remaining calorie deficit or surplus needed to reach the user's \`targetCalories\` for the day.

The primary goal is to guide the user towards their \`targetCalories\`. If their \`currentCaloriesBurned\` is below their \`targetActivityCalories\` (if specified), the motivational tip can gently remind them about their exercise goal, but the main action should be about food intake unless food intake is already perfect and only activity is lagging significantly.

Generate:
1.  \`actionTitle\`: Short, direct call to action primarily focused on food (e.g., "Eat More Healthy Foods", "Stay Within Target", "Calorie Goal Met!"). It can be "More Activity" if food is on track but exercise burn is significantly low AND they are over target.
2.  \`actionValue\`: The specific number of calories for that action (e.g., amount to eat, amount to eat, amount *over* or *under* target). Null if on track.
3.  \`actionUnit\`: Unit for actionValue (e.g., "kcal to eat", "kcal to eat", "kcal over target", "kcal under target"). Null if actionValue is null.
4.  \`statusMessage\`: Brief (1 sentence) summary of current progress towards their *overall daily calorie target* ({{targetCalories}} kcal).
5.  \`motivationalTip\`: Short (1-2 sentences), supportive, relevant tip. If \`targetActivityCalories\` is set and \`currentCaloriesBurned\` is less, this tip can encourage meeting that exercise goal.

**Goal-Specific Logic (Focus on \`targetCalories\`):**

*   **weight_loss:** Target is {{targetCalories}} kcal.
    *   If NCI > {{targetCalories}}: \`actionTitle\`="Reduce Intake or Increase Activity", \`actionValue\`=(NCI - {{targetCalories}}), \`actionUnit\`="kcal over target". Status: "You've exceeded your calorie target." Tip: "Consider lighter options for your next meal. If you've met your exercise burn goal ({{targetActivityCalories}} kcal), focus on diet. If not, a bit more activity could help too!"
    *   If NCI < {{targetCalories}}: \`actionTitle\`="Continue Towards Deficit", \`actionValue\`=({{targetCalories}} - NCI), \`actionUnit\`="kcal remaining for target". Status: "You're on track to meet your calorie deficit." Tip: "Keep choosing nutrient-rich foods. Still aiming for {{targetActivityCalories}} kcal burn from exercise today?"
    *   If NCI == {{targetCalories}}: \`actionTitle\`="Deficit Met!", \`actionValue\`=null, \`actionUnit\`=null. Status: "Great job, you've hit your calorie target!" Tip: "Focus on consistency! Have you met your {{targetActivityCalories}} kcal exercise goal?"

*   **weight_gain** / **muscle_building:** Target is {{targetCalories}} kcal.
    *   If NCI < {{targetCalories}}: \`actionTitle\`="Eat More Nutrients", \`actionValue\`=({{targetCalories}} - NCI), \`actionUnit\`="kcal to eat". Status: "You need more calories to reach your surplus." Tip: "Opt for calorie-dense, nutritious foods. Also, remember your exercise goal of {{targetActivityCalories}} kcal burn."
    *   If NCI >= {{targetCalories}}: \`actionTitle\`="Surplus Met!", \`actionValue\`=(NCI - {{targetCalories}}), \`actionUnit\`="kcal surplus achieved". Status: "Excellent, you've met your surplus target!" Tip: "Focus on quality protein for muscle growth. Did you hit your {{targetActivityCalories}} kcal exercise goal?"

*   **recomposition** / **stay_fit:** Target is {{targetCalories}} kcal.
    *   Use a buffer of ~100 kcal around {{targetCalories}}.
    *   If NCI > ({{targetCalories}} + 100): \`actionTitle\`="Adjust Intake/Activity", \`actionValue\`=(NCI - {{targetCalories}}), \`actionUnit\`="kcal over target". Status: "Slightly over target, a bit more activity or lighter next meal can balance it." Tip: "If you haven't met your {{targetActivityCalories}} kcal exercise goal, now's a good time!"
    *   If NCI < ({{targetCalories}} - 100): \`actionTitle\`="Eat a Bit More", \`actionValue\`=({{targetCalories}} - NCI), \`actionUnit\`="kcal to eat". Status: "Slightly under target, consider a healthy snack." Tip: "Remember your daily exercise goal of {{targetActivityCalories}} kcal!"
    *   Else (within buffer): \`actionTitle\`="Balanced!", \`actionValue\`=null, \`actionUnit\`=null. Status: "Good balance maintained today!" Tip: "Consistency is key! Keeping up with your {{targetActivityCalories}} kcal exercise goal?"

**Important Notes:**
- All calorie values for \`actionValue\` must be positive or null.
- If \`actionValue\` is null, \`actionUnit\` must also be null.
- Motivational tip can gently remind about the \`targetActivityCalories\` if set and not met.
- Base primary action on \`targetCalories\`.

Return ONLY the valid JSON object strictly matching the output schema. Do not add explanations.
`,
});

const suggestCalorieAdjustmentFlow = ai.defineFlow<
  typeof SuggestCalorieAdjustmentInputSchema, 
  typeof SuggestCalorieAdjustmentOutputSchema 
>(
  {
    name: 'suggestCalorieAdjustmentFlow',
    inputSchema: SuggestCalorieAdjustmentInputSchema,
    outputSchema: SuggestCalorieAdjustmentOutputSchema,
  },
  async (input) => {
    console.log("[AI Flow - Suggest Calorie Adjustment] Calling prompt with input:", input);
    const { output, usage, finishReason } = await suggestCalorieAdjustmentPrompt(input);
    console.log("[AI Flow - Suggest Calorie Adjustment] AI Usage:", usage);

    if (!output || finishReason !== 'stop') {
      console.error("[AI Flow - Suggest Calorie Adjustment] AI failed to generate suggestion or response was not 'stop'. Finish Reason:", finishReason, "Output:", output);
      // Fallback response
      return {
        actionTitle: "Info Unavailable",
        actionValue: null,
        actionUnit: null,
        statusMessage: "Could not generate advice. Check targets.",
        motivationalTip: "Ensure your profile and daily targets are set correctly for personalized advice."
      };
    }
    
    console.log("[AI Flow - Suggest Calorie Adjustment] AI Raw Output:", output);

    // Validate actionValue to be non-negative if not null
    const validatedActionValue = output.actionValue !== null && output.actionValue !== undefined ? Math.max(0, Math.round(output.actionValue)) : null;
    
    const validatedOutput = {
        ...output,
        actionValue: validatedActionValue,
        actionUnit: validatedActionValue === null ? null : output.actionUnit,
    };
    
    console.log("[AI Flow - Suggest Calorie Adjustment] Validated Output:", validatedOutput);
    return validatedOutput;
  }
);
