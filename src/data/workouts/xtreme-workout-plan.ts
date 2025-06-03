import type { ExerciseDetail } from '@/app/dashboard/types';

export type WorkoutPlanType = 'LIGHT' | 'MAX' | 'POWER' | 'XTREME';

export interface WorkoutDay {
  day: number;
  name: string;
  description: string;
  quote: string;
  youtubeExplanationUrl: string;
  exercises: Exercise[];
}

export interface Exercise {
  exercise: string;
  sets: number;
  reps: string;
  notes: string;
  youtubeLink: string;
  weight: number | null;
  restTime: string;
  rpe: number;
  tempo: string;
  tags: string[];
  equipment: string[];
}

export const XTREME_WORKOUT_PLAN: WorkoutDay[] = [
  {
    day: 1,
    name: "XTREME Day 1 - Chest, Shoulders & Triceps",
    description: "Extreme intensity push day with advanced compound movements",
    quote: "The cave you fear to enter holds the treasure you seek. - Joseph Campbell",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+chest+shoulder+tricep+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Comprehensive warm-up for intense training",
        youtubeLink: "https://www.youtube.com/results?search_query=advanced+dynamic+warmup",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Bench Press",
        sets: 3,
        reps: "15",
        notes: "Focus on explosive concentric, controlled eccentric",
        youtubeLink: "https://www.youtube.com/results?search_query=advanced+bench+press+technique",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "X010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Bench Press",
        sets: 3,
        reps: "15",
        notes: "Target upper chest with maximum intensity",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+bench+press+advanced",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Cable Cross Over or Inner Pec Flies",
        sets: 3,
        reps: "15",
        notes: "Maximum squeeze at contraction point",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+advanced+technique",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2020",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable"]
      },
      {
        exercise: "Shoulder Press",
        sets: 3,
        reps: "15",
        notes: "Strict form, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+advanced+form",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Dumbbell Side Raises Superset with Wide Grip Pushups",
        sets: 3,
        reps: "15",
        notes: "No rest between exercises, push to failure",
        youtubeLink: "https://www.youtube.com/results?search_query=side+raise+wide+pushup+extreme",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Superset", "Shoulders", "Chest"],
        equipment: ["Dumbbell", "Bodyweight"]
      },
      {
        exercise: "Close Grip Bench Press",
        sets: 3,
        reps: "15",
        notes: "Maximum tricep activation, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+bench+press+advanced",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Triceps"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Skull Crushers",
        sets: 3,
        reps: "15",
        notes: "Lower slowly, explosive extension",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crusher+advanced+technique",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "3010",
        tags: ["Isolation", "Triceps"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "15",
        notes: "Full extension, maximum contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+advanced",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Triceps"],
        equipment: ["Cable"]
      }
    ]
  },
  {
    day: 2,
    name: "XTREME Day 2 - Back & Biceps",
    description: "Extreme intensity pull day with advanced training techniques",
    quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Waldo Emerson",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+back+bicep+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Prepare for maximum pulling intensity",
        youtubeLink: "https://www.youtube.com/results?search_query=back+workout+advanced+warmup",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Pullups / Pullups / Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Choose hardest variation possible, focus on lat engagement",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+pullup+advanced+technique",
        weight: null,
        restTime: "90s",
        rpe: 9,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Bodyweight", "Cable"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "12-15",
        notes: "Perfect form essential, engage entire posterior chain",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+advanced+form",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "2010",
        tags: ["Compound", "Back", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Reverse Grip Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Underhand grip, pull to lower chest with control",
        youtubeLink: "https://www.youtube.com/results?search_query=reverse+grip+lat+pulldown+advanced",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Heavy weight, strict form, full range",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+row+advanced+technique",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Barbell Shrugs Superset with Rear Delt Flies / Dumbbell Flies",
        sets: 3,
        reps: "12-15",
        notes: "Maximum trap engagement followed by rear delt isolation",
        youtubeLink: "https://www.youtube.com/results?search_query=shrug+rear+delt+superset+advanced",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2110",
        tags: ["Isolation", "Superset", "Traps", "Shoulders"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Strict form, no momentum, maximum bicep contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+advanced",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Biceps"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Biceps Curls Superset with Hammer Curls",
        sets: 3,
        reps: "12-15",
        notes: "Target different bicep heads with varying angles",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+hammer+curl+extreme",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Superset", "Biceps"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 3,
    name: "XTREME Day 3 - Legs",
    description: "Extreme intensity leg workout for maximum lower body development",
    quote: "The pain you feel today will be the strength you feel tomorrow. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+leg+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Intensive leg and hip mobility preparation",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+workout+extreme+warmup",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Squats",
        sets: 4,
        reps: "15",
        notes: "Maximum weight possible with perfect form",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+squat+extreme+intensity",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Deep range of motion, explosive concentric",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+extreme+technique",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Leg Extension",
        sets: 3,
        reps: "12-15",
        notes: "Maximum quad contraction, controlled negative",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+extreme+form",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2020",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "12-15",
        notes: "Full hamstring activation, squeeze at top",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+extreme",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2020",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Wall Sit",
        sets: 1,
        reps: "Till Failure",
        notes: "Push beyond comfort zone, maximum time under tension",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+extreme+endurance",
        weight: 0,
        restTime: "60s",
        rpe: 9,
        tempo: "Hold",
        tags: ["Isometric", "Legs"],
        equipment: ["Bodyweight"]
      }
    ]
  },
  {
    day: 4,
    name: "XTREME Day 4 - Chest, Shoulders & Triceps",
    description: "Second extreme intensity push day of the week",
    quote: "Success isn't given. It's earned in the gym. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+push+workout+advanced",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Prepare for maximum pushing intensity",
        youtubeLink: "https://www.youtube.com/results?search_query=push+workout+extreme+warmup",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Bench Press",
        sets: 3,
        reps: "15",
        notes: "Maximum weight with perfect form and control",
        youtubeLink: "https://www.youtube.com/results?search_query=bench+press+extreme+technique",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "X010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Bench Press",
        sets: 3,
        reps: "15",
        notes: "Upper chest focus with extreme intensity",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+bench+press+extreme",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Cable Cross Over or Inner Pec Flies",
        sets: 3,
        reps: "15",
        notes: "Maximum chest activation and peak contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+extreme+intensity",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2020",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable"]
      },
      {
        exercise: "Shoulder Press",
        sets: 3,
        reps: "15",
        notes: "Overhead strength with maximum shoulder engagement",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+extreme+form",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Dumbbell Side Raises Superset with Wide Grip Pushups",
        sets: 3,
        reps: "15",
        notes: "Push beyond failure, extreme shoulder burn",
        youtubeLink: "https://www.youtube.com/results?search_query=side+raise+pushup+extreme+superset",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Superset", "Shoulders", "Chest"],
        equipment: ["Dumbbell", "Bodyweight"]
      },
      {
        exercise: "Close Grip Bench Press",
        sets: 3,
        reps: "15",
        notes: "Maximum tricep overload with strict form",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+bench+extreme",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Triceps"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Skull Crushers",
        sets: 3,
        reps: "15",
        notes: "Controlled eccentric, explosive concentric",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crusher+extreme+technique",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "3010",
        tags: ["Isolation", "Triceps"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "15",
        notes: "Maximum tricep contraction and extension",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+extreme",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Triceps"],
        equipment: ["Cable"]
      }
    ]
  },
  {
    day: 5,
    name: "XTREME Day 5 - Back & Biceps",
    description: "Second extreme intensity pull day for complete back development",
    quote: "Your limitation—it's only your imagination. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+back+bicep+advanced",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Intensive preparation for maximum pulling work",
        youtubeLink: "https://www.youtube.com/results?search_query=pull+workout+extreme+warmup",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Pullups / Pullups / Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Maximum resistance, perfect pulling form",
        youtubeLink: "https://www.youtube.com/results?search_query=pullup+extreme+advanced",
        weight: null,
        restTime: "90s",
        rpe: 9,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Bodyweight", "Cable"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "12-15",
        notes: "Heavy deadlifts with perfect form, maximum posterior chain",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+extreme+intensity",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "2010",
        tags: ["Compound", "Back", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Reverse Grip Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Maximum lat stretch and contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=reverse+lat+pulldown+extreme",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Heavy rows with maximum back engagement",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+row+extreme+form",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Barbell Shrugs Superset with Rear Delt Flies / Dumbbell Flies",
        sets: 3,
        reps: "12-15",
        notes: "Maximum trap and rear delt development",
        youtubeLink: "https://www.youtube.com/results?search_query=shrug+rear+delt+extreme+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2110",
        tags: ["Isolation", "Superset", "Traps", "Shoulders"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Heavy bicep curls with strict form",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+extreme",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Biceps"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Biceps Curls Superset with Hammer Curls",
        sets: 3,
        reps: "12-15",
        notes: "Complete bicep annihilation with varying angles",
        youtubeLink: "https://www.youtube.com/results?search_query=bicep+superset+extreme",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Superset", "Biceps"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 6,
    name: "XTREME Day 6 - Legs",
    description: "Final extreme intensity leg workout for complete lower body mastery",
    quote: "Great things never come from comfort zones. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+leg+workout+advanced",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Final preparation for extreme leg training",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+workout+final+warmup",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Squats",
        sets: 4,
        reps: "15",
        notes: "Maximum weight possible, perfect depth",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+squat+extreme+final",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Maximum load with full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+extreme+final",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Leg Extension",
        sets: 3,
        reps: "12-15",
        notes: "Complete quad exhaustion with peak contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+extreme+final",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2020",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "12-15",
        notes: "Maximum hamstring development and strength",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+extreme+final",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2020",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Wall Sit",
        sets: 1,
        reps: "Till Failure",
        notes: "Final test of mental and physical endurance",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+extreme+final",
        weight: 0,
        restTime: "60s",
        rpe: 9,
        tempo: "Hold",
        tags: ["Isometric", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Calf Raises",
        sets: 3,
        reps: "12-15",
        notes: "Complete lower leg development with maximum contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=calf+raise+extreme+final",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2110",
        tags: ["Isolation", "Calves"],
        equipment: ["Machine", "Dumbbell"]
      }
    ]
  }
];

export const getXtremeWorkoutByDay = (day: number): WorkoutDay | undefined => {
  return XTREME_WORKOUT_PLAN.find(workout => workout.day === day);
};

export const convertXtremeWorkoutToExercises = (workout: WorkoutDay): ExerciseDetail[] => {
  if (!workout || !workout.exercises) {
    return [];
  }
  
  // For Xtreme workouts, we'll add specific metadata that's relevant to extreme training
  return workout.exercises.map(exercise => {
    return {
      ...exercise,
      notes: exercise.notes || `Part of ${workout.name}`,
      tags: [...(exercise.tags || []), 'Xtreme'],  // Add 'Xtreme' tag if not already present
      restTime: exercise.restTime || '60s', // Standard rest for extreme training if not specified
      rpe: exercise.rpe || 9,  // Higher RPE for extreme training if not specified
      tempo: exercise.tempo || '2010'  // Standard tempo for extreme exercises if not specified
    };
  });
};
