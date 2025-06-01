// src/app/log/page.tsx
"use client";

import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Camera, Mic, Type, Loader2, CheckCircle, AlertCircle, Upload, Trash2, Send, PlusCircle, ListRestart, Utensils, Pause, Play, Sparkles, BrainCircuit, Info, Scale, Bot, X } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { foodImageRecognition, FoodImageRecognitionInput, FoodImageRecognitionOutput } from '@/ai/flows/food-image-recognition';
import { voiceFoodLogging, VoiceFoodLoggingInput, VoiceFoodLoggingOutput } from '@/ai/flows/voice-food-logging';
import { estimateNutritionFromText, EstimateNutritionInput, EstimateNutritionOutput } from '@/ai/flows/estimate-nutrition-from-text';
import { identifyFoodFromText, IdentifyFoodInput, IdentifyFoodOutput } from '@/ai/flows/identify-food-from-text';
import { suggestFoodItems, SuggestFoodItemsInput, SuggestionItem } from '@/ai/flows/suggest-food-items'; 
import Image from 'next/image';
import { Nutrition } from '@/services/nutrition';
import { cn } from "@/lib/utils";
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import { useAuth } from '@/context/AuthContext'; 
import { addFoodLog } from '@/services/firestore'; 
import type { FirestoreFoodLogData } from '@/app/dashboard/types'; 

interface ProcessedFoodResult extends Nutrition {
  id: string;
  originalDescription?: string;
  identifiedFoodName: string;
  source: 'image' | 'voice' | 'manual';
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function LogFoodPage() {
  const { toast } = useToast();
  const { user, userId, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false); 
  const [pendingResults, setPendingResults] = useState<ProcessedFoodResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<SuggestionItem[]>([]); 
  const [suggestionError, setSuggestionError] = useState<string | null>(null); 

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetInputState = useCallback((tabToKeep?: string) => {
      setError(null);
      setIsLoading(false);
      setIsIdentifying(false);

      if (tabToKeep !== 'image') {
          setImagePreview(null);
          setImageFile(null);
          if (imageInputRef.current) imageInputRef.current.value = "";
      }
      if (tabToKeep !== 'voice') {
          setIsRecording(false);
          setAudioPreviewUrl(null);
          setAudioBlob(null);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
          }
          if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
          }
           setRecordingTime(0);
      }
      if (tabToKeep !== 'manual') {
          setManualInput("");
      }
  }, []);

  useEffect(() => {
      if (activeTab !== 'manual') {
        setAiSuggestions([]);
        setSuggestionError(null);
        setIsSuggesting(false);
      }
      resetInputState(activeTab);
  }, [activeTab, resetInputState]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => { 
    imageInputRef.current?.click(); 
  };

  const handleImageSubmit = async () => {
      if (!imagePreview) { 
        setError("Please select an image first."); 
        return; 
      }
      setIsLoading(true); 
      setError(null);
      
      try {
          const input: FoodImageRecognitionInput = { photoDataUri: imagePreview };
          const output: FoodImageRecognitionOutput = await foodImageRecognition(input);
          
          if (!output.foodItems || output.foodItems.length === 0) {
              setError("AI could not identify any food items in the image.");
              toast({ 
                title: "No Items Found", 
                description: "Try a clearer image or manual input.", 
                variant: "destructive" 
              });
              setIsLoading(false); 
              return;
          }
          
          const processedResults: ProcessedFoodResult[] = output.foodItems.map((item, index) => ({
            id: `img-${Date.now()}-${index}`, 
            identifiedFoodName: item.foodItem,
            calories: item.nutrition.calories, 
            protein: item.nutrition.protein,
            carbohydrates: item.nutrition.carbohydrates, 
            fat: item.nutrition.fat, 
            source: 'image',
          }));
          
          setPendingResults(prev => [...prev, ...processedResults].sort((a,b) => b.calories - a.calories));
          toast({ 
            title: "Image Processed", 
            description: `${processedResults.length} item(s) added for review.` 
          });
          resetInputState('image');
      } catch (err: any) {
          console.error("Image recognition error:", err); 
          setError(`Image processing failed: ${err.message}.`);
          toast({ 
            title: "Error", 
            description: "Could not process the image.", 
            variant: "destructive" 
          });
      } finally { 
        setIsLoading(false); 
      }
  };

   const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => { 
          audioChunksRef.current.push(event.data); 
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            setAudioBlob(blob); 
            const url = URL.createObjectURL(blob); 
            setAudioPreviewUrl(url);
            stream.getTracks().forEach(track => track.stop());
            if (recordingIntervalRef.current) { 
              clearInterval(recordingIntervalRef.current); 
              recordingIntervalRef.current = null; 
            }
        };
        
        mediaRecorderRef.current.start(); 
        setIsRecording(true); 
        setError(null); 
        setAudioPreviewUrl(null); 
        setAudioBlob(null);
        setRecordingTime(0);
        
        recordingIntervalRef.current = setInterval(() => { 
          setRecordingTime(prevTime => prevTime + 1); 
        }, 1000);
    } catch (err) {
        console.error("Error accessing microphone:", err); 
        setError("Could not access microphone. Check permissions.");
        toast({ 
          title: "Microphone Error", 
          description: "Please check your microphone permissions.", 
          variant: "destructive"
        });
        if (recordingIntervalRef.current) { 
          clearInterval(recordingIntervalRef.current); 
          recordingIntervalRef.current = null; 
        }
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) { 
        mediaRecorderRef.current.stop(); 
        setIsRecording(false); 
      }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60); 
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleVoiceSubmit = async () => {
      if (!audioBlob) { 
        setError("Please record your meal description first."); 
        return; 
      }
      setIsLoading(true); 
      setError(null);
      
      const reader = new FileReader(); 
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
              const input: VoiceFoodLoggingInput = { voiceRecordingDataUri: base64Audio };
              const output: VoiceFoodLoggingOutput = await voiceFoodLogging(input);
              
              if (!output.foodItems || output.foodItems.length === 0) {
                  setError("AI could not identify any food items from the recording.");
                  toast({ 
                    title: "No Items Found", 
                    description: "Try speaking clearly or use manual input.", 
                    variant: "destructive" 
                  });
                  setIsLoading(false); 
                  return;
              }
              
              const processedResults: ProcessedFoodResult[] = output.foodItems.map((item, index) => ({
                id: `voice-${Date.now()}-${index}`, 
                identifiedFoodName: item.foodItem, 
                ...item.nutrition, 
                source: 'voice',
              }));
              
              setPendingResults(prev => [...prev, ...processedResults].sort((a,b) => b.calories - a.calories));
              toast({ 
                title: "Voice Log Processed", 
                description: `${processedResults.length} item(s) added for review.` 
              });
              resetInputState('voice');
          } catch (err: any) {
              console.error("Voice logging error:", err); 
              setError(`Voice processing failed: ${err.message}.`);
              toast({ 
                title: "Error", 
                description: "Could not process voice input.", 
                variant: "destructive" 
              });
          } finally { 
            setIsLoading(false); 
          }
      }
      
      reader.onerror = (error) => {
          console.error("Error converting blob:", error); 
          setError("Failed to prepare audio data."); 
          setIsLoading(false);
          toast({ 
            title: "Error", 
            description: "Failed preparing audio.", 
            variant: "destructive" 
          });
      }
  };

  const handleManualSubmit = async () => {
      const description = manualInput.trim();
      if (!description) { 
        setError("Please enter your meal description."); 
        return; 
      }
      setIsLoading(true); 
      setIsIdentifying(true); 
      setError(null);
      
      try {
          const identificationInput: IdentifyFoodInput = { foodDescription: description };
          const identificationOutput: IdentifyFoodOutput = await identifyFoodFromText(identificationInput);
          const identifiedName = identificationOutput.identifiedFoodName;
          
          toast({ 
            title: "Food Identified", 
            description: `"${identifiedName}"`
          });
          setIsIdentifying(false);
          
          const nutritionInput: EstimateNutritionInput = { foodDescription: description };
          const nutritionEstimate: EstimateNutritionOutput = await estimateNutritionFromText(nutritionInput);
          
          const processedResult: ProcessedFoodResult = {
              id: `manual-${Date.now()}-0`, 
              identifiedFoodName: identifiedName,
              originalDescription: description, 
              ...nutritionEstimate, 
              source: 'manual',
          };
          
          setPendingResults(prev => [...prev, processedResult].sort((a,b) => b.calories - a.calories));
          setManualInput("");
          toast({ 
            title: "Nutrition Estimated", 
            description: `Added "${identifiedName}" for review.` 
          });
      } catch (err: any) {
          console.error("Manual logging AI error:", err); 
          setError(`Processing failed: ${err.message}.`);
          toast({ 
            title: "Processing Error", 
            description: `Could not process: ${err.message}`, 
            variant: "destructive" 
          });
      } finally { 
        setIsLoading(false); 
        setIsIdentifying(false); 
      }
  };

  const fetchSuggestions = useCallback(async () => {
      if (!userId) {
          console.warn("[Log Page] Cannot fetch suggestions: User not authenticated.");
          setSuggestionError("User not authenticated. Cannot fetch suggestions.");
          return;
      }
      
      console.log("[Log Page] Fetching AI suggestions for user:", userId);
      setIsSuggesting(true);
      setSuggestionError(null);
      
      try {
          const input: SuggestFoodItemsInput = { userId };
          const result = await suggestFoodItems(input); 
          setAiSuggestions(result.suggestions);
          console.log("[Log Page] AI suggestions fetched:", result.suggestions);
      } catch (err: any) {
          console.error("AI suggestion error:", err);
          setSuggestionError("Could not load suggestions.");
          setAiSuggestions([]); 
      } finally {
          setIsSuggesting(false);
      }
  }, [userId]);

  useEffect(() => {
      if (activeTab === 'manual' && aiSuggestions.length === 0 && !isSuggesting && userId) {
          fetchSuggestions();
      }
  }, [activeTab, aiSuggestions.length, isSuggesting, fetchSuggestions, userId]);

  const removeItem = (id: string) => {
    setPendingResults(currentResults => currentResults.filter(item => item.id !== id));
  };

  const clearAllPending = () => {
    setPendingResults([]); 
    setError(null); 
    resetInputState();
    toast({
      title: "Cleared", 
      description: "All pending items removed."
    });
  }

  const confirmAndLogFood = async () => {
    if (pendingResults.length === 0) {
      toast({ 
        title: "Nothing to log", 
        description: "Add some food items first.", 
        variant: "destructive"
      });
      return;
    }
    
    if (!userId) {
        toast({ 
          title: "Authentication Error", 
          description: "Please log in to save your food log.", 
          variant: "destructive"
        });
        return;
    }
    
    console.log("Logging confirmed via Firestore Service:", pendingResults, "for user:", userId);
    setIsLoading(true);
    
    try {
        const logPromises = pendingResults.map(item => {
            const logData: FirestoreFoodLogData = {
              foodItem: item.identifiedFoodName, 
              calories: Math.round(item.calories),
              protein: parseFloat(item.protein.toFixed(1)),
              carbohydrates: parseFloat(item.carbohydrates.toFixed(1)),
              fat: parseFloat(item.fat.toFixed(1)),
              timestamp: new Date().toISOString(),
              logMethod: item.source,
              ...(item.originalDescription && { originalDescription: item.originalDescription })
            };
            return addFoodLog(userId, logData);
        });
        
        await Promise.all(logPromises);
        
        toast({
            title: "Success!",
            description: `${pendingResults.length} item(s) logged successfully.`,
            variant: "default",
        });
        
        setPendingResults([]);
        setError(null);
        resetInputState();
    } catch (e) {
        console.error("Error saving food logs via service:", e);
        toast({ 
          title: "Save Error", 
          description: "Could not save to database. Please try again.", 
          variant: "destructive"
        });
    } finally { 
      setIsLoading(false); 
    }
  };

  if (authLoading) {
       return (
         <div className="flex justify-center items-center min-h-screen">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
           >
             <Loader2 className="h-8 w-8 animate-spin text-primary"/>
           </motion.div>
         </div>
       );
   }
   
   if (!userId && !authLoading) {
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center p-10"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access the food logging page.</p>
          </motion.div>
        );
   }

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.03, scale: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.02, scale: 1 }}
            transition={{ duration: 2, delay: 0.8 }}
            className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-6 md:py-12 max-w-4xl">
          <motion.div variants={itemVariants}>
            {/* Header Section */}
            <div className="text-center mb-8 md:mb-12">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-3 mb-4"
              >
                <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                  <Utensils className="h-8 w-8 text-primary-foreground"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Log Your Meal
                </h1>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Capture your meals using text, photos, or voice recording. 
                <br className="hidden md:block"/>
                Our AI will identify foods and estimate nutrition for you.
              </motion.p>
            </div>

            {/* Main Card */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl relative overflow-hidden">
                {/* Card gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card to-accent/5 pointer-events-none" />
                
                <CardHeader className="relative bg-gradient-to-r from-primary/10 via-card to-card border-b border-border/50 p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                         <Bot className="h-7 w-7 text-primary"/> AI-Powered Food Logging
                      </CardTitle>
                      <CardDescription className="text-base mt-2 text-muted-foreground max-w-2xl">
                        Choose your preferred input method below. Review AI estimations before confirming your log.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative p-6 md:p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Enhanced Tab Navigation */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/60 h-14 p-1 shadow-inner backdrop-blur-sm border border-border/30">
                        <TabsTrigger 
                          value="manual" 
                          className="flex items-center gap-2 py-3 text-sm md:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-md group"
                        >
                          <Type className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:animate-pulse"/>
                          <span className="hidden sm:inline">Manual Text</span>
                          <span className="sm:hidden">Text</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="image" 
                          className="flex items-center gap-2 py-3 text-sm md:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-md group"
                        >
                          <Camera className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:animate-pulse"/>
                          <span className="hidden sm:inline">Photo Upload</span>
                          <span className="sm:hidden">Photo</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="voice" 
                          className="flex items-center gap-2 py-3 text-sm md:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-md group"
                        >
                          <Mic className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:animate-pulse"/>
                          <span className="hidden sm:inline">Voice Record</span>
                          <span className="sm:hidden">Voice</span>
                        </TabsTrigger>
                      </TabsList>
                    </motion.div>

                    {/* Manual Text Input Tab */}
                    <TabsContent value="manual" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <Label htmlFor="manual-food" className="text-lg font-semibold flex items-center gap-2">
                          <Type className="h-5 w-5 text-primary"/>
                          Describe Your Meal
                        </Label>
                        <Textarea 
                          id="manual-food" 
                          placeholder="E.g., 'Large bowl of oatmeal with fresh berries and almonds', 'Grilled chicken breast with quinoa and steamed broccoli'"
                          value={manualInput} 
                          onChange={(e) => setManualInput(e.target.value)} 
                          className="min-h-[140px] text-base p-4 bg-background/90 border-2 border-border hover:border-primary/30 focus:border-primary transition-all duration-300 rounded-xl shadow-sm resize-none" 
                          disabled={isLoading} 
                          rows={5}
                        />
                        
                        {/* AI Suggestions Section */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/30"
                        >
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary"/> 
                            AI Suggestions
                            {isSuggesting && <Loader2 className="h-4 w-4 animate-spin text-primary"/>}
                          </Label>
                          
                          {isSuggesting ? (
                            <div className="flex flex-wrap gap-2">
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3, delay: i * 0.1 }}
                                >
                                  <Skeleton className="h-10 w-24 rounded-lg bg-muted/50" />
                                </motion.div>
                              ))}
                            </div>
                          ) : suggestionError ? (
                            <p className="text-sm text-destructive">{suggestionError}</p>
                          ) : aiSuggestions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {aiSuggestions.map((suggestion, index) => (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-sm rounded-xl border-dashed border-2 hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-300 shadow-sm"
                                        onClick={() => {
                                          const textToSet = suggestion.quantity
                                            ? `${suggestion.suggestionName} (${suggestion.quantity})`
                                            : suggestion.suggestionName;
                                          setManualInput(textToSet);
                                        }}
                                      >
                                        <PlusCircle className="h-3 w-3 mr-1"/>
                                        {suggestion.suggestionName}
                                      </Button>
                                    </motion.div>
                                  </TooltipTrigger>
                                  <TooltipContent className="p-4 max-w-xs bg-popover text-popover-foreground border shadow-xl rounded-xl">
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-base">{suggestion.suggestionName}</h4>
                                      <p className="text-sm text-muted-foreground italic">{suggestion.reason}</p>
                                      {suggestion.quantity && (
                                        <p className="text-sm flex items-center gap-2">
                                          <Scale className="h-4 w-4" /> 
                                          <span className="font-medium">Quantity: {suggestion.quantity}</span>
                                        </p>
                                      )}
                                      <Separator className="my-3" />
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span>Calories:</span><span className="font-medium">{suggestion.estimatedNutrition.calories.toFixed(0)} kcal</span>
                                        <span>Protein:</span><span className="font-medium">{suggestion.estimatedNutrition.protein.toFixed(1)} g</span>
                                        <span>Carbs:</span><span className="font-medium">{suggestion.estimatedNutrition.carbohydrates.toFixed(1)} g</span>
                                        <span>Fat:</span><span className="font-medium">{suggestion.estimatedNutrition.fat.toFixed(1)} g</span>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No suggestions available currently.</p>
                          )}
                        </motion.div>

                        <Button 
                          onClick={handleManualSubmit} 
                          disabled={!manualInput.trim() || isLoading} 
                          className="w-full text-lg py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl transform hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold"
                        >
                          {isLoading && isIdentifying && (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> 
                              Identifying Food...
                            </>
                          )}
                          {isLoading && !isIdentifying && (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> 
                              Estimating Nutrition...
                            </>
                          )}
                          {!isLoading && (
                            <>
                              <Send className="mr-3 h-5 w-5"/> 
                              Analyze & Add to Review
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </TabsContent>

                    {/* Image Upload Tab */}
                    <TabsContent value="image" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <Label className="text-lg font-semibold flex items-center gap-2">
                          <Camera className="h-5 w-5 text-primary"/>
                          Upload Meal Photo
                        </Label>
                        
                        <div 
                          className="relative border-2 border-dashed border-muted rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-gradient-to-br from-muted/20 via-background to-muted/30 hover:border-primary transition-all duration-300 group cursor-pointer overflow-hidden"
                          onClick={triggerImageUpload}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <Input 
                            ref={imageInputRef} 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange} 
                          />
                          
                          {imagePreview ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="relative group-hover:scale-105 transition-transform duration-300"
                            >
                              <Image 
                                src={imagePreview} 
                                alt="Meal preview" 
                                width={300} 
                                height={300} 
                                className="max-h-48 w-auto rounded-xl object-contain shadow-xl border-2 border-border/30" 
                              />
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setImagePreview(null); 
                                  setImageFile(null); 
                                  if (imageInputRef.current) imageInputRef.current.value = ""; 
                                }}
                              > 
                                <X className="h-4 w-4"/> 
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5 }}
                              className="flex flex-col items-center space-y-4"
                            >
                              <div className="p-6 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                                <Camera className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                              </div>
                              <div className="space-y-2">
                                <Button 
                                  variant="outline" 
                                  size="lg" 
                                  className="bg-background/80 hover:bg-primary/10 hover:border-primary shadow-lg rounded-xl px-8"
                                >
                                  <Upload className="mr-2 h-5 w-5"/> 
                                  Select Photo
                                </Button>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                  Upload a clear photo of your meal for AI identification
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <Button 
                          onClick={handleImageSubmit} 
                          disabled={!imagePreview || isLoading} 
                          className="w-full text-lg py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl transform hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> 
                              Analyzing Image...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-3 h-5 w-5"/> 
                              Analyze Photo & Add to Review
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </TabsContent>

                    {/* Voice Recording Tab */}
                    <TabsContent value="voice" className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <Label className="text-lg font-semibold flex items-center gap-2">
                          <Mic className="h-5 w-5 text-primary"/>
                          Record Meal Description
                        </Label>
                        
                        <div className="border-2 border-muted rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 min-h-[300px] bg-gradient-to-br from-muted/20 via-background to-muted/30 relative overflow-hidden">
                          {/* Recording Animation Background */}
                          <AnimatePresence>
                            {isRecording && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 overflow-hidden"
                              >
                                <motion.div 
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.1, 0.3, 0.1]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-red-500/20 rounded-2xl"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Microphone Icon with Recording Animation */}
                          <motion.div 
                            className="relative w-24 h-24 flex items-center justify-center"
                            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                          >
                            <div className={cn(
                              "absolute inset-0 rounded-full border-4 transition-all duration-500",
                              isRecording 
                                ? "border-red-500/50 shadow-lg shadow-red-500/20" 
                                : "border-primary/30"
                            )}>
                              {isRecording && (
                                <motion.div
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute inset-0 rounded-full border-2 border-red-500/30"
                                />
                              )}
                            </div>
                            <Mic className={cn(
                              "h-10 w-10 transition-colors duration-300 relative z-10",
                              isRecording ? "text-red-500" : "text-primary"
                            )} />
                          </motion.div>

                          {/* Recording Timer */}
                          <motion.div
                            key={recordingTime}
                            initial={{ scale: 0.9, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-2xl font-mono font-bold bg-background/80 px-4 py-2 rounded-xl shadow-sm border border-border/30 backdrop-blur-sm"
                          >
                            {formatTime(recordingTime)}
                          </motion.div>

                          {/* Recording Controls */}
                          <Button 
                            variant={isRecording ? "destructive" : "outline"} 
                            size="lg" 
                            onClick={isRecording ? stopRecording : startRecording} 
                            disabled={isLoading} 
                            className={cn(
                              "px-8 py-3 text-lg shadow-lg rounded-full font-semibold",
                              "transform hover:scale-105 transition-all duration-300",
                              isRecording 
                                ? "hover:bg-red-700 shadow-red-500/20" 
                                : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                            )}
                          >
                            {isRecording ? (
                              <>
                                <Pause className="mr-2 h-5 w-5"/> 
                                Stop Recording
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-5 w-5"/> 
                                Start Recording
                              </>
                            )}
                          </Button>

                          {/* Audio Preview */}
                          <AnimatePresence>
                            {audioPreviewUrl && !isRecording && (
                              <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full p-4 bg-background/80 rounded-xl shadow-inner border border-border/30 backdrop-blur-sm"
                              >
                                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500"/>
                                  Recording Preview:
                                </p>
                                <audio controls src={audioPreviewUrl} className="w-full h-12 rounded-lg"></audio>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs text-muted-foreground hover:text-destructive mt-2" 
                                  onClick={() => {
                                    setAudioPreviewUrl(null); 
                                    setAudioBlob(null);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1"/>
                                  Clear Recording
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {!isRecording && !audioPreviewUrl && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-sm text-muted-foreground text-center max-w-xs"
                            >
                              Click "Start Recording" and describe your meal aloud.
                              <br/>
                              <span className="text-xs italic">Example: "I had a grilled chicken salad with avocado"</span>
                            </motion.p>
                          )}
                        </div>

                        <Button 
                          onClick={handleVoiceSubmit} 
                          disabled={!audioBlob || isLoading || isRecording} 
                          className="w-full text-lg py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl transform hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> 
                              Processing Audio...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-3 h-5 w-5"/> 
                              Analyze Audio & Add to Review
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </TabsContent>
                  </Tabs>

                  {/* Error Display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl flex items-start gap-3 shadow-sm"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5"/> 
                        <div>
                          <p className="font-medium">Processing Error</p>
                          <p className="text-sm opacity-90 mt-1">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pending Results Review Section */}
                  <AnimatePresence>
                    {pendingResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        className="mt-8"
                      >
                        <Card className="border-2 border-accent/20 shadow-2xl bg-gradient-to-br from-accent/5 via-card to-card overflow-hidden">
                          <CardHeader className="bg-gradient-to-r from-accent/10 via-card to-card border-b border-accent/30 p-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                              <div>
                                <CardTitle className="text-accent flex items-center gap-3 text-xl md:text-2xl">
                                  <Sparkles className="h-6 w-6"/> 
                                  Review Items ({pendingResults.length})
                                </CardTitle>
                                <CardDescription className="text-base mt-2 text-muted-foreground">
                                  Review AI estimations below. Remove any incorrect items before confirming.
                                </CardDescription>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={clearAllPending} 
                                className="border-destructive/50 text-destructive hover:bg-destructive/10 transform hover:scale-105 transition-all duration-200 rounded-lg"
                              >
                                <Trash2 className="mr-2 h-4 w-4"/> 
                                Clear All
                              </Button>
                            </div>
                          </CardHeader>

                          <CardContent className="p-0">
                            <div className="max-h-[50vh] overflow-y-auto">
                              {/* Desktop Header */}
                              <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-6 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0 backdrop-blur-sm border-b border-border/30">
                                <span className="col-span-5">Food Item (AI Identified)</span>
                                <span className="col-span-2 text-center">Calories</span>
                                <span className="col-span-1 text-center">Protein</span>
                                <span className="col-span-1 text-center">Carbs</span>
                                <span className="col-span-1 text-center">Fat</span>
                                <span className="col-span-2 text-center">Actions</span>
                              </div>

                              {/* Results List */}
                              <div className="divide-y divide-border/30">
                                {pendingResults.map((item, index) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="grid grid-cols-6 md:grid-cols-12 gap-4 py-4 px-6 items-center group hover:bg-muted/20 transition-colors duration-200"
                                  >
                                    {/* Food Item Info */}
                                    <div className="col-span-5 md:col-span-5 space-y-1">
                                      <h4 className="font-semibold text-foreground leading-tight">
                                        {item.identifiedFoodName}
                                      </h4>
                                      {item.originalDescription && item.originalDescription !== item.identifiedFoodName && (
                                        <p className="text-xs text-muted-foreground italic" title={`Original: ${item.originalDescription}`}>
                                          From: {item.originalDescription.length > 30 
                                            ? `${item.originalDescription.substring(0, 30)}...` 
                                            : item.originalDescription
                                          }
                                        </p>
                                      )}
                                      {/* Mobile Nutrition Summary */}
                                      <div className="md:hidden text-xs text-muted-foreground space-y-1">
                                        <p className="font-mono">
                                          {item.calories.toFixed(0)} kcal | 
                                          P: {item.protein.toFixed(1)}g | 
                                          C: {item.carbohydrates.toFixed(1)}g | 
                                          F: {item.fat.toFixed(1)}g
                                        </p>
                                      </div>
                                    </div>

                                    {/* Desktop Nutrition Values */}
                                    <div className="hidden md:block col-span-2 text-center">
                                      <span className="font-semibold text-lg">{item.calories.toFixed(0)}</span>
                                      <span className="text-xs text-muted-foreground ml-1">kcal</span>
                                    </div>
                                    <div className="hidden md:block col-span-1 text-center">
                                      <span className="font-medium">{item.protein.toFixed(1)}</span>
                                      <span className="text-xs text-muted-foreground">g</span>
                                    </div>
                                    <div className="hidden md:block col-span-1 text-center">
                                      <span className="font-medium">{item.carbohydrates.toFixed(1)}</span>
                                      <span className="text-xs text-muted-foreground">g</span>
                                    </div>
                                    <div className="hidden md:block col-span-1 text-center">
                                      <span className="font-medium">{item.fat.toFixed(1)}</span>
                                      <span className="text-xs text-muted-foreground">g</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 md:col-span-2 flex justify-end">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-50 group-hover:opacity-100 transition-all duration-200 rounded-full"
                                            onClick={() => removeItem(item.id)}
                                          >
                                            <Trash2 className="h-4 w-4"/>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Remove this item</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="p-6 bg-gradient-to-t from-muted/20 via-card to-card border-t border-border/30">
                            <Button 
                              onClick={confirmAndLogFood} 
                              className="w-full text-lg py-4 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-xl transform hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold" 
                              disabled={pendingResults.length === 0 || isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-3 h-5 w-5 animate-spin"/> 
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-3 h-5 w-5"/> 
                                  Confirm & Log {pendingResults.length} Item{pendingResults.length > 1 ? 's' : ''}
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty State */}
                  {pendingResults.length === 0 && !isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-center py-12 space-y-3"
                    >
                      <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center mb-4">
                        <Utensils className="h-8 w-8 text-muted-foreground/50"/>
                      </div>
                      <h3 className="text-lg font-semibold text-muted-foreground">Ready to Log Your Meal</h3>
                      <p className="text-muted-foreground/80 max-w-md mx-auto">
                        Use any of the input methods above to add food items. 
                        Your selections will appear here for review before logging.
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
