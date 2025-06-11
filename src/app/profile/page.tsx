// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel as ShadCnFormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel as UiSelectLabel,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
    User, Target as TargetIcon, Utensils, Activity, Save, Sparkles, Settings,
    Ruler, Weight, Calendar, TrendingUp, ShieldQuestion, MapPin, Loader2, AlertCircle,
    RefreshCw, Info, Salad, Vegan, WheatOff, Shell, CircleHelp, Flame, Droplet,
    Dumbbell, Egg, Fish, Milk, Bean, Sprout, ChefHat, HeartHandshake, Languages, Target,
    CheckCircle, Star, Zap, Heart, Bell, Clock, TestTube
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, saveUserProfile, isDisplayNameTaken } from '@/services/firestore';
import { calculateDailyTargets, CalculateTargetsInput } from '@/ai/flows/dashboard-update';
import type { StoredUserProfile, Gender, FitnessGoal, ActivityLevel, DietaryStyle, CommonAllergy, TranslatePreference } from '@/app/dashboard/types';
import { Skeleton } from '@/components/ui/skeleton';
import { dietaryStyleValues, fitnessGoalValues, activityLevelValues, commonAllergyValues, genderOptions, translatePreferenceOptions } from '@/app/dashboard/types';
import { createFirestoreServiceError } from '@/services/firestore/utils';
import { Label } from "@/components/ui/label";
import AnimatedWrapper, { FadeInWrapper, SlideUpWrapper, StaggerContainer } from "@/components/ui/animated-wrapper";
import { useWeightReminder } from '@/hooks/use-weight-reminder';


const profileFormSchema = z.object({
    displayName: z.string().min(3, "Display name must be at least 3 characters").max(30, "Display name cannot exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Display name can only contain letters, numbers, and underscores.").optional().transform(val => val || ""),
    height: z.coerce.number().min(1, "Height must be positive").min(50, "Height seems too low (cm)").max(300, "Height seems too high (cm)").optional().nullable(),
    weight: z.coerce.number().min(1, "Weight must be positive").min(20, "Weight seems too low (kg)").max(500, "Weight seems too high (kg)").optional().nullable(),
    age: z.coerce.number().int().min(1, "Age must be positive").min(10, "Age must be at least 10").max(120, "Age seems too high").optional().nullable(),
    gender: z.enum(genderOptions.map(g => g.value) as [Gender, ...Gender[]]).optional(),
    fitnessGoal: z.enum(fitnessGoalValues as [FitnessGoal, ...FitnessGoal[]]).optional(),
    activityLevel: z.enum(activityLevelValues as [ActivityLevel, ...ActivityLevel[]]).optional(),
    preferFewerRestDays: z.boolean().optional().default(false),
    dietaryStyles: z.array(z.enum(dietaryStyleValues as [DietaryStyle, ...DietaryStyle[]])).optional(),
    allergies: z.array(z.enum(commonAllergyValues as [CommonAllergy, ...CommonAllergy[]])).optional(),
    otherAllergies: z.string().max(200, "Other allergies description is too long.").optional().transform(val => val || ""),
    foodDislikes: z.string().max(500, "Dislikes description is too long.").optional().transform(val => val || ""),
    localFoodStyle: z.string().max(100, "Food style description should be under 100 characters.").optional().transform(val => val === undefined || val === null ? "" : val),
    foodPreferences: z.string().max(500, "General notes should be under 500 characters.").optional().transform(val => val || ""),
    useAiTargets: z.boolean().default(true),
    manualTargetCalories: z.coerce.number().min(1, "Calories must be positive").optional().nullable(),
    manualTargetProtein: z.coerce.number().min(1, "Protein must be positive").optional().nullable(),
    manualTargetCarbs: z.coerce.number().min(1, "Carbs must be positive").optional().nullable(),
    manualTargetFat: z.coerce.number().min(1, "Fat must be positive").optional().nullable(),
    manualTargetActivityCalories: z.coerce.number().min(0, "Activity calories cannot be negative").optional().nullable(),
    translatePreference: z.enum(translatePreferenceOptions.map(o => o.value) as [TranslatePreference, ...TranslatePreference[]]).optional().default('en'),
}).superRefine((data, ctx) => {
    if (!data.displayName?.trim()) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Display Name is required.", path: ["displayName"] }); }
    if (data.height === null || data.height === undefined) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Height is required.", path: ["height"] }); }
    if (data.weight === null || data.weight === undefined) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Weight is required.", path: ["weight"] }); }
    if (data.age === null || data.age === undefined) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Age is required.", path: ["age"] }); }
    if (!data.gender) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gender is required.", path: ["gender"] }); }
    if (!data.fitnessGoal) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fitness Goal is required.", path: ["fitnessGoal"] }); }
    if (!data.activityLevel) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Activity Level is required.", path: ["activityLevel"] }); }

    if (!data.useAiTargets) {
        if (data.manualTargetCalories === undefined || data.manualTargetCalories === null || isNaN(data.manualTargetCalories) || data.manualTargetCalories <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid manual calorie target is required.", path: ["manualTargetCalories"] });
        }
        if (data.manualTargetProtein === undefined || data.manualTargetProtein === null || isNaN(data.manualTargetProtein) || data.manualTargetProtein <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid manual protein target is required.", path: ["manualTargetProtein"] });
        }
        if (data.manualTargetCarbs === undefined || data.manualTargetCarbs === null || isNaN(data.manualTargetCarbs) || data.manualTargetCarbs <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid manual carb target is required.", path: ["manualTargetCarbs"] });
        }
        if (data.manualTargetFat === undefined || data.manualTargetFat === null || isNaN(data.manualTargetFat) || data.manualTargetFat <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid manual fat target is required.", path: ["manualTargetFat"] });
        }
        if (data.manualTargetActivityCalories !== undefined && data.manualTargetActivityCalories !== null && (isNaN(data.manualTargetActivityCalories) || data.manualTargetActivityCalories < 0)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Manual activity calorie target must be a non-negative number.", path: ["manualTargetActivityCalories"] });
        }
    }
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
    displayName: "", height: undefined, weight: undefined, age: undefined,
    gender: undefined, fitnessGoal: undefined, activityLevel: undefined,
    dietaryStyles: [], allergies: [], otherAllergies: "",
    foodDislikes: "", localFoodStyle: "", foodPreferences: "",
    useAiTargets: true,
    manualTargetCalories: undefined, manualTargetProtein: undefined, manualTargetCarbs: undefined, manualTargetFat: undefined,
    manualTargetActivityCalories: undefined,
    preferFewerRestDays: false,
    translatePreference: 'en',
};

const goalOptions: { value: FitnessGoal; label: string; icon: React.ElementType }[] = [
  { value: "weight_loss", label: "Weight Loss", icon: TrendingUp }, { value: "weight_gain", label: "Weight Gain", icon: TrendingUp },
  { value: "muscle_building", label: "Muscle Building", icon: Dumbbell }, { value: "recomposition", label: "Recomposition", icon: Activity },
  { value: "stay_fit", label: "Stay Fit", icon: HeartHandshake },
];
const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary", label: "Sedentary", description: "Little/no exercise" },
  { value: "lightly_active", label: "Lightly Active", description: "1-3 days/wk" },
  { value: "moderately_active", label: "Moderately Active", description: "3-5 days/wk" },
  { value: "very_active", label: "Very Active", description: "6-7 days/wk" },
  { value: "extra_active", label: "Extra Active", description: "Hard exercise + physical job" },
];
const dietaryStyleOptions: { value: DietaryStyle; label: string; icon: React.ElementType }[] = [
  { value: "non_vegetarian", label: "Non-Vegetarian", icon: Utensils },
  { value: "vegetarian", label: "Vegetarian", icon: Salad },
  { value: "vegan", label: "Vegan", icon: Vegan },
  { value: "eggetarian", label: "Eggetarian", icon: Egg },
  { value: "jain", label: "Jain", icon: Sprout },
  { value: "pescatarian", label: "Pescatarian", icon: Fish },
];
const allergyOptions: { value: CommonAllergy; label: string; icon: React.ElementType }[] = [
  { value: "peanuts", label: "Peanuts", icon: Bean },
  { value: "gluten", label: "Gluten", icon: WheatOff },
  { value: "dairy", label: "Dairy", icon: Milk },
  { value: "soy", label: "Soy", icon: Bean },
  { value: "shellfish", label: "Shellfish", icon: Shell },
];
const indianRegions = [
    "Not Specified", "North Indian (General)", "South Indian (General)", "East Indian (General)", "West Indian (General)",
    "South Indian (Tamil Nadu)", "South Indian (Kerala)", "South Indian (Karnataka)", "South Indian (Andhra/Telangana)",
    "Bengali", "Gujarati", "Maharashtrian", "Punjabi", "Rajasthani", "Goan", "Kashmiri", "Odia", "Bihari", "Assamese"
];
const otherRegions = ["Asian (General)", "Mediterranean", "Western (General)", "Mexican", "Italian"];

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading, userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAiTargets, setIsProcessingAiTargets] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialDisplayName, setInitialDisplayName] = useState<string | undefined>(undefined);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

  // Weight reminder state
  const weightReminder = useWeightReminder();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDay, setReminderDay] = useState('0'); // Sunday default
  const [reminderHour, setReminderHour] = useState('10');
  const [reminderMinute, setReminderMinute] = useState('0');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const useAiTargets = form.watch("useAiTargets");

  const loadProfile = useCallback(async () => {
    if (!userId || hasFetchedProfile) {
        if (!userId) console.log("[Profile Page] LoadProfile: No userId yet.");
        if (hasFetchedProfile) console.log("[Profile Page] LoadProfile: Profile already fetched this session.");
        setIsLoading(false);
        return;
    }
    console.log("[Profile Page] Auth loaded, User ID:", userId, "Fetching profile...");
    setLoadError(null); setIsLoading(true);
    try {
        const profileData = await getUserProfile(userId);
        console.log("[Profile Page] Loaded profile from service:", profileData);

        if (!profileData) {
             console.error("[Profile Page] CRITICAL: Failed to load or create user profile in getUserProfile. Returned null/undefined.");
             throw createFirestoreServiceError("Failed to load or create user profile. Please try again or contact support.", "profile-critical-failure");
        }

        setInitialDisplayName(profileData.displayName ?? "");

        // Convert any potential Date objects from localStorage to numbers/strings if needed by form
        const formData: ProfileFormValues = {
            displayName: profileData.displayName ?? "",
            height: profileData.height ?? null,
            weight: profileData.weight ?? null,
            age: profileData.age ?? null,
            gender: profileData.gender ?? undefined,
            fitnessGoal: profileData.fitnessGoal ?? undefined,
            activityLevel: profileData.activityLevel ?? undefined,
            preferFewerRestDays: profileData.preferFewerRestDays ?? false,
            dietaryStyles: Array.isArray(profileData.dietaryStyles) ? profileData.dietaryStyles : [],
            allergies: Array.isArray(profileData.allergies) ? profileData.allergies : [],
            otherAllergies: profileData.otherAllergies ?? "",
            foodDislikes: profileData.foodDislikes ?? "",
            localFoodStyle: profileData.localFoodStyle ?? "",
            foodPreferences: profileData.foodPreferences ?? "",
            useAiTargets: profileData.useAiTargets ?? true,
            manualTargetCalories: profileData.manualTargetCalories ?? null,
            manualTargetProtein: profileData.manualTargetProtein ?? null,
            manualTargetCarbs: profileData.manualTargetCarbs ?? null,
            manualTargetFat: profileData.manualTargetFat ?? null,
            manualTargetActivityCalories: profileData.manualTargetActivityCalories ?? null,
            translatePreference: profileData.translatePreference || 'en',
        };
        form.reset(formData);
        setHasFetchedProfile(true);
    } catch (error: any) {
      console.error("[Profile Page] Error in loadProfile catch block:", error);
      setLoadError(error.message || "Could not load or initialize your profile.");
      toast({ variant: "destructive", title: "Profile Load Error", description: error.message });
      setHasFetchedProfile(true);
    } finally { setIsLoading(false); }
  }, [userId, form, toast, hasFetchedProfile]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { router.replace('/authorize'); return; }
    if (!hasFetchedProfile) {
        loadProfile();
    }
  }, [authLoading, userId, router, loadProfile, hasFetchedProfile]);

  useEffect(() => {
    if (useAiTargets) {
      form.setValue("manualTargetCalories", null, { shouldValidate: false });
      form.setValue("manualTargetProtein", null, { shouldValidate: false });
      form.setValue("manualTargetCarbs", null, { shouldValidate: false });
      form.setValue("manualTargetFat", null, { shouldValidate: false });
      form.setValue("manualTargetActivityCalories", null, { shouldValidate: false });
    }
  }, [useAiTargets, form]);

  // Load weight reminder settings
  useEffect(() => {
    if (weightReminder.settings) {
      setReminderEnabled(weightReminder.settings.enabled);
      setReminderDay(weightReminder.settings.dayOfWeek.toString());
      setReminderHour(weightReminder.settings.hour.toString());
      setReminderMinute(weightReminder.settings.minute.toString());
    }
  }, [weightReminder.settings]);

  // Handle weight reminder settings change
  const handleReminderChange = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    
    if (enabled && weightReminder.permission !== 'granted') {
      const granted = await weightReminder.requestPermission();
      if (!granted) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Notifications are required for weight reminders. Please enable them in your browser settings."
        });
        setReminderEnabled(false);
        return;
      }
    }

    const settings = {
      enabled,
      dayOfWeek: parseInt(reminderDay),
      hour: parseInt(reminderHour),
      minute: parseInt(reminderMinute)
    };

    if (enabled) {
      const success = await weightReminder.scheduleReminder(settings);
      if (success) {
        toast({
          title: "Reminder Scheduled",
          description: `You'll be reminded to update your weight every ${getDayName(parseInt(reminderDay))} at ${formatTime(parseInt(reminderHour), parseInt(reminderMinute))}.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Reminder Failed",
          description: "Failed to schedule weight reminder. Please try again."
        });
        setReminderEnabled(false);
      }
    } else {
      await weightReminder.cancelReminder();
      toast({
        title: "Reminder Cancelled",
        description: "Weight reminders have been disabled."
      });
    }
  };

  const handleReminderTimeChange = async () => {
    if (reminderEnabled) {
      const settings = {
        enabled: true,
        dayOfWeek: parseInt(reminderDay),
        hour: parseInt(reminderHour),
        minute: parseInt(reminderMinute)
      };

      const success = await weightReminder.scheduleReminder(settings);
      if (success) {
        toast({
          title: "Reminder Updated",
          description: `Weight reminder updated to ${getDayName(parseInt(reminderDay))} at ${formatTime(parseInt(reminderHour), parseInt(reminderMinute))}.`
        });
      }
    }
  };

  const handleTestNotification = async () => {
    const success = await weightReminder.showTestNotification();
    if (success) {
      toast({
        title: "Test Notification Sent",
        description: "Check if you received the test notification."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: "Failed to send test notification."
      });
    }
  };

  // Helper functions
  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!userId) { toast({ variant: "destructive", title: "Error", description: "User not authenticated." }); return; }
    
    setIsSaving(true); setIsProcessingAiTargets(false);

    // Construct a PLAIN JavaScript object for the server action
    const plainProfileData: Partial<StoredUserProfile> = {
        displayName: data.displayName || undefined, // Send undefined if empty, let server handle default
        height: data.height ?? null,
        weight: data.weight ?? null,
        age: data.age ?? null,
        gender: data.gender ?? null,
        fitnessGoal: data.fitnessGoal ?? null,
        activityLevel: data.activityLevel ?? null,
        preferFewerRestDays: data.preferFewerRestDays ?? false,
        dietaryStyles: Array.isArray(data.dietaryStyles) ? data.dietaryStyles : [],
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        otherAllergies: data.otherAllergies || "",
        foodDislikes: data.foodDislikes || "",
        localFoodStyle: data.localFoodStyle === "Not Specified" ? "" : (data.localFoodStyle || ""),
        foodPreferences: data.foodPreferences || "",
        useAiTargets: data.useAiTargets ?? true,
        translatePreference: data.translatePreference || 'en',
        // `settings` will be merged server-side if sent, or default if not.
        // Let's construct it explicitly for clarity if it's part of the form.
        // For now, assuming settings are not directly on this form, server will merge with existing or default.
    };
    
    // Add settings if they were part of the form (currently they are not in ProfileFormValues)
    // if (data.settings) {
    //     plainProfileData.settings = { 
    //         theme: data.settings.theme, 
    //         progressViewPermission: data.settings.progressViewPermission 
    //     };
    // }


    if (data.displayName && data.displayName.trim() && data.displayName !== initialDisplayName) {
        try {
            const taken = await isDisplayNameTaken(data.displayName.trim());
            if (taken) {
                form.setError("displayName", { type: "manual", message: "This display name is already taken." });
                setIsSaving(false); return;
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Save Error", description: "Could not verify display name." });
            setIsSaving(false); return;
        }
    }

    try {
        if (data.useAiTargets) {
            plainProfileData.manualTargetCalories = null;
            plainProfileData.manualTargetProtein = null;
            plainProfileData.manualTargetCarbs = null;
            plainProfileData.manualTargetFat = null;
            plainProfileData.manualTargetActivityCalories = null;
            // AI targets will be calculated and saved in the next step
        } else {
            plainProfileData.manualTargetCalories = data.manualTargetCalories ?? null;
            plainProfileData.manualTargetProtein = data.manualTargetProtein ?? null;
            plainProfileData.manualTargetCarbs = data.manualTargetCarbs ?? null;
            plainProfileData.manualTargetFat = data.manualTargetFat ?? null;
            plainProfileData.manualTargetActivityCalories = data.manualTargetActivityCalories ?? null;
            
            // Clear AI targets if manual is chosen
            plainProfileData.targetCalories = null;
            plainProfileData.targetProtein = null;
            plainProfileData.targetCarbs = null;
            plainProfileData.targetFat = null;
            plainProfileData.targetActivityCalories = null;
            plainProfileData.maintenanceCalories = null;
        }
        
        await saveUserProfile(userId, plainProfileData); // Send plain data
        toast({ title: "Profile Updated", description: "Core information saved." });
        setInitialDisplayName(data.displayName);

        if (data.useAiTargets) {
            setIsSaving(false); 
            setIsProcessingAiTargets(true);

            const aiInput: CalculateTargetsInput = {
                height: data.height!, weight: data.weight!, age: data.age!,
                gender: data.gender!, activityLevel: data.activityLevel!, fitnessGoal: data.fitnessGoal!,
                foodPreferences: data.foodPreferences, localFoodStyle: data.localFoodStyle,
            };

            try {
                const calculatedTargetsResult = await calculateDailyTargets(aiInput);
                const maintenanceCals = calculatedTargetsResult.targetCalories + (data.fitnessGoal === 'weight_loss' ? 500 : ['weight_gain', 'muscle_building'].includes(data.fitnessGoal!) ? -300 : 0);
                
                const aiTargetsToSave: Partial<StoredUserProfile> = { // Plain object
                    targetCalories: calculatedTargetsResult.targetCalories,
                    targetProtein: calculatedTargetsResult.targetProtein,
                    targetCarbs: calculatedTargetsResult.targetCarbs,
                    targetFat: calculatedTargetsResult.targetFat,
                    targetActivityCalories: calculatedTargetsResult.targetActivityCalories,
                    maintenanceCalories: maintenanceCals,
                    useAiTargets: true,
                };
                await saveUserProfile(userId, aiTargetsToSave); // Send plain data
                toast({ title: "AI Targets Calculated & Saved!", description: "Personalized targets are set." });
                router.push('/dashboard'); 
            } catch (aiError: any) {
                toast({ variant: "destructive", title: "AI Target Error", description: `Could not set AI targets: ${aiError.message}. Please try saving again or set manual targets.` });
            } finally {
                setIsProcessingAiTargets(false);
            }
        } else {
            setIsSaving(false);
            toast({ title: "Manual Targets Saved", description: "Profile updated." });
            router.push('/dashboard');
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Save Error", description: error.message || "Could not save profile." });
        setIsSaving(false);
        setIsProcessingAiTargets(false);
    }
  }

  const renderStyledRadioGroup = (field: any, options: { value: string; label: string }[]) => (
    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {options.map((option) => (
        <FormItem key={option.value} className="relative">
           <FormControl>
                <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} className="sr-only peer" />
           </FormControl>
           <ShadCnFormLabel
            htmlFor={`${field.name}-${option.value}`}
            className={cn(
               "flex items-center justify-center p-2 sm:p-3 text-center text-xs sm:text-sm font-medium rounded-lg border-2 border-muted bg-popover hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
               "h-full min-h-[40px] sm:min-h-[44px] md:min-h-[50px] lg:min-h-[60px] card-interactive",
               field.value === option.value && "border-primary bg-primary/10 text-primary ring-2 ring-primary/50 ring-offset-1 ring-offset-background"
           )}>
             {option.label}
          </ShadCnFormLabel>
        </FormItem>
      ))}
    </RadioGroup>
 );

  const renderChips = (field: any, options: { value: string; label: string; icon?: React.ElementType }[]) => (
   <div className="flex flex-wrap gap-1.5 sm:gap-2">
     {options.map((option, index) => (
       <Button
         key={option.value}
         type="button"
         variant={field.value === option.value ? "default" : "outline"}
         className={cn(
           "rounded-lg text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 md:px-4 shadow-sm transition-all transform hover:scale-105 btn",
           field.value === option.value ? "bg-primary text-primary-foreground border-primary font-semibold" : "border-input hover:bg-accent/50 hover:border-primary/50",
           "animate-in fade-in zoom-in-95"
         )}
         style={{ animationDelay: `${index * 50}ms` }}
         onClick={() => {
           form.setValue(field.name, option.value, { shouldValidate: true });
         }}
       >
         {option.icon && React.createElement(option.icon, { className: "mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" })}
         <span className="text-xs sm:text-sm">{option.label}</span>
       </Button>
     ))}
   </div>
 );

 const renderMultiSelectCheckbox = (field: any, options: { value: string; label: string; icon?: React.ElementType }[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
      {options.map((item, index) => (
        <FormField key={item.value} control={form.control} name={field.name} render={({ field: controllerField }) => {
            const currentValue = Array.isArray(controllerField.value) ? controllerField.value : [];
            const isChecked = currentValue.includes(item.value);
            return (
               <ShadCnFormLabel
                  htmlFor={`checkbox-${field.name}-${item.value}`}
                  data-state={isChecked ? 'checked' : 'unchecked'}
                  className={cn(
                    "flex flex-row items-center space-x-2 space-y-0 rounded-lg border p-2 sm:p-2.5 transition-all hover:bg-muted/50 cursor-pointer card-interactive",
                    "data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary/50 data-[state=checked]:ring-1 data-[state=checked]:ring-primary/30",
                    "animate-in fade-in zoom-in-95 min-h-[40px] sm:min-h-[44px] flex-1"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
               >
                <FormControl>
                  <Checkbox
                    id={`checkbox-${field.name}-${item.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                        return checked
                          ? controllerField.onChange([...currentValue, item.value])
                          : controllerField.onChange(currentValue.filter((value) => value !== item.value))
                    }}
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                  />
                </FormControl>
                 <span className="font-normal text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 flex-grow leading-tight">
                    {item.icon && React.createElement(item.icon, { className: "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" })}
                    <span className="break-words">{item.label}</span>
                 </span>
               </ShadCnFormLabel>
            );
          }}
        />
      ))}
    </div>
 );

  // Main component return JSX
  if (authLoading || isLoading || !hasFetchedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl w-full"
        >
          <Card className="bg-card/90 backdrop-blur-xl border-border/20 shadow-2xl">
            <CardHeader className="text-center p-6 sm:p-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
              </motion.div>
              <Skeleton className="h-6 w-48 mx-auto bg-muted/50 mb-2" />
              <Skeleton className="h-4 w-64 mx-auto bg-muted/30" />
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-8">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="space-y-6 p-6 border rounded-xl bg-muted/20 backdrop-blur-sm"
                >
                  <Skeleton className="h-5 w-1/3 bg-muted/50" />
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-muted/50" />
                    <Skeleton className="h-12 w-full bg-muted/50" />
                    {i === 3 && <Skeleton className="h-24 w-full bg-muted/50" />}
                  </div>
                </motion.div>
              ))}
            </CardContent>
            <CardFooter className="pt-6 pb-8 justify-center">
              <Skeleton className="h-12 w-48 bg-muted/50" />
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md text-center border-destructive/50 bg-card/90 backdrop-blur-xl shadow-2xl">
            <CardHeader className="p-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
              </motion.div>
              <CardTitle className="text-destructive text-xl">Profile Error</CardTitle>
              <CardDescription className="text-base mt-2">{loadError}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pb-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={loadProfile} size="lg" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isProcessingAiTargets) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-[200]"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 border-primary/20">
            <div className="flex justify-center items-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </motion.div>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-foreground mb-3"
            >
              Personalizing Your Targets...
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              Bago AI is crafting your optimal daily goals. This might take a moment. Please wait.
            </motion.p>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-2 sm:py-4 md:py-8 pb-24 sm:pb-8">
      {/* Animated Background Elements - Hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <motion.div
          className="absolute top-10 sm:top-20 left-4 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-primary/5 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 bg-accent/5 rounded-full blur-2xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-2 sm:px-4 md:px-6 pb-safe">
        <FadeInWrapper>
          <Card className="bg-card/90 backdrop-blur-xl border-border/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden mb-8 sm:mb-4">
            <motion.div
              className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <CardHeader className="text-center p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.4 }}
                  className="relative mx-auto mb-2 sm:mb-3 md:mb-4"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary-foreground" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1 sm:mb-2">
                    Complete Your Profile
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed px-1 sm:px-2 md:px-0">
                    Complete your profile for personalized AI insights and plans. Fields marked * are required.
                  </CardDescription>
                </motion.div>

                {/* Decorative elements - Hidden on mobile for cleaner look */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 hidden sm:block">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary/30" />
                  </motion.div>
                </div>
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 hidden sm:block">
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-accent/30" />
                  </motion.div>
                </div>
              </CardHeader>
            </motion.div>
            
            <CardContent className="p-2 sm:p-3 md:p-6 lg:p-8 font-sans relative">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
                  <StaggerContainer>
                    {/* About You Section */}
                    <motion.section
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6 border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm 
                               shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300
                               hover:bg-card/70 group mb-4 sm:mb-6 md:mb-8"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 border-b border-border/30 pb-2 sm:pb-3 md:pb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"
                        >
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                        </motion.div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          About You
                        </h2>
                      </div>

                      <FormField control={form.control} name="displayName" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Display Name *
                          </ShadCnFormLabel>
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.02 }}>
                              <Input 
                                Icon={User} 
                                placeholder="Choose a unique display name" 
                                {...field} 
                                value={field.value ?? ''} 
                                className="h-11 sm:h-12 text-sm sm:text-base font-sans transition-all duration-300
                                         focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                         hover:border-primary/30"
                              />
                            </motion.div>
                          </FormControl>
                          <FormDescription className="text-xs font-sans text-muted-foreground leading-relaxed">
                            Visible to others if you enable sharing. Letters, numbers, underscores only.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <FormField control={form.control} name="height" render={({ field }) => (
                          <FormItem>
                            <ShadCnFormLabel className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                              <Ruler className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              Height (cm) *
                            </ShadCnFormLabel>
                            <FormControl>
                              <motion.div whileFocus={{ scale: 1.02 }}>
                                <Input 
                                  Icon={Ruler} 
                                  type="number" 
                                  placeholder="e.g., 175" 
                                  {...field} 
                                  value={field.value ?? ''} 
                                  className="h-11 sm:h-12 text-sm sm:text-base font-sans transition-all duration-300
                                           focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                           hover:border-primary/30"
                                />
                              </motion.div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="weight" render={({ field }) => (
                          <FormItem>
                            <ShadCnFormLabel className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                              <Weight className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              Weight (kg) *
                            </ShadCnFormLabel>
                            <FormControl>
                              <motion.div whileFocus={{ scale: 1.02 }}>
                                <Input 
                                  Icon={Weight} 
                                  type="number" 
                                  placeholder="e.g., 70" 
                                  {...field} 
                                  value={field.value ?? ''} 
                                  className="h-11 sm:h-12 text-sm sm:text-base font-sans transition-all duration-300
                                           focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                           hover:border-primary/30"
                                />
                              </motion.div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="age" render={({ field }) => (
                          <FormItem className="sm:col-span-2 lg:col-span-1">
                            <ShadCnFormLabel className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              Age (years) *
                            </ShadCnFormLabel>
                            <FormControl>
                              <motion.div whileFocus={{ scale: 1.02 }}>
                                <Input 
                                  Icon={Calendar} 
                                  type="number" 
                                  placeholder="e.g., 25" 
                                  {...field} 
                                  value={field.value ?? ''} 
                                  className="h-11 sm:h-12 text-sm sm:text-base font-sans transition-all duration-300
                                           focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                           hover:border-primary/30"
                                />
                              </motion.div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium">Gender *</ShadCnFormLabel>
                          {renderStyledRadioGroup(field, genderOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.section>

                    {/* Fitness Details Section */}
                    <motion.section
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6 border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm 
                               shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300
                               hover:bg-card/70 group mb-4 sm:mb-6 md:mb-8"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 border-b border-border/30 pb-2 sm:pb-3 md:pb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"
                        >
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                        </motion.div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Fitness Details
                        </h2>
                      </div>

                      <FormField control={form.control} name="fitnessGoal" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Primary Fitness Goal *
                          </ShadCnFormLabel>
                          {renderChips(field, goalOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="activityLevel" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Typical Activity Level *
                          </ShadCnFormLabel>
                          {renderChips(field, activityOptions)}
                          <FormDescription className="text-xs mt-2 sm:mt-3 font-sans text-muted-foreground leading-relaxed">
                            {activityOptions.find(opt => opt.value === field.value)?.description}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="preferFewerRestDays" render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/30 p-3 sm:p-4 
                                           bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-colors duration-300 sm:space-y-0">
                          <div className="space-y-1 sm:mr-4">
                            <ShadCnFormLabel className="text-xs sm:text-sm font-medium flex items-center gap-2">
                              <ShieldQuestion className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              Training Intensity
                            </ShadCnFormLabel>
                            <FormDescription className="text-xs font-sans leading-relaxed">
                              Prefer fewer rest days? (Requests a more intense workout plan)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <motion.div whileTap={{ scale: 0.95 }} className="flex justify-center sm:justify-end">
                              <Switch 
                                checked={field.value ?? false} 
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                              />
                            </motion.div>
                          </FormControl>
                        </FormItem>
                      )} />
                    </motion.section>

                    {/* Nutrition Section */}
                    <motion.section
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6 border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm 
                               shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300
                               hover:bg-card/70 group mb-4 sm:mb-6 md:mb-8"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 border-b border-border/30 pb-2 sm:pb-3 md:pb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"
                        >
                          <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                        </motion.div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Personalize Your Nutrition
                        </h2>
                      </div>
                      
                      <FormDescription className="text-xs sm:text-sm italic text-center text-muted-foreground p-2 sm:p-3 bg-muted/20 rounded-lg border border-border/20 leading-relaxed">
                        This helps tailor meal suggestions and nutritional analysis.
                      </FormDescription>

                      <FormField control={form.control} name="localFoodStyle" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Regional Cuisine Preference
                          </ShadCnFormLabel>
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.02 }}>
                              <Select onValueChange={field.onChange} value={field.value === "" ? "Not Specified" : field.value || "Not Specified"}>
                                <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base font-sans transition-all duration-300
                                                       focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                                       hover:border-primary/30">
                                  <SelectValue placeholder="Select your preferred cuisine..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Not Specified" className="text-muted-foreground italic font-sans">
                                    Select your preferred cuisine...
                                  </SelectItem>
                                  <SelectGroup>
                                    <UiSelectLabel className="text-xs font-sans">Indian Regions</UiSelectLabel>
                                    {indianRegions.filter(r => r !== "Not Specified").map(region => 
                                      <SelectItem key={region} value={region} className="font-sans">{region}</SelectItem>
                                    )}
                                  </SelectGroup>
                                  <SelectGroup>
                                    <UiSelectLabel className="text-xs font-sans">Other Regions</UiSelectLabel>
                                    {otherRegions.map(region => 
                                      <SelectItem key={region} value={region} className="font-sans">{region}</SelectItem>
                                    )}
                                  </SelectGroup>
                                  <SelectItem value="other" className="font-sans">Other (Specify Below)</SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="dietaryStyles" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <Salad className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Dietary Style(s)
                          </ShadCnFormLabel>
                          {renderMultiSelectCheckbox(field, dietaryStyleOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="allergies" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium flex items-center gap-2">
                            <CircleHelp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                            Allergies/Intolerances
                          </ShadCnFormLabel>
                          {renderMultiSelectCheckbox(field, allergyOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="otherAllergies" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-xs sm:text-sm font-medium">Other Allergies</ShadCnFormLabel>
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.02 }}>
                              <Input 
                                Icon={Info} 
                                placeholder="Specify other allergies..." 
                                {...field} 
                                value={field.value ?? ''} 
                                className="text-sm sm:text-base h-11 sm:h-12 font-sans transition-all duration-300
                                         focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                         hover:border-primary/30"
                              />
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="foodDislikes" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium">Food Dislikes (Optional)</ShadCnFormLabel>
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.02 }}>
                              <Textarea 
                                Icon={Info} 
                                placeholder="List any foods you strongly dislike (e.g., mushrooms, spicy food)" 
                                className="resize-none text-sm sm:text-base min-h-[80px] sm:min-h-[100px] font-sans transition-all duration-300
                                         focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                         hover:border-primary/30" 
                                {...field} 
                                value={field.value ?? ''} 
                              />
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="foodPreferences" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium">Other Notes (Optional)</ShadCnFormLabel>
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.02 }}>
                              <Textarea 
                                Icon={Info} 
                                placeholder="Any other specific needs? (e.g., No onion/garlic, prefers low-oil cooking)" 
                                className="resize-none text-sm sm:text-base min-h-[80px] sm:min-h-[100px] font-sans transition-all duration-300
                                         focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                         hover:border-primary/30" 
                                {...field} 
                                value={field.value ?? ''} 
                              />
                            </motion.div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.section>

                    {/* Language Preference Section */}
                    <motion.section
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6 border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm 
                               shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300
                               hover:bg-card/70 group mb-4 sm:mb-6 md:mb-8"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 border-b border-border/30 pb-2 sm:pb-3 md:pb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"
                        >
                          <Languages className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                        </motion.div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Language Preference
                        </h2>
                      </div>

                      <FormField control={form.control} name="translatePreference" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className="text-sm sm:text-base font-medium">Report & AI Chat Language</ShadCnFormLabel>
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.02 }}>
                              <Select onValueChange={field.onChange} value={field.value || 'en'}>
                                <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base font-sans transition-all duration-300
                                                       focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                                       hover:border-primary/30">
                                  <SelectValue placeholder="Select language..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {translatePreferenceOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value} className="font-sans">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          </FormControl>
                          <FormDescription className="text-xs font-sans text-muted-foreground leading-relaxed">
                            Select the language for AI-generated reports and chat responses.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.section>

                    {/* Target Settings Section */}
                    <motion.section
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-5 lg:p-6 border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm 
                               shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300
                               hover:bg-card/70 group mb-4 sm:mb-6 md:mb-8"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 border-b border-border/30 pb-3 sm:pb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-1.5 sm:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"
                        >
                          <TargetIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </motion.div>
                        <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Target Settings
                        </h2>
                      </div>

                      <FormField control={form.control} name="useAiTargets" render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/30 p-4 
                                           bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-colors duration-300 space-y-3 sm:space-y-0">
                          <div className="space-y-1 sm:mr-4">
                            <ShadCnFormLabel className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                              Use Smart Personalized Targets
                            </ShadCnFormLabel>
                            <FormDescription className="text-xs font-sans leading-relaxed">
                              Let Bago automatically calculate your daily goals using BMR/TDEE formulas.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <motion.div whileTap={{ scale: 0.95 }} className="flex justify-center sm:justify-end">
                              <Switch 
                                checked={field.value ?? true} 
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                              />
                            </motion.div>
                          </FormControl>
                        </FormItem>
                      )} />

                      <AnimatePresence mode="wait">
                        {!useAiTargets && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 pt-4"
                          >
                            <p className="text-sm text-muted-foreground italic font-sans p-3 bg-muted/20 rounded-lg border border-border/20 leading-relaxed">
                              Manually set your daily nutritional and activity targets:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                              <FormField control={form.control} name="manualTargetCalories" render={({ field }) => (
                                <FormItem>
                                  <ShadCnFormLabel className="flex items-center gap-2 text-xs">
                                    <Flame className="h-3 w-3 text-primary" />
                                    Calories (kcal) *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <motion.div whileFocus={{ scale: 1.02 }}>
                                      <Input 
                                        Icon={Flame} 
                                        type="number" 
                                        placeholder="e.g., 2000" 
                                        {...field} 
                                        value={field.value ?? ''} 
                                        className="h-11 sm:h-10 text-base font-sans transition-all duration-300
                                                 focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                                 hover:border-primary/30"
                                      />
                                    </motion.div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name="manualTargetProtein" render={({ field }) => (
                                <FormItem>
                                  <ShadCnFormLabel className="flex items-center gap-2 text-xs">
                                    <Dumbbell className="h-3 w-3 text-primary" />
                                    Protein (g) *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <motion.div whileFocus={{ scale: 1.02 }}>
                                      <Input 
                                        Icon={Dumbbell} 
                                        type="number" 
                                        placeholder="e.g., 150" 
                                        {...field} 
                                        value={field.value ?? ''} 
                                        className="h-11 sm:h-10 text-base font-sans transition-all duration-300
                                                 focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                                 hover:border-primary/30"
                                      />
                                    </motion.div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name="manualTargetCarbs" render={({ field }) => (
                                <FormItem>
                                  <ShadCnFormLabel className="flex items-center gap-2 text-xs">
                                    <Activity className="h-3 w-3 text-primary" />
                                    Carbs (g) *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <motion.div whileFocus={{ scale: 1.02 }}>
                                      <Input 
                                        Icon={Activity} 
                                        type="number" 
                                        placeholder="e.g., 200" 
                                        {...field} 
                                        value={field.value ?? ''} 
                                        className="h-11 sm:h-10 text-base font-sans transition-all duration-300
                                                 focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                                 hover:border-primary/30"
                                      />
                                    </motion.div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name="manualTargetFat" render={({ field }) => (
                                <FormItem>
                                  <ShadCnFormLabel className="flex items-center gap-2 text-xs">
                                    <Droplet className="h-3 w-3 text-primary" />
                                    Fat (g) *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <motion.div whileFocus={{ scale: 1.02 }}>
                                      <Input 
                                        Icon={Droplet} 
                                        type="number" 
                                        placeholder="e.g., 70" 
                                        {...field} 
                                        value={field.value ?? ''} 
                                        className="h-11 sm:h-10 text-base font-sans transition-all duration-300
                                                 focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                                 hover:border-primary/30"
                                      />
                                    </motion.div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>

                            <FormField control={form.control} name="manualTargetActivityCalories" render={({ field }) => (
                              <FormItem>
                                <ShadCnFormLabel className="flex items-center gap-2 text-sm font-medium">
                                  <Target className="h-4 w-4 text-primary" />
                                  Manual Target Activity Calories (kcal)
                                </ShadCnFormLabel>
                                <FormControl>
                                  <motion.div whileFocus={{ scale: 1.02 }}>
                                    <Input 
                                      Icon={Target} 
                                      type="number" 
                                      placeholder="e.g., 300" 
                                      {...field} 
                                      value={field.value ?? ''} 
                                      className="h-12 sm:h-11 text-base font-sans transition-all duration-300
                                               focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                                               hover:border-primary/30"
                                    />
                                  </motion.div>
                                </FormControl>
                                <FormDescription className="text-xs font-sans text-muted-foreground leading-relaxed">
                                  Your desired daily calorie burn from dedicated exercise.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.section>

                    {/* Weight Reminder Section */}
                    <motion.section
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="space-y-6 p-6 border border-border/30 rounded-xl bg-card/50 backdrop-blur-sm 
                               shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300
                               hover:bg-card/70 group"
                    >
                      <div className="flex items-center gap-3 border-b border-border/30 pb-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300"
                        >
                          <Bell className="h-5 w-5 text-primary" />
                        </motion.div>
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Weight Tracking Reminders
                        </h2>
                      </div>

                      <FormDescription className="text-sm italic text-center text-muted-foreground p-3 bg-muted/20 rounded-lg border border-border/20">
                        Get reminded weekly to update your weight for better tracking and personalized recommendations.
                      </FormDescription>

                      {!weightReminder.isSupported && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4" />
                            Notifications may not be fully supported in your current environment.
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            • Make sure you're using HTTPS or localhost
                            <br />
                            • Install as PWA for full notification support
                            <br />
                            • Check browser notification permissions
                          </p>
                          {process.env.NODE_ENV === 'development' && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-mono">
                              Dev mode: Try installing as PWA or check console for details
                            </p>
                          )}
                        </div>
                      )}

                      {(weightReminder.isSupported || process.env.NODE_ENV === 'development') && (
                        <div className="space-y-4">
                          {/* Development mode notice */}
                          {!weightReminder.isSupported && process.env.NODE_ENV === 'development' && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Development mode: Notification settings available for testing
                              </p>
                            </div>
                          )}

                          {/* Enable/Disable Toggle */}
                          <div className="flex flex-row items-center justify-between rounded-xl border border-border/30 p-4 
                                         bg-muted/20 backdrop-blur-sm hover:bg-muted/30 transition-colors duration-300">
                            <div className="space-y-1 mr-4">
                              <ShadCnFormLabel className="text-sm font-medium flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                Weekly Weight Reminders
                              </ShadCnFormLabel>
                              <FormDescription className="text-xs font-sans">
                                {weightReminder.permission === 'granted' 
                                  ? "Get notified weekly to update your weight"
                                  : "Permission required for notifications"
                                }
                              </FormDescription>
                            </div>
                            <motion.div whileTap={{ scale: 0.95 }}>
                              <Switch 
                                checked={reminderEnabled} 
                                onCheckedChange={handleReminderChange}
                                disabled={weightReminder.isLoading}
                                className="data-[state=checked]:bg-primary"
                              />
                            </motion.div>
                          </div>

                          {/* Time and Day Settings */}
                          <AnimatePresence mode="wait">
                            {reminderEnabled && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4 pt-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Day of Week */}
                                  <div className="space-y-2">
                                    <ShadCnFormLabel className="text-sm font-medium flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-primary" />
                                      Day of Week
                                    </ShadCnFormLabel>
                                    <Select
                                      value={reminderDay}
                                      onValueChange={(value) => {
                                        setReminderDay(value);
                                        setTimeout(handleReminderTimeChange, 100);
                                      }}
                                    >
                                      <SelectTrigger className="h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-primary/30">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="0">Sunday</SelectItem>
                                        <SelectItem value="1">Monday</SelectItem>
                                        <SelectItem value="2">Tuesday</SelectItem>
                                        <SelectItem value="3">Wednesday</SelectItem>
                                        <SelectItem value="4">Thursday</SelectItem>
                                        <SelectItem value="5">Friday</SelectItem>
                                        <SelectItem value="6">Saturday</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Hour */}
                                  <div className="space-y-2">
                                    <ShadCnFormLabel className="text-sm font-medium flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-primary" />
                                      Hour
                                    </ShadCnFormLabel>
                                    <Select
                                      value={reminderHour}
                                      onValueChange={(value) => {
                                        setReminderHour(value);
                                        setTimeout(handleReminderTimeChange, 100);
                                      }}
                                    >
                                      <SelectTrigger className="h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-primary/30">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {formatTime(i, 0).split(':')[0] + ' ' + formatTime(i, 0).split(' ')[1]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Minute */}
                                  <div className="space-y-2">
                                    <ShadCnFormLabel className="text-sm font-medium flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-primary" />
                                      Minute
                                    </ShadCnFormLabel>
                                    <Select
                                      value={reminderMinute}
                                      onValueChange={(value) => {
                                        setReminderMinute(value);
                                        setTimeout(handleReminderTimeChange, 100);
                                      }}
                                    >
                                      <SelectTrigger className="h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-primary/30">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                          <SelectItem key={minute} value={minute.toString()}>
                                            {minute.toString().padStart(2, '0')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Test Notification Button */}
                                <div className="flex justify-center pt-2">
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleTestNotification}
                                      className="gap-2 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
                                    >
                                      <TestTube className="h-4 w-4" />
                                      Test Notification
                                    </Button>
                                  </motion.div>
                                </div>

                                <div className="text-center text-xs text-muted-foreground italic p-2 bg-muted/10 rounded-lg">
                                  Next reminder: {getDayName(parseInt(reminderDay))} at {formatTime(parseInt(reminderHour), parseInt(reminderMinute))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.section>
                  </StaggerContainer>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="pt-8 pb-4 sm:pt-8 sm:pb-2"
                  >
                    <CardFooter className="pt-6 pb-8 sm:pb-4 md:pb-8 justify-center px-4 sm:px-6">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full max-w-md"
                      >
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 
                                   text-primary-foreground py-4 sm:py-3 px-6 text-base font-semibold shadow-lg 
                                   transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
                                   disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-11 md:h-12" 
                          disabled={isSaving || !form.formState.isDirty || isProcessingAiTargets}
                        >
                          <AnimatePresence mode="wait">
                            {(isSaving && !isProcessingAiTargets) && (
                              <motion.div 
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                              >
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Saving Basic Info...
                              </motion.div>
                            )}
                            {isProcessingAiTargets && (
                              <motion.div 
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                              >
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Calculating AI Targets...
                              </motion.div>
                            )}
                            {!isSaving && !isProcessingAiTargets && (
                              <motion.div 
                                key="update"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center"
                              >
                                <Save className="mr-2 h-5 w-5" />
                                Update Profile
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                    </CardFooter>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </FadeInWrapper>
      </div>
    </div>
  );
}
