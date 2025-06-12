// src/app/workout-plans/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ClipboardList, PlusCircle, Trash2, CalendarDays, Save, Edit, AlertCircle, Wand2, Info, Youtube, Check, X, FileText, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDay, format } from 'date-fns';
import { getUserProfile, getWorkoutPlan, saveWorkoutPlan } from '@/services/firestore'; // Removed unused imports
import { generateWorkoutPlan, WeeklyWorkoutPlan as AIWeeklyWorkoutPlan, ExerciseDetail as AIExerciseDetail } from '@/ai/flows/generate-workout-plan';
import { generateSimpleWorkout, SimpleWorkoutInput, SimpleWorkoutOutput } from '@/ai/flows/generate-simple-workout';
import { StoredUserProfile, WeeklyWorkoutPlan, ExerciseDetail } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import AddEditExerciseForm from './AddEditExerciseForm'; // Import the new form component
import PDFWorkoutIntegration from '@/components/pdf/PDFWorkoutIntegration';
import PDFWorkoutCard from '@/components/pdf/PDFWorkoutCard';
import { PDFWorkout } from '@/components/pdf/PDFWorkoutViewer';
import { 
    getPowerWorkoutByDay, 
    convertPowerWorkoutToExercises, 
    convertWorkoutToExercises, 
    getWorkoutByTypeAndDay, 
    WorkoutPlanType 
} from '@/data/workouts/power-workout-plan';
import { convertLightWorkoutToExercises } from '@/data/workouts/light-workout-plan';
import { convertMaxWorkoutToExercises } from '@/data/workouts/max-workout-plan';
import { convertXtremeWorkoutToExercises } from '@/data/workouts/xtreme-workout-plan';

// --- Types ---
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
const daysOfWeekOrder: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface EditableExercise extends ExerciseDetail {
    isNew?: boolean; // Flag for newly added items
    id: string; // Unique ID for editing/deleting
}

// PDF Workout item interface
export interface PDFWorkoutItem {
    type: 'pdf';
    id: string;
    pdfWorkout: PDFWorkout;
}

// --- Helper Functions ---
const createInitialEditablePlan = (plan: WeeklyWorkoutPlan | null): Record<DayOfWeek, EditableExercise[]> => {
    const editablePlan: Record<DayOfWeek, EditableExercise[]> = {
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    };
    if (plan) {
        daysOfWeekOrder.forEach(day => {
            editablePlan[day] = (plan[day] || []).map((ex, index) => ({
                ...ex,
                 // Ensure required fields have defaults if missing from plan
                 exercise: ex.exercise || "Unnamed Exercise",
                 sets: ex.sets ?? null,
                 reps: ex.reps ?? null,
                 notes: ex.notes ?? "",
                 youtubeLink: ex.youtubeLink ?? null,
                id: `${day}-${index}-${Date.now()}` // Generate initial ID
            }));
        });
    }
    return editablePlan;
};

const generateUniqueId = (day: DayOfWeek) => `${day}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Helper to normalize PDF category to WorkoutPlanType
const normalizeCategory = (category: string): WorkoutPlanType | null => {
    switch (category.trim().toUpperCase()) {
        case 'POWER':
            return 'POWER';
        case 'XTREME':
        case 'XTREME WORKOUT':
            return 'XTREME';
        case 'MAX':
        case 'MAX WORKOUT':
            return 'MAX';
        case 'LIGHT':
        case 'LIGHT WORKOUT':
            return 'LIGHT';
        default:
            return null;
    }
};

// --- Main Component ---
export default function WorkoutPlansPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, userId, loading: authLoading } = useAuth();

    const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkoutPlan | null>(null);
    const [editablePlan, setEditablePlan] = useState<Record<DayOfWeek, EditableExercise[]>>(createInitialEditablePlan(null));
    const [isLoadingPlan, setIsLoadingPlan] = useState(true);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isGeneratingSimple, setIsGeneratingSimple] = useState<DayOfWeek | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // State to manage which exercise is currently being edited or added
    const [editingExerciseState, setEditingExerciseState] = useState<{ day: DayOfWeek; exercise: EditableExercise } | null>(null);
    const [activeDay, setActiveDay] = useState<DayOfWeek | null>(null);
    // State for PDF workouts
    const [pdfWorkouts, setPdfWorkouts] = useState<Record<DayOfWeek, PDFWorkoutItem[]>>({
        Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    });
    // State for unsaved changes tracking
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [originalPlan, setOriginalPlan] = useState<Record<DayOfWeek, EditableExercise[]> | null>(null);

    // Get today's day name
    const todayDayName = useMemo(() => {
        const dayIndex = getDay(new Date()); // Sunday = 0, Monday = 1, ...
        return daysOfWeekOrder[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust to match our order
    }, []);

    useEffect(() => {
       setActiveDay(todayDayName); // Set active day initially
    }, [todayDayName]);


    // --- Data Fetching ---
    const loadData = useCallback(async () => {
        if (!userId) return;
        setIsLoadingPlan(true);
        setError(null);
        try {
            const [profile, plan] = await Promise.all([
                getUserProfile(userId),
                getWorkoutPlan(userId)
            ]);
            setUserProfile(profile);
            setWeeklyPlan(plan);
            const initialPlan = createInitialEditablePlan(plan);
            setEditablePlan(initialPlan);
            setOriginalPlan(JSON.parse(JSON.stringify(initialPlan))); // Deep copy for comparison
            setHasUnsavedChanges(false);
            if (!profile) {
                 setError("Profile not found. Please complete your profile first.");
                 toast({ variant: "destructive", title: "Profile Missing", description: "Cannot manage workouts without a profile." });
            }
             console.log("[WorkoutPlansPage] Loaded Profile:", profile);
             console.log("[WorkoutPlansPage] Loaded Plan:", plan);
        } catch (err: any) {
            console.error("[WorkoutPlansPage] Error loading data:", err);
             setError(`Failed to load data: ${err.message}`);
             toast({ variant: "destructive", title: "Loading Error", description: err.message || "Could not load data." });
        } finally {
            setIsLoadingPlan(false);
        }
    }, [userId, toast]);

    useEffect(() => {
        if (!authLoading && userId) {
            loadData();
        } else if (!authLoading && !userId) {
            router.replace('/authorize');
        }
    }, [authLoading, userId, loadData, router]);

    // --- AI Generation ---
    const handleGeneratePlan = async () => {
        if (!userId || !userProfile) {
            toast({ variant: "destructive", title: "Cannot Generate", description: "User profile is required." });
            return;
        }
        if (!userProfile.weight || !userProfile.age || !userProfile.activityLevel || !userProfile.fitnessGoal) {
            toast({ variant: "destructive", title: "Profile Incomplete", description: "Weight, age, activity, and goal needed for AI plan." });
            router.push('/profile'); return;
        }

        setIsGeneratingPlan(true); setError(null);
        try {
            // Map user profile fitness goal to AI flow fitness goal
            const aiFitnessGoal = userProfile.fitnessGoal === 'stay_fit' ? 'toning' : userProfile.fitnessGoal!;
            const planInput = { weight: userProfile.weight, age: userProfile.age, activityLevel: userProfile.activityLevel, fitnessGoal: aiFitnessGoal as "weight_loss" | "weight_gain" | "muscle_building" | "recomposition" | "toning", preferFewerRestDays: userProfile.preferFewerRestDays ?? false };
            console.log("[WorkoutPlansPage] Generating AI Plan with input:", planInput);
            const aiPlan = await generateWorkoutPlan(planInput);
            
            // Convert AI plan to dashboard format with validation
            const convertedPlan: WeeklyWorkoutPlan = {
                Monday: aiPlan.Monday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Tuesday: aiPlan.Tuesday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Wednesday: aiPlan.Wednesday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Thursday: aiPlan.Thursday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Friday: aiPlan.Friday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Saturday: aiPlan.Saturday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Sunday: aiPlan.Sunday.map(ex => validateExerciseInput({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
            };
            
            setWeeklyPlan(convertedPlan);
            const newPlan = createInitialEditablePlan(convertedPlan);
            setEditablePlan(newPlan);
            setOriginalPlan(JSON.parse(JSON.stringify(newPlan)));
            setHasUnsavedChanges(false);
            toast({ title: "AI Plan Generated!", description: "Review and save your new weekly plan." });
        } catch (err: any) {
            console.error("[WorkoutPlansPage] AI plan generation error:", err);
            setError(`AI plan generation failed: ${err.message}. Please try again or create manually.`);
            toast({ variant: "destructive", title: "Generation Failed", description: `AI error: ${err.message}` });
        } finally { setIsGeneratingPlan(false); }
    };

     const handleSuggestSimpleWorkout = async (day: DayOfWeek) => {
         if (!userId || !userProfile) return;
         if (!userProfile.fitnessGoal || !userProfile.activityLevel) {
             toast({ variant: "destructive", title: "Profile Info Needed", description: "Fitness goal and activity level are needed." }); return;
         }
         setIsGeneratingSimple(day);
         try {
             const simpleInput: SimpleWorkoutInput = { fitnessGoal: userProfile.fitnessGoal, activityLevel: userProfile.activityLevel };
             const simpleWorkoutOutput: SimpleWorkoutOutput = await generateSimpleWorkout(simpleInput);

             const newEditableExercises: EditableExercise[] = simpleWorkoutOutput.exercises.map(ex => {
                 const validatedEx = validateExerciseInput(ex);
                 return {
                     ...validatedEx,
                     id: generateUniqueId(day),
                     youtubeLink: typeof ex.youtubeLink === 'string' ? ex.youtubeLink : null
                 };
             });

             setEditablePlan(prev => ({ ...prev, [day]: newEditableExercises }));
             toast({ title: "Simple Workout Suggested", description: `Added exercises for ${day}. Remember to save!` });
         } catch (err: any) {
             console.error(`[WorkoutPlansPage] Simple workout suggestion error for ${day}:`, err);
             toast({ variant: "destructive", title: "Suggestion Failed", description: `Could not suggest a simple workout: ${err.message}` });
         } finally { setIsGeneratingSimple(null); }
     };

    // --- Manual Edits ---
    const handleAddExerciseClick = (day: DayOfWeek) => {
        const newId = generateUniqueId(day);
        const newExerciseTemplate: EditableExercise = {
            id: newId, exercise: "", sets: 3, reps: "8-12", notes: "", youtubeLink: null, isNew: true
        };
        // Add to the top for immediate visibility
        setEditablePlan(prev => ({ ...prev, [day]: [newExerciseTemplate, ...prev[day]] }));
        setEditingExerciseState({ day, exercise: newExerciseTemplate }); // Start editing the new exercise
    };

    const handleEditExerciseClick = (day: DayOfWeek, exercise: EditableExercise) => {
        setEditingExerciseState({ day, exercise });
    };

     const handleExerciseChange = (day: DayOfWeek, exerciseId: string, field: keyof EditableExercise, value: any) => {
        // Update the specific exercise being edited in the main editablePlan state
         setEditablePlan(prevPlan => {
            const dayPlan = prevPlan[day];
            const updatedDayPlan = dayPlan.map(ex => {
                if (ex.id === exerciseId) {
                     console.log(`Updating ${day}-${exerciseId}: Field=${field}, Value=${value}`);
                    return { ...ex, [field]: value };
                }
                return ex;
            });
             // Also update the editingExerciseState if the current edit matches
             if (editingExerciseState?.exercise.id === exerciseId) {
                 setEditingExerciseState(prevState => prevState ? {
                     ...prevState,
                     exercise: { ...prevState.exercise, [field]: value }
                 } : null);
             }

             return { ...prevPlan, [day]: updatedDayPlan };
         });
     };

    // Function to check if there are unsaved changes
    const checkForUnsavedChanges = useCallback(() => {
        if (!originalPlan) return false;
        return JSON.stringify(editablePlan) !== JSON.stringify(originalPlan);
    }, [editablePlan, originalPlan]);

    // Update unsaved changes state whenever editablePlan changes
    useEffect(() => {
        setHasUnsavedChanges(checkForUnsavedChanges());
    }, [editablePlan, checkForUnsavedChanges]);

    // Prevent leaving page with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Function to navigate to previous/next day
    const navigateDay = useCallback((direction: 'prev' | 'next') => {
        if (!activeDay) return;
        const currentIndex = daysOfWeekOrder.indexOf(activeDay);
        let newIndex;
        if (direction === 'prev') {
            newIndex = currentIndex === 0 ? daysOfWeekOrder.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex === daysOfWeekOrder.length - 1 ? 0 : currentIndex + 1;
        }
        setActiveDay(daysOfWeekOrder[newIndex]);
    }, [activeDay]);

    const handleSaveEditedExercise = (exerciseToSave: EditableExercise) => {
        const { day } = editingExerciseState!;
        setEditablePlan(prev => ({
            ...prev,
            [day]: prev[day].map(ex => ex.id === exerciseToSave.id ? { ...exerciseToSave, isNew: false } : ex) // Mark as not new on save
        }));
        setEditingExerciseState(null); // Exit editing mode
    };

     const handleCancelEdit = () => {
         if (editingExerciseState?.exercise.isNew) {
             // If it was a new exercise being added, remove it on cancel
             handleRemoveExercise(editingExerciseState.day, editingExerciseState.exercise.id);
         }
         setEditingExerciseState(null); // Exit editing mode
     };

    // --- PDF Workout Handlers ---
    const handleAddPDFWorkout = (day: DayOfWeek, pdfWorkout: PDFWorkout, replaceExisting: boolean) => {
        // Add PDF to the PDF workouts state (for display)
        const newPDFItem: PDFWorkoutItem = {
            type: 'pdf',
            id: `${day}-pdf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            pdfWorkout
        };
        setPdfWorkouts(prev => ({
            ...prev,
            [day]: [...prev[day], newPDFItem]
        }));
        if (replaceExisting) {
            const workoutType = normalizeCategory(pdfWorkout.category);
            if (!workoutType) {
                toast({ title: 'Unknown PDF Workout Type', description: `Could not recognize workout type: ${pdfWorkout.category}`, variant: 'destructive' });
                return;
            }
            const workout = getWorkoutByTypeAndDay(workoutType, pdfWorkout.day);
            if (workout) {
                let exercises;
                switch (workoutType) {
                    case 'POWER':
                        exercises = convertPowerWorkoutToExercises(workout);
                        break;
                    case 'LIGHT':
                        exercises = convertLightWorkoutToExercises(workout);
                        break;
                    case 'MAX':
                        exercises = convertMaxWorkoutToExercises(workout);
                        break;
                    case 'XTREME':
                        exercises = convertXtremeWorkoutToExercises(workout);
                        break;
                    default:
                        exercises = convertWorkoutToExercises(workout);
                }
                const newEditableExercises: EditableExercise[] = exercises.map(ex => ({
                    ...ex,
                    id: generateUniqueId(day),
                    isNew: true
                }));
                setEditablePlan(prev => ({
                    ...prev,
                    [day]: newEditableExercises
                }));
                if (editingExerciseState?.day === day) {
                    setEditingExerciseState(null);
                }
                toast({
                    title: 'PDF Exercises Added',
                    description: `Added ${newEditableExercises.length} exercises from ${pdfWorkout.name} to ${day}`,
                });
            } else {
                toast({ title: 'Workout Not Found', description: `No workout found for ${workoutType} Day ${pdfWorkout.day}`, variant: 'destructive' });
            }
        }
    };

    const handleRemovePDFWorkout = (day: DayOfWeek, pdfId: string) => {
        setPdfWorkouts(prev => ({
            ...prev,
            [day]: prev[day].filter(item => item.id !== pdfId)
        }));
    };


    const handleRemoveExercise = (day: DayOfWeek, exerciseId: string) => {
        setEditablePlan(prev => ({
            ...prev,
            [day]: prev[day].filter(ex => ex.id !== exerciseId)
        }));
        if (editingExerciseState?.exercise.id === exerciseId) {
           setEditingExerciseState(null); // Stop editing if the removed item was being edited
        }
    };

    const handleSetRestDay = (day: DayOfWeek) => {
         const newId = generateUniqueId(day);
         setEditablePlan(prev => ({
             ...prev,
             [day]: [{ id: newId, exercise: "Rest", sets: null, reps: null, notes: "Active recovery optional", youtubeLink: null, isNew: true }]
         }));
         setEditingExerciseState(null); // Ensure no editing state is active
     };


    // --- Saving Plan ---
    const handleSaveChanges = async () => {
        if (!userId) return;
        setIsSaving(true); setError(null);
        try {
            const planToSave: WeeklyWorkoutPlan = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
            daysOfWeekOrder.forEach(day => {
                planToSave[day] = editablePlan[day].map(({ isNew, id, ...rest }) => ({
                   ...rest,
                   sets: rest.sets ? Number(rest.sets) : null,
                   reps: rest.reps ? String(rest.reps) : null,
                   notes: rest.notes || "",
                   youtubeLink: rest.youtubeLink || null
                }));
            });

            console.log("[WorkoutPlansPage] Saving Plan:", planToSave);
            await saveWorkoutPlan(userId, planToSave);
            setWeeklyPlan(planToSave);
            const savedPlan = createInitialEditablePlan(planToSave);
            setEditablePlan(savedPlan);
            setOriginalPlan(JSON.parse(JSON.stringify(savedPlan)));
            setHasUnsavedChanges(false);
            toast({ title: "Plan Saved!", description: "Your workout plan has been updated." });
            setEditingExerciseState(null);
        } catch (err: any) {
            console.error("[WorkoutPlansPage] Error saving plan:", err);
            setError(`Failed to save workout plan: ${err.message}`);
            toast({ variant: "destructive", title: "Save Error", description: err.message || "Could not save plan." });
        } finally { setIsSaving(false); }
    };

    // --- Render Logic ---
    if (authLoading || isLoadingPlan) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-violet-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
                    <motion.div 
                        className="space-y-3 sm:space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <motion.div
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-2xl flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
                            </motion.div>
                            <div className="space-y-2">
                                <div className="h-6 sm:h-8 w-60 sm:w-80 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl animate-pulse"/>
                                <div className="h-3 sm:h-4 w-72 sm:w-96 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-xl animate-pulse"/>
                            </div>
                        </div>
                    </motion.div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <motion.div 
                            className="lg:col-span-2 space-y-3 sm:space-y-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            {Array.from({ length: 4 }, (_, i) => (
                                <div key={i} className="h-20 sm:h-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-3xl animate-pulse"/>
                            ))}
                        </motion.div>
                        <motion.div 
                            className="space-y-3 sm:space-y-4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <div className="h-40 sm:h-48 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-3xl animate-pulse"/>
                            <div className="h-24 sm:h-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-3xl animate-pulse"/>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && error.includes("Profile not found")) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-3 sm:p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="border-0 shadow-2xl rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-yellow-500/5 pointer-events-none"/>
                        <CardHeader className="text-center space-y-4 sm:space-y-6 pb-6 sm:pb-8 relative p-4 sm:p-6">
                            <motion.div 
                                className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                            >
                                <AlertCircle size={40} className="sm:w-12 sm:h-12 text-red-600 dark:text-red-400"/>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <CardTitle className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                                    Something Went Wrong
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 mt-3 sm:mt-4 leading-relaxed px-2">
                                    {error || "User profile is missing. Please set up your profile first to access workout plans."}
                                </CardDescription>
                            </motion.div>
                        </CardHeader>
                        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-0 relative p-4 sm:p-6">
                            <motion.div
                                className="flex-1 w-full"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button onClick={loadData} variant="outline" size="lg" className="w-full rounded-xl border-2 hover:border-primary/50 text-sm sm:text-base">
                                    <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px] mr-2"/>
                                    Retry
                                </Button>
                            </motion.div>
                            <motion.div
                                className="flex-1 w-full"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button onClick={() => router.push('/profile')} size="lg" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-sm sm:text-base">
                                    Setup Profile
                                </Button>
                            </motion.div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Main component render
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                            Workout Plans
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base mt-1">
                            Design, customize, and track your weekly fitness journey
                        </p>
                    </div>
                    
                    {/* Unsaved changes indicator */}
                    {hasUnsavedChanges && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Unsaved changes</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Action Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    <Button 
                        onClick={handleGeneratePlan} 
                        disabled={isGeneratingPlan || isSaving || !!isGeneratingSimple} 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    >
                        {isGeneratingPlan ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Generate AI Plan
                            </>
                        )}
                    </Button>
                    
                    <Button 
                        onClick={handleSaveChanges} 
                        disabled={!hasUnsavedChanges || isSaving || isGeneratingPlan || !!isGeneratingSimple} 
                        size="lg" 
                        variant={hasUnsavedChanges ? "default" : "outline"}
                        className={cn("w-full shadow-lg", hasUnsavedChanges && "bg-green-600 hover:bg-green-700")}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-5 w-5" />
                                {hasUnsavedChanges ? "Save Changes" : "No Changes"}
                            </>
                        )}
                    </Button>
                </motion.div>

                {/* Error Display */}
                {error && !error.includes("Profile not found") && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                    >
                        <Card className="border-destructive/50 bg-destructive/5 shadow-lg">
                            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                                <p className="text-destructive font-medium text-sm sm:text-base break-words">{error}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Enhanced Day Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <Card className="shadow-lg border-0 bg-gradient-to-r from-card/90 to-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-lg">Weekly Overview</h2>
                                {activeDay && (
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Button
                                            onClick={() => navigateDay('prev')}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-medium min-w-[80px] text-center">
                                            {activeDay}
                                        </span>
                                        <Button
                                            onClick={() => navigateDay('next')}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Desktop Day Grid */}
                            <div className="hidden sm:grid grid-cols-7 gap-3">
                                {daysOfWeekOrder.map((day, index) => {
                                    const exercises = editablePlan[day] || [];
                                    const isRestDay = exercises.length === 1 && exercises[0].exercise.toLowerCase() === 'rest';
                                    const isToday = day === todayDayName;
                                    const isActive = activeDay === day;

                                    return (
                                        <motion.div
                                            key={day}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + index * 0.05 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                onClick={() => {
                                                    setActiveDay(day);
                                                    setEditingExerciseState(null);
                                                }}
                                                variant={isActive ? "default" : "outline"}
                                                className={cn(
                                                    "w-full h-20 flex flex-col items-center justify-center gap-1 transition-all duration-200",
                                                    isToday && "ring-2 ring-primary/50",
                                                    isActive && "bg-primary text-primary-foreground shadow-lg",
                                                    !isActive && isToday && "border-primary/50 bg-primary/5",
                                                    isRestDay && !isActive && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                )}
                                            >
                                                <span className="font-semibold text-sm">{day.slice(0, 3)}</span>
                                                {isToday && (
                                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                                )}
                                                <div className="text-xs text-center">
                                                    {isRestDay ? (
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">Rest</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Mobile Day Carousel */}
                            <div className="sm:hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <Button
                                        onClick={() => navigateDay('prev')}
                                        variant="outline"
                                        size="sm"
                                        className="h-10 w-10 p-0 shrink-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="flex-1 overflow-x-auto">
                                        <div className="flex gap-2 pb-1">
                                            {daysOfWeekOrder.map((day) => {
                                                const exercises = editablePlan[day] || [];
                                                const isRestDay = exercises.length === 1 && exercises[0].exercise.toLowerCase() === 'rest';
                                                const isToday = day === todayDayName;
                                                const isActive = activeDay === day;

                                                return (
                                                    <Button
                                                        key={day}
                                                        onClick={() => {
                                                            setActiveDay(day);
                                                            setEditingExerciseState(null);
                                                        }}
                                                        variant={isActive ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "flex-shrink-0 h-12 px-4 transition-all duration-200",
                                                            isToday && "ring-2 ring-primary/50",
                                                            isActive && "bg-primary text-primary-foreground shadow-lg",
                                                            !isActive && isToday && "border-primary/50 bg-primary/5",
                                                            isRestDay && !isActive && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-medium text-xs">{day.slice(0, 3)}</span>
                                                            <span className="text-[10px] opacity-75">
                                                                {isRestDay ? 'Rest' : exercises.length}
                                                            </span>
                                                        </div>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={() => navigateDay('next')}
                                        variant="outline"
                                        size="sm"
                                        className="h-10 w-10 p-0 shrink-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Actions for Active Day */}
                            {activeDay && (
                                <motion.div 
                                    className="space-y-4"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {/* Primary Actions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <Button
                                            onClick={() => handleAddExerciseClick(activeDay)}
                                            size="sm"
                                            className="h-9 text-xs sm:text-sm"
                                        >
                                            <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                                            Add Exercise
                                        </Button>
                                        <Button
                                            onClick={() => handleSuggestSimpleWorkout(activeDay)}
                                            disabled={!!isGeneratingSimple}
                                            size="sm"
                                            variant="outline"
                                            className="h-9 text-xs sm:text-sm"
                                        >
                                            {isGeneratingSimple === activeDay ? (
                                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 animate-spin" />
                                            ) : (
                                                <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                                            )}
                                            <span className="truncate">AI Suggest</span>
                                        </Button>
                                        <Button
                                            onClick={() => handleSetRestDay(activeDay)}
                                            size="sm"
                                            variant="secondary"
                                            className="h-9 text-xs sm:text-sm"
                                        >
                                            <span className="truncate">Set Rest Day</span>
                                        </Button>
                                    </div>

                                    {/* PDF Workout Integration - Compact Design */}
                                    <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200/50 dark:border-blue-800/30">
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
                                                        PDF Workout Plans
                                                    </h3>
                                                    <p className="text-[10px] sm:text-xs text-blue-700/70 dark:text-blue-300/70 truncate">
                                                        Power, Light, Max & Xtreme
                                                    </p>
                                                </div>
                                            </div>
                                            <PDFWorkoutIntegration
                                                day={activeDay}
                                                onAddPDFWorkout={(day, pdfWorkout, replaceExisting) => 
                                                    handleAddPDFWorkout(day, pdfWorkout, replaceExisting)
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Main Content Layout */}
                <div className="space-y-6">
                        {activeDay && (
                            <motion.div
                                key={activeDay}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-6"
                            >
                                {/* Exercise Form */}
                                <AnimatePresence>
                                    {editingExerciseState?.day === activeDay && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <Card className="border-2 border-primary/50 shadow-xl bg-card/90 backdrop-blur-lg">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Edit className="h-5 w-5" />
                                                        {editingExerciseState.exercise.isNew ? 'Add Exercise' : 'Edit Exercise'}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <AddEditExerciseForm
                                                        key={editingExerciseState.exercise.id}
                                                        exercise={editingExerciseState.exercise}
                                                        day={activeDay}
                                                        onSave={handleSaveEditedExercise}
                                                        onCancel={handleCancelEdit}
                                                        onChange={(field, value) => handleExerciseChange(activeDay, editingExerciseState.exercise.id, field, value)}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Day Content */}
                                <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                                    <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg",
                                                        activeDay === todayDayName 
                                                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" 
                                                            : "bg-primary/10 text-primary border border-primary/20"
                                                    )}
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 400 }}
                                                >
                                                    {activeDay.slice(0, 2).toUpperCase()}
                                                </motion.div>
                                                <div>
                                                    <CardTitle className="text-xl">{activeDay}</CardTitle>
                                                    <CardDescription>
                                                        {activeDay === todayDayName ? "Today's workout" : "Plan your workout"}
                                                        {editablePlan[activeDay]?.length > 0 && (
                                                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                                {editablePlan[activeDay]?.length} exercise{editablePlan[activeDay]?.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {/* PDF Workouts Display */}
                                        {pdfWorkouts[activeDay]?.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">PDF Workouts</h3>
                                                <div className="space-y-3">
                                                    {pdfWorkouts[activeDay].map((pdfItem) => (
                                                        <motion.div
                                                            key={pdfItem.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <PDFWorkoutCard
                                                                pdfWorkout={pdfItem.pdfWorkout}
                                                                onRemove={() => handleRemovePDFWorkout(activeDay, pdfItem.id)}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Exercise List */}
                                <div className="space-y-3 sm:space-y-4">
                                    <AnimatePresence>
                                        {editablePlan[activeDay]?.length > 0 ? (
                                            editablePlan[activeDay].map((exercise, index) => (
                                                editingExerciseState?.exercise.id !== exercise.id && (
                                                    <motion.div
                                                        key={exercise.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        className="group"
                                                    >
                                                        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md bg-card/80">
                                                            <CardContent className="p-3 sm:p-4">
                                                                <div className="flex items-start justify-between gap-2 sm:gap-4">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-sm sm:text-base text-card-foreground mb-1 sm:mb-2 break-words">
                                                                            {exercise.exercise}
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                                                                            {exercise.sets && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <span className="font-medium">Sets:</span> {exercise.sets}
                                                                                </span>
                                                                            )}
                                                                            {exercise.reps && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <span className="font-medium">Reps:</span> {exercise.reps}
                                                                                </span>
                                                                            )}
                                                                            {exercise.youtubeLink && (
                                                                                <motion.a
                                                                                    href={exercise.youtubeLink}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                                                                                    whileHover={{ scale: 1.05 }}
                                                                                >
                                                                                    <Youtube className="h-3 w-3" />
                                                                                    <span>Video</span>
                                                                                </motion.a>
                                                                            )}
                                                                        </div>
                                                                        {exercise.notes && (
                                                                            <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-2 break-words">
                                                                                {exercise.notes}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                        <Button
                                                                            onClick={() => handleEditExerciseClick(activeDay, exercise)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                                                        >
                                                                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => handleRemoveExercise(activeDay, exercise.id)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                                                                        >
                                                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                )
                                            ))
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                                className="text-center py-8 sm:py-12"
                                            >
                                                <motion.div
                                                    animate={{ 
                                                        y: [0, -10, 0],
                                                        rotate: [0, 5, 0]
                                                    }}
                                                    transition={{ 
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <ClipboardList className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                                                </motion.div>
                                                <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-2">
                                                    No exercises planned for {activeDay}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
                                                    Add exercises manually or use AI to generate a workout
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-4">
                                                    <Button
                                                        onClick={() => handleAddExerciseClick(activeDay)}
                                                        className="gap-2 text-xs sm:text-sm h-9 sm:h-10"
                                                        size="sm"
                                                    >
                                                        <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        Add Exercise
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleSuggestSimpleWorkout(activeDay)}
                                                        disabled={!!isGeneratingSimple}
                                                        variant="outline"
                                                        className="gap-2 text-xs sm:text-sm h-9 sm:h-10"
                                                        size="sm"
                                                    >
                                                        {isGeneratingSimple === activeDay ? (
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                            >
                                                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            </motion.div>
                                                        ) : (
                                                            <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        )}
                                                        <span className="truncate">AI Suggest</span>
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {!activeDay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-8 sm:py-12 px-4"
                    >
                        <CalendarDays className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-2">
                            Select a day to view or edit workouts
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Choose a day from the selector above to start planning your workout
                        </p>
                    </motion.div>
                )}
                </div>
            </div>
        </div>
    );
}

// Add exercise validation helper
const validateExerciseInput = (exercise: ExerciseDetail): EditableExercise => {
    // Normalize reps display
    let displayReps = exercise.reps;
    if (typeof displayReps === 'string' && displayReps.toLowerCase().includes('failure')) {
        displayReps = 'To failure';
    }
    
    // Ensure calorie burn is within reasonable range
    let caloriesBurned = exercise.caloriesBurned || 15;
    if (typeof caloriesBurned === 'number') {
        caloriesBurned = Math.max(6, Math.min(30, caloriesBurned));
    }
    
    return {
        ...exercise,
        reps: displayReps,
        caloriesBurned: caloriesBurned,
        id: generateUniqueId('temp'), // Will be replaced with proper ID
        isNew: true
    };
};