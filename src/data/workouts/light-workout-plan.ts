// src/data/workouts/light-workout-plan.ts
/**
 * LIGHT Workout Plan - 3-Day Beginner-Friendly Program
 * Based on the LIGHT workout PDF files provided by the user
 * RPE: 5-6 (Moderate intensity)
 * Focus: Foundation building, proper form, basic movements
 */

import type { ExerciseDetail } from '@/app/dashboard/types';

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
    name: "LIGHT Day 1 - Full Body Foundation",
    description: "Light intensity full body workout focusing on foundational movements and proper form",
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
        reps: "10-15",
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
        reps: "12-15",
        notes: "Use light to moderate weight",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+bench+press+beginner",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Assisted Pullups / Lat Pulldown",
        sets: 3,
        reps: "10-12",
        notes: "Use assistance or cable machine",
        youtubeLink: "https://www.youtube.com/results?search_query=assisted+pullup+lat+pulldown",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable", "Bodyweight"]
      },
      {
        exercise: "Bodyweight Squats",
        sets: 3,
        reps: "15-20",
        notes: "Focus on form and depth",
        youtubeLink: "https://www.youtube.com/results?search_query=bodyweight+squat+form",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Dumbbell Shoulder Press",
        sets: 3,
        reps: "12-15",
        notes: "Seated or standing, light weight",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+beginner",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Plank",
        sets: 3,
        reps: "30-45 sec",
        notes: "Keep body straight, engage core",
        youtubeLink: "https://www.youtube.com/results?search_query=plank+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "Hold",
        tags: ["Core", "Isometric"],
        equipment: ["Bodyweight"]
      }
    ]
  },
  {
    day: 2,
    name: "LIGHT Day 2 - Upper Body Focus",
    description: "Light intensity upper body workout with emphasis on chest, back, and arms",
    quote: "Small steps in the right direction can turn out to be the biggest step of your life. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=beginner+upper+body+workout",
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
        exercise: "Incline Pushups",
        sets: 3,
        reps: "12-15",
        notes: "Use bench or elevated surface",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+pushup+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Dumbbell Rows",
        sets: 3,
        reps: "12-15",
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
        exercise: "Dumbbell Flyes",
        sets: 3,
        reps: "12-15",
        notes: "Light weight, focus on chest stretch",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+flyes+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Dumbbell Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Keep elbows at sides, controlled movement",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+bicep+curl+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Overhead Tricep Extension",
        sets: 3,
        reps: "12-15",
        notes: "Light weight, focus on tricep stretch",
        youtubeLink: "https://www.youtube.com/results?search_query=overhead+tricep+extension+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Arms"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Side Crunches",
        sets: 3,
        reps: "15 each side",
        notes: "Focus on oblique engagement",
        youtubeLink: "https://www.youtube.com/results?search_query=side+crunch+tutorial",
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
    name: "LIGHT Day 3 - Lower Body & Core",
    description: "Light intensity lower body and core workout for balance and stability",
    quote: "Progress is impossible without change, and those who cannot change their minds cannot change anything. - George Bernard Shaw",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=beginner+lower+body+workout",
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
        exercise: "Goblet Squats",
        sets: 3,
        reps: "15-20",
        notes: "Hold light dumbbell at chest",
        youtubeLink: "https://www.youtube.com/results?search_query=goblet+squat+tutorial",
        weight: null,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Walking Lunges",
        sets: 3,
        reps: "10 each leg",
        notes: "Focus on balance and control",
        youtubeLink: "https://www.youtube.com/results?search_query=walking+lunge+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Glute Bridges",
        sets: 3,
        reps: "15-20",
        notes: "Squeeze glutes at the top",
        youtubeLink: "https://www.youtube.com/results?search_query=glute+bridge+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2010",
        tags: ["Isolation", "Glutes"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Calf Raises",
        sets: 3,
        reps: "20",
        notes: "Rise onto toes, control the movement",
        youtubeLink: "https://www.youtube.com/results?search_query=calf+raises+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "2110",
        tags: ["Isolation", "Legs"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Modified Dead Bug",
        sets: 3,
        reps: "10 each side",
        notes: "Keep lower back pressed to floor",
        youtubeLink: "https://www.youtube.com/results?search_query=dead+bug+exercise+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 5,
        tempo: "3010",
        tags: ["Core", "Stability"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Standing Balance",
        sets: 3,
        reps: "30 sec each leg",
        notes: "Hold for balance, progress to eyes closed",
        youtubeLink: "https://www.youtube.com/results?search_query=single+leg+balance+tutorial",
        weight: 0,
        restTime: "30s",
        rpe: 4,
        tempo: "Hold",
        tags: ["Balance", "Stability"],
        equipment: ["Bodyweight"]
      }
    ]
  }
];

// Helper function to get specific day workout
export const getLightWorkoutByDay = (day: number): WorkoutDay | null => {
  return LIGHT_WORKOUT_PLAN.find(workout => workout.day === day) || null;
};

// Helper function to convert workout to exercises
export const convertLightWorkoutToExercises = (workout: WorkoutDay): ExerciseDetail[] => {
  return workout.exercises;
};

export default LIGHT_WORKOUT_PLAN;