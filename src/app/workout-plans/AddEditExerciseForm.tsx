// src/app/workout-plans/AddEditExerciseForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Check, X, Dumbbell, FileText, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { EditableExercise } from './page';
import type { DayOfWeek } from './page';

// --- Mock Data (Replace with actual data fetching or pass as props) ---
const exerciseLibrary = [
  { name: "Bench Press (Barbell)", category: "Chest", equipment: ["Barbell"] },
  { name: "Squats (Barbell Back)", category: "Legs", equipment: ["Barbell"] },
  { name: "Deadlift (Conventional)", category: "Back/Legs", equipment: ["Barbell"] },
  { name: "Overhead Press (Barbell)", category: "Shoulders", equipment: ["Barbell"] },
  { name: "Pull-ups", category: "Back", equipment: ["Pull-up Bar", "Bodyweight"] },
  { name: "Dumbbell Rows", category: "Back", equipment: ["Dumbbell"] },
  { name: "Lateral Raises (Dumbbell)", category: "Shoulders", equipment: ["Dumbbell"] },
  { name: "Bicep Curls (Dumbbell)", category: "Arms", equipment: ["Dumbbell"] },
  { name: "Tricep Pushdown (Cable)", category: "Arms", equipment: ["Cable"] },
  { name: "Leg Press", category: "Legs", equipment: ["Machine: Leg Press"] },
  { name: "Leg Extensions", category: "Legs", equipment: ["Machine: Leg Extension"] },
  { name: "Hamstring Curls (Lying)", category: "Legs", equipment: ["Machine: Hamstring Curl"] },
  { name: "Running (Treadmill)", category: "Cardio", equipment: ["Treadmill"] },
  { name: "Plank", category: "Core", equipment: ["Bodyweight"] },
  // Add many more exercises...
];

const commonRepCounts = ["6", "8", "10", "12", "15", "8-12", "10-15", "AMRAP"];
const commonDurations = ["30s", "45s", "60s", "90s", "120s", "2 min", "5 min", "10 min", "20 min", "30 min"];
const commonRestTimes = ["30s", "45s", "60s", "90s", "120s", "180s"];
const equipmentOptions = ['Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Bago', 'Machine', 'Bodyweight', 'Other'];
const tagOptions = ['Compound', 'Isolation', 'Accessory', 'Warm-up', 'Cool-down', 'Cardio', 'Plyometric', 'Strength', 'Hypertrophy', 'Endurance'];

// --- Component Props ---
interface AddEditExerciseFormProps {
    exercise: EditableExercise;
    day: string;
    onSave: (exercise: EditableExercise) => void;
    onCancel: () => void;
    onChange: (field: keyof EditableExercise, value: any) => void;
}

// --- Main Form Component ---
const AddEditExerciseForm: React.FC<AddEditExerciseFormProps> = ({
    exercise: initialExercise, day, onSave, onCancel, onChange: propagateChange
}) => {
    const [exercise, setExercise] = useState<EditableExercise>({
        id: initialExercise?.id || `${day}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        exercise: initialExercise?.exercise || "",
        sets: initialExercise?.sets ?? 3,
        reps: initialExercise?.reps ?? "8-12",
        notes: initialExercise?.notes ?? "",
        youtubeLink: initialExercise?.youtubeLink ?? null,
        isNew: initialExercise?.isNew ?? true,
    });

    const [trackingType, setTrackingType] = useState<'reps' | 'duration'>(() => {
        const repsValue = initialExercise?.reps;
        if (typeof repsValue === 'string' && (repsValue.includes('min') || repsValue.includes('sec') || repsValue.includes('s'))) {
            return 'duration';
        }
        return 'reps';
    });

    useEffect(() => {
        setExercise({
            id: initialExercise?.id || `${day}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            exercise: initialExercise?.exercise || "",
            sets: initialExercise?.sets ?? 3,
            reps: initialExercise?.reps ?? (trackingType === 'duration' ? '60s' : '8-12'),
            notes: initialExercise?.notes ?? "",
            youtubeLink: initialExercise?.youtubeLink ?? null,
            isNew: initialExercise?.isNew ?? true,
        });
    }, [initialExercise, day, trackingType]);

    const handleChange = (field: keyof EditableExercise, value: any) => {
        const updatedExercise = { ...exercise, [field]: value };
        setExercise(updatedExercise);
        propagateChange(field, value);
    };

    const handleTrackingTypeChange = (type: 'reps' | 'duration') => {
        setTrackingType(type);
        const defaultValue = type === 'duration' ? '60s' : '8-12';
        handleChange('reps', defaultValue);
    };

    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!exercise.exercise || !exercise.exercise.trim()) {
            alert("Please enter an exercise name.");
            return;
        }
        onSave(exercise);
    };

    const trackingOptions = trackingType === 'reps' ? commonRepCounts : commonDurations;    return (
        <div className="w-full max-w-full max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-purple-50/80 backdrop-blur-xl border-0 shadow-2xl rounded-2xl sm:rounded-3xl">
            {/* Header */}
            <div className="sticky top-0 z-10 p-3 sm:p-6 pb-2 sm:pb-4 border-b border-blue-200/30 bg-white/80 backdrop-blur-xl rounded-t-2xl sm:rounded-t-3xl">
                <div className="text-base sm:text-xl font-semibold text-gray-800 flex items-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                        {exercise.isNew ? <Plus className="w-3 h-3 sm:w-5 sm:h-5 text-white" /> : <Edit className="w-3 h-3 sm:w-5 sm:h-5 text-white" />}
                    </div>
                    <span className="truncate">{exercise.isNew ? 'Add Exercise' : 'Edit Exercise'}</span>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 ml-8 sm:ml-11 truncate">Configure your exercise details for {day}</p>
            </div>            <div className="p-3 sm:p-6 space-y-4 sm:space-y-8">
                {/* Exercise Details Section */}
                <motion.div 
                    className="space-y-3 sm:space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm sm:text-lg">1</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Exercise Details</h3>
                    </div>
                    
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-blue-100/50">
                        <Label htmlFor="exerciseName" className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block">
                            Exercise Name *
                        </Label>
                        <Input 
                            id="exerciseName" 
                            value={exercise.exercise} 
                            onChange={e => handleChange('exercise', e.target.value)} 
                            className="w-full h-10 sm:h-12 bg-white/80 backdrop-blur-sm border-blue-200/30 rounded-lg sm:rounded-xl shadow-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base" 
                            placeholder="Start typing exercise name (e.g., Bench Press, Squats)" 
                        />
                    </div>
                </motion.div>                {/* Volume & Intensity Section */}
                <motion.div 
                    className="space-y-3 sm:space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm sm:text-lg">2</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Volume & Intensity</h3>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-green-100/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {/* Sets */}
                            <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block">
                                    Sets
                                </Label>
                                <div className="flex items-center justify-center space-x-3 sm:space-x-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleChange('sets', Math.max(1, (exercise.sets || 1) - 1))} 
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white/80 border-blue-200/30 shadow-lg hover:shadow-xl hover:bg-blue-50/80 transition-all duration-200"
                                    >
                                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    </Button>
                                    <span className="text-xl sm:text-2xl font-bold w-8 sm:w-12 text-center text-gray-800">{exercise.sets || 1}</span>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => handleChange('sets', (exercise.sets || 1) + 1)} 
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white/80 border-blue-200/30 shadow-lg hover:shadow-xl hover:bg-blue-50/80 transition-all duration-200"
                                    >
                                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    </Button>
                                </div>
                            </div>                            {/* Repetitions / Duration */}
                            <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block">
                                    Repetitions / Duration
                                </Label>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <div>
                                            <Label className="text-xs text-gray-600 font-medium">Reps</Label>
                                            <Input 
                                                value={trackingType === 'reps' ? (exercise.reps || '') : ''} 
                                                onChange={e => {
                                                    handleChange('reps', e.target.value);
                                                    if (e.target.value) setTrackingType('reps');
                                                }} 
                                                className="h-9 sm:h-11 bg-white/80 backdrop-blur-sm border-blue-200/30 rounded-lg sm:rounded-xl shadow-lg text-sm sm:text-base" 
                                                placeholder="8-12" 
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-600 font-medium">Time</Label>
                                            <Input 
                                                value={trackingType === 'duration' ? (exercise.reps || '') : ''} 
                                                onChange={e => {
                                                    handleChange('reps', e.target.value);
                                                    if (e.target.value) setTrackingType('duration');
                                                }} 
                                                className="h-9 sm:h-11 bg-white/80 backdrop-blur-sm border-blue-200/30 rounded-lg sm:rounded-xl shadow-lg text-sm sm:text-base" 
                                                placeholder="60s" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs text-gray-600 font-medium mb-2 sm:mb-3">Quick Select:</p>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {trackingOptions.map(option => (
                                                <Button 
                                                    key={option} 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleChange('reps', option)} 
                                                    className="text-xs h-7 sm:h-9 px-2 sm:px-4 bg-white/80 border-blue-200/30 shadow-lg hover:shadow-xl hover:bg-blue-50/80 rounded-lg sm:rounded-xl transition-all duration-200"
                                                >
                                                    {option}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>                {/* Additional Information Section */}
                <motion.div 
                    className="space-y-3 sm:space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm sm:text-lg">3</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Additional Information</h3>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100/50 space-y-4 sm:space-y-5">
                        <div>
                            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block">
                                Notes & Form Cues
                            </Label>
                            <Textarea 
                                id="notes" 
                                value={exercise.notes || ''} 
                                onChange={e => handleChange('notes', e.target.value)} 
                                className="w-full min-h-[80px] sm:min-h-[100px] bg-white/80 backdrop-blur-sm border-blue-200/30 rounded-lg sm:rounded-xl shadow-lg resize-none text-gray-800 placeholder-gray-500 text-sm sm:text-base" 
                                placeholder="Add any form cues, modifications, or special instructions..." 
                            />
                        </div>

                        <div>
                            <Label htmlFor="tutorialLink" className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block">
                                Tutorial Link (Optional)
                            </Label>
                            <Input 
                                id="tutorialLink" 
                                value={exercise.youtubeLink || ''} 
                                onChange={e => handleChange('youtubeLink', e.target.value)} 
                                className="w-full h-10 sm:h-12 bg-white/80 backdrop-blur-sm border-blue-200/30 rounded-lg sm:rounded-xl shadow-lg text-gray-800 placeholder-gray-500 text-sm sm:text-base" 
                                placeholder="https://youtube.com/watch?v=..." 
                            />
                        </div>
                    </div>
                </motion.div>                {/* Action Buttons */}
                <motion.div 
                    className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-blue-200/30 p-3 sm:p-6 rounded-b-2xl sm:rounded-b-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <div className="flex space-x-3 sm:space-x-4">
                        <Button 
                            variant="outline" 
                            onClick={onCancel} 
                            className="flex-1 h-12 sm:h-14 border-blue-200/30 bg-white/80 text-gray-700 hover:bg-blue-50/50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                            <span className="truncate">Cancel</span>
                        </Button>
                        <Button 
                            onClick={handleSaveClick} 
                            disabled={!exercise.exercise?.trim()} 
                            className="flex-1 h-12 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 text-sm sm:text-base"
                        >
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                            <span className="truncate">Save Exercise</span>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AddEditExerciseForm;

