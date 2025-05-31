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
import { Loader2, Sparkles, ClipboardList, PlusCircle, Trash2, CalendarDays, Save, Edit, AlertCircle, Wand2, Info, Youtube, Check, X } from 'lucide-react'; // Added Check, X
import { getDay, format } from 'date-fns';
import { getUserProfile, getWorkoutPlan, saveWorkoutPlan } from '@/services/firestore'; // Removed unused imports
import { generateWorkoutPlan, WeeklyWorkoutPlan as AIWeeklyWorkoutPlan, ExerciseDetail as AIExerciseDetail } from '@/ai/flows/generate-workout-plan';
import { generateSimpleWorkout, SimpleWorkoutInput, SimpleWorkoutOutput } from '@/ai/flows/generate-simple-workout';
import { StoredUserProfile, WeeklyWorkoutPlan, ExerciseDetail } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import AddEditExerciseForm from './AddEditExerciseForm'; // Import the new form component

// --- Types ---
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
const daysOfWeekOrder: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface EditableExercise extends ExerciseDetail {
    isNew?: boolean; // Flag for newly added items
    id: string; // Unique ID for editing/deleting
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
            setEditablePlan(createInitialEditablePlan(plan));
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
            
            // Convert AI plan to dashboard format
            const convertedPlan: WeeklyWorkoutPlan = {
                Monday: aiPlan.Monday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Tuesday: aiPlan.Tuesday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Wednesday: aiPlan.Wednesday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Thursday: aiPlan.Thursday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Friday: aiPlan.Friday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Saturday: aiPlan.Saturday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
                Sunday: aiPlan.Sunday.map(ex => ({ ...ex, youtubeLink: ex.youtubeLink ?? undefined })),
            };
            
            setWeeklyPlan(convertedPlan);
            setEditablePlan(createInitialEditablePlan(convertedPlan));
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

             const newEditableExercises: EditableExercise[] = simpleWorkoutOutput.exercises.map(ex => ({
                 ...ex, id: generateUniqueId(day), isNew: true,
                 youtubeLink: typeof ex.youtubeLink === 'string' ? ex.youtubeLink : null
             }));

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
            setEditablePlan(createInitialEditablePlan(planToSave));
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
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
     }

      if (error && error.includes("Profile not found")) {
        return ( <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center"> <Card className="max-w-md border-destructive shadow-lg"> <CardHeader><AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2"/><CardTitle className="text-destructive">Profile Needed</CardTitle><CardDescription>{error}</CardDescription></CardHeader> <CardFooter><Button onClick={() => router.push('/profile')}>Go to Profile</Button></CardFooter> </Card> </div> );
     }

    return (
        <motion.div 
            className="max-w-4xl mx-auto my-4 md:my-8 px-2 sm:px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.div
                className="relative overflow-hidden rounded-lg"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
            >
                <Card className="shadow-xl border border-border/20 overflow-hidden bg-card/95 backdrop-blur-sm">
                    <motion.div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        animate={{ 
                            background: [
                                "radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)",
                                "radial-gradient(circle at 70% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)",
                                "radial-gradient(circle at 20% 60%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
                            ]
                        }}
                        transition={{ 
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                    <CardHeader className="bg-gradient-to-r from-accent/10 via-card to-card border-b p-4 sm:p-6 relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                           <motion.div
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.2, duration: 0.5 }}
                           >
                               <CardTitle className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
                                  <motion.div
                                      initial={{ rotate: -10 }}
                                      animate={{ rotate: 0 }}
                                      transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                                  >
                                      <ClipboardList className="h-6 w-6" />
                                  </motion.div>
                                  Manage Workout Plans
                               </CardTitle>
                               <CardDescription className="text-sm md:text-base mt-1">
                                  View, edit, or generate your weekly gym schedule.
                               </CardDescription>
                           </motion.div>
                            <motion.div 
                                className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto self-start sm:self-center"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan || isSaving || !!isGeneratingSimple} size="sm" className="w-full sm:w-auto shadow-sm transition-transform">
                                        <AnimatePresence mode="wait">
                                            {isGeneratingPlan ? (
                                                <motion.div
                                                    key="generating"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center"
                                                >
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="generate"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center"
                                                >
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate AI Plan
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button onClick={handleSaveChanges} disabled={isSaving || isGeneratingPlan || !!isGeneratingSimple} size="sm" variant="secondary" className="w-full sm:w-auto shadow-sm transition-transform">
                                        <AnimatePresence mode="wait">
                                            {isSaving ? (
                                                <motion.div
                                                    key="saving"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center"
                                                >
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="save"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center"
                                                >
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                        {error && !error.includes("Profile not found") && (
                            <motion.p 
                                className="text-destructive text-xs mt-3"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </CardHeader>

                    <CardContent className="p-0 relative z-10">
                     <Accordion type="single" collapsible value={activeDay || ""} onValueChange={(value) => { setActiveDay(value as DayOfWeek); setEditingExerciseState(null); }} className="w-full">
                        {daysOfWeekOrder.map((day) => {
                            const exercises = editablePlan[day] || [];
                            const isRestDay = exercises.length === 1 && exercises[0].exercise.toLowerCase() === 'rest';
                            const dayIsGeneratingSimple = isGeneratingSimple === day;

                            return (
                                <AccordionItem value={day} key={day} className={cn("border-b last:border-b-0", activeDay === day && "bg-muted/30")}>
                                    <AccordionTrigger className={cn("px-4 py-3 text-base font-semibold hover:bg-muted/50 transition-colors", activeDay === day ? "text-primary" : "")}>
                                        <div className="flex items-center gap-2">
                                          {day}
                                          {isRestDay && <span className="text-xs font-normal bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Rest Day</span>}
                                          {day === todayDayName && <span className="text-xs font-normal bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Today</span>}
                                          {dayIsGeneratingSimple && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2"/>}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-2 bg-background/50">
                                        <div className="space-y-3">
                                             {/* Conditionally render the Add/Edit form */}
                                            {editingExerciseState?.day === day && (
                                               <Card className="border-primary/30 shadow-md my-3">
                                                    <CardContent className="p-4">
                                                         <AddEditExerciseForm
                                                             key={editingExerciseState.exercise.id} // Ensure re-render when exercise changes
                                                             exercise={editingExerciseState.exercise}
                                                             day={day}
                                                             onSave={handleSaveEditedExercise}
                                                             onCancel={handleCancelEdit}
                                                             onChange={(field, value) => handleExerciseChange(day, editingExerciseState.exercise.id, field, value)}
                                                         />
                                                     </CardContent>
                                                </Card>
                                            )}

                                            {/* Display existing exercises */}
                                            {exercises.map((ex) => (
                                                 // Don't display the exercise currently being edited in the list
                                                 editingExerciseState?.exercise.id !== ex.id && (
                                                     <div key={ex.id} className="p-3 border rounded-md bg-card shadow-sm flex flex-col sm:flex-row gap-2 sm:gap-3 relative group hover:shadow-md transition-shadow">
                                                        <div className="flex-grow space-y-1 min-w-0">
                                                             <p className={cn("font-medium text-sm leading-tight", isRestDay && "text-blue-700 dark:text-blue-300")}>{ex.exercise}</p>
                                                            {!isRestDay && (ex.sets || ex.reps) && <p className="text-xs text-muted-foreground">{ex.sets ? `${ex.sets} sets` : ''}{ex.sets && ex.reps ? ' x ' : ''}{ex.reps || ''}{typeof ex.reps === 'string' && ex.reps.includes('min') ? '' : ' reps'}</p>}
                                                            {ex.notes && <p className="text-xs text-muted-foreground italic truncate pt-0.5">{ex.notes}</p>}
                                                             {ex.youtubeLink && <a href={ex.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">Watch Tutorial</a>}
                                                        </div>
                                                        <div className="flex flex-row sm:flex-col gap-1 absolute top-1 right-1 sm:relative sm:top-auto sm:right-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                             <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEditExerciseClick(day, ex)} title="Edit"><Edit size={14}/></Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Remove"><Trash2 size={14}/></Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader><AlertDialogTitle>Remove Exercise?</AlertDialogTitle><AlertDialogDescription>Remove "{ex.exercise}" from {day}'s plan?</AlertDialogDescription></AlertDialogHeader>
                                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveExercise(day, ex.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Remove</AlertDialogAction></AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                     </div>
                                                 )
                                             ))}

                                            {/* Action Buttons */}
                                             <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                                  <Button variant="outline" size="sm" onClick={() => handleAddExerciseClick(day)} disabled={!!editingExerciseState} className="flex-grow text-xs shadow-sm hover:bg-primary/10 hover:border-primary/50"><PlusCircle size={14} className="mr-1"/>Add Exercise</Button>
                                                  <Button variant="outline" size="sm" onClick={() => handleSetRestDay(day)} disabled={!!editingExerciseState} className="flex-grow text-xs shadow-sm text-blue-600 border-blue-200 hover:bg-blue-100/50 hover:border-blue-400"><CalendarDays size={14} className="mr-1"/>Set as Rest Day</Button>
                                                  {isRestDay && (
                                                      <Button variant="outline" size="sm" onClick={() => handleSuggestSimpleWorkout(day)} disabled={dayIsGeneratingSimple || !!editingExerciseState} className="flex-grow text-xs shadow-sm text-green-600 border-green-200 hover:bg-green-100/50 hover:border-green-400">
                                                          {dayIsGeneratingSimple ? <Loader2 size={14} className="mr-1 animate-spin"/> : <Wand2 size={14} className="mr-1"/>}
                                                          {dayIsGeneratingSimple ? "Suggesting..." : "Suggest Light Workout?"}
                                                      </Button>
                                                  )}
                                             </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </CardContent>
            </Card>
            </motion.div>
        </motion.div>
    );
}