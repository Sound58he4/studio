// src/data/workouts/power-workout-plan.ts
/**
 * Workout Plans - Structured Programs
 * Based on the LIGHT, MAX, POWER, and XTREME workout PDF files provided by the user
 */

import type { ExerciseDetail } from '@/app/dashboard/types';

export type WorkoutPlanType = 'LIGHT' | 'MAX' | 'POWER' | 'XTREME';

export interface WorkoutDay {
  day: number;
  name: string;
  description: string;
  quote: string;
  youtubeExplanationUrl: string;
  exercises: ExerciseDetail[];
}

// LIGHT WORKOUT PLAN
export const LIGHT_WORKOUT_PLAN: WorkoutDay[] = [
  {
    day: 1,
    name: "LIGHT Day 1 - Full Body",
    description: "Light intensity full body workout focusing on foundational movements",
    quote: "The journey of a thousand miles begins with a single step. - Lao Tzu",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=beginner+full+body+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Knee Pushups / Pushups",
        sets: 3,
        reps: "15",
        notes: "Choose variation based on fitness level",
        youtubeLink: "https://www.youtube.com/results?search_query=proper+pushup+form+beginner",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Bodyweight"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Dumbbell Bench Press",
        sets: 3,
        reps: "15",
        notes: "Use light to moderate weight",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+bench+press+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Lat Pull Down",
        sets: 3,
        reps: "15",
        notes: "Focus on proper form and full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=lat+pulldown+proper+form",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Shoulder Press",
        sets: 3,
        reps: "15",
        notes: "Controlled movement, light to moderate weight",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Dumbbell Bicep Curls",
        sets: 3,
        reps: "15",
        notes: "Focus on bicep contraction, avoid swinging",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+bicep+curl+proper+form",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "15",
        notes: "Keep elbows at sides, focus on extension",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Cable"]
      },
      {
        exercise: "Barbell Squats / Dumbbell Squats",
        sets: 3,
        reps: "15",
        notes: "Choose variation based on fitness level",
        youtubeLink: "https://www.youtube.com/results?search_query=squat+proper+form+beginner",
        weight: null,
        restTime: "90s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Ab Crunches",
        sets: 3,
        reps: "15",
        notes: "Focus on abdominal contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=proper+ab+crunch+form",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Core", "Isolation"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Leg Raises",
        sets: 3,
        reps: "15",
        notes: "Control the movement, focus on lower abs",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+raises+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Core", "Isolation"],
        equipment: ["Bodyweight"]
      }
    ]
  },
  {
    day: 2,
    name: "LIGHT Day 2 - Full Body",
    description: "Light intensity full body workout with exercise variations",
    quote: "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=light+full+body+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Knee Pushups / Pushups",
        sets: 3,
        reps: "15",
        notes: "Choose variation based on fitness level",
        youtubeLink: "https://www.youtube.com/results?search_query=proper+pushup+form+beginner",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Bodyweight"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Incline Dumbbell Press",
        sets: 3,
        reps: "15",
        notes: "Focus on upper chest activation",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+dumbbell+press+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Cable Lat Rows",
        sets: 3,
        reps: "15",
        notes: "Pull to lower chest, squeeze shoulder blades",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+lat+row+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Side Raises",
        sets: 3,
        reps: "15",
        notes: "Slight bend in elbow, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+lateral+raise+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Shoulders"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "15",
        notes: "Keep elbows at sides, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Seated Overhead Dumbbell Tricep Extension",
        sets: 3,
        reps: "15",
        notes: "Keep upper arms stationary, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=seated+overhead+tricep+extension+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Leg Extension",
        sets: 3,
        reps: "15",
        notes: "Focus on quad contraction at the top",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+proper+form",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Ab Crunches",
        sets: 3,
        reps: "15",
        notes: "Focus on abdominal contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=proper+ab+crunch+form",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Core", "Isolation"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Leg Raises",
        sets: 3,
        reps: "15",
        notes: "Control the movement, focus on lower abs",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+raises+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Core", "Isolation"],
        equipment: ["Bodyweight"]
      }
    ]
  },
  {
    day: 3,
    name: "LIGHT Day 3 - Full Body",
    description: "Complete light intensity full body workout with additional exercises",
    quote: "It's not about being the best, it's about being better than you were yesterday. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=full+body+workout+light+intensity",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Knee Pushups / Pushups",
        sets: 3,
        reps: "15",
        notes: "Choose variation based on fitness level",
        youtubeLink: "https://www.youtube.com/results?search_query=proper+pushup+form+beginner",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Bodyweight"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Cable Crossover / Butterflies",
        sets: 3,
        reps: "15",
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable", "Machine"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "15",
        notes: "Support with bench, pull to hip",
        youtubeLink: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Dumbbell Rear Delt Flies / Machine Rear Delt Flies",
        sets: 3,
        reps: "15",
        notes: "Focus on rear deltoid activation",
        youtubeLink: "https://www.youtube.com/results?search_query=rear+delt+fly+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Shoulders"],
        equipment: ["Dumbbell", "Machine"]
      },
      {
        exercise: "Dumbbell Shrug",
        sets: 3,
        reps: "15",
        notes: "Lift straight up, hold at top",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+shrug+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2110",
        tags: ["Isolation", "Traps"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Hammer Curls",
        sets: 3,
        reps: "15",
        notes: "Neutral grip, focus on forearm and bicep",
        youtubeLink: "https://www.youtube.com/results?search_query=hammer+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Triceps Dips",
        sets: 3,
        reps: "12-15",
        notes: "Use bench if needed, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+dips+bench+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Arms"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Lunges / Dumbbell Lunges",
        sets: 3,
        reps: "12-15",
        notes: "Each leg, step forward, lower knee to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+lunge+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Bodyweight", "Dumbbell"]
      },
      {
        exercise: "Wall Sit",
        sets: 3,
        reps: 12,
        notes: "Back against wall, thighs parallel to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 6,
        tempo: "Hold",
        tags: ["Isometric", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Ab Crunches",
        sets: 3,
        reps: "15",
        notes: "Focus on abdominal contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=proper+ab+crunch+form",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Core", "Isolation"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Leg Raises",
        sets: 3,
        reps: "15",
        notes: "Control the movement, focus on lower abs",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+raises+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Core", "Isolation"],
        equipment: ["Bodyweight"]
      }
    ]
  }
];

// MAX WORKOUT PLAN
export const MAX_WORKOUT_PLAN: WorkoutDay[] = [
  {
    day: 1,
    name: "MAX Day 1 - Chest, Back & Shoulders",
    description: "Maximum intensity upper body workout focusing on compound movements",
    quote: "The only way to define your limits is by going beyond them. - Arthur C. Clarke",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=intense+upper+body+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Focus on full range of motion and chest contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Inner Pec Flies / Butterflies",
        sets: 3,
        reps: "15",
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=pec+flies+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Dumbbell", "Machine"]
      },
      {
        exercise: "Dead Lift",
        sets: 3,
        reps: "15",
        notes: "Maintain neutral spine, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Lat Pulldown",
        sets: 3,
        reps: "15",
        notes: "Pull to upper chest, lean back slightly",
        youtubeLink: "https://www.youtube.com/results?search_query=lat+pulldown+proper+form",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Shoulder Press Superset with Side Raises",
        sets: 3,
        reps: "15",
        notes: "Complete shoulder press then immediately do side raises",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+lateral+raise+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Shoulders", "Superset"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Rear Delt Raises Superset with Dumbbell Front Raises",
        sets: 3,
        reps: "15",
        notes: "Complete rear delt raises then immediately do front raises",
        youtubeLink: "https://www.youtube.com/results?search_query=rear+delt+front+raise+superset",
        weight: null,
        restTime: "90s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Shoulders", "Superset"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Incline Bicep Curls Superset with Triceps Pushdown",
        sets: 3,
        reps: "15",
        notes: "Complete incline curls then immediately do pushdowns",
        youtubeLink: "https://www.youtube.com/results?search_query=bicep+tricep+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms", "Superset"],
        equipment: ["Dumbbell", "Cable"]
      },
      {
        exercise: "Hammer Curls Superset with Overhead Dumbbell Triceps Extension",
        sets: 3,
        reps: "15",
        notes: "Complete hammer curls then immediately do tricep extensions",
        youtubeLink: "https://www.youtube.com/results?search_query=hammer+curl+tricep+extension+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms", "Superset"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 2,
    name: "MAX Day 2 - Legs",
    description: "Maximum intensity leg workout for complete lower body development",
    quote: "The pain you feel today will be the strength you feel tomorrow. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=max+leg+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, don't lock out knees",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Leg Extension",
        sets: 3,
        reps: "12-15",
        notes: "Focus on quad contraction at the top",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+proper+form",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "12-15",
        notes: "Focus on hamstring contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Wall Sit",
        sets: 1,
        reps: "Till Failure",
        notes: "Back against wall, thighs parallel to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 8,
        tempo: "Hold",
        tags: ["Isometric", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Calf Raises",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, squeeze at top",
        youtubeLink: "https://www.youtube.com/results?search_query=calf+raises+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2110",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine", "Bodyweight"]
      }
    ]
  },
  {
    day: 3,
    name: "MAX Day 3 - Chest & Triceps",
    description: "Maximum intensity chest and triceps workout for upper body strength",
    quote: "Push yourself because no one else is going to do it for you. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=chest+tricep+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Flat Bench Press",
        sets: 3,
        reps: "15",
        notes: "Focus on chest contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Bench Press",
        sets: 3,
        reps: "15",
        notes: "Focus on upper chest development",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Cable Crossover / Inner Pec Flies",
        sets: 3,
        reps: "15",
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable", "Machine"]
      },
      {
        exercise: "Shoulder Press",
        sets: 3,
        reps: "15",
        notes: "Full range of motion, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell", "Barbell"]
      },
      {
        exercise: "Dumbbell Side Raises Superset with Wide Grip Pushups",
        sets: 3,
        reps: "15",
        notes: "Complete side raises then immediately do pushups",
        youtubeLink: "https://www.youtube.com/results?search_query=lateral+raise+pushup+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Shoulders", "Superset"],
        equipment: ["Dumbbell", "Bodyweight"]
      },
      {
        exercise: "Close Grip Bench Press",
        sets: 3,
        reps: "15",
        notes: "Hands shoulder-width apart, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Skull Crushers",
        sets: 3,
        reps: "15",
        notes: "Keep elbows stationary, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crushers+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "15",
        notes: "Keep elbows at sides, full extension",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Cable"]
      }
    ]
  },
  {
    day: 4,
    name: "MAX Day 4 - Back & Biceps",
    description: "Maximum intensity back and biceps workout for upper body strength",
    quote: "The only place where success comes before work is in the dictionary. - Vidal Sassoon",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=back+biceps+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Choose variation based on strength level",
        youtubeLink: "https://www.youtube.com/results?search_query=pullup+variations+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Bodyweight", "Cable"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "12-15",
        notes: "Maintain neutral spine, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Reverse Grip Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Underhand grip, focus on lower lats",
        youtubeLink: "https://www.youtube.com/results?search_query=reverse+grip+lat+pulldown+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Support with bench, pull to hip",
        youtubeLink: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Barbell Shrugs Superset with Rear Delt Flies / Dumbbell Flies",
        sets: 3,
        reps: "12-15",
        notes: "Complete shrugs then immediately do rear delt flies",
        youtubeLink: "https://www.youtube.com/results?search_query=shrug+rear+delt+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2110",
        tags: ["Isolation", "Back", "Shoulders", "Superset"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Keep elbows at sides, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Biceps Curls Superset with Hammer Curls",
        sets: 3,
        reps: "12-15",
        notes: "Complete incline curls then immediately do hammer curls",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+hammer+curl+superset",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms", "Superset"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 5,
    name: "MAX Day 5 - Legs",
    description: "Maximum intensity leg workout for complete lower body development",
    quote: "The harder you work for something, the greater you'll feel when you achieve it. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=max+leg+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, don't lock out knees",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Leg Extension",
        sets: 3,
        reps: "12-15",
        notes: "Focus on quad contraction at the top",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+proper+form",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "12-15",
        notes: "Focus on hamstring contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Wall Sit",
        sets: 1,
        reps: "Till Failure",
        notes: "Back against wall, thighs parallel to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 8,
        tempo: "Hold",
        tags: ["Isometric", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Calf Raises",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, squeeze at top",
        youtubeLink: "https://www.youtube.com/results?search_query=calf+raises+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2110",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine", "Bodyweight"]
      }
    ]
  }
];

// POWER WORKOUT PLAN
export const POWER_WORKOUT_PLAN: WorkoutDay[] = [  {
    day: 1,
    name: "POWER Day 1 - Shoulders & Biceps",
    description: "Power-focused shoulder and bicep training for maximum strength gains",
    quote: "Success isn't given. It's earned in the gym. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=power+shoulder+biceps+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Wide Grip Pushups",
        sets: 3,
        reps: "20",
        notes: "Place weight on back, wide hand placement",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+wide+grip+pushup+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest", "Shoulders"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Barbell Shoulder Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+shoulder+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Dumbbell Shoulder Press Superset with Dumbbell Side Raises",
        sets: 3,
        reps: "12-15",
        notes: "Complete shoulder press then immediately do side raises",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+lateral+raise+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Isolation", "Shoulders", "Superset"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Rear Delt Flies Superset with Plate Front Raises",
        sets: 3,
        reps: "12-15",
        notes: "Complete rear delt flies then immediately do front raises",
        youtubeLink: "https://www.youtube.com/results?search_query=rear+delt+front+raise+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Shoulders", "Superset"],
        equipment: ["Dumbbell", "Weight Plate"]
      },
      {
        exercise: "Trap Bar Shrugs",
        sets: 3,
        reps: 12,
        notes: "Lift straight up, hold at top briefly",
        youtubeLink: "https://www.youtube.com/results?search_query=trap+bar+shrug+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2110",
        tags: ["Isolation", "Traps"],
        equipment: ["Trap Bar"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12",
        notes: "Keep elbows at sides, control the weight",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Dumbbell Curls",
        sets: 3,
        reps: 12,
        notes: "Seated on incline bench, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+dumbbell+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Preacher Curls",
        sets: 3,
        reps: 12,
        notes: "Full range of motion, control the negative",
        youtubeLink: "https://www.youtube.com/results?search_query=preacher+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "3010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Hammer Curls",
        sets: 3,
        reps: "12",
        notes: "Neutral grip, focus on forearm and bicep",
        youtubeLink: "https://www.youtube.com/results?search_query=hammer+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 2,
    name: "POWER Day 2 - Chest & Back",
    description: "Power-focused chest and back training for maximum strength gains",
    quote: "The cave you fear to enter holds the treasure you seek. - Joseph Campbell",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=power+chest+back+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        reps: "10-12",
        notes: "Control the weight, focus on chest contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Dumbbell Press",
        sets: 3,
        reps: "12",
        notes: "45-degree incline, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+dumbbell+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Inner Pec Flies Superset with Chest Pushups",
        sets: 3,
        reps: "12-15",
        notes: "Complete flies then immediately do pushups",
        youtubeLink: "https://www.youtube.com/results?search_query=pec+fly+pushup+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Compound", "Chest", "Superset"],
        equipment: ["Dumbbell", "Machine", "Bodyweight"]
      },
      {
        exercise: "Cable Crossovers",
        sets: 3,
        reps: "12-15",
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable"]
      },
      {
        exercise: "Lat Pulldowns",
        sets: 3,
        reps: "12-15",
        notes: "Pull to upper chest, lean back slightly",
        youtubeLink: "https://www.youtube.com/results?search_query=lat+pulldown+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Chest Supported Rows",
        sets: 3,
        reps: "12-15",
        notes: "Chest supported on incline bench, pull to abdomen",
        youtubeLink: "https://www.youtube.com/results?search_query=chest+supported+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell", "Machine"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "10-12",
        notes: "Maintain neutral spine, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Support with bench, pull to hip",
        youtubeLink: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      }
    ]
  },  {
    day: 3,
    name: "POWER Day 3 - Triceps, Legs & Core",
    description: "Power-focused triceps, legs and core training for maximum strength gains",
    quote: "Pain is temporary. Quitting lasts forever. - Lance Armstrong",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=power+triceps+legs+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Tricep Dips",
        sets: 3,
        reps: "12-15",
        notes: "Use weight if needed, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+dips+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Arms"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Rope Tricep Pushdown",
        sets: 3,
        reps: "12-15",
        notes: "Keep elbows at sides, spread rope at bottom",
        youtubeLink: "https://www.youtube.com/results?search_query=rope+tricep+pushdown+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Cable"]
      },
      {
        exercise: "Skull Crushers Superset with Close Grip Bench Press",
        sets: 3,
        reps: "12 each",
        notes: "Complete skull crushers then immediately do close grip bench",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crusher+close+grip+bench+superset",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Compound", "Arms", "Superset"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Close Grip Pushups",
        sets: 3,
        reps: 12,
        notes: "Hand placement shoulder-width or narrower",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+pushup+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Arms", "Chest"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Squats",
        sets: 3,
        reps: "12-15",
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, don't lock out knees",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "15",
        notes: "Focus on hamstring contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hanging Leg Raises / Leg Raises",
        sets: 3,
        reps: "15-20",
        notes: "Keep legs straight if possible, control movement",
        youtubeLink: "https://www.youtube.com/results?search_query=hanging+leg+raise+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Core"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Plate Weighted Crunches",
        sets: 3,
        reps: "15",
        notes: "Hold weight plate on chest, focus on contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+crunches+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Core"],
        equipment: ["Weight Plate"]
      },
      {
        exercise: "Plank",
        sets: 3,
        reps: 12,
        notes: "Keep body straight, engage core",
        youtubeLink: "https://www.youtube.com/results?search_query=plank+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 6,
        tempo: "Hold",
        tags: ["Core", "Isometric"],
        equipment: ["Bodyweight"]
      }
    ]
  },
  {
    day: 4,
    name: "POWER Day 4 - Shoulders & Biceps",
    description: "Power-focused shoulder and bicep training for maximum strength gains",
    quote: "The only bad workout is the one that didn't happen. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=power+shoulder+biceps+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Wide Grip Pushups",
        sets: 3,
        reps: "20",
        notes: "Place weight on back, wide hand placement",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+wide+grip+pushup+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest", "Shoulders"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Barbell Shoulder Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+shoulder+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Dumbbell Shoulder Press Superset with Dumbbell Side Raises",
        sets: 3,
        reps: "12-15",
        notes: "Complete shoulder press then immediately do side raises",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+lateral+raise+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Isolation", "Shoulders", "Superset"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Rear Delt Flies Superset with Plate Front Raises",
        sets: 3,
        reps: "12-15",
        notes: "Complete rear delt flies then immediately do front raises",
        youtubeLink: "https://www.youtube.com/results?search_query=rear+delt+front+raise+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Shoulders", "Superset"],
        equipment: ["Dumbbell", "Weight Plate"]
      },
      {
        exercise: "Trap Bar Shrugs",
        sets: 3,
        reps: 12,
        notes: "Lift straight up, hold at top briefly",
        youtubeLink: "https://www.youtube.com/results?search_query=trap+bar+shrug+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2110",
        tags: ["Isolation", "Traps"],
        equipment: ["Trap Bar"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12",
        notes: "Keep elbows at sides, control the weight",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Dumbbell Curls",
        sets: 3,
        reps: 12,
        notes: "Seated on incline bench, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+dumbbell+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Preacher Curls",
        sets: 3,
        reps: 12,
        notes: "Full range of motion, control the negative",
        youtubeLink: "https://www.youtube.com/results?search_query=preacher+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 8,
        tempo: "3010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Hammer Curls",
        sets: 3,
        reps: "12",
        notes: "Neutral grip, focus on forearm and bicep",
        youtubeLink: "https://www.youtube.com/results?search_query=hammer+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      }
    ]
  },  {
    day: 5,
    name: "POWER Day 5 - Chest & Back",
    description: "Power-focused chest and back training for maximum strength gains",
    quote: "Your limitation—it's only your imagination. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=power+chest+back+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        reps: "10-12",
        notes: "Control the weight, focus on chest contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Dumbbell Press",
        sets: 3,
        reps: "12",
        notes: "45-degree incline, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+dumbbell+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Inner Pec Flies Superset with Chest Pushups",
        sets: 3,
        reps: "12-15",
        notes: "Complete flies then immediately do pushups",
        youtubeLink: "https://www.youtube.com/results?search_query=pec+fly+pushup+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Compound", "Chest", "Superset"],
        equipment: ["Dumbbell", "Machine", "Bodyweight"]
      },
      {
        exercise: "Cable Crossovers",
        sets: 3,
        reps: "12-15",
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable"]
      },
      {
        exercise: "Lat Pulldowns",
        sets: 3,
        reps: "12-15",
        notes: "Pull to upper chest, lean back slightly",
        youtubeLink: "https://www.youtube.com/results?search_query=lat+pulldown+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Chest Supported Rows",
        sets: 3,
        reps: "12-15",
        notes: "Chest supported on incline bench, pull to abdomen",
        youtubeLink: "https://www.youtube.com/results?search_query=chest+supported+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell", "Machine"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "10-12",
        notes: "Maintain neutral spine, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Support with bench, pull to hip",
        youtubeLink: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 6,
    name: "POWER Day 6 - Triceps, Legs & Core",
    description: "Power-focused triceps, legs and core training for maximum strength gains",
    quote: "Champions aren't made in comfort zones. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=power+triceps+legs+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
        weight: 0,
        restTime: "0s",
        rpe: 3,
        tempo: "Moderate",
        tags: ["Warm-up", "Mobility"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Tricep Dips",
        sets: 3,
        reps: "12-15",
        notes: "Use weight if needed, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+dips+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Arms"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Rope Tricep Pushdown",
        sets: 3,
        reps: "12-15",
        notes: "Keep elbows at sides, spread rope at bottom",
        youtubeLink: "https://www.youtube.com/results?search_query=rope+tricep+pushdown+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Cable"]
      },
      {
        exercise: "Skull Crushers Superset with Close Grip Bench Press",
        sets: 3,
        reps: "12 each",
        notes: "Complete skull crushers then immediately do close grip bench",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crusher+close+grip+bench+superset",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Isolation", "Compound", "Arms", "Superset"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Close Grip Pushups",
        sets: 3,
        reps: 12,
        notes: "Hand placement shoulder-width or narrower",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+pushup+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Arms", "Chest"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Weighted Squats",
        sets: 3,
        reps: "12-15",
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, don't lock out knees",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "15",
        notes: "Focus on hamstring contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hanging Leg Raises / Leg Raises",
        sets: 3,
        reps: "15-20",
        notes: "Keep legs straight if possible, control movement",
        youtubeLink: "https://www.youtube.com/results?search_query=hanging+leg+raise+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Core"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Plate Weighted Crunches",
        sets: 3,
        reps: "15",
        notes: "Hold weight plate on chest, focus on contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+crunches+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2010",
        tags: ["Core"],
        equipment: ["Weight Plate"]
      },
      {
        exercise: "Plank",
        sets: 3,
        reps: 12,
        notes: "Keep body straight, engage core",
        youtubeLink: "https://www.youtube.com/results?search_query=plank+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 6,
        tempo: "Hold",
        tags: ["Core", "Isometric"],
        equipment: ["Bodyweight"]
      }
    ]
  }
];

// XTREME WORKOUT PLAN
export const XTREME_WORKOUT_PLAN: WorkoutDay[] = [
  {
    day: 1,
    name: "XTREME Day 1 - Chest, Shoulders & Triceps",
    description: "Extreme intensity chest, shoulders and triceps workout for maximum gains",
    quote: "Pain is temporary. Pride is forever. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+push+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Focus on chest contraction, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Bench Press",
        sets: 3,
        reps: "15",
        notes: "Focus on upper chest development",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+bench+press+tutorial",
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
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable", "Machine"]
      },
      {
        exercise: "Shoulder Press",
        sets: 3,
        reps: "15",
        notes: "Full range of motion, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
 tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell", "Barbell"]
      },
      {
        exercise: "Dumbbell Side Raises Superset with Wide Grip Pushups",
        sets: 3,
        reps: "15",
        notes: "Complete side raises then immediately do pushups",
        youtubeLink: "https://www.youtube.com/results?search_query=lateral+raise+pushup+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Compound", "Shoulders", "Superset"],
        equipment: ["Dumbbell", "Bodyweight"]
      },
      {
        exercise: "Close Grip Bench Press",
        sets: 3,
        reps: "15",
        notes: "Hands shoulder-width apart, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Skull Crushers",
        sets: 3,
        reps: "15",
        notes: "Keep elbows stationary, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crushers+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "15",
        notes: "Keep elbows at sides, full extension",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Cable"]
      }
    ]
  },
  {
    day: 2,
    name: "XTREME Day 2 - Back & Biceps",
    description: "Extreme intensity back and biceps workout for maximum gains",
    quote: "If you want something you've never had, you must be willing to do something you've never done. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+pull+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Choose variation based on strength level",
        youtubeLink: "https://www.youtube.com/results?search_query=pullup+variations+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Bodyweight", "Cable"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "12-15",
        notes: "Maintain neutral spine, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Reverse Grip Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Underhand grip, focus on lower lats",
        youtubeLink: "https://www.youtube.com/results?search_query=reverse+grip+lat+pulldown+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Support with bench, pull to hip",
        youtubeLink: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Barbell Shrugs Superset with Rear Delt Flies / Dumbbell Flies",
        sets: 3,
        reps: "12-15",
        notes: "Complete shrugs then immediately do rear delt flies",
        youtubeLink: "https://www.youtube.com/results?search_query=shrug+rear+delt+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2110",
        tags: ["Isolation", "Back", "Shoulders", "Superset"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Keep elbows at sides, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Biceps Curls Superset with Hammer Curls",
        sets: 3,
        reps: "12-15",
        notes: "Complete incline curls then immediately do hammer curls",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+hammer+curl+superset",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms", "Superset"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 3,
    name: "XTREME Day 3 - Legs",
    description: "Extreme intensity leg workout for complete lower body development",
    quote: "The pain you feel today will be the strength you feel tomorrow. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+leg+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, don't lock out knees",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+tutorial",
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
        notes: "Focus on quad contraction at the top",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+proper+form",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "12-15",
        notes: "Focus on hamstring contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Wall Sit",
        sets: 1,
        reps: "Till Failure",
        notes: "Back against wall, thighs parallel to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+tutorial",
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
        notes: "Full range of motion, squeeze at top",
        youtubeLink: "https://www.youtube.com/results?search_query=calf+raises+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2110",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine", "Bodyweight"]
      }
    ]
  },
  {
    day: 4,
    name: "XTREME Day 4 - Chest, Shoulders & Triceps",
    description: "Extreme intensity chest, shoulders and triceps workout for maximum gains",
    quote: "The difference between the impossible and the possible lies in a person's determination. - Tommy Lasorda",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+push+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Focus on chest contraction, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Bench Press",
        sets: 3,
        reps: "15",
        notes: "Focus on upper chest development",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+bench+press+tutorial",
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
        notes: "Focus on chest contraction at center",
        youtubeLink: "https://www.youtube.com/results?search_query=cable+crossover+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Cable", "Machine"]
      },
      {
        exercise: "Shoulder Press",
        sets: 3,
        reps: "15",
        notes: "Full range of motion, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=shoulder+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell", "Barbell"]
      },
      {
        exercise: "Dumbbell Side Raises Superset with Wide Grip Pushups",
        sets: 3,
        reps: "15",
        notes: "Complete side raises then immediately do pushups",
        youtubeLink: "https://www.youtube.com/results?search_query=lateral+raise+pushup+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Compound", "Shoulders", "Superset"],
        equipment: ["Dumbbell", "Bodyweight"]
      },
      {
        exercise: "Close Grip Bench Press",
        sets: 3,
        reps: "15",
        notes: "Hands shoulder-width apart, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Skull Crushers",
        sets: 3,
        reps: "15",
        notes: "Keep elbows stationary, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=skull+crushers+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell", "EZ Bar"]
      },
      {
        exercise: "Tricep Pushdown",
        sets: 3,
        reps: "15",
        notes: "Keep elbows at sides, full extension",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Cable"]
      }
    ]
  },
  {
    day: 5,
    name: "XTREME Day 5 - Back & Biceps",
    description: "Extreme intensity back and biceps workout for maximum gains",
    quote: "Great things never came from comfort zones. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+pull+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Choose variation based on strength level",
        youtubeLink: "https://www.youtube.com/results?search_query=pullup+variations+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Bodyweight", "Cable"]
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "12-15",
        notes: "Maintain neutral spine, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Reverse Grip Lat Pulldown",
        sets: 3,
        reps: "12-15",
        notes: "Underhand grip, focus on lower lats",
        youtubeLink: "https://www.youtube.com/results?search_query=reverse+grip+lat+pulldown+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
        notes: "Support with bench, pull to hip",
        youtubeLink: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Barbell Shrugs Superset with Rear Delt Flies / Dumbbell Flies",
        sets: 3,
        reps: "12-15",
        notes: "Complete shrugs then immediately do rear delt flies",
        youtubeLink: "https://www.youtube.com/results?search_query=shrug+rear+delt+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2110",
        tags: ["Isolation", "Back", "Shoulders", "Superset"],
        equipment: ["Barbell", "Dumbbell"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Keep elbows at sides, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Biceps Curls Superset with Hammer Curls",
        sets: 3,
        reps: "12-15",
        notes: "Complete incline curls then immediately do hammer curls",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+hammer+curl+superset",
        weight: null,
        restTime: "60s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Arms", "Superset"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 6,
    name: "XTREME Day 6 - Legs",
    description: "Extreme intensity leg workout for complete lower body development",
    quote: "Don't wish it were easier. Wish you were better. - Jim Rohn",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=extreme+leg+workout",
    exercises: [
      {
        exercise: "Dynamic Stretches",
        sets: 1,
        reps: "5-10 min",
        notes: "Warm up all major muscle groups",
        youtubeLink: "https://www.youtube.com/results?search_query=dynamic+stretching+routine",
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
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "120s",
        rpe: 9,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "12-15",
        notes: "Full range of motion, don't lock out knees",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+press+tutorial",
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
        notes: "Focus on quad contraction at the top",
        youtubeLink: "https://www.youtube.com/results?search_query=leg+extension+proper+form",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Hamstring Curls",
        sets: 3,
        reps: "12-15",
        notes: "Focus on hamstring contraction",
        youtubeLink: "https://www.youtube.com/results?search_query=hamstring+curl+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine"]
      },
      {
        exercise: "Wall Sit",
        sets: 1,
        reps: "Till Failure",
        notes: "Back against wall, thighs parallel to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=wall+sit+tutorial",
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
        notes: "Full range of motion, squeeze at top",
        youtubeLink: "https://www.youtube.com/results?search_query=calf+raises+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 6,
        tempo: "2110",
        tags: ["Isolation", "Legs"],
        equipment: ["Machine", "Bodyweight"]
      }
    ]
  }
];

// Additional motivational quotes for variety
export const WORKOUT_QUOTES = [
  "The pain you feel today will be the strength you feel tomorrow.",
  "Success isn't given. It's earned in the gym.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The only bad workout is the one that didn't happen.",
  "Champions aren't made in comfort zones.",
  "Strength does not come from physical capacity. It comes from an indomitable will.",
  "The cave you fear to enter holds the treasure you seek.",
  "Your limitation—it's only your imagination.",
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Don't wish it were easier. Wish you were better.",
  "The difference between the impossible and the possible lies in a person's determination.",
  "If you want something you've never had, you must be willing to do something you've never done.",
  "It's not about being the best, it's about being better than you were yesterday.",
  "Pain is temporary. Quitting lasts forever."
];

// Get a random workout quote
export const getRandomWorkoutQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * WORKOUT_QUOTES.length);
  return WORKOUT_QUOTES[randomIndex];
};

// Get workout by type and day number
export const getWorkoutByTypeAndDay = (type: WorkoutPlanType, day: number): WorkoutDay | undefined => {
  let workoutPlan: WorkoutDay[] = [];
  
  switch(type) {
    case 'LIGHT':
      workoutPlan = LIGHT_WORKOUT_PLAN;
      break;
    case 'MAX':
      workoutPlan = MAX_WORKOUT_PLAN;
      break;
    case 'POWER':
      workoutPlan = POWER_WORKOUT_PLAN;
      break;
    case 'XTREME':
      workoutPlan = XTREME_WORKOUT_PLAN;
      break;
  }
  
  return workoutPlan.find(workout => workout.day === day);
};

// Convert WorkoutDay to ExerciseDetail array for compatibility
export const convertWorkoutToExercises = (workout: WorkoutDay): ExerciseDetail[] => {
  return workout.exercises;
};

// Convert Power workout to ExerciseDetail array (specific implementation for power workouts)
export const convertPowerWorkoutToExercises = (workout: WorkoutDay): ExerciseDetail[] => {
  if (!workout || !workout.exercises) {
    return [];
  }
  
  // For Power workouts, we'll add specific metadata that's relevant to power training
  return workout.exercises.map(exercise => {
    return {
      ...exercise,
      notes: exercise.notes || `Part of ${workout.name}`,
      tags: [...(exercise.tags || []), 'Power'],  // Add 'Power' tag if not already present
      restTime: exercise.restTime || '90s', // Longer rest for power training if not specified
      rpe: exercise.rpe || 8,  // Higher RPE for power training if not specified
      tempo: exercise.tempo || '2010'  // Standard tempo for power exercises if not specified
    };
  });
};

// Get all available workout types
export const getWorkoutTypes = (): WorkoutPlanType[] => {
  return ['LIGHT', 'MAX', 'POWER', 'XTREME'];
};

// For backward compatibility
export const getPowerWorkoutByDay = (day: number): WorkoutDay | undefined => {
  return getWorkoutByTypeAndDay('POWER', day);
};
