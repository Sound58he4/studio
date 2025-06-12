/**
 * @fileOverview MET-based calorie burn calculation system
 * Uses established Metabolic Equivalent of Task (MET) values for accurate calorie estimation
 * Formula: Calories = MET × weight (kg) × time (hours)
 */

// MET values database (Metabolic Equivalent of Task)
// Source: Compendium of Physical Activities and ACSM guidelines
const MET_VALUES: Record<string, number> = {
  // Cardio exercises
  'walking': 3.5,
  'brisk walking': 4.3,
  'jogging': 7.0,
  'running': 8.0,
  'fast running': 11.5,
  'cycling': 6.8,
  'swimming': 8.0,
  'rowing': 7.0,
  'elliptical': 5.0,
  'stair climbing': 8.8,
  'jumping jacks': 7.7,
  'burpees': 8.0,
  'mountain climbers': 8.0,
  'high knees': 6.0,
  'butt kicks': 6.0,
  'jump rope': 10.0,
  
  // Strength training (varies by intensity)
  'bench press': 6.0,
  'incline bench press': 6.0,
  'decline bench press': 6.0,
  'dumbbell press': 6.0,
  'push ups': 3.8,
  'pushups': 3.8,
  'incline pushups': 3.0,
  'decline pushups': 4.5,
  'chest flyes': 5.0,
  'dumbbell flyes': 5.0,
  'chest dips': 5.5,
  'dips': 5.5,
  
  // Back exercises
  'pull ups': 8.0,
  'pullups': 8.0,
  'chin ups': 8.0,
  'lat pulldown': 5.0,
  'cable rows': 5.0,
  'bent over rows': 5.5,
  'dumbbell rows': 5.0,
  't-bar rows': 5.5,
  'deadlifts': 7.0,
  'deadlift': 7.0,
  'shrugs': 4.0,
  
  // Leg exercises
  'squats': 5.0,
  'weighted squats': 6.0,
  'goblet squats': 5.5,
  'leg press': 5.0,
  'lunges': 4.0,
  'walking lunges': 4.5,
  'leg extensions': 4.0,
  'leg curls': 4.0,
  'hamstring curls': 4.0,
  'calf raises': 3.5,
  'wall sit': 4.0,
  'step ups': 5.0,
  
  // Shoulder exercises
  'shoulder press': 5.0,
  'overhead press': 5.5,
  'military press': 5.5,
  'lateral raises': 4.0,
  'front raises': 4.0,
  'rear delt flyes': 4.0,
  'upright rows': 4.5,
  
  // Arm exercises
  'bicep curls': 3.5,
  'hammer curls': 3.5,
  'tricep extensions': 3.5,
  'overhead tricep extension': 3.5,
  'tricep dips': 5.0,
  'arm circles': 3.0,
  
  // Core exercises
  'planks': 3.5,
  'plank': 3.5,
  'side planks': 3.5,
  'crunches': 3.8,
  'sit ups': 3.8,
  'russian twists': 4.0,
  'leg raises': 4.0,
  'bicycle crunches': 4.5,
  'mountain climbers': 8.0,
  'dead bug': 3.0,
  'bird dog': 3.0,
  
  // Flexibility and mobility
  'stretching': 2.3,
  'yoga': 3.0,
  'pilates': 3.0,
  'warm up': 2.5,
  'cool down': 2.0,
  'mobility': 2.5,
  'foam rolling': 2.0,
  
  // Compound movements
  'clean and press': 8.0,
  'thrusters': 7.0,
  'kettlebell swings': 7.0,
  'turkish get up': 6.0,
  'farmer walks': 5.0,
  'renegade rows': 6.0,
  
  // High intensity
  'hiit': 8.0,
  'circuit training': 7.0,
  'crossfit': 8.0,
  'bootcamp': 7.5,
  
  // Rest/minimal activity
  'rest': 1.0,
};

// Exercise intensity modifiers based on sets, reps, and weight
const INTENSITY_MODIFIERS = {
  // Low intensity (light weight, high reps, longer rest)
  LOW: 0.8,
  // Moderate intensity (moderate weight, moderate reps)
  MODERATE: 1.0,
  // High intensity (heavy weight, low reps, compound movements)
  HIGH: 1.3,
  // Very high intensity (max effort, explosive movements)
  VERY_HIGH: 1.5,
};

interface CalorieCalculationInput {
  exerciseName: string;
  exerciseType: "cardio" | "strength" | "flexibility" | "other";
  duration?: number; // minutes
  sets?: number;
  reps?: number;
  weight?: number; // weight used for exercise
  userWeight: number; // user's body weight in kg
  notes?: string;
}

interface CalorieCalculationResult {
  estimatedCalories: number;
  metValue: number;
  intensity: string;
  calculationMethod: string;
}

/**
 * Calculate calories burned using MET values and intensity modifiers
 */
export function calculateCaloriesMET(input: CalorieCalculationInput): CalorieCalculationResult {
  const { exerciseName, exerciseType, duration, sets, reps, weight, userWeight, notes } = input;
  
  // Get base MET value for the exercise
  const exerciseNameLower = exerciseName.toLowerCase();
  let baseMET = findMETValue(exerciseNameLower, exerciseType);
  
  // Determine intensity modifier
  const intensityInfo = determineIntensity(exerciseType, sets, reps, weight, notes);
  const adjustedMET = baseMET * intensityInfo.modifier;
  
  // Calculate duration
  const durationHours = calculateDuration(exerciseType, duration, sets, reps);
  
  // Calculate calories: MET × weight (kg) × time (hours)
  const calories = adjustedMET * userWeight * durationHours;
  
  // Add safety bounds: reasonable calorie range for a single exercise
  const boundedCalories = Math.min(Math.max(1, calories), 2000); // 1-2000 kcal max per exercise
  
  // Log warning if original calculation was unrealistic
  if (calories > 2000) {
    console.warn(`[MET Calculation] Unrealistic calorie estimate detected and capped: ${Math.round(calories)} -> ${boundedCalories} kcal for ${input.exerciseName}`);
    console.warn(`[MET Calculation] Input values: sets=${sets}, reps=${reps}, duration=${duration}, userWeight=${userWeight}`);
  }
  
  return {
    estimatedCalories: Math.round(boundedCalories),
    metValue: adjustedMET,
    intensity: intensityInfo.level,
    calculationMethod: `MET (${adjustedMET.toFixed(1)}) × ${userWeight}kg × ${durationHours.toFixed(2)}h${calories > 2000 ? ' (capped)' : ''}`
  };
}

/**
 * Find MET value for an exercise, with fuzzy matching
 */
function findMETValue(exerciseName: string, exerciseType: string): number {
  // Direct match
  if (MET_VALUES[exerciseName]) {
    return MET_VALUES[exerciseName];
  }
  
  // Fuzzy matching - check if exercise name contains any known exercise
  for (const [key, value] of Object.entries(MET_VALUES)) {
    if (exerciseName.includes(key) || key.includes(exerciseName)) {
      return value;
    }
  }
  
  // Fallback based on exercise type
  switch (exerciseType) {
    case 'cardio':
      return 6.0; // Moderate cardio
    case 'strength':
      return 5.0; // Moderate strength training
    case 'flexibility':
      return 2.5; // Stretching/yoga
    case 'other':
    default:
      return 4.0; // General physical activity
  }
}

/**
 * Determine exercise intensity based on sets, reps, weight, and notes
 */
function determineIntensity(
  exerciseType: string,
  sets?: number,
  reps?: number,
  weight?: number,
  notes?: string
): { level: string; modifier: number } {
  
  // Check notes for intensity keywords
  if (notes) {
    const notesLower = notes.toLowerCase();
    if (notesLower.includes('high intensity') || notesLower.includes('explosive') || notesLower.includes('max effort')) {
      return { level: 'Very High', modifier: INTENSITY_MODIFIERS.VERY_HIGH };
    }
    if (notesLower.includes('heavy') || notesLower.includes('intense')) {
      return { level: 'High', modifier: INTENSITY_MODIFIERS.HIGH };
    }
    if (notesLower.includes('light') || notesLower.includes('easy') || notesLower.includes('warm')) {
      return { level: 'Low', modifier: INTENSITY_MODIFIERS.LOW };
    }
  }
  
  // Strength training intensity based on reps
  if (exerciseType === 'strength' && reps) {
    if (reps <= 6) {
      return { level: 'High', modifier: INTENSITY_MODIFIERS.HIGH }; // Low reps = heavy weight
    } else if (reps <= 12) {
      return { level: 'Moderate', modifier: INTENSITY_MODIFIERS.MODERATE }; // Moderate reps
    } else {
      return { level: 'Low', modifier: INTENSITY_MODIFIERS.LOW }; // High reps = light weight
    }
  }
  
  // Cardio intensity (default is moderate unless specified)
  if (exerciseType === 'cardio') {
    return { level: 'Moderate', modifier: INTENSITY_MODIFIERS.MODERATE };
  }
  
  // Default moderate intensity
  return { level: 'Moderate', modifier: INTENSITY_MODIFIERS.MODERATE };
}

/**
 * Calculate exercise duration in hours
 */
function calculateDuration(
  exerciseType: string,
  duration?: number,
  sets?: number,
  reps?: number
): number {
  // If duration is provided, use it (but cap at reasonable maximum)
  if (duration && duration > 0) {
    // Cap duration at 3 hours (180 minutes) for safety
    const cappedDuration = Math.min(duration, 180);
    return cappedDuration / 60; // Convert minutes to hours
  }
  
  // For strength training, estimate duration based on sets and reps
  if (exerciseType === 'strength' && sets && reps) {
    // Add validation for reasonable bounds
    const cappedSets = Math.min(Math.max(sets, 1), 20); // 1-20 sets max
    const cappedReps = Math.min(Math.max(reps, 1), 100); // 1-100 reps max
    
    // Estimate: 2-3 seconds per rep + rest time between sets
    const timePerRep = 2.5; // seconds
    const timePerSet = cappedReps * timePerRep; // seconds per set
    const restBetweenSets = 90; // seconds (1.5 minutes average rest)
    const totalSeconds = (cappedSets * timePerSet) + ((cappedSets - 1) * restBetweenSets);
    
    // Cap total duration at 3 hours for extreme safety
    const durationHours = Math.min(totalSeconds / 3600, 3.0);
    return durationHours;
  }
  
  // Default duration based on exercise type
  switch (exerciseType) {
    case 'cardio':
      return 0.5; // 30 minutes default
    case 'strength':
      return 0.25; // 15 minutes default for single exercise
    case 'flexibility':
      return 0.17; // 10 minutes default
    default:
      return 0.25; // 15 minutes default
  }
}

/**
 * Main function that matches the existing AI interface
 */
export function estimateCaloriesBurnedMET(input: CalorieCalculationInput): { estimatedCalories: number } {
  const result = calculateCaloriesMET(input);
  console.log(`[MET Calculation] ${input.exerciseName}: ${result.calculationMethod} = ${result.estimatedCalories} kcal`);
  return { estimatedCalories: result.estimatedCalories };
}
