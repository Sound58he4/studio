'use server';
/**
 * @fileOverview Generates a simple, home-friendly workout plan for rest or light activity days.
 *
 * - generateSimpleWorkout - A function that generates the simple workout.
 * - SimpleWorkoutInput - The input type for the function.
 * - SimpleWorkoutOutput - The return type for the function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import type { ExerciseDetail } from '@/ai/flows/generate-workout-plan'; // Reuse ExerciseDetail schema type
import type { FitnessGoal, ActivityLevel } from '@/app/dashboard/types'; // Import types
import { fitnessGoalValues, activityLevelValues } from '@/app/dashboard/types'; // Import helper arrays

// Reuse the ExerciseDetail schema definition from the main workout plan flow
// We just need the schema definition, not the whole file logic.
const ExerciseDetailSchema = z.object({
    exercise: z.string().min(3).describe("Specific name of the exercise (e.g., 'Bodyweight Squats', 'Push-ups', 'Light Jog')."),
    sets: z.number().int().min(0).nullable().describe("Number of sets (null for duration focus)."),
    reps: z.string().nullable().describe("Rep range (e.g., '10-15', 'AMRAP') or duration (e.g., '20 min'). Null for Rest."),
    notes: z.string().optional().describe("Optional notes like form tips or modifications."),
    youtubeLink: z.string().nullable().describe("A YouTube search URL (https://www.youtube.com/results?search_query=...). Null if not applicable."),
    caloriesBurned: z.number().nullable().describe("Estimated calories burned for the exercise. Null for Rest.")
});

// Input schema: User's goal and general activity level
const SimpleWorkoutInputSchema = z.object({
  fitnessGoal: z.enum(fitnessGoalValues as [FitnessGoal, ...FitnessGoal[]]).describe("User's primary fitness goal."),
  activityLevel: z.enum(activityLevelValues as [ActivityLevel, ...ActivityLevel[]]).describe("User's typical activity level."), // Use the imported values
});
export type SimpleWorkoutInput = z.infer<typeof SimpleWorkoutInputSchema>;

// Output schema: A list of simple exercises
const SimpleWorkoutOutputSchema = z.object({
  exercises: z.array(ExerciseDetailSchema).min(2).max(5).describe("A list of 2-5 simple exercises suitable for a light activity or rest day at home."),
});
export type SimpleWorkoutOutput = z.infer<typeof SimpleWorkoutOutputSchema>;

// Exported wrapper function
export async function generateSimpleWorkout(input: SimpleWorkoutInput): Promise<SimpleWorkoutOutput> {
  const result = await generateSimpleWorkoutFlow(input);
  
  // Apply validation to all exercises
  const validatedExercises = result.exercises.map(validateSimpleExercise);
  
  return { exercises: validatedExercises };
}

// Define the Genkit prompt
const generateSimpleWorkoutPrompt = ai.definePrompt({
  name: 'generateSimpleWorkoutPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17', // Use faster model
  input: { schema: SimpleWorkoutInputSchema },
  output: { schema: SimpleWorkoutOutputSchema },
  prompt: `You are a fitness assistant AI creating short, simple workout suggestions for users on their rest days or for light activity. The focus is on **home-friendly, bodyweight exercises** or light cardio.

**User Profile:**
- Fitness Goal: {{fitnessGoal}}
- Activity Level: {{activityLevel}}

**Instructions:**
1.  **Generate 2-5 simple exercises.** Prioritize bodyweight movements (squats, lunges, push-ups, planks, glute bridges), light cardio (jogging in place, jumping jacks), or active recovery (stretching, foam rolling).
2.  **Keep it light:** This is not a main workout. Aim for lower volume (1-3 sets, moderate reps or short durations).
3.  **Goal Consideration:**
    *   weight_loss/toning: Maybe slightly more reps or a bit of light cardio.
    *   muscle_building/Gain: Focus on mobility, light activation, or very light bodyweight circuits.
    *   recomposition/stay_fit: A mix of light cardio and bodyweight strength/mobility.
4.  **Activity Level:** More active users might handle slightly more volume than sedentary users, but keep it light overall.
5.  **Provide details:** For each exercise, specify 'exercise' name, 'sets' (if applicable, null otherwise), 'reps' (e.g., '10-15', '30 sec', '5 min'), optional 'notes' (e.g., 'Focus on form', 'Modify on knees if needed'), and a 'youtubeLink' (search URL format: \`https://www.youtube.com/results?search_query=[exercise+name]+tutorial\`). Link should be null if not applicable (e.g., for 'Foam Rolling').
6.  **Output Format:** Return ONLY the valid JSON object matching the output schema, containing the 'exercises' array.

**Example Output (Goal: Weight Loss):**
{
  "exercises": [
    { "exercise": "Jumping Jacks", "sets": null, "reps": "2 min", "notes": "Light intensity warmup.", "youtubeLink": "https://www.youtube.com/results?search_query=jumping+jacks+tutorial" },
    { "exercise": "Bodyweight Squats", "sets": 2, "reps": "15-20", "notes": "Focus on depth and control.", "youtubeLink": "https://www.youtube.com/results?search_query=bodyweight+squats+tutorial" },
    { "exercise": "Push-ups (on knees if needed)", "sets": 2, "reps": "AMRAP (As Many Reps As Possible)", "notes": "Maintain good form.", "youtubeLink": "https://www.youtube.com/results?search_query=push+ups+tutorial" },
    { "exercise": "Plank", "sets": 2, "reps": "30-45 sec", "notes": "Keep core engaged.", "youtubeLink": "https://www.youtube.com/results?search_query=plank+tutorial" }
  ]
}

Generate the simple workout JSON now based *strictly* on the user profile and instructions.
`,
});

// Add validation function for simple workout exercises
const validateSimpleExercise = (exercise: any) => {
    // Normalize reps field - set failure to default 12
    let normalizedReps = exercise.reps;
    if (typeof normalizedReps === 'string' && normalizedReps.toLowerCase().includes('failure')) {
        normalizedReps = '12';
    }
    
    // Check if it's a stretch exercise (lower calorie burn)
    const isStretchExercise = exercise.exercise && (
        exercise.exercise.toLowerCase().includes('stretch') ||
        exercise.exercise.toLowerCase().includes('warm-up') ||
        exercise.exercise.toLowerCase().includes('cool-down') ||
        exercise.exercise.toLowerCase().includes('flexibility') ||
        exercise.exercise.toLowerCase().includes('yoga') ||
        exercise.exercise.toLowerCase().includes('foam rolling')
    );
    
    // Validate and cap calorie burn to reasonable range
    let caloriesBurned = exercise.caloriesBurned || 0;
    if (typeof caloriesBurned === 'number') {
        if (isStretchExercise) {
            // Cap stretches between 2-4 kcal
            caloriesBurned = Math.max(2, Math.min(4, caloriesBurned));
        } else {
            // Cap regular exercises between 6-30 kcal
            caloriesBurned = Math.max(6, Math.min(30, caloriesBurned));
        }
    } else {
        // Default values based on exercise type
        caloriesBurned = isStretchExercise ? 3 : 12;
    }
    
    return {
        exercise: exercise.exercise || 'Unknown Exercise',
        sets: exercise.sets || 2,
        reps: normalizedReps,
        notes: exercise.notes || '',
        youtubeLink: exercise.youtubeLink || null,
        caloriesBurned: caloriesBurned
    };
};

// Define the Genkit flow
const generateSimpleWorkoutFlow = ai.defineFlow<
  typeof SimpleWorkoutInputSchema,
  typeof SimpleWorkoutOutputSchema
>(
  {
    name: 'generateSimpleWorkoutFlow',
    inputSchema: SimpleWorkoutInputSchema,
    outputSchema: SimpleWorkoutOutputSchema,
  },
  async (input) => {
    const { output } = await generateSimpleWorkoutPrompt(input);

    if (!output || !output.exercises || output.exercises.length < 2) {
      throw new Error("AI failed to generate a valid simple workout.");
    }

    // Basic validation/cleanup (optional, as schema should handle most)
    const validatedExercises = output.exercises.map(ex => ({
        ...ex,
        exercise: ex.exercise.trim(),
        // Ensure numeric/string consistency might be needed depending on AI variability
        sets: ex.sets ? Math.max(0, Math.round(ex.sets)) : null,
        reps: ex.reps ? String(ex.reps).trim() : null,
        notes: ex.notes?.trim() || undefined,
        youtubeLink: ex.youtubeLink?.trim() || null,
        caloriesBurned: null // Will be set by validation function
    }));

    return { exercises: validatedExercises };
  }
);

