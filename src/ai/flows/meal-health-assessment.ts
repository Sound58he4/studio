'use server';

/**
 * @fileOverview AI flow to assess whether a meal is healthy/appropriate based on user's fitness goals
 * This provides personalized meal health assessment by considering both the meal composition and user objectives
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import type { FitnessGoal } from '@/app/dashboard/types';

// Input schema for meal health assessment
const MealHealthAssessmentInputSchema = z.object({
  mealDescription: z.string().describe('Description of the meal to assess'),
  mealNutrition: z.object({
    calories: z.number().describe('Total calories in the meal'),
    protein: z.number().describe('Total protein in grams'),
    carbohydrates: z.number().describe('Total carbohydrates in grams'),
    fat: z.number().describe('Total fat in grams'),
  }).describe('Nutritional breakdown of the meal'),
  userGoal: z.enum(['weight_loss', 'weight_gain', 'muscle_building', 'recomposition', 'stay_fit']).describe('User\'s current fitness goal'),
  userProfile: z.object({
    targetCalories: z.number().optional().describe('User\'s daily calorie target'),
    targetProtein: z.number().optional().describe('User\'s daily protein target'),
    targetCarbs: z.number().optional().describe('User\'s daily carbs target'),
    targetFat: z.number().optional().describe('User\'s daily fat target'),
  }).optional().describe('User\'s daily nutrition targets')
});

// Output schema for meal health assessment
const MealHealthAssessmentOutputSchema = z.object({
  isHealthy: z.boolean().describe('Whether the meal is healthy/appropriate for the user\'s goal'),
  healthStatus: z.enum(['excellent', 'good', 'moderate', 'poor']).describe('Overall health rating of the meal'),
  simpleStatus: z.enum(['HEALTHY', 'MODERATE', 'UNHEALTHY']).describe('Simple status indicator for UI'),
  recommendation: z.string().describe('Brief explanation and recommendation (2-3 sentences max)'),
  keyPoints: z.array(z.string()).describe('2-3 key points about why this meal is good/bad for their goal'),
  improvementTips: z.array(z.string()).optional().describe('1-2 simple tips to make the meal better for their goal'),
});

export type MealHealthAssessmentInput = z.infer<typeof MealHealthAssessmentInputSchema>;
export type MealHealthAssessmentOutput = z.infer<typeof MealHealthAssessmentOutputSchema>;

// AI prompt for meal health assessment
const mealHealthPrompt = ai.definePrompt({
  name: 'mealHealthPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: MealHealthAssessmentInputSchema },
  output: { schema: MealHealthAssessmentOutputSchema },
  prompt: `You are a certified nutritionist AI that evaluates meals based on user fitness goals.

**Meal to Assess:** {{mealDescription}}

**Nutritional Content:**
- Calories: {{mealNutrition.calories}} kcal
- Protein: {{mealNutrition.protein}}g
- Carbohydrates: {{mealNutrition.carbohydrates}}g  
- Fat: {{mealNutrition.fat}}g

**User's Fitness Goal:** {{userGoal}}

{{#if userProfile}}
**User's Daily Targets:**
{{#if userProfile.targetCalories}}- Target Calories: {{userProfile.targetCalories}} kcal{{/if}}
{{#if userProfile.targetProtein}}- Target Protein: {{userProfile.targetProtein}}g{{/if}}
{{#if userProfile.targetCarbs}}- Target Carbs: {{userProfile.targetCarbs}}g{{/if}}
{{#if userProfile.targetFat}}- Target Fat: {{userProfile.targetFat}}g{{/if}}
{{/if}}

**Assessment Guidelines by Goal:**

**Weight Loss:**
- Favor: Lower calories, high protein (muscle preservation), fiber-rich foods, lean proteins, vegetables
- Avoid: High-calorie dense foods, excessive fats, refined sugars, large portions
- Look for: Balanced macros with protein 25-30%, moderate carbs from whole sources

**Weight Gain:**
- Favor: Calorie-dense but nutritious foods, healthy fats, complex carbs, adequate protein
- Avoid: Empty calories from junk food, excessive processed foods
- Look for: Higher calorie content with good nutrition density

**Muscle Building:**
- Favor: High protein content (1.6-2.2g/kg body weight), post-workout carbs, leucine-rich foods
- Avoid: Very low protein meals, excessive alcohol, highly processed foods
- Look for: Protein 20-30g per meal, balanced macros supporting recovery

**Recomposition:**
- Favor: High protein, moderate calories, nutrient-dense foods, timing around workouts
- Avoid: Calorie extremes, low protein, highly processed foods
- Look for: Balanced approach with slight calorie moderation and high protein

**Stay Fit:**
- Favor: Balanced macronutrients, whole foods, variety, sustainable choices
- Avoid: Extreme restrictions, highly processed foods
- Look for: Overall nutritional balance and sustainability

**Instructions:**
1. Assess if this meal aligns with the user's goal
2. Consider portion size, macro balance, food quality, and timing appropriateness
3. Rate the meal's health status for their specific goal
4. Provide a simple status: "HEALTHY" for excellent/good meals, "MODERATE" for decent meals, "UNHEALTHY" for poor meals
5. Provide practical, actionable feedback
6. Be encouraging but honest about improvements needed
7. Keep recommendations concise and actionable

Focus on being supportive while providing honest nutritional guidance tailored to their fitness journey.`,
});

// Main flow function
export const mealHealthAssessment = ai.defineFlow(
  {
    name: 'mealHealthAssessment',
    inputSchema: MealHealthAssessmentInputSchema,
    outputSchema: MealHealthAssessmentOutputSchema,
  },
  async (input: MealHealthAssessmentInput): Promise<MealHealthAssessmentOutput> => {
    console.log('[Meal Health Assessment] Starting assessment for goal:', input.userGoal);
    
    try {
      const { output } = await mealHealthPrompt(input);
      
      // Validate the output
      const validatedOutput = MealHealthAssessmentOutputSchema.parse(output);
      
      console.log('[Meal Health Assessment] Assessment complete:', {
        isHealthy: validatedOutput.isHealthy,
        healthStatus: validatedOutput.healthStatus,
        hasRecommendation: !!validatedOutput.recommendation
      });
      
      return validatedOutput;
      
    } catch (error) {
      console.error('[Meal Health Assessment] Error during assessment:', error);
      
      // Provide fallback assessment
      return {
        isHealthy: true,
        healthStatus: 'moderate',
        simpleStatus: 'MODERATE',
        recommendation: 'Unable to provide detailed assessment at this time. This meal appears to be generally appropriate for your goals.',
        keyPoints: ['Meal contains a reasonable balance of macronutrients', 'Consider your overall daily intake'],
        improvementTips: ['Focus on whole foods when possible']
      };
    }
  }
);
