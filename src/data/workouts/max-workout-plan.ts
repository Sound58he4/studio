// src/data/workouts/max-workout-plan.ts
/**
 * MAX Workout Plan - 5-Day High-Intensity Program
 * Based on the MAX workout PDF files provided by the user
 * RPE: 6-8 (Moderate to high intensity)
 * Focus: Strength building, compound movements, progressive overload
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

// MAX WORKOUT PLAN
export const MAX_WORKOUT_PLAN: WorkoutDay[] = [
  {
    day: 1,
    name: "MAX Day 1 - Chest, Back & Shoulders",
    description: "Maximum intensity upper body workout focusing on compound movements and strength",
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
        exercise: "Barbell Bench Press",
        sets: 4,
        reps: "8-10",
        notes: "Focus on progressive overload",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Weighted Pull-ups / Lat Pulldown",
        sets: 4,
        reps: "8-10",
        notes: "Add weight if possible",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+pullup+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Bodyweight", "Cable"]
      },
      {
        exercise: "Dumbbell Shoulder Press",
        sets: 4,
        reps: "10-12",
        notes: "Full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Incline Dumbbell Press",
        sets: 3,
        reps: "10-12",
        notes: "45-degree incline, focus on upper chest",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+dumbbell+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Bent-Over Barbell Rows",
        sets: 4,
        reps: "8-10",
        notes: "Pull to lower chest, squeeze shoulder blades",
        youtubeLink: "https://www.youtube.com/results?search_query=bent+over+barbell+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Lateral Raises Superset with Rear Delt Flyes",
        sets: 3,
        reps: "12-15",
        notes: "Complete lateral raises then immediately do rear delt flyes",
        youtubeLink: "https://www.youtube.com/results?search_query=lateral+raise+rear+delt+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Shoulders", "Superset"],
        equipment: ["Dumbbell"]
      }
    ]
  },
  {
    day: 2,
    name: "MAX Day 2 - Legs & Glutes",
    description: "Maximum intensity lower body workout for strength and power development",
    quote: "Strength does not come from physical capacity. It comes from an indomitable will. - Mahatma Gandhi",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=intense+leg+workout",
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
        exercise: "Barbell Back Squats",
        sets: 4,
        reps: "8-10",
        notes: "Full depth, drive through heels",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+squat+proper+form",
        weight: null,
        restTime: "150s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Legs"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Romanian Deadlifts",
        sets: 4,
        reps: "8-10",
        notes: "Focus on hamstring stretch",
        youtubeLink: "https://www.youtube.com/results?search_query=romanian+deadlift+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Legs", "Hamstrings"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Bulgarian Split Squats",
        sets: 3,
        reps: "12 each leg",
        notes: "Rear foot elevated, focus on front leg",
        youtubeLink: "https://www.youtube.com/results?search_query=bulgarian+split+squat+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Legs", "Unilateral"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Leg Press",
        sets: 3,
        reps: "15-20",
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
        exercise: "Walking Lunges",
        sets: 3,
        reps: "20 total steps",
        notes: "Control descent, drive through front heel",
        youtubeLink: "https://www.youtube.com/results?search_query=walking+lunge+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 6,
        tempo: "2010",
        tags: ["Compound", "Legs"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Calf Raises",
        sets: 4,
        reps: "20-25",
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
    name: "MAX Day 3 - Push (Chest, Shoulders, Triceps)",
    description: "Maximum intensity push workout targeting chest, shoulders, and triceps",
    quote: "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=intense+push+workout",
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
        exercise: "Barbell Bench Press",
        sets: 4,
        reps: "6-8",
        notes: "Heavy weight, focus on power",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bench+press+tutorial",
        weight: null,
        restTime: "150s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Overhead Press",
        sets: 4,
        reps: "8-10",
        notes: "Standing, full body engagement",
        youtubeLink: "https://www.youtube.com/results?search_query=overhead+press+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Shoulders"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Incline Barbell Press",
        sets: 3,
        reps: "8-10",
        notes: "45-degree incline, upper chest focus",
        youtubeLink: "https://www.youtube.com/results?search_query=incline+barbell+press+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Dips",
        sets: 3,
        reps: "12-15",
        notes: "Chest dips, lean forward slightly",
        youtubeLink: "https://www.youtube.com/results?search_query=chest+dips+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Chest", "Triceps"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Close-Grip Bench Press",
        sets: 3,
        reps: "10-12",
        notes: "Hands shoulder-width apart, focus on triceps",
        youtubeLink: "https://www.youtube.com/results?search_query=close+grip+bench+press+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Triceps"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Tricep Pushdowns Superset with Overhead Tricep Extension",
        sets: 3,
        reps: "12-15",
        notes: "Complete pushdowns then immediately do overhead extension",
        youtubeLink: "https://www.youtube.com/results?search_query=tricep+pushdown+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Triceps", "Superset"],
        equipment: ["Cable", "Dumbbell"]
      }
    ]
  },
  {
    day: 4,
    name: "MAX Day 4 - Pull (Back & Biceps)",
    description: "Maximum intensity pull workout focusing on back and bicep development",
    quote: "The difference between ordinary and extraordinary is that little extra. - Jimmy Johnson",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=intense+pull+workout",
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
        exercise: "Deadlifts",
        sets: 4,
        reps: "6-8",
        notes: "Conventional deadlift, maintain neutral spine",
        youtubeLink: "https://www.youtube.com/results?search_query=deadlift+proper+form",
        weight: null,
        restTime: "150s",
        rpe: 8,
        tempo: "3010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Weighted Pull-ups / Chin-ups",
        sets: 4,
        reps: "8-10",
        notes: "Add weight if possible, full range of motion",
        youtubeLink: "https://www.youtube.com/results?search_query=weighted+pullup+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "2010",
        tags: ["Compound", "Back", "Biceps"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "T-Bar Rows",
        sets: 4,
        reps: "10-12",
        notes: "Pull to lower chest, squeeze shoulder blades",
        youtubeLink: "https://www.youtube.com/results?search_query=t+bar+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Lat Pulldowns",
        sets: 3,
        reps: "12-15",
        notes: "Wide grip, pull to upper chest",
        youtubeLink: "https://www.youtube.com/results?search_query=lat+pulldown+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Back"],
        equipment: ["Cable"]
      },
      {
        exercise: "Barbell Bicep Curls",
        sets: 3,
        reps: "10-12",
        notes: "Full range of motion, control the weight",
        youtubeLink: "https://www.youtube.com/results?search_query=barbell+bicep+curl+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Biceps"],
        equipment: ["Barbell"]
      },
      {
        exercise: "Hammer Curls Superset with Cable Bicep Curls",
        sets: 3,
        reps: "12-15",
        notes: "Complete hammer curls then immediately do cable curls",
        youtubeLink: "https://www.youtube.com/results?search_query=hammer+curl+cable+curl+superset",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Isolation", "Biceps", "Superset"],
        equipment: ["Dumbbell", "Cable"]
      }
    ]
  },
  {
    day: 5,
    name: "MAX Day 5 - Full Body Power",
    description: "Maximum intensity full body power workout combining all major movement patterns",
    quote: "Champions aren't made in comfort zones. - Unknown",
    youtubeExplanationUrl: "https://www.youtube.com/results?search_query=full+body+power+workout",
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
        exercise: "Squat to Press",
        sets: 4,
        reps: "10-12",
        notes: "Explosive movement, combine squat with overhead press",
        youtubeLink: "https://www.youtube.com/results?search_query=squat+to+press+tutorial",
        weight: null,
        restTime: "120s",
        rpe: 8,
        tempo: "Explosive",
        tags: ["Compound", "Full Body"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Burpees",
        sets: 3,
        reps: "10-15",
        notes: "Full body explosive movement",
        youtubeLink: "https://www.youtube.com/results?search_query=burpee+tutorial",
        weight: 0,
        restTime: "120s",
        rpe: 8,
        tempo: "Explosive",
        tags: ["Compound", "Cardio"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Renegade Rows",
        sets: 3,
        reps: "10 each arm",
        notes: "Maintain plank position, alternate rowing",
        youtubeLink: "https://www.youtube.com/results?search_query=renegade+row+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "2010",
        tags: ["Compound", "Core", "Back"],
        equipment: ["Dumbbell"]
      },
      {
        exercise: "Mountain Climbers",
        sets: 3,
        reps: "30 seconds",
        notes: "Fast alternating knee drives",
        youtubeLink: "https://www.youtube.com/results?search_query=mountain+climbers+tutorial",
        weight: 0,
        restTime: "60s",
        rpe: 7,
        tempo: "Fast",
        tags: ["Cardio", "Core"],
        equipment: ["Bodyweight"]
      },
      {
        exercise: "Kettlebell Swings",
        sets: 3,
        reps: "20-25",
        notes: "Hip hinge movement, explosive hip drive",
        youtubeLink: "https://www.youtube.com/results?search_query=kettlebell+swing+tutorial",
        weight: null,
        restTime: "90s",
        rpe: 7,
        tempo: "Explosive",
        tags: ["Compound", "Power"],
        equipment: ["Kettlebell"]
      },
      {
        exercise: "Plank to Push-up",
        sets: 3,
        reps: "10-15",
        notes: "Transition from plank to push-up position",
        youtubeLink: "https://www.youtube.com/results?search_query=plank+to+pushup+tutorial",
        weight: 0,
        restTime: "90s",
        rpe: 6,
        tempo: "Controlled",
        tags: ["Compound", "Core"],
        equipment: ["Bodyweight"]
      }
    ]
  }
];

// Helper function to get specific day workout
export const getMaxWorkoutByDay = (day: number): WorkoutDay | null => {
  return MAX_WORKOUT_PLAN.find(workout => workout.day === day) || null;
};

// Helper function to convert workout to exercises
export const convertMaxWorkoutToExercises = (workout: WorkoutDay): ExerciseDetail[] => {
  return workout.exercises;
};

export default MAX_WORKOUT_PLAN;