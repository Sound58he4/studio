// src/ai/flows/weekly-progress-report.ts
'use server';

/**
 * @fileOverview Generates a detailed progress report for the user, analyzing nutritional intake, food choices,
 * progress trends, and providing personalized feedback for a specified period (daily, weekly, monthly).
 *
 * - generateProgressReport - Function to handle report generation.
 * - ProgressReportInput - Input type for the function.
 * - ProgressReportOutput - Return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { format } from 'date-fns';
import type { FitnessGoal, TranslatePreference } from '@/app/dashboard/types';
import { fitnessGoalValues, translatePreferenceOptions } from '@/app/dashboard/types';

// --- Input Schemas ---

const FoodLogEntrySchema = z.object({
  foodItem: z.string().describe('The name of the food item consumed.'),
  calories: z.number().optional().describe('Calories consumed for this item.'),
  protein: z.number().optional().describe('Protein consumed for this item (g).'),
  carbohydrates: z.number().optional().describe('Carbohydrates consumed for this item (g).'),
  fat: z.number().optional().describe('Fat consumed for this item (g).'),
  timestamp: z.string().optional().describe('Timestamp of consumption (ISO format).'),
});

const ExerciseLogEntrySchema = z.object({
  exerciseName: z.string().describe('Name of the exercise performed.'), 
  exerciseType: z.string().describe('Type of exercise (e.g., cardio, strength).'),
  duration: z.number().optional().describe('Duration in minutes.'),
  estimatedCaloriesBurned: z.number().optional().describe('Estimated calories burned.'), 
});

const ProgressReportInputSchema = z.object({
  userId: z.string().describe('User ID.'),
  reportType: z.enum(['daily', 'weekly', 'monthly']).describe('Report period type.'),
  startDate: z.string().describe('Start date (YYYY-MM-DD).'),
  endDate: z.string().describe('End date (YYYY-MM-DD).'),
  foodLog: z.array(FoodLogEntrySchema).describe('Food logs for the period.'),
  exerciseLog: z.array(ExerciseLogEntrySchema).optional().describe('Exercise logs (optional).'),
  targetCalories: z.number().min(1, "Target calories must be positive").describe('DAILY calorie target.'),
  targetProtein: z.number().min(1, "Target protein must be positive").describe('DAILY protein target (g).'),
  targetCarbs: z.number().min(1, "Target carbs must be positive").describe('DAILY carb target (g).'),
  targetFat: z.number().min(1, "Target fat must be positive").describe('DAILY fat target (g).'),
  fitnessGoal: z.enum(fitnessGoalValues as [FitnessGoal, ...FitnessGoal[]]).optional().describe("User's primary fitness goal (e.g., weight_loss)."),
  translatePreference: z.enum(translatePreferenceOptions.map(o => o.value) as [TranslatePreference, ...TranslatePreference[]]).optional().default('en').describe("User's preferred language for the report ('en', 'ta-Latn', 'ta')."),
});

export type ProgressReportInput = z.infer<typeof ProgressReportInputSchema>;

// --- Output Schemas (REMOVED MAXLENGTH CONSTRAINTS) ---

const MacronutrientConsumptionSchema = z.object({
    calorieAvg: z.number().optional().describe("Average daily calorie intake for the period."),
    proteinAvg: z.number().optional().describe("Average daily protein intake (g)."),
    carbsAvg: z.number().optional().describe("Average daily carbohydrate intake (g)."),
    fatAvg: z.number().optional().describe("Average daily fat intake (g)."),
    calorieTarget: z.number().describe("Daily calorie target."),
    proteinTarget: z.number().describe("Daily protein target (g)."),
    carbsTarget: z.number().describe("Daily carb target (g)."),
    fatTarget: z.number().describe("Daily fat target (g)."),
    feedback: z.string().describe("Concise feedback on macro adherence (1-2 sentences).")
});

const FoodVarietyAndHealthinessSchema = z.object({
    healthiestFoods: z.array(z.string()).max(3).describe("List up to 3 examples of healthy food items logged."),
    lessHealthyFoods: z.array(z.string()).max(3).describe("List up to 3 examples of less healthy items or areas for improvement (e.g., 'Frequent sugary snacks')."),
    feedback: z.string().describe("Brief feedback on food choices and variety (1-2 sentences).")
});

const ProgressHighlightsSchema = z.object({
    trend: z.enum(['positive', 'negative', 'neutral']).describe("Overall progress trend for the period."),
    points: z.array(z.string()).min(2).max(4).describe("2-4 bullet points highlighting specific achievements or challenges related to goals. **Must contain at least 2 points even if no data.**") 
});

const ProgressReportOutputSchema = z.object({
  reportTitle: z.string().describe('Title (e.g., "Daily Report - July 20", "Weekly Report - July 14-20").'),
  overallSummary: z.string().describe('Concise overall summary (2-3 sentences) of performance against goals.'),
  macronutrientConsumption: MacronutrientConsumptionSchema.describe("Analysis of average daily macro intake vs targets."),
  foodVarietyAndHealthiness: FoodVarietyAndHealthinessSchema.describe("Assessment of food choices logged."),
  progressHighlights: ProgressHighlightsSchema.describe("Key progress points and overall trend."),
  personalizedFeedback: z.array(z.string()).min(1).max(3).describe("1-3 specific, actionable feedback points."),
  keyImprovementAreas: z.array(z.string()).min(1).max(3).describe("1-3 key areas identified for improvement."),
  goalTimelineEstimate: z.string().describe("Brief, estimated outlook on achieving the fitness goal based on current trend (e.g., 'On track', 'Slight adjustments needed', 'Significant changes required').")
});

export type ProgressReportOutput = z.infer<typeof ProgressReportOutputSchema>;

// --- Exported Function ---
export async function generateProgressReport(input: ProgressReportInput): Promise<ProgressReportOutput> {
  if (!input.foodLog) { console.warn(`Generating report for ${input.startDate} to ${input.endDate} with no food log array (might be empty).`); }
  if (!input.targetCalories || !input.targetProtein || !input.targetCarbs || !input.targetFat) {
      throw new Error("Missing nutritional targets in input.");
  }

  return progressReportFlow(input);
}

// --- Genkit Prompt ---

const progressReportPrompt = ai.definePrompt({
  name: 'progressReportPrompt',
  model: 'googleai/gemini-2.5-flash', 
  input: { schema: ProgressReportInputSchema },
  output: { schema: ProgressReportOutputSchema }, 
  prompt: `You are Bago, an expert nutrition and fitness coach AI. Generate a detailed {{reportType}} progress report for the user based on their logs and DAILY targets for the period {{startDate}} to {{endDate}}. The user's fitness goal is {{#if fitnessGoal}}{{fitnessGoal}}{{else}}not specified{{/if}}.

**Report Language Preference:** {{translatePreference}}. 
If 'en', respond in English.
If 'ta-Latn', provide Tamil in English script (e.g., 'Vanakkam, ungal progress report idhu.').
If 'ta', use Tamil script (e.g., 'வணக்கம், உங்கள் முன்னேற்ற அறிக்கை இது.').
Default to English if the requested language is not well-supported for this detailed report.

**User's DAILY Nutritional Targets:**
*   Calories: {{targetCalories}} kcal
*   Protein: {{targetProtein}} g
*   Carbs: {{targetCarbs}} g
*   Fat: {{targetFat}} g

**User's Food Log ({{startDate}} to {{endDate}}):**
{{#if foodLog.length}} {{#each foodLog}} * [{{@index}}] {{foodItem}}: {{#if calories}}{{calories}} kcal, P:{{protein}}g, C:{{carbohydrates}}g, F:{{fat}}g {{else}} (Nutrition N/A) {{/if}} {{/each}} {{else}} * No food logged during this period. {{/if}}

**User's Exercise Log ({{startDate}} to {{endDate}}):**
{{#if exerciseLog.length}} {{#each exerciseLog}} * {{exerciseName}} ({{exerciseType}}{{#if duration}}, {{duration}} min{{/if}}{{#if estimatedCaloriesBurned}}, ~{{estimatedCaloriesBurned}} kcal{{/if}}) {{/each}} {{else}} * No exercise logged during this period. {{/if}}

**Instructions:**
1.  **Calculate Period Averages:** Determine the number of days. Calculate the **average daily** intake for calories, protein, carbs, and fat from the food log. If no food logged, averages are zero.
2.  **Generate Report Title:** Create a title indicating the report type and date range.
3.  **Generate Overall Summary:** Provide a concise summary of overall performance against **average daily** targets (calories & macros) and the user's fitness goal. Mention consistency or lack thereof. If no data, state that.
4.  **Analyze Macronutrients:** Fill the \`macronutrientConsumption\` object:
    *   Calculate \`calorieAvg\`, \`proteinAvg\`, \`carbsAvg\`, \`fatAvg\`. Handle potential division by zero if no logs.
    *   Include the daily \`calorieTarget\`, \`proteinTarget\`, \`carbsTarget\`, \`fatTarget\`.
    *   Write **concise feedback** comparing average intake to targets.
5.  **Analyze Food Variety/Healthiness:** Fill the \`foodVarietyAndHealthiness\` object:
    *   Identify up to 3 \`healthiestFoods\` examples logged (lean proteins, vegetables, whole grains).
    *   Identify up to 3 \`lessHealthyFoods\` examples logged or patterns (processed foods, sugary drinks, fried items). Be objective.
    *   Write brief \`feedback\` on dietary patterns and variety.
6.  **Highlight Progress:** Fill the \`progressHighlights\` object:
    *   Determine the overall \`trend\` ('positive', 'negative', 'neutral') towards the fitness goal based on adherence and exercise. Default to 'neutral' if insufficient data.
    *   List **exactly 2-4 specific bullet \`points\`** (achievements, consistent habits, challenges, missed targets). **IMPORTANT: If no logs are provided, you MUST still provide at least two default points like ["Consistent logging is needed to track progress.", "Start by logging at least one meal or workout."]. Do not return fewer than 2 points.** Minimum 2 points required.
7.  **Provide Actionable Feedback:** Fill the \`personalizedFeedback\` array with 1-3 specific, actionable recommendations based *directly* on the analysis (macros, food choices, progress points). Minimum 1 point required.
8.  **Identify Improvement Areas:** Fill the \`keyImprovementAreas\` array with 1-3 clear areas the user should focus on (e.g., 'Increase protein intake', 'Reduce sugary drinks', 'Log meals more consistently'). Minimum 1 point required.
9.  **Estimate Goal Timeline:** Provide a brief, realistic \`goalTimelineEstimate\` based on the period's trend (e.g., 'On track to reach goal in X weeks if current trend continues.', 'Adjustments needed to meet goal timeline.', 'More data needed for estimate.'). Be cautious and general.
10. **Tone:** Be encouraging, supportive, data-driven, and objective.
11. **Format:** Return ONLY the valid JSON object strictly conforming to the \`ProgressReportOutputSchema\`. No extra text. Pay close attention to array minimums/maximums and field requirements.

**Constraint:** If no food/exercise data is logged for the period, generate a report indicating this lack of data and encouraging logging. Populate fields appropriately (e.g., averages are 0, lists are empty or state "No data", feedback focuses on logging). **Crucially, ensure the 'progressHighlights.points' array still contains at least 2 default points.**

Generate the detailed report JSON now.
`,
});

// --- Genkit Flow ---
const progressReportFlow = ai.defineFlow<
  typeof ProgressReportInputSchema,
  typeof ProgressReportOutputSchema
>(
  {
    name: 'progressReportFlow',
    inputSchema: ProgressReportInputSchema,
    outputSchema: ProgressReportOutputSchema,
  },
  async input => {
     console.log("[Report Flow] Received input:", {
       ...input,
       foodLogCount: input.foodLog.length,
       exerciseLogCount: input.exerciseLog?.length ?? 0,
       translatePreference: input.translatePreference, // Log the preference
     });

    if (!input.targetCalories || input.targetCalories <= 0 ||
        !input.targetProtein || input.targetProtein <= 0 ||
        !input.targetCarbs || input.targetCarbs <= 0 ||
        !input.targetFat || input.targetFat <= 0) {
        console.error("[Report Flow] Invalid nutritional targets provided:", input);
        throw new Error("Invalid or missing nutritional targets. Please update your profile.");
    }

     const isNoData = input.foodLog.length === 0 && (!input.exerciseLog || input.exerciseLog.length === 0);

     if (isNoData) {
         console.log("[Report Flow] No log data found, constructing 'no data' report structure BEFORE AI call.");
         const reportTitle = `${input.reportType.charAt(0).toUpperCase() + input.reportType.slice(1)} Report: ${input.startDate} to ${input.endDate}`;
         return {
             reportTitle: reportTitle,
             overallSummary: "No food or exercise items were logged during this period. Unable to generate a detailed progress report. Log your meals and workouts to get personalized insights.",
             macronutrientConsumption: {
                 calorieAvg: 0, proteinAvg: 0, carbsAvg: 0, fatAvg: 0,
                 calorieTarget: input.targetCalories, proteinTarget: input.targetProtein, carbsTarget: input.targetCarbs, fatTarget: input.targetFat,
                 feedback: "No data to provide feedback. Start logging to unlock personalized guidance."
             },
             foodVarietyAndHealthiness: {
                 healthiestFoods: [], lessHealthyFoods: [],
                 feedback: "No food data to analyze."
             },
             progressHighlights: {
                 trend: 'neutral',
                 points: ["Consistent logging is essential to track progress.", "Start by logging at least one meal or workout each day."],
             },
             personalizedFeedback: ["Start logging your meals and exercises daily, even estimations help!"],
             keyImprovementAreas: ["Begin consistent logging.", "Explore different logging methods (text, image, voice)"],
             goalTimelineEstimate: "Cannot estimate timeline without data."
         };
     }

    const { output } = await progressReportPrompt(input);

    if (!output) {
        console.error("[Report Flow] AI failed to generate report output.");
        const errorTitle = `Error Generating ${input.reportType.charAt(0).toUpperCase() + input.reportType.slice(1)} Report`;
        return {
            reportTitle: errorTitle,
            overallSummary: "AI failed to generate the report. Please try again later.",
            macronutrientConsumption: {
                calorieAvg: undefined, proteinAvg: undefined, carbsAvg: undefined, fatAvg: undefined,
                calorieTarget: input.targetCalories, proteinTarget: input.targetProtein, carbsTarget: input.targetCarbs, fatTarget: input.targetFat,
                feedback: "AI failed to analyze macronutrient consumption."
            },
            foodVarietyAndHealthiness: {
                healthiestFoods: [], lessHealthyFoods: [],
                feedback: "AI failed to analyze food variety."
            },
            progressHighlights: {
                trend: 'neutral',
                points: ["AI processing error.", "Could not generate highlights."]
            },
            personalizedFeedback: ["AI failed to generate personalized feedback."],
            keyImprovementAreas: ["AI failed to identify key improvement areas."],
            goalTimelineEstimate: "AI could not estimate goal timeline."
        };
    }

     if (!output.progressHighlights || !output.progressHighlights.points || output.progressHighlights.points.length < 2) {
          console.warn("[Report Flow] AI failed to provide minimum required progress points. Adding defaults.");
          output.progressHighlights = output.progressHighlights || { trend: 'neutral', points: [] }; 
          output.progressHighlights.points = ["Data analyzed for trends.", "Review feedback for details."];
     }

    console.log("[Report Flow] Successfully generated report.");
    const validatedOutput = {
        ...output,
        macronutrientConsumption: {
            ...output.macronutrientConsumption,
            calorieAvg: output.macronutrientConsumption.calorieAvg !== undefined ? Math.round(output.macronutrientConsumption.calorieAvg) : undefined,
            proteinAvg: output.macronutrientConsumption.proteinAvg !== undefined ? parseFloat(output.macronutrientConsumption.proteinAvg.toFixed(1)) : undefined,
            carbsAvg: output.macronutrientConsumption.carbsAvg !== undefined ? parseFloat(output.macronutrientConsumption.carbsAvg.toFixed(1)) : undefined,
            fatAvg: output.macronutrientConsumption.fatAvg !== undefined ? parseFloat(output.macronutrientConsumption.fatAvg.toFixed(1)) : undefined,
        }
    };
    return validatedOutput;
  }
);

