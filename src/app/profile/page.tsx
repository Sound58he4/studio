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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { hasProAccess } from '@/services/firestore/subscriptionService';
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
  const [errorPopup, setErrorPopup] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });
  const [userHasProAccess, setUserHasProAccess] = useState<boolean>(false);
  const [isCheckingProAccess, setIsCheckingProAccess] = useState<boolean>(true);

  // Dark theme state and detection
  const [isClient, setIsClient] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Detect theme from HTML class (consistent with Overview page)
  useEffect(() => {
    const updateDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateDark(); // Initial check
    
    // Watch for theme changes
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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

  const checkProAccess = useCallback(async () => {
    if (!userId) {
      setIsCheckingProAccess(false);
      return;
    }
    
    try {
      setIsCheckingProAccess(true);
      const hasAccess = await hasProAccess(userId);
      setUserHasProAccess(hasAccess);
      console.log("[Profile Page] Pro access check:", hasAccess);
    } catch (error) {
      console.error("[Profile Page] Error checking Pro access:", error);
      setUserHasProAccess(false); // Default to no access on error
    } finally {
      setIsCheckingProAccess(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { router.replace('/authorize'); return; }
    if (!hasFetchedProfile) {
        loadProfile();
    }
    // Check Pro access when userId is available
    checkProAccess();
  }, [authLoading, userId, router, loadProfile, hasFetchedProfile, checkProAccess]);

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

  const showErrorPopup = (title: string, message: string) => {
    setErrorPopup({
      show: true,
      title,
      message
    });
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!userId) { 
      showErrorPopup("Authentication Error", "User not authenticated. Please log in again.");
      return; 
    }
    
    // Check for form validation errors
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors).map(([field, error]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
        return `${fieldName}: ${error?.message || 'Invalid value'}`;
      });
      
      showErrorPopup(
        "Form Validation Error", 
        `Please fix the following errors:\n\n${errorMessages.join('\n')}`
      );
      return;
    }
    
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
                showErrorPopup("Display Name Error", "This display name is already taken. Please choose a different one.");
                setIsSaving(false); return;
            }
        } catch (error) {
            showErrorPopup("Verification Error", "Could not verify display name. Please try again.");
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
                showErrorPopup("AI Target Error", `Could not set AI targets: ${aiError.message}. Please try saving again or set manual targets.`);
            } finally {
                setIsProcessingAiTargets(false);
            }
        } else {
            setIsSaving(false);
            toast({ title: "Manual Targets Saved", description: "Profile updated." });
            router.push('/dashboard');
        }
    } catch (error: any) {
        showErrorPopup("Save Error", error.message || "Could not save profile. Please try again.");
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
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
     {options.map((option, index) => (
       <Button
         key={option.value}
         type="button"
         variant={field.value === option.value ? "default" : "outline"}
         className={cn(
           "rounded-xl text-sm h-auto min-h-[3rem] px-4 py-3 shadow-sm transition-all justify-start text-left",
           field.value === option.value 
             ? isDark
               ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-md hover:bg-blue-700" 
               : "bg-primary text-primary-foreground border-primary font-semibold shadow-md"
             : isDark
               ? "border-[#3a3a3a] bg-[#2a2a2a] text-gray-300 hover:bg-[#323232] hover:border-blue-500/50"
               : "border-input hover:bg-primary/5 hover:border-primary/50",
           "animate-in fade-in zoom-in-95"
         )}
         style={{ animationDelay: `${index * 50}ms` }}
         onClick={() => {
           form.setValue(field.name, option.value, { shouldValidate: true });
         }}
       >
         <div className="flex items-center gap-2 w-full">
           {option.icon && React.createElement(option.icon, { 
             className: `h-4 w-4 flex-shrink-0 ${
               field.value === option.value 
                 ? 'text-current' 
                 : isDark ? 'text-blue-400' : 'text-primary'
             }` 
           })}
           <span className="text-sm font-medium leading-tight break-words">{option.label}</span>
         </div>
       </Button>
     ))}
   </div>
 );

 const renderMultiSelectCheckbox = (field: any, options: { value: string; label: string; icon?: React.ElementType }[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {options.map((item, index) => (
        <FormField key={item.value} control={form.control} name={field.name} render={({ field: controllerField }) => {
            const currentValue = Array.isArray(controllerField.value) ? controllerField.value : [];
            const isChecked = currentValue.includes(item.value);
            return (
               <ShadCnFormLabel
                  htmlFor={`checkbox-${field.name}-${item.value}`}
                  data-state={isChecked ? 'checked' : 'unchecked'}
                  className={cn(
                    "flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 p-3 transition-all cursor-pointer",
                    "animate-in fade-in zoom-in-95 min-h-[52px]",
                    isDark 
                      ? "border-[#3a3a3a] hover:bg-[#323232] data-[state=checked]:bg-blue-600/20 data-[state=checked]:border-blue-500/50 data-[state=checked]:shadow-sm"
                      : "border-input hover:bg-muted/30 data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary/50 data-[state=checked]:shadow-sm"
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
                    className="h-5 w-5 flex-shrink-0"
                  />
                </FormControl>
                 <span className={`font-medium text-sm flex items-center gap-2 flex-grow ${
                   isDark ? 'text-gray-300' : 'text-foreground'
                 }`}>
                    {item.icon && React.createElement(item.icon, { 
                      className: `h-4 w-4 flex-shrink-0 ${
                        isDark ? 'text-gray-400' : 'text-muted-foreground'
                      }` 
                    })}
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
      <div className={`min-h-screen flex items-center justify-center p-4 animate-fade-in transition-all duration-500 ${
        isDark 
          ? 'bg-[#0f0f0f]' 
          : 'bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl w-full"
        >
          <Card className={`backdrop-blur-xl border-0 rounded-3xl shadow-lg ${
            isDark 
              ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
              : 'bg-clayGlass shadow-clay'
          }`}>
            <CardHeader className="text-center p-6 sm:p-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4"
              >
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80' 
                    : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-clayInset'
                }`}>
                  <User className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <Skeleton className={`h-6 w-48 mx-auto mb-2 rounded-2xl ${
                isDark ? 'bg-[#3a3a3a]' : 'bg-white/30'
              }`} />
              <Skeleton className={`h-4 w-64 mx-auto rounded-2xl ${
                isDark ? 'bg-[#3a3a3a]' : 'bg-white/20'
              }`} />
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-8">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`space-y-6 p-6 border-0 rounded-3xl backdrop-blur-sm transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#252525] border border-[#3a3a3a]' 
                      : 'bg-white/30 shadow-clayInset'
                  }`}>
                  <Skeleton className={`h-5 w-1/3 rounded-2xl ${
                    isDark ? 'bg-[#3a3a3a]' : 'bg-white/40'
                  }`} />
                  <div className="space-y-4">
                    <Skeleton className={`h-12 w-full rounded-2xl ${
                      isDark ? 'bg-[#3a3a3a]' : 'bg-white/40'
                    }`} />
                    <Skeleton className={`h-12 w-full rounded-2xl ${
                      isDark ? 'bg-[#3a3a3a]' : 'bg-white/40'
                    }`} />
                    {i === 3 && <Skeleton className={`h-24 w-full rounded-2xl ${
                      isDark ? 'bg-[#3a3a3a]' : 'bg-white/40'
                    }`} />}
                  </div>
                </motion.div>
              ))}
            </CardContent>
            <CardFooter className="pt-6 pb-8 justify-center">
              <Skeleton className={`h-12 w-48 rounded-3xl ${
                isDark ? 'bg-[#3a3a3a]' : 'bg-white/40'
              }`} />
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 animate-fade-in transition-all duration-500 ${
        isDark 
          ? 'bg-[#0f0f0f]' 
          : 'bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`w-full max-w-md text-center border-0 backdrop-blur-xl rounded-3xl shadow-lg ${
            isDark 
              ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
              : 'bg-clayGlass shadow-clayStrong'
          }`}>
            <CardHeader className="p-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              </motion.div>
              <CardTitle className={`text-xl ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}>Profile Error</CardTitle>
              <CardDescription className={`text-base mt-2 ${
                isDark ? 'text-gray-400' : 'text-gray-700'
              }`}>{loadError}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pb-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={loadProfile} 
                  size="lg" 
                  className="gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl shadow-clay hover:shadow-clayStrong transition-all duration-300"
                >
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
          <Card className="bg-clayGlass backdrop-blur-xl p-8 rounded-3xl shadow-clayStrong text-center max-w-sm mx-4 border-0">
            <div className="flex justify-center items-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="h-16 w-16 rounded-full border-4 border-blue-300 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
              </motion.div>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-gray-800 mb-3"
            >
              Personalizing Your Targets...
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-600 leading-relaxed"
            >
              Bago AI is crafting your optimal daily goals. This might take a moment. Please wait.
            </motion.p>
          </Card>
        </motion.div>
      </motion.div>
    );
  }
  return (
    <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
      isDark 
        ? 'bg-[#0f0f0f]' 
        : 'bg-gradient-to-br from-clay-100 via-clayBlue to-clay-200'
    }`}>
      <div className="max-w-2xl mx-auto px-3 py-4 md:px-6 md:py-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="mb-6 md:mb-8 animate-slide-down">
          <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 p-6 text-center transition-all duration-500 ${
            isDark 
              ? 'bg-[#1a1a1a] border border-[#2a2a2a]' 
              : 'bg-clayGlass shadow-clay'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in shadow-lg ${
              isDark 
                ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80' 
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}>
              <User className="h-6 w-6 text-white" />
            </div>
            <h1 className={`text-xl md:text-2xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Complete Your Profile</h1>
            <p className={`text-sm md:text-base ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Customize your Bago experience</p>
          </div>
        </div>

        <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl animate-fade-in ${
          isDark 
            ? 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a]' 
            : 'bg-clayGlass shadow-clay hover:shadow-clayStrong'
        }`}>
          <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  const errorMessages = Object.entries(errors).map(([field, error]) => {
                    const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
                    return `${fieldName}: ${error?.message || 'Invalid value'}`;
                  });
                  
                  showErrorPopup(
                    "Form Validation Error", 
                    `Please fix the following errors:\n\n${errorMessages.join('\n')}`
                  );
                })} className="space-y-8">                  {/* Step 1: Basic Info */}
                  <div className="space-y-6 animate-stagger-in">
                    <div className={`backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 ${
                      isDark 
                        ? 'bg-[#252525] border border-[#3a3a3a]' 
                        : 'bg-white/40 shadow-clayInset'
                    }`}>
                      <div className={`flex items-center gap-3 pb-3 mb-4 border-b transition-all duration-300 ${
                        isDark 
                          ? 'border-[#3a3a3a]' 
                          : 'border-blue-200/50'
                      }`}>
                        <div className={`w-10 h-10 rounded-2xl text-white text-sm flex items-center justify-center font-medium shadow-lg ${
                          isDark 
                            ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80' 
                            : 'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          <User className="h-5 w-5" />
                        </div>
                        <h2 className={`text-lg font-semibold ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>Basic Information</h2>
                      </div>

                      <FormField control={form.control} name="displayName" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`flex items-center gap-2 text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                            <User className={`h-4 w-4 ${
                              isDark ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            Display Name *
                          </ShadCnFormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Choose a unique display name" 
                              {...field} 
                              value={field.value ?? ''} 
                              className={`h-11 text-base backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                                isDark 
                                  ? 'bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:bg-[#323232]' 
                                  : 'bg-white/60 shadow-clayInset focus:shadow-clay'
                              }`}
                            />
                          </FormControl>
                          <FormDescription className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Visible to others if you enable sharing. Letters, numbers, underscores only.
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      {/* Body Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField control={form.control} name="height" render={({ field }) => (
                          <FormItem>
                            <ShadCnFormLabel className={`flex items-center gap-2 text-sm font-medium ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              <Ruler className={`h-4 w-4 ${
                                isDark ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                              Height (cm) *
                            </ShadCnFormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="175" 
                                {...field} 
                                value={field.value ?? ''} 
                                className={`h-11 text-base backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                                  isDark 
                                    ? 'bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:bg-[#323232]' 
                                    : 'bg-white/60 shadow-clayInset focus:shadow-clay'
                                }`}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="weight" render={({ field }) => (
                          <FormItem>
                            <ShadCnFormLabel className={`flex items-center gap-2 text-sm font-medium ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              <Weight className={`h-4 w-4 ${
                                isDark ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                              Weight (kg) *
                            </ShadCnFormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="70" 
                                {...field} 
                                value={field.value ?? ''} 
                                className={`h-11 text-base backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                                  isDark 
                                    ? 'bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:bg-[#323232]' 
                                    : 'bg-white/60 shadow-clayInset focus:shadow-clay'
                                }`}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="age" render={({ field }) => (
                          <FormItem>
                            <ShadCnFormLabel className={`flex items-center gap-2 text-sm font-medium ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                              <Calendar className={`h-4 w-4 ${
                                isDark ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                              Age (years) *
                            </ShadCnFormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="25" 
                                {...field} 
                                value={field.value ?? ''} 
                                className={`h-11 text-base backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                                  isDark 
                                    ? 'bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:bg-[#323232]' 
                                    : 'bg-white/60 shadow-clayInset focus:shadow-clay'
                                }`}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Gender *</ShadCnFormLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {genderOptions.map((option) => (
                              <Button
                                key={option.value}
                                type="button"
                                variant={field.value === option.value ? "default" : "outline"}
                                className={cn(
                                  "h-12 text-sm font-medium rounded-2xl border-0 transition-all duration-300",
                                  field.value === option.value 
                                    ? isDark
                                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl" 
                                      : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-clay hover:shadow-clayStrong"
                                    : isDark
                                      ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#323232] border border-[#3a3a3a]"
                                      : "bg-white/60 backdrop-blur-sm shadow-clayInset text-gray-700 hover:bg-white/80 hover:shadow-clay"
                                )}
                                onClick={() => field.onChange(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />                    </div>
                  </div>

                    {/* Step 2: Goals & Activity */}
                    <div className="space-y-6 animate-stagger-in">
                      <div className={`backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 ${
                        isDark 
                          ? 'bg-[#252525] border border-[#3a3a3a]' 
                          : 'bg-white/40 shadow-clayInset'
                      }`}>
                        <div className={`flex items-center gap-3 pb-3 mb-4 border-b transition-all duration-300 ${
                          isDark 
                            ? 'border-[#3a3a3a]' 
                            : 'border-blue-200/50'
                        }`}>
                          <div className={`w-10 h-10 rounded-2xl text-white text-sm flex items-center justify-center font-medium shadow-lg ${
                            isDark 
                              ? 'bg-gradient-to-br from-purple-600/80 to-purple-700/80' 
                              : 'bg-gradient-to-br from-purple-400 to-purple-600'
                          }`}>
                            <TargetIcon className="h-5 w-5" />
                          </div>
                          <h2 className={`text-lg font-semibold ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Your Goals & Activity</h2>
                        </div>

                      <FormField control={form.control} name="fitnessGoal" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>What's your main goal? *</ShadCnFormLabel>
                          {renderChips(field, goalOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="activityLevel" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>How active are you? *</ShadCnFormLabel>
                          {renderChips(field, activityOptions)}
                          {field.value && (
                            <p className={`text-xs mt-2 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {activityOptions.find(opt => opt.value === field.value)?.description}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="preferFewerRestDays" render={({ field }) => (
                        <FormItem className={`flex items-center justify-between p-4 border-0 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                          isDark 
                            ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                            : 'bg-white/40 shadow-clayInset'
                        }`}>
                          <div>
                            <ShadCnFormLabel className={`text-sm font-medium ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>Prefer intense workouts?</ShadCnFormLabel>
                            <FormDescription className={`text-xs mt-1 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Fewer rest days, more challenging routines
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value ?? false} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>                        </FormItem>
                      )} />
                      </div>
                    </div>

                    {/* Step 3: Preferences & Targets */}
                    <div className="space-y-6 animate-stagger-in">
                      <div className={`backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 ${
                        isDark 
                          ? 'bg-[#252525] border border-[#3a3a3a]' 
                          : 'bg-white/40 shadow-clayInset'
                      }`}>
                        <div className={`flex items-center gap-3 pb-3 mb-4 border-b transition-all duration-300 ${
                          isDark 
                            ? 'border-[#3a3a3a]' 
                            : 'border-blue-200/50'
                        }`}>
                          <div className={`w-10 h-10 rounded-2xl text-white text-sm flex items-center justify-center font-medium shadow-lg ${
                            isDark 
                              ? 'bg-gradient-to-br from-green-600/80 to-green-700/80' 
                              : 'bg-gradient-to-br from-green-400 to-green-600'
                          }`}>
                            <Utensils className="h-5 w-5" />
                          </div>
                          <h2 className={`text-lg font-semibold ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Preferences & Targets</h2>
                        </div>

                      {/* Quick Dietary Preferences */}
                      <FormField control={form.control} name="dietaryStyles" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Diet Type (Optional)</ShadCnFormLabel>
                          {renderMultiSelectCheckbox(field, dietaryStyleOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="allergies" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Food Allergies (Optional)</ShadCnFormLabel>
                          {renderMultiSelectCheckbox(field, allergyOptions)}
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Simplified food preferences in one field */}
                      <FormField control={form.control} name="foodPreferences" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Food Notes (Optional)</ShadCnFormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any food preferences, dislikes, or special requirements..." 
                              className={`resize-none text-sm min-h-[80px] backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                                isDark 
                                  ? 'bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:bg-[#323232]' 
                                  : 'bg-white/60 shadow-clayInset focus:shadow-clay'
                              }`}
                              {...field} 
                              value={field.value ?? ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Language Preference */}
                      <FormField control={form.control} name="translatePreference" render={({ field }) => (
                        <FormItem>
                          <ShadCnFormLabel className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>Language</ShadCnFormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || 'en'}>
                              <SelectTrigger className={`h-11 backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                                isDark 
                                  ? 'bg-[#2a2a2a] text-white border border-[#3a3a3a] focus:bg-[#323232]' 
                                  : 'bg-white/60 shadow-clayInset focus:shadow-clay'
                              }`}>
                                <SelectValue placeholder="Select language..." />
                              </SelectTrigger>
                              <SelectContent className={`backdrop-blur-sm border-0 rounded-2xl shadow-lg ${
                                isDark 
                                  ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                  : 'bg-clayGlass shadow-clayStrong'
                              }`}>
                                {translatePreferenceOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value} className={`rounded-xl ${
                                    isDark 
                                      ? 'text-gray-300 hover:bg-[#323232] focus:bg-[#323232]' 
                                      : 'hover:bg-white/80 focus:bg-white/80'
                                  }`}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Target Settings - Simplified */}
                    <div className={`space-y-6 p-4 border-0 rounded-3xl backdrop-blur-sm animate-stagger-in transition-all duration-300 ${
                      isDark 
                        ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-[#3a3a3a]' 
                        : 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 shadow-clayInset'
                    }`}>
                      <div className="text-center">
                        <h3 className={`text-lg font-semibold mb-2 ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>How should we set your daily targets?</h3>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>Choose how to calculate your nutrition goals</p>
                      </div>

                      <FormField control={form.control} name="useAiTargets" render={({ field }) => (
                        <FormItem className="space-y-4">
                          {/* AI Targets Option */}
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "relative p-4 border-0 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm",
                              field.value 
                                ? isDark
                                  ? "bg-[#2a2a2a] shadow-lg ring-2 ring-blue-500/50 border border-blue-500/30" 
                                  : "bg-white/80 shadow-clay ring-2 ring-blue-500/50"
                                : isDark
                                  ? "bg-[#252525] hover:bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#4a4a4a]"
                                  : "bg-white/40 hover:bg-white/60 hover:shadow-clay shadow-clayInset"
                            )}
                            onClick={() => field.onChange(true)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                                field.value 
                                  ? isDark 
                                    ? "border-blue-400 bg-blue-400" 
                                    : "border-blue-500 bg-blue-500"
                                  : isDark 
                                    ? "border-gray-500" 
                                    : "border-gray-400"
                              )}>
                                {field.value && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-yellow-500" />
                                  <ShadCnFormLabel className={`text-sm sm:text-base font-semibold cursor-pointer ${
                                    isDark ? 'text-white' : 'text-gray-800'
                                  }`}>
                                    Smart AI Targets (Recommended)
                                  </ShadCnFormLabel>
                                </div>
                                <FormDescription className={`text-xs sm:text-sm leading-relaxed ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Let our AI automatically calculate your perfect daily nutrition goals based on your body stats, 
                                  fitness goals, and activity level. This uses proven BMR/TDEE formulas for accuracy.
                                </FormDescription>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    isDark 
                                      ? 'bg-green-900/50 text-green-300 border border-green-700/50' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    ✓ Personalized
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    isDark 
                                      ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    ✓ Science-based
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    isDark 
                                      ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    ✓ Auto-updated
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Manual Targets Option */}
                          <motion.div
                            whileTap={{ scale: userHasProAccess ? 0.98 : 1 }}
                            className={cn(
                              "relative p-4 border-0 rounded-2xl transition-all duration-300 backdrop-blur-sm",
                              !userHasProAccess 
                                ? "opacity-60 cursor-not-allowed"
                                : !field.value 
                                  ? "cursor-pointer"
                                  : "cursor-pointer",
                              !field.value 
                                ? isDark
                                  ? "bg-[#2a2a2a] shadow-lg ring-2 ring-orange-500/50 border border-orange-500/30" 
                                  : "bg-white/80 shadow-clay ring-2 ring-orange-500/50"
                                : isDark
                                  ? "bg-[#252525] hover:bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#4a4a4a]"
                                  : "bg-white/40 hover:bg-white/60 hover:shadow-clay shadow-clayInset"
                            )}
                            onClick={() => {
                              if (!userHasProAccess) {
                                toast({
                                  title: "Upgrade to Pro",
                                  description: "Manual Target (Advanced) is available for Pro members only.",
                                  variant: "default",
                                });
                                return;
                              }
                              field.onChange(false);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                                !userHasProAccess
                                  ? "border-gray-400 bg-gray-200"
                                  : !field.value 
                                    ? isDark 
                                      ? "border-orange-400 bg-orange-400" 
                                      : "border-orange-500 bg-orange-500"
                                    : isDark 
                                      ? "border-gray-500" 
                                      : "border-gray-400"
                              )}>
                                {!field.value && userHasProAccess && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Settings className={cn(
                                      "h-4 w-4",
                                      userHasProAccess ? "text-orange-500" : "text-gray-400"
                                    )} />
                                    <ShadCnFormLabel className={cn(
                                      "text-sm sm:text-base font-semibold cursor-pointer",
                                      userHasProAccess 
                                        ? isDark ? 'text-white' : 'text-gray-800'
                                        : 'text-gray-500'
                                    )}>
                                      Manual Targets (Advanced)
                                    </ShadCnFormLabel>
                                  </div>
                                  {!userHasProAccess && (
                                    <span className={cn(
                                      "px-2 py-1 text-xs rounded-full font-medium",
                                      isDark 
                                        ? 'bg-gradient-to-r from-purple-900/80 to-blue-900/80 text-purple-200 border border-purple-700/50' 
                                        : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200'
                                    )}>
                                      <Star className="h-3 w-3 inline mr-1" />
                                      Pro
                                    </span>
                                  )}
                                </div>
                                <FormDescription className={cn(
                                  "text-xs sm:text-sm leading-relaxed",
                                  userHasProAccess 
                                    ? isDark ? 'text-gray-400' : 'text-gray-600'
                                    : 'text-gray-500'
                                )}>
                                  {userHasProAccess 
                                    ? "Set your own daily nutrition targets if you have specific requirements from a nutritionist, dietitian, or personal experience. You'll need to enter calories, protein, carbs, and fat manually."
                                    : "Unlock manual nutrition targets with Pro. Set custom calories, protein, carbs, and fat based on your specific requirements."
                                  }
                                </FormDescription>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className={cn(
                                    "px-2 py-1 text-xs rounded-full",
                                    userHasProAccess
                                      ? isDark 
                                        ? 'bg-orange-900/50 text-orange-300 border border-orange-700/50' 
                                        : 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-200 text-gray-500'
                                  )}>
                                    ⚙️ Full control
                                  </span>
                                  <span className={cn(
                                    "px-2 py-1 text-xs rounded-full",
                                    userHasProAccess
                                      ? isDark 
                                        ? 'bg-gray-800/50 text-gray-300 border border-gray-600/50' 
                                        : 'bg-gray-100 text-gray-800'
                                      : 'bg-gray-200 text-gray-500'
                                  )}>
                                    📊 Custom values
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </FormItem>
                      )} />

                      <AnimatePresence mode="wait">
                        {!useAiTargets && userHasProAccess && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 mt-4 p-4 bg-white/60 backdrop-blur-sm border-0 rounded-2xl shadow-clayInset"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Settings className="h-4 w-4 text-orange-600" />
                              <h3 className="text-sm font-semibold text-orange-800">
                                Enter Your Custom Targets
                              </h3>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-orange-700 leading-relaxed mb-4">
                              Fill in your daily nutrition targets. All fields marked with * are required.
                            </p>

                            {/* Main Macros Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <FormField control={form.control} name="manualTargetCalories" render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <ShadCnFormLabel className="flex items-center gap-1 text-xs font-medium text-gray-800">
                                    <Flame className="h-3 w-3 text-red-500" />
                                    Calories *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="2000" 
                                      {...field} 
                                      value={field.value ?? ''} 
                                      className="h-10 text-sm bg-white/80 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl focus:shadow-clay transition-all duration-300"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name="manualTargetProtein" render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <ShadCnFormLabel className="flex items-center gap-1 text-xs font-medium text-gray-800">
                                    <Dumbbell className="h-3 w-3 text-blue-500" />
                                    Protein *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="150g" 
                                      {...field} 
                                      value={field.value ?? ''} 
                                      className="h-10 text-sm bg-white/80 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl focus:shadow-clay transition-all duration-300"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name="manualTargetCarbs" render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <ShadCnFormLabel className="flex items-center gap-1 text-xs font-medium text-gray-800">
                                    <Activity className="h-3 w-3 text-green-500" />
                                    Carbs *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="200g" 
                                      {...field} 
                                      value={field.value ?? ''} 
                                      className="h-10 text-sm bg-white/80 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl focus:shadow-clay transition-all duration-300"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )} />

                              <FormField control={form.control} name="manualTargetFat" render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <ShadCnFormLabel className="flex items-center gap-1 text-xs font-medium text-gray-800">
                                    <Droplet className="h-3 w-3 text-yellow-500" />
                                    Fat *
                                  </ShadCnFormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="70g" 
                                      {...field} 
                                      value={field.value ?? ''} 
                                      className="h-10 text-sm bg-white/80 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl focus:shadow-clay transition-all duration-300"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )} />
                            </div>

                            {/* Activity Calories - Full width */}
                            <FormField control={form.control} name="manualTargetActivityCalories" render={({ field }) => (
                              <FormItem className="space-y-2">
                                <ShadCnFormLabel className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                  <Target className="h-4 w-4 text-purple-500" />
                                  Exercise Target (Optional)
                                </ShadCnFormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="e.g., 300 calories from exercise" 
                                    {...field} 
                                    value={field.value ?? ''} 
                                    className="h-10 text-sm bg-white/80 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl focus:shadow-clay transition-all duration-300"
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-600">
                                  How many calories you aim to burn from dedicated exercise daily
                                </FormDescription>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />

                            {/* Help text */}
                            <div className="mt-4 p-3 bg-blue-50/80 backdrop-blur-sm border-0 rounded-2xl shadow-clayInset">
                              <p className="text-xs text-blue-700 leading-relaxed">
                                💡 <strong>Need help?</strong> Consult with a nutritionist or use online calculators to determine your ideal targets. 
                                You can always switch back to AI targets later.
                              </p>
                            </div>
                          </motion.div>
                        )}
                        {!useAiTargets && !userHasProAccess && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "space-y-4 mt-4 p-6 border-0 rounded-2xl backdrop-blur-sm",
                              isDark 
                                ? "bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700/30" 
                                : "bg-gradient-to-br from-purple-50/80 to-blue-50/80 shadow-clayInset"
                            )}
                          >
                            <div className="text-center space-y-3">
                              <div className={cn(
                                "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
                                isDark 
                                  ? "bg-gradient-to-br from-purple-600 to-blue-600" 
                                  : "bg-gradient-to-br from-purple-500 to-blue-500"
                              )}>
                                <Star className="h-6 w-6 text-white" />
                              </div>
                              <div className="space-y-2">
                                <h3 className={cn(
                                  "text-lg font-semibold",
                                  isDark ? "text-white" : "text-gray-900"
                                )}>
                                  Upgrade to Pro
                                </h3>
                                <p className={cn(
                                  "text-sm leading-relaxed",
                                  isDark ? "text-purple-200" : "text-purple-700"
                                )}>
                                  Manual nutrition targets are available for Pro members. 
                                  Set custom calories, protein, carbs, and fat based on your specific requirements.
                                </p>
                              </div>
                              <div className="flex flex-wrap justify-center gap-2 mt-4">
                                <span className={cn(
                                  "px-3 py-1 text-xs rounded-full font-medium",
                                  isDark 
                                    ? 'bg-purple-800/50 text-purple-200 border border-purple-600/50' 
                                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                                )}>
                                  ⚙️ Full Control
                                </span>
                                <span className={cn(
                                  "px-3 py-1 text-xs rounded-full font-medium",
                                  isDark 
                                    ? 'bg-blue-800/50 text-blue-200 border border-blue-600/50' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                )}>
                                  📊 Custom Values
                                </span>
                              </div>
                              <Button
                                type="button"
                                onClick={() => router.push('/subscription')}
                                className={cn(
                                  "mt-4 px-6 py-2 rounded-2xl font-medium transition-all duration-300",
                                  "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                                  "text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                )}
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Upgrade Now
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
                    </div>

                    {/* Simple Weight Reminder */}
                    <div className="p-4 border-0 rounded-2xl bg-white/40 backdrop-blur-sm shadow-clayInset animate-stagger-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <ShadCnFormLabel className="text-sm font-medium flex items-center gap-2 text-gray-800">
                            <Bell className="h-4 w-4 text-blue-600" />
                            Weekly Weight Reminders
                          </ShadCnFormLabel>
                          <FormDescription className="text-xs text-gray-600 mt-1">
                            Get notified every Sunday to update your weight
                          </FormDescription>
                        </div>
                        <Switch 
                          checked={reminderEnabled} 
                          onCheckedChange={handleReminderChange}
                          disabled={weightReminder.isLoading}
                        />
                      </div>

                      {/* Simple notification info when enabled */}
                      {reminderEnabled && (
                        <div className="mt-4 pt-4 border-t border-blue-200/30">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600">
                              📅 Every Sunday at 10:00 AM
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleTestNotification}                              className="text-xs h-8 bg-white/60 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl hover:bg-white/80 hover:shadow-clay transition-all duration-300"
                            >
                              <TestTube className="h-3 w-3 mr-1" />
                              Test
                            </Button>
                          </div>                        </div>
                      )}
                    </div>

                  {/* Submit Button */}
                  <div className="pt-8 animate-fade-in">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl shadow-clay hover:shadow-clayStrong transition-all duration-300 hover:scale-[1.02]" 
                      disabled={isSaving || isProcessingAiTargets}
                    >
                      {(isSaving && !isProcessingAiTargets) && (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      )}
                      {isProcessingAiTargets && (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Calculating Targets...
                        </>
                      )}
                      {!isSaving && !isProcessingAiTargets && (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Complete Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

      {/* Error Popup Dialog */}
      <AlertDialog open={errorPopup.show} onOpenChange={(open) => setErrorPopup(prev => ({ ...prev, show: open }))}>
        <AlertDialogContent className="bg-clayGlass backdrop-blur-xl border-0 shadow-clayStrong mx-4 max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {errorPopup.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 whitespace-pre-line">
              {errorPopup.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setErrorPopup(prev => ({ ...prev, show: false }))}
              className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl shadow-clay hover:shadow-clayStrong transition-all duration-300"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
