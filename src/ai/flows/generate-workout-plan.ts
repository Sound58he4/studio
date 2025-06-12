'use server';
/**
 * @fileOverview Generates a personalized 7-day gym workout plan based on user profile.
 *
 * - generateWorkoutPlan - A function that generates the workout plan.
 * - GenerateWorkoutPlanInput - The input type for the function.
 * - WeeklyWorkoutPlan - The return type for the function (renamed for clarity).
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Input schema based on Profile Page data, focusing on workout relevance
const GenerateWorkoutPlanInputSchema = z.object({
  // height: z.coerce.number().min(1).describe("User's height in centimeters."), // Less relevant?
  weight: z.coerce.number().min(1).describe("User's weight in kilograms (useful for calorie estimates/intensity)."),
  age: z.coerce.number().int().min(1).describe("User's age in years."),
  // gender: z.enum(["male", "female", "other"]).describe("User's gender."), // Can influence exercise selection/intensity
  activityLevel: z.enum([
      "sedentary",
      "lightly_active",
      "moderately_active",
      "very_active",
      "extra_active"
    ]).describe("User's physical activity level (important for intensity/volume)."),
   fitnessGoal: z.enum([
       "weight_loss",
       "weight_gain",
       "muscle_building",
       "recomposition",
       "toning"
    ]).describe("User's primary fitness goal (very important for plan structure)."),
   // Optional: Could add experience level (beginner, intermediate, advanced) later
   // experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("User's gym experience level."),
   // Optional: Preferred workout days/split type
   // preferredSplit: z.string().optional().describe("Preferred split (e.g., PPL, Upper/Lower, Full Body)")
   // Optional: Explicitly request fewer rest days (can be set via settings/profile later)
   preferFewerRestDays: z.boolean().optional().default(false).describe("Indicates if the user prefers fewer rest days and a more intense schedule.")
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;

// Schema for a single exercise detail
const ExerciseDetailSchema = z.object({
    exercise: z.string().min(3, "Exercise name seems too short").describe("Specific name of the exercise (e.g., 'Bench Press', 'Squats', 'Rest'). Cannot be empty unless it's a rest day."),
    sets: z.number().int().min(0).nullable().describe("Number of sets (null for Rest/Cardio duration focus)."),
    reps: z.string().nullable().describe("Rep range (e.g., '8-12', '15-20', 'AMRAP') or duration for cardio/flexibility (e.g., '30 min'). Null for Rest."),
    notes: z.string().optional().describe("Optional notes like tempo, rest time, or alternatives."),
    // Remove .url() validation for compatibility with Gemini's structured output format limitations.
    // The prompt still requests a URL format. Validation happens post-generation.
    youtubeLink: z.string().nullable().describe("A YouTube search URL for an exercise tutorial (e.g., https://www.youtube.com/results?search_query=bench+press+tutorial). Should be null for Rest."),
    caloriesBurned: z.number().nullable().describe("Estimated calories burned for the exercise. Null for Rest.")
});
export type ExerciseDetail = z.infer<typeof ExerciseDetailSchema>;

// Output schema: Explicitly define keys for each day of the week
const GenerateWorkoutPlanOutputSchema = z.object({
  Monday: z.array(ExerciseDetailSchema).min(1, "Plan for Monday cannot be empty. Provide exercises or a 'Rest' entry.").describe("Workout plan for Monday. Include at least one item (can be 'Rest')."),
  Tuesday: z.array(ExerciseDetailSchema).min(1, "Plan for Tuesday cannot be empty.").describe("Workout plan for Tuesday. Include at least one item (can be 'Rest')."),
  Wednesday: z.array(ExerciseDetailSchema).min(1, "Plan for Wednesday cannot be empty.").describe("Workout plan for Wednesday. Include at least one item (can be 'Rest')."),
  Thursday: z.array(ExerciseDetailSchema).min(1, "Plan for Thursday cannot be empty.").describe("Workout plan for Thursday. Include at least one item (can be 'Rest')."),
  Friday: z.array(ExerciseDetailSchema).min(1, "Plan for Friday cannot be empty.").describe("Workout plan for Friday. Include at least one item (can be 'Rest')."),
  Saturday: z.array(ExerciseDetailSchema).min(1, "Plan for Saturday cannot be empty.").describe("Workout plan for Saturday. Include at least one item (can be 'Rest')."),
  Sunday: z.array(ExerciseDetailSchema).min(1, "Plan for Sunday cannot be empty.").describe("Workout plan for Sunday. Include at least one item (can be 'Rest')."),
}).describe("A 7-day workout plan with specific exercises for each day from Monday to Sunday.");

// Use the correct output type name
export type WeeklyWorkoutPlan = z.infer<typeof GenerateWorkoutPlanOutputSchema>;

// Add validation function for exercise data
const validateExerciseData = (exercise: any): ExerciseDetail => {
    // Normalize reps field - set failure to default 12
    let normalizedReps = exercise.reps;
    if (typeof normalizedReps === 'string' && normalizedReps.toLowerCase().includes('failure')) {
        normalizedReps = '12';
    }
    
    // Validate and cap calorie burn to reasonable range
    let caloriesBurned = exercise.caloriesBurned || 0;
    
    // Check if it's a stretch exercise (lower calorie burn)
    const isStretchExercise = exercise.exercise && (
        exercise.exercise.toLowerCase().includes('stretch') ||
        exercise.exercise.toLowerCase().includes('warm-up') ||
        exercise.exercise.toLowerCase().includes('cool-down') ||
        exercise.exercise.toLowerCase().includes('flexibility') ||
        exercise.exercise.toLowerCase().includes('yoga')
    );
    
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
        caloriesBurned = isStretchExercise ? 3 : 15;
    }
    
    return {
        exercise: exercise.exercise || 'Unknown Exercise',
        sets: exercise.sets || 3,
        reps: normalizedReps,
        notes: exercise.notes || '',
        youtubeLink: exercise.youtubeLink || null,
        caloriesBurned: caloriesBurned
    };
};

// Exported wrapper function
export async function generateWorkoutPlan(input: GenerateWorkoutPlanInput): Promise<WeeklyWorkoutPlan> {
  // Basic validation can remain here or be moved inside the flow
  if (!input.weight || !input.age || !input.activityLevel || !input.fitnessGoal) {
      throw new Error("Weight, age, activity level, and fitness goal are required to generate a workout plan.");
  }
  
  const result = await generateWorkoutPlanFlow(input);
  
  // Apply validation to all exercises in the plan
  const validatedPlan: WeeklyWorkoutPlan = {
      Monday: (result.Monday || []).map(validateExerciseData),
      Tuesday: (result.Tuesday || []).map(validateExerciseData),
      Wednesday: (result.Wednesday || []).map(validateExerciseData),
      Thursday: (result.Thursday || []).map(validateExerciseData),
      Friday: (result.Friday || []).map(validateExerciseData),
      Saturday: (result.Saturday || []).map(validateExerciseData),
      Sunday: (result.Sunday || []).map(validateExerciseData)
  };

  return validatedPlan;
}

// Provided exercise list (can be refined)
const EXERCISE_LIST_REFERENCE = `
- DYNAMIC STRETCHES (Warm-up)
- STATIC STRETCHES (Cool-down)
- BENCH PRESS (Barbell/Dumbbell)
- INCLINE BENCH PRESS (Barbell/Dumbbell)
- CABLE CROSS OVER
- PEC DECK (Butterfly)
- SHOULDER PRESS (Barbell/Dumbbell)
- LATERAL RAISES (Dumbbell/Cable)
- FRONT RAISES (Dumbbell/Cable)
- REAR DELT FLY (Dumbbell/Machine/Cable)
- WIDE GRIP PUSHUPS
- CLOSE GRIP BENCH PRESS
- SKULL CRUSHERS
- TRICEP PUSHDOWN (Cable/Rope/Bar)
- OVERHEAD TRICEP EXTENSION (Dumbbell/Cable)
- WEIGHTED PULLUPS / PULLUPS / ASSISTED PULLUPS
- LAT PULLDOWN (Wide/Close/Reverse Grip)
- DEADLIFT (Conventional/Sumo/Romanian)
- BARBELL ROWS
- DUMBBELL ROWS
- SEATED CABLE ROWS
- BARBELL SHRUGS
- DUMBBELL SHRUGS
- BARBELL BICEP CURLS
- DUMBBELL BICEP CURLS (Standing/Seated/Incline)
- HAMMER CURLS
- PREACHER CURLS
- WEIGHTED SQUATS (Barbell Back/Front Squat)
- GOBLET SQUATS
- LEG PRESS
- LEG EXTENSIONS
- HAMSTRING CURLS (Lying/Seated)
- WALL SIT
- LUNGES (Dumbbell/Barbell)
- CALF RAISES (Standing/Seated)
- RUNNING (Treadmill/Outdoor)
- CYCLING (Stationary/Outdoor)
- ELLIPTICAL
- STAIR CLIMBER
- JUMP ROPE
- YOGA POSES
- FOAM ROLLING
- PLANKS
- CRUNCHES
- LEG RAISES
- RUSSIAN TWISTS
- REST
`;

// Define the Genkit prompt
const generateWorkoutPlanPrompt = ai.definePrompt({
  name: 'generateWorkoutPlanPrompt',
  model: 'googleai/gemini-2.5-flash-preview-04-17',
  input: { schema: GenerateWorkoutPlanInputSchema },
  output: { schema: GenerateWorkoutPlanOutputSchema },
  prompt: `You are an expert fitness coach AI specializing in creating personalized, effective, and safe weekly **gym-based** workout plans.

**Task:** Generate a structured and challenging 7-day workout plan (Monday to Sunday) tailored to the user's profile below. **Prioritize creating workout days over rest days unless rest is essential for recovery based on the user's profile and goals.**

**User Profile:**
- Weight: {{weight}} kg
- Age: {{age}} years
- Activity Level: {{activityLevel}}
- Fitness Goal: {{fitnessGoal}}
{{#if preferFewerRestDays}}- User Preference: Prefers fewer rest days (more intense schedule){{/if}}

**Instructions:**
1.  **Structure & Intensity:** Create a plan for all 7 days (Monday to Sunday). **Minimize rest days.** Base the number of workout days vs. rest days primarily on the user's \`activityLevel\` and \`fitnessGoal\`.
    *   **Activity Level Guide:**
        *   sedentary/lightly_active: Aim for 3-4 workout days unless fitnessGoal is intense (e.g., muscle building).
        *   moderately_active: Aim for 4-5 workout days.
        *   very_active/extra_active: Aim for 5-6 workout days, include active recovery or lower intensity days if needed instead of pure rest.
    *   **User Preference:** If preferFewerRestDays is true, increase workout frequency further, potentially incorporating active recovery.
    *   **Rest Day Placement:** Distribute rest days logically (e.g., mid-week, weekend) for recovery. **Only assign 'Rest' if a workout is not scheduled.**
2.  **Exercise Selection:** Prioritize compound movements (squats, deadlifts, presses, rows) and supplement with isolation exercises relevant to the user's goal. Use exercises commonly found in a gym setting. Use the reference list below but are not limited to it. Ensure variety throughout the week. Include warm-ups (e.g., Dynamic Stretches) and cool-downs (e.g., Static Stretches).
3.  **Sets & Reps/Duration:** Provide specific sets (usually 3-5 for main lifts, 2-4 for accessories) and rep ranges (e.g., '6-10' for strength, '8-12' for hypertrophy, '12-15+' for endurance/toning) for strength exercises. For cardio or flexibility, specify duration (e.g., '30 min', '15 min'). Reps/duration MUST be null for 'Rest' days. Sets MUST be null for 'Rest' or pure cardio/flexibility where applicable.
4.  **Goal Alignment:**
    *   **muscle_building/weight_gain:** Focus on progressive overload, higher volume, moderate-to-high intensity, rep ranges 6-15. Ensure sufficient protein & slight caloric surplus implied.
    *   **weight_loss/toning:** Include a mix of strength (to preserve muscle, 3-4 days/wk) and cardio (2-3 days/wk), potentially higher reps (12-20) or circuits. Imply caloric deficit.
    *   **recomposition:** Balance strength training (3-5 days/wk) and moderate cardio (1-2 days/wk). Focus on hitting protein goals.
5.  **Calorie Estimation:** For each exercise, provide realistic calorie burn estimates:
    *   **Stretches/Flexibility/Warm-ups/Cool-downs:** 2-4 kcal only (very low intensity)
    *   **Regular exercises (strength, cardio):** 6-30 kcal per exercise
    *   **Rest days:** null calories
    Base estimates on exercise type, intensity and duration. Never exceed these ranges.
6.  **YouTube Links:** For each *specific* exercise (e.g., 'Bench Press', 'Running', NOT 'Rest', 'Warm-up', 'Cool-down'), generate a valid YouTube search URL in the format: \`https://www.youtube.com/results?search_query=[exercise+name]+tutorial\`. Replace spaces in the exercise name with '+'. For 'Rest', 'Warm-up', 'Cool-down' etc., the link MUST be null.
7.  **Notes:** Add brief, helpful notes where appropriate (e.g., 'Focus on form', 'Warm-up: 5 min light cardio', 'Cool-down: 10 min stretching', 'Rest 60-90s between sets').
8.  **Output Format:** Return ONLY the valid JSON object strictly matching the output schema. The main object must have keys "Monday" through "Sunday". Each key's value must be an array of exercise objects, each containing 'exercise' (must be specific), 'sets' (nullable number), 'reps' (nullable string), 'notes' (optional string), 'youtubeLink' (string URL or null), and 'caloriesBurned' (number following the ranges above). **Ensure every day has at least one entry.** If a day is determined to be a rest day based on the profile analysis, the array should contain ONLY ONE entry like: \`[{ "exercise": "Rest", "sets": null, "reps": null, "notes": "Active recovery recommended (light walk/stretching)", "youtubeLink": null, "caloriesBurned": null }]\`. **Do NOT return empty arrays for any day.**

**Reference Exercise List (Use as inspiration, feel free to add others):**
${EXERCISE_LIST_REFERENCE}

Generate the 7-day workout plan JSON now based *strictly* on the user profile and instructions. Emphasize creating workouts and minimize pure rest days according to the activity level and goals.`,
});

// Define the Genkit flow
const generateWorkoutPlanFlow = ai.defineFlow<
  typeof GenerateWorkoutPlanInputSchema,
  typeof GenerateWorkoutPlanOutputSchema // Output type is now the explicit object schema
>(
  {
    name: 'generateWorkoutPlanFlow',
    inputSchema: GenerateWorkoutPlanInputSchema,
    outputSchema: GenerateWorkoutPlanOutputSchema, // Ensure output schema is defined here
  },
  async (input) => {
    const { output } = await generateWorkoutPlanPrompt(input);

    // Genkit handles basic schema validation. Add more specific checks.
    if (!output) {
      throw new Error("AI failed to generate a workout plan.");
    }

    // Post-processing/validation
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const; // Use const assertion
    let generatedRestDays = 0;

    for (const day of days) {
        const dayPlan = output[day];
        // Schema now enforces min length 1, but check content
        if (!Array.isArray(dayPlan) || dayPlan.length === 0) {
             // This *shouldn't* happen based on prompt and schema minLength. If it does, AI failed.
             console.error(`AI generated an empty plan for ${day}. This violates the schema.`);
             // Decide how to handle: Throw error? Attempt to fix?
             // For now, throw, as adding 'Rest' might mask AI issues and contradict user needs.
             throw new Error(`AI failed to provide a valid plan for ${day}. Plan array was empty.`);
             // Alternative (less ideal): Fallback to Rest if absolutely needed, but log error.
             // output[day] = [{ exercise: 'Rest', sets: null, reps: null, notes: 'Auto-added rest day due to AI error.', youtubeLink: null }];
        }

        if (dayPlan.length === 1 && dayPlan[0].exercise.toLowerCase() === 'rest') {
             generatedRestDays++;
        }

        for (const exercise of dayPlan) {
            // Validate exercise name isn't empty (unless it's 'Rest')
            if (!exercise.exercise || exercise.exercise.trim().length < 3) {
                if (exercise.exercise?.toLowerCase() !== 'rest') {
                    console.warn(`AI generated an invalid/short exercise name on ${day}: '${exercise.exercise}'. Replacing with placeholder.`);
                    // Replace or throw error? Replacing might hide issues.
                    // exercise.exercise = 'Unnamed Exercise';
                    throw new Error(`AI generated an invalid exercise name on ${day}: '${exercise.exercise}'`);
                }
            }

            // Further validation for YouTube links (since .url() was removed from schema)
            const requiresLink = exercise.exercise.toLowerCase() !== 'rest' && exercise.exercise.toLowerCase() !== 'warm-up' && exercise.exercise.toLowerCase() !== 'cool-down' && !exercise.exercise.toLowerCase().includes('stretch');
             if (requiresLink && (!exercise.youtubeLink || !exercise.youtubeLink.startsWith('https://www.youtube.com/results?search_query='))) {
                console.warn(`Generated potentially invalid YouTube link for ${exercise.exercise} on ${day}: ${exercise.youtubeLink}. Attempting to fix.`);
                // Basic check - does it look like a URL?
                const isLikelyUrl = typeof exercise.youtubeLink === 'string' && (exercise.youtubeLink.startsWith('http://') || exercise.youtubeLink.startsWith('https://'));

                if (!isLikelyUrl) {
                    // If it's not a URL at all, generate the search query
                    const query = encodeURIComponent(`${exercise.exercise} tutorial`).replace(/%20/g, '+');
                    exercise.youtubeLink = `https://www.youtube.com/results?search_query=${query}`;
                    console.warn(`Replaced invalid link with search query: ${exercise.youtubeLink}`);
                } else {
                    // If it looks like a URL but isn't the expected format, keep it but warn
                    console.warn(`Keeping potentially incorrect URL format: ${exercise.youtubeLink}`);
                }

            }
             if (!requiresLink && exercise.youtubeLink !== null) {
                console.warn(`Setting YouTube link to null for ${exercise.exercise} on ${day}`);
                exercise.youtubeLink = null;
            }
            // Ensure sets/reps are null for Rest
            if (exercise.exercise.toLowerCase() === 'rest' && (exercise.sets !== null || exercise.reps !== null)) {
                 console.warn(`Setting sets/reps to null for Rest day on ${day}`);
                 exercise.sets = null;
                 exercise.reps = null;
            }
             // Ensure reps string format for cardio/duration is handled correctly (e.g., "30 min")
             // Basic check: if reps is a string containing 'min', sets should likely be null
             if (typeof exercise.reps === 'string' && exercise.reps.includes('min') && exercise.sets !== null) {
                console.warn(`Setting sets to null for duration-based exercise '${exercise.exercise}' on ${day}.`);
                exercise.sets = null;
             }
        }
    }

     // Check if the number of rest days seems appropriate for the activity level
     const expectedMinWorkoutDays = {
         sedentary: 3,
         lightly_active: 3,
         moderately_active: 4,
         very_active: 5,
         extra_active: 5,
     };
     let minWorkouts = expectedMinWorkoutDays[input.activityLevel];
     if (input.preferFewerRestDays) minWorkouts = Math.min(6, minWorkouts + 1); // Increase if preference set

     if (generatedRestDays > (7 - minWorkouts)) {
        console.warn(`AI generated ${generatedRestDays} rest days, which might be too many for activity level '${input.activityLevel}' ${input.preferFewerRestDays ? 'with preference for fewer rests' : ''}. Expected at least ${minWorkouts} workout days.`);
        // Decide whether to throw an error or just warn. Warning is less disruptive.
        // throw new Error("AI generated too many rest days for the user profile.");
     }


    return output; // Return the validated/processed output
  }
);


