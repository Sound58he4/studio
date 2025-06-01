// src/app/workout-plans/AddEditExerciseForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel as UiSelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Check, X, Info, Dumbbell, Weight, Clock, Repeat, Scale, Tag, ListFilter, Youtube, Wand2, BrainCircuit, ThumbsUp, Sparkles, Search, Plus, Minus } from 'lucide-react';
import { EditableExercise } from './page';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

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


// --- Stepper Component ---
const StepperInput: React.FC<{
    label: string; id: string; value: number | null; min?: number; step?: number; unit?: string;
    onChange: (value: number | null) => void; icon?: React.ElementType; className?: string;
}> = ({ label, id, value, min = 0, step = 1, unit, onChange, icon: Icon, className }) => {
    const handleIncrement = () => onChange(value === null ? min + step : Math.max(min, (value || 0) + step));
    const handleDecrement = () => onChange(value === null ? min : Math.max(min, (value || 0) - step));
    const handleChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = e.target.value === '' ? null : parseInt(e.target.value, 10);
        if (numValue === null || (!isNaN(numValue) && numValue >= min)) {
            onChange(numValue);
        } else if (!isNaN(numValue) && numValue < min) {
            onChange(min);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
               {Icon && <Icon size={16} className="text-blue-500"/>} {label} {unit && <span className="text-xs text-slate-500">({unit})</span>}
            </Label>
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400" 
                        onClick={handleDecrement} 
                        aria-label={`Decrease ${label}`}
                    >
                        <Minus size={16}/>
                    </Button>
                </motion.div>
                <Input
                    id={id}
                    type="number"
                    min={min}
                    step={step}
                    value={value ?? ''}
                    onChange={handleChangeEvent}
                    placeholder="--"
                    className="h-10 border-0 bg-transparent text-center px-2 flex-grow min-w-[60px] font-semibold text-lg focus-visible:ring-0"
                    aria-label={label}
                />
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400" 
                        onClick={handleIncrement} 
                        aria-label={`Increase ${label}`}
                    >
                        <Plus size={16}/>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

// --- Chip Component ---
const Chip: React.FC<{
    label: string | React.ReactNode;
    value: string; selected?: boolean; onClick: () => void; className?: string;
}> = ({ label, selected = false, onClick, className }) => (
    <Button
        type="button"
        variant={selected ? "secondary" : "outline"}
        size="sm"
        onClick={onClick}
        className={cn(
            "text-xs h-7 px-2.5 rounded-full transition-all duration-150 ease-in-out hover:scale-105 flex items-center gap-1",
            selected ? "bg-primary/15 text-primary border-primary/30 ring-1 ring-primary/20" : "border-input hover:bg-muted/50",
            className
        )}
        aria-pressed={selected}
    >
        {label}
    </Button>
);

// --- Autocomplete Component ---
const ExerciseAutocomplete: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState<{ name: string; category: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onChange(newQuery);

        if (newQuery.length > 1) {
            const filtered = exerciseLibrary
                .filter(ex => ex.name.toLowerCase().includes(newQuery.toLowerCase()))
                .slice(0, 5);
            setSuggestions(filtered);
            setIsOpen(filtered.length > 0);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSuggestionClick = (suggestionName: string) => {
        setQuery(suggestionName);
        onChange(suggestionName);
        setIsOpen(false);
        setSuggestions([]);
         inputRef.current?.focus();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
            setIsOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);


    return (
        <div className="relative">
             <Label htmlFor="exercise-name-input" className="text-sm font-medium">Exercise Name *</Label>
            <Input
                ref={inputRef}
                id="exercise-name-input"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder || "Start typing (e.g., Bench Press)"}
                className="text-base"
                onFocus={() => query.length > 1 && suggestions.length > 0 && setIsOpen(true)}
                required
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="exercise-suggestions"
                aria-expanded={isOpen}
            />
            {isOpen && suggestions.length > 0 && (
                <ul
                   id="exercise-suggestions"
                   role="listbox"
                   className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                 >
                    {suggestions.map((s) => (
                        <li
                            key={s.name}
                            role="option"
                            aria-selected={query === s.name}
                            onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s.name); }}
                            className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex justify-between items-center"
                        >
                            <span>{s.name}</span>
                            <span className="text-xs text-muted-foreground italic">{s.category}</span>
                        </li>
                    ))}
                     <li className="px-3 py-2 text-xs text-muted-foreground italic border-t">Continue typing for custom exercise</li>
                </ul>
            )}
        </div>
    );
};

// --- Multi-Select Chips Component ---
const MultiSelectChips: React.FC<{
    label: string; options: string[]; value: string[]; onChange: (value: string[]) => void; icon?: React.ElementType;
}> = ({ label, options, value: selectedValues = [], onChange, icon: Icon }) => {
    const handleToggle = (option: string) => {
        const currentSelection = Array.isArray(selectedValues) ? selectedValues : [];
        const newSelection = currentSelection.includes(option)
            ? currentSelection.filter(item => item !== option)
            : [...currentSelection, option];
        onChange(newSelection);
    };

    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                 {Icon && <Icon size={12}/>} {label}
            </Label>
            <div className="flex flex-wrap gap-1.5">
                {options.map(option => {
                     let chipLabel: string | React.ReactNode = option;
                     if (option === "Bago") {
                         chipLabel = (
                             <span className="flex items-center gap-1">
                                 <Image src="https://picsum.photos/id/237/16/16" alt="Bago Logo" width={16} height={16} data-ai-hint="logo fitness" className="inline-block rounded-sm" />
                                 Bago
                             </span>
                         );
                     }
                     return (
                        <Chip
                            key={option}
                            label={chipLabel}
                            value={option}
                            selected={selectedValues.includes(option)}
                            onClick={() => handleToggle(option)}
                        />
                     );
                })}
            </div>
        </div>
    );
};

// --- Main Form Component ---
const AddEditExerciseForm: React.FC<AddEditExerciseFormProps> = ({
    exercise: initialExercise, day, onSave, onCancel, onChange: propagateChange
}) => {
    const [exercise, setExercise] = useState<EditableExercise>({
        id: initialExercise?.id || generateUniqueId(day),
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
            id: initialExercise?.id || generateUniqueId(day),
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

    const trackingOptions = trackingType === 'reps' ? commonRepCounts : commonDurations;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <motion.div
                            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Dumbbell className="h-4 w-4 text-white" />
                        </motion.div>
                        {exercise.isNew ? 'Add New Exercise' : 'Edit Exercise'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Configure your exercise details for {day}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSaveClick} className="space-y-6">
                {/* Exercise Name Section */}
                <motion.div
                    className="space-y-4 p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Search className="h-3 w-3 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Exercise Details</h4>
                    </div>
                    
                    <ExerciseAutocomplete
                        value={exercise.exercise}
                        onChange={(value) => handleChange('exercise', value)}
                        placeholder="Start typing exercise name (e.g., Bench Press, Squats)"
                    />
                </motion.div>

                {/* Sets and Reps Section */}
                <motion.div
                    className="space-y-4 p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200/50 dark:border-green-800/50"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                            <Repeat className="h-3 w-3 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Volume & Intensity</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StepperInput
                            id="sets" 
                            label="Sets" 
                            icon={Repeat}
                            value={exercise.sets ?? null}
                            onChange={(value) => handleChange('sets', value)}
                            className="w-full"
                        />

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <ListFilter size={16} className="text-green-500"/>
                                Repetitions / Duration
                            </Label>
                            
                            {/* Tracking Type Toggle */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                <motion.div
                                    className="flex-1"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        variant={trackingType === 'reps' ? 'default' : 'ghost'}
                                        className={cn(
                                            "w-full rounded-lg transition-all duration-200",
                                            trackingType === 'reps' 
                                                ? "bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-slate-100" 
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                        )} 
                                        onClick={() => handleTrackingTypeChange('reps')}
                                    >
                                        Reps
                                    </Button>
                                </motion.div>
                                <motion.div
                                    className="flex-1"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        variant={trackingType === 'duration' ? 'default' : 'ghost'}
                                        className={cn(
                                            "w-full rounded-lg transition-all duration-200",
                                            trackingType === 'duration' 
                                                ? "bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-slate-100" 
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                        )} 
                                        onClick={() => handleTrackingTypeChange('duration')}
                                    >
                                        Time
                                    </Button>
                                </motion.div>
                            </div>

                            <Input
                                id="reps-duration" 
                                type="text"
                                placeholder={trackingType === 'reps' ? "e.g., 8-12" : "e.g., 60s"}
                                value={exercise.reps ?? ''}
                                onChange={(e) => handleChange('reps', e.target.value)}
                                className="h-12 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-green-400 dark:focus:border-green-600"
                            />

                            {/* Quick Select Options */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Quick Select:
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {trackingOptions.map(opt => (
                                        <motion.div
                                            key={opt}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Chip 
                                                label={opt} 
                                                value={opt} 
                                                onClick={() => handleChange('reps', opt)} 
                                                selected={exercise.reps === opt}
                                                className="h-8"
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Notes Section */}
                <motion.div
                    className="space-y-4 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl border border-purple-200/50 dark:border-purple-800/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Info className="h-3 w-3 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Additional Information</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Notes & Form Cues
                            </Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Add any form cues, modifications, or special instructions..."
                                value={exercise.notes ?? ''} 
                                onChange={(e) => handleChange('notes', e.target.value)} 
                                className="min-h-[80px] rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-400 dark:focus:border-purple-600 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="youtubeLink" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Youtube size={16} className="text-red-500"/>
                                Tutorial Link (Optional)
                            </Label>
                            <Input 
                                id="youtubeLink" 
                                placeholder="https://youtube.com/watch?v=..."
                                value={exercise.youtubeLink ?? ''} 
                                onChange={(e) => handleChange('youtubeLink', e.target.value)} 
                                className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-400 dark:focus:border-purple-600"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                    className="flex gap-4 pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                >
                    <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onCancel}
                            className="w-full h-12 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-600 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
                        >
                            <X size={18} className="mr-2"/> 
                            Cancel
                        </Button>
                    </motion.div>
                    <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button 
                            type="submit"
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                        >
                            <Check size={18} className="mr-2"/> 
                            Save Exercise
                        </Button>
                    </motion.div>
                </motion.div>
            </form>
        </motion.div>
    );
};

const generateUniqueId = (day: string) => `${day}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`;


export default AddEditExerciseForm;
    
