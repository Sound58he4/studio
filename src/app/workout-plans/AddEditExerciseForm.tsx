// src/app/workout-plans/AddEditExerciseForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel as UiSelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Check, X, Info, Dumbbell, Weight, Clock, Repeat, Scale, Tag, ListFilter, Youtube, Wand2, BrainCircuit, ThumbsUp } from 'lucide-react';
import { EditableExercise } from './page';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
        <div className={cn("space-y-1", className)}>
            <Label htmlFor={id} className="text-xs font-medium text-muted-foreground flex items-center gap-1">
               {Icon && <Icon size={12}/>} {label} {unit && `(${unit})`}
            </Label>
            <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 flex-shrink-0 rounded-r-none" onClick={handleDecrement} aria-label={`Decrease ${label}`}>-</Button>
                <Input
                    id={id}
                    type="number"
                    min={min}
                    step={step}
                    value={value ?? ''}
                    onChange={handleChangeEvent}
                    placeholder="--"
                    className="h-8 rounded-none text-center px-1 flex-grow min-w-[40px]"
                     aria-label={label}
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 flex-shrink-0 rounded-l-none" onClick={handleIncrement} aria-label={`Increase ${label}`}>+</Button>
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
        weight: initialExercise?.weight ?? null,
        restTime: initialExercise?.restTime ?? "60s",
        rpe: initialExercise?.rpe ?? null,
        tempo: initialExercise?.tempo ?? "",
        tags: initialExercise?.tags ?? [],
        equipment: initialExercise?.equipment ?? [],
    });
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

    const determineInitialTrackingType = (repsValue: string | number | null): 'reps' | 'duration' => {
        if (typeof repsValue === 'string' && (repsValue.includes('min') || repsValue.includes('sec') || repsValue.includes('s'))) {
            return 'duration';
        }
        return 'reps';
    };
    const [trackingType, setTrackingType] = useState<'reps' | 'duration'>(determineInitialTrackingType(initialExercise?.reps ?? "8-12"));

    useEffect(() => {
        const defaultReps = determineInitialTrackingType(initialExercise?.reps) === 'duration' ? '60s' : '8-12';
        setExercise({
            id: initialExercise?.id || generateUniqueId(day),
            exercise: initialExercise?.exercise || "",
            sets: initialExercise?.sets ?? 3,
            reps: initialExercise?.reps ?? defaultReps,
            notes: initialExercise?.notes ?? "",
            youtubeLink: initialExercise?.youtubeLink ?? null,
            isNew: initialExercise?.isNew ?? true,
            weight: initialExercise?.weight ?? null,
            restTime: initialExercise?.restTime ?? "60s",
            rpe: initialExercise?.rpe ?? null,
            tempo: initialExercise?.tempo ?? "",
            tags: initialExercise?.tags ?? [],
            equipment: initialExercise?.equipment ?? [],
        });
        setTrackingType(determineInitialTrackingType(initialExercise?.reps));
    }, [initialExercise, day]);


    const handleChange = (field: keyof EditableExercise, value: any) => {
        const updatedExercise = { ...exercise, [field]: value };
        setExercise(updatedExercise);
        propagateChange(field, value);
    };

     const handleTrackingTypeChange = (type: 'reps' | 'duration') => {
        setTrackingType(type);
        handleChange('reps', '');
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
        <form onSubmit={handleSaveClick} className="space-y-4 p-1 animate-in fade-in duration-300">
            <div className="space-y-3 p-4 border border-border/50 rounded-lg bg-background/30 shadow-inner">
                 <h4 className="text-sm font-semibold text-primary border-b pb-1 mb-3">Core Details</h4>
                <ExerciseAutocomplete
                    value={exercise.exercise}
                    onChange={(value) => handleChange('exercise', value)}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 items-end pt-2">
                     <StepperInput
                        id="sets" label="Sets" icon={Repeat}
                        value={exercise.sets ?? null}
                        onChange={(value) => handleChange('sets', value)}
                     />

                     <div className="col-span-2 sm:col-span-1 flex flex-col space-y-1">
                         <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><ListFilter size={12}/> Reps / Time</Label>
                         <div className="flex items-center border rounded-md overflow-hidden h-8 bg-muted/50 p-0.5">
                             <Button type="button" size="sm" variant={trackingType === 'reps' ? 'secondary' : 'ghost'} className={cn("flex-1 text-xs h-full rounded-sm px-1", trackingType === 'reps' && "shadow-sm")} onClick={() => handleTrackingTypeChange('reps')}>Reps</Button>
                             <Button type="button" size="sm" variant={trackingType === 'duration' ? 'secondary' : 'ghost'} className={cn("flex-1 text-xs h-full rounded-sm px-1", trackingType === 'duration' && "shadow-sm")} onClick={() => handleTrackingTypeChange('duration')}>Time</Button>
                         </div>
                         <Input
                             id="reps-duration" type="text"
                             placeholder={trackingType === 'reps' ? "e.g., 8-12" : "e.g., 60s"}
                             value={exercise.reps ?? ''}
                             onChange={(e) => handleChange('reps', e.target.value)}
                             className="h-8 text-sm mt-1"
                         />
                     </div>

                     <div className="flex flex-col space-y-1">
                         <Label htmlFor="weight" className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Weight size={12}/> Weight</Label>
                         <div className="flex items-center">
                             <Input
                                id="weight" type="number" step="0.1" placeholder="--" className="h-8 text-sm rounded-r-none"
                                value={exercise.weight ?? ''}
                                onChange={(e) => handleChange('weight', e.target.value === '' ? null : parseFloat(e.target.value))}
                            />
                             <Select value={unit} onValueChange={(value) => setUnit(value as 'kg' | 'lbs')}>
                                 <SelectTrigger className="h-8 w-[60px] text-xs rounded-l-none border-l-0 px-2"> <SelectValue /> </SelectTrigger>
                                 <SelectContent> <SelectItem value="kg" className="text-xs">kg</SelectItem> <SelectItem value="lbs" className="text-xs">lbs</SelectItem> </SelectContent>
                             </Select>
                         </div>
                          <Chip label="Bodyweight" value="BW" onClick={() => handleChange('weight', 0)} className="mt-1 !h-6 !px-2" selected={exercise.weight === 0}/>
                     </div>
                </div>

                 <div className="space-y-1 pt-2">
                     <Label className="text-xs font-medium text-muted-foreground">Quick Select ({trackingType === 'reps' ? 'Reps' : 'Time'}):</Label>
                     <div className="flex flex-wrap gap-1.5">
                        {trackingOptions.map(opt => ( <Chip key={opt} label={opt} value={opt} onClick={() => handleChange('reps', opt)} selected={exercise.reps === opt}/> ))}
                     </div>
                 </div>

                 <div className="space-y-1 pt-2">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock size={12}/> Rest Time</Label>
                      <div className="flex flex-wrap gap-1.5 items-center">
                         <Input
                            id="rest" placeholder="e.g., 60s" className="h-8 text-sm w-24"
                            value={exercise.restTime ?? ''}
                            onChange={(e) => handleChange('restTime', e.target.value)}
                         />
                          {commonRestTimes.map(opt => ( <Chip key={opt} label={opt} value={opt} onClick={() => handleChange('restTime', opt)} selected={exercise.restTime === opt}/> ))}
                     </div>
                 </div>
            </div>

             <Accordion type="single" collapsible className="w-full border rounded-lg overflow-hidden shadow-sm bg-card/50">
                <AccordionItem value="advanced-options" className="border-b-0">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline hover:bg-muted/50 px-4 py-2">
                        <span className="flex items-center gap-1.5"><ListFilter size={14}/> Advanced Options</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 space-y-4 bg-background/30 border-t">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                  <TooltipProvider> <Tooltip> <TooltipTrigger asChild><Label htmlFor="rpe" className="text-xs font-medium text-muted-foreground flex items-center gap-1"><BrainCircuit size={12}/> RPE <Info size={10} className="cursor-help"/></Label></TooltipTrigger> <TooltipContent side="top" className="text-xs">Rate of Perceived Exertion (1-10)</TooltipContent> </Tooltip> </TooltipProvider>
                                 <Input
                                    id="rpe" type="number" min="1" max="10" step="0.5" placeholder="-" className="h-8 text-sm"
                                    value={exercise.rpe ?? ''}
                                    onChange={(e) => handleChange('rpe', e.target.value === '' ? null : parseFloat(e.target.value))}
                                 />
                             </div>
                             <div className="space-y-1">
                                  <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
                                      <Label htmlFor="tempo" className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock size={12}/> Tempo <Info size={10} className="cursor-help"/></Label>
                                  </TooltipTrigger> <TooltipContent side="top" className="text-xs max-w-[200px]"> Ecc-Pause-Con-Pause (e.g., 4010) </TooltipContent> </Tooltip> </TooltipProvider>
                                 <Input
                                    id="tempo" placeholder="e.g., 4010" className="h-8 text-sm"
                                    value={exercise.tempo ?? ''}
                                    onChange={(e) => handleChange('tempo', e.target.value)}
                                />
                             </div>
                         </div>
                         <MultiSelectChips label="Tags/Type" icon={Tag} options={tagOptions} value={exercise.tags ?? []} onChange={(v)=>handleChange('tags', v)}/>
                         <MultiSelectChips label="Equipment" icon={Dumbbell} options={equipmentOptions} value={exercise.equipment ?? []} onChange={(v)=>handleChange('equipment', v)}/>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

             <div className="space-y-1 pt-2">
                 <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Info size={12}/> Notes</Label>
                 <Textarea id="notes" placeholder="Cues, focus points, modifications..." value={exercise.notes ?? ''} onChange={(e) => handleChange('notes', e.target.value)} className="min-h-[60px] text-sm" />
             </div>

              <div className="space-y-1">
                 <Label htmlFor="youtubeLink" className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Youtube size={12}/> Tutorial Link (Optional)</Label>
                 <Input id="youtubeLink" placeholder="https://youtube.com/..." value={exercise.youtubeLink ?? ''} onChange={(e) => handleChange('youtubeLink', e.target.value)} className="h-8 text-sm"/>
             </div>

             <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                 <Button type="button" variant="ghost" onClick={onCancel}><X size={16} className="mr-1"/> Cancel</Button>
                 <Button type="submit"><Check size={16} className="mr-1"/> Save Exercise</Button>
             </div>
        </form>
    );
};

const generateUniqueId = (day: string) => `${day}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`;


export default AddEditExerciseForm;
    
