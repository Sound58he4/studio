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
import { Camera, Mic, Type, Loader2, CheckCircle, AlertCircle, Upload, Trash2, Send, PlusCircle, ListRestart, Utensils, Pause, Play, Sparkles, BrainCircuit, Info, Scale } from "lucide-react"; 
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

  const triggerImageUpload = () => { imageInputRef.current?.click(); };

  const handleImageSubmit = async () => {
      if (!imagePreview) { setError("Please select an image first."); return; }
      setIsLoading(true); setError(null);
      try {
          const input: FoodImageRecognitionInput = { photoDataUri: imagePreview };
          const output: FoodImageRecognitionOutput = await foodImageRecognition(input);
          if (!output.foodItems || output.foodItems.length === 0) {
              setError("AI could not identify any food items in the image.");
              toast({ title: "No Items Found", description: "Try a clearer image or manual input.", variant: "destructive" });
              setIsLoading(false); return;
          }
          const processedResults: ProcessedFoodResult[] = output.foodItems.map((item, index) => ({
            id: `img-${Date.now()}-${index}`, identifiedFoodName: item.foodItem,
            calories: item.nutrition.calories, protein: item.nutrition.protein,
            carbohydrates: item.nutrition.carbohydrates, fat: item.nutrition.fat, source: 'image',
          }));
          setPendingResults(prev => [...prev, ...processedResults].sort((a,b) => b.calories - a.calories));
          toast({ title: "Image Processed", description: `${processedResults.length} item(s) added for review.` });
          resetInputState('image');
      } catch (err: any) {
          console.error("Image recognition error:", err); setError(`Image processing failed: ${err.message}.`);
          toast({ title: "Error", description: "Could not process the image.", variant: "destructive" });
      } finally { setIsLoading(false); }
  };

   const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => { audioChunksRef.current.push(event.data); };
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            setAudioBlob(blob); const url = URL.createObjectURL(blob); setAudioPreviewUrl(url);
            stream.getTracks().forEach(track => track.stop());
            if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
        };
        mediaRecorderRef.current.start(); setIsRecording(true); setError(null); setAudioPreviewUrl(null); setAudioBlob(null);
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => { setRecordingTime(prevTime => prevTime + 1); }, 1000);
    } catch (err) {
        console.error("Error accessing microphone:", err); setError("Could not access microphone. Check permissions.");
        toast({ title: "Mic Error", description: "Check permissions.", variant: "destructive"});
        if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60); const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleVoiceSubmit = async () => {
      if (!audioBlob) { setError("Please record your meal description first."); return; }
      setIsLoading(true); setError(null);
      const reader = new FileReader(); reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
              const input: VoiceFoodLoggingInput = { voiceRecordingDataUri: base64Audio };
              const output: VoiceFoodLoggingOutput = await voiceFoodLogging(input);
              if (!output.foodItems || output.foodItems.length === 0) {
                  setError("AI could not identify any food items from the recording.");
                  toast({ title: "No Items Found", description: "Try speaking clearly or use manual input.", variant: "destructive" });
                  setIsLoading(false); return;
              }
              const processedResults: ProcessedFoodResult[] = output.foodItems.map((item, index) => ({
                id: `voice-${Date.now()}-${index}`, identifiedFoodName: item.foodItem, ...item.nutrition, source: 'voice',
              }));
              setPendingResults(prev => [...prev, ...processedResults].sort((a,b) => b.calories - a.calories));
              toast({ title: "Voice Log Processed", description: `${processedResults.length} item(s) added for review.` });
              resetInputState('voice');
          } catch (err: any) {
              console.error("Voice logging error:", err); setError(`Voice processing failed: ${err.message}.`);
              toast({ title: "Error", description: "Could not process voice input.", variant: "destructive" });
          } finally { setIsLoading(false); }
      }
      reader.onerror = (error) => {
          console.error("Error converting blob:", error); setError("Failed to prepare audio data."); setIsLoading(false);
          toast({ title: "Error", description: "Failed preparing audio.", variant: "destructive" });
      }
  };

  const handleManualSubmit = async () => {
      const description = manualInput.trim();
      if (!description) { setError("Please enter your meal description."); return; }
      setIsLoading(true); setIsIdentifying(true); setError(null);
      try {
          const identificationInput: IdentifyFoodInput = { foodDescription: description };
          const identificationOutput: IdentifyFoodOutput = await identifyFoodFromText(identificationInput);
          const identifiedName = identificationOutput.identifiedFoodName;
          toast({ title: "Food Identified", description: `"${identifiedName}"`});
          setIsIdentifying(false);
          const nutritionInput: EstimateNutritionInput = { foodDescription: description }; // Using the original user description for nutrition
          const nutritionEstimate: EstimateNutritionOutput = await estimateNutritionFromText(nutritionInput);
          const processedResult: ProcessedFoodResult = {
              id: `manual-${Date.now()}-0`, identifiedFoodName: identifiedName,
              originalDescription: description, ...nutritionEstimate, source: 'manual',
          };
          setPendingResults(prev => [...prev, processedResult].sort((a,b) => b.calories - a.calories));
          setManualInput("");
          toast({ title: "Nutrition Estimated", description: `Added "${identifiedName}" for review.` });
      } catch (err: any) {
          console.error("Manual logging AI error:", err); setError(`Processing failed: ${err.message}.`);
          toast({ title: "Processing Error", description: `Could not process: ${err.message}`, variant: "destructive" });
      } finally { setIsLoading(false); setIsIdentifying(false); }
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
    setPendingResults([]); setError(null); resetInputState();
    toast({title: "Cleared pending items."});
  }

  const confirmAndLogFood = async () => {
    if (pendingResults.length === 0) {
      toast({ title: "Nothing to log", description: "Add some food items first.", variant: "destructive"});
      return;
    }
    if (!userId) {
        toast({ title: "Error", description: "User not logged in. Cannot save logs.", variant: "destructive"});
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
            title: "Food Logged Successfully!",
            description: `${pendingResults.length} item(s) saved to your history.`,
            variant: "default",
        });
        setPendingResults([]);
        setError(null);
        resetInputState();
    } catch (e) {
        console.error("Error saving food logs via service:", e);
        toast({ title: "Logging Error", description: "Could not save log to database.", variant: "destructive"});
    } finally { setIsLoading(false); }
  };

  if (authLoading) {
       return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
   }
   if (!userId && !authLoading) {
        return <div className="text-center p-10">Please log in to access this page.</div>;
   }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-3xl mx-auto my-4 md:my-8 px-4"
    >
      {/* Animated background gradient */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none" 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="shadow-xl border border-border/20 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-card to-card border-b p-5 md:p-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
             <Utensils className="h-7 w-7"/> Log Your Meal
          </CardTitle>
          <CardDescription className="text-base mt-1 text-muted-foreground">
            Add meals using text, image, or voice. Review Bago's AI estimations before confirming.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/80 h-12 shadow-inner">
              <TabsTrigger value="manual" className="flex items-center gap-1.5 py-2.5 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-l-md"><Type className="h-4 w-4 md:h-5 md:w-5"/>Text</TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-1.5 py-2.5 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"><Camera className="h-4 w-4 md:h-5 md:w-5"/>Image</TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1.5 py-2.5 text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-r-md"><Mic className="h-4 w-4 md:h-5 md:w-5"/>Voice</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-5 animate-in fade-in duration-300">
                <Label htmlFor="manual-food" className="text-base font-medium block mb-1">Describe Your Meal</Label>
                <Textarea id="manual-food" placeholder="E.g., 'Large bowl of oatmeal with berries and nuts', 'Chicken curry with rice'" value={manualInput} onChange={(e) => setManualInput(e.target.value)} className="min-h-[120px] resize-y text-base p-3 shadow-sm focus:ring-2 focus:ring-primary/50 border-input bg-background/90 transition-shadow hover:shadow-md" disabled={isLoading} rows={4} />
                 <div className="space-y-2 pt-3">
                     <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <BrainCircuit size={16} className="text-primary"/> AI Suggestions
                        {isSuggesting && <Loader2 size={14} className="animate-spin text-primary"/>}
                     </Label>
                      {isSuggesting ? (
                         <div className="flex flex-wrap gap-2 animate-pulse">
                             {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-md bg-muted/50" />)}
                         </div>
                      ) : suggestionError ? (
                          <p className="text-xs text-destructive">{suggestionError}</p>
                      ) : aiSuggestions.length > 0 ? (
                         <TooltipProvider delayDuration={100}>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {aiSuggestions.map((suggestion, index) => (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                           <Button
                                               type="button"
                                               variant="outline"
                                               size="sm"
                                                className={cn(
                                                    "text-xs sm:text-sm rounded-lg border-dashed hover:bg-primary/10 hover:border-primary/50 h-9 px-3 sm:px-4",
                                                    "group relative overflow-hidden shadow-sm", 
                                                    "transition-all duration-300 ease-out",
                                                    "animate-in fade-in zoom-in-95"
                                                )}
                                                style={{ animationDelay: `${index * 50}ms` }}
                                                onClick={() => {
                                                    const textToSet = suggestion.quantity
                                                        ? `${suggestion.suggestionName} (${suggestion.quantity})`
                                                        : suggestion.suggestionName;
                                                    setManualInput(textToSet);
                                                    }}
                                                title={`Add "${suggestion.suggestionName}" to input`}
                                           >
                                                <span className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                                <span className="relative z-10">{suggestion.suggestionName}</span>
                                           </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="p-3 max-w-xs bg-popover text-popover-foreground border shadow-lg rounded-md text-xs z-50">
                                            <p className="font-semibold text-base mb-1.5">{suggestion.suggestionName}</p>
                                            <p className="text-muted-foreground mb-2 italic text-sm">{suggestion.reason}</p>
                                            {suggestion.quantity && (
                                                 <p className="text-muted-foreground mb-2 flex items-center gap-1 text-sm"><Scale size={14} /> Quantity: <span className="font-medium text-foreground/90">{suggestion.quantity}</span></p>
                                            )}
                                            <Separator className="my-2" />
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums text-sm">
                                                <span>Calories:</span><span className="font-medium">{suggestion.estimatedNutrition.calories.toFixed(0)} kcal</span>
                                                <span>Protein:</span><span className="font-medium">{suggestion.estimatedNutrition.protein.toFixed(1)} g</span>
                                                <span>Carbs:</span><span className="font-medium">{suggestion.estimatedNutrition.carbohydrates.toFixed(1)} g</span>
                                                <span>Fat:</span><span className="font-medium">{suggestion.estimatedNutrition.fat.toFixed(1)} g</span>
                                                {suggestion.estimatedNutrition.fiber !== undefined && (
                                                    <>
                                                        <span>Fiber:</span><span className="font-medium">{suggestion.estimatedNutrition.fiber.toFixed(1)} g</span>
                                                    </>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                         </TooltipProvider>
                     ) : (
                          <p className="text-xs text-muted-foreground italic">No suggestions available currently.</p>
                     )}
                 </div>

                 <Button onClick={handleManualSubmit} disabled={!manualInput.trim() || isLoading} className="w-full text-base py-3 bg-primary hover:bg-primary/90 shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2">
                   {isLoading && isIdentifying && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Identifying...</>}
                   {isLoading && !isIdentifying && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Estimating...</>}
                   {!isLoading && <><Send className="mr-2 h-5 w-5"/> Identify & Estimate</>}
                 </Button>
            </TabsContent>

            <TabsContent value="image" className="space-y-5 animate-in fade-in duration-300">
               <Label htmlFor="picture" className="text-base font-medium block mb-1">Upload Meal Photo</Label>
               <div className="relative border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[250px] bg-muted/30 hover:border-primary transition-colors duration-200 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-card via-muted/10 to-card opacity-50 z-0"></div>
                  <Input ref={imageInputRef} id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {imagePreview ? (
                     <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300 ease-out z-10">
                       <Image src={imagePreview} alt="Meal preview" width={200} height={200} className="max-h-40 w-auto rounded-md object-contain shadow-lg border" />
                       <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md opacity-80 hover:opacity-100 transform hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); if (imageInputRef.current) imageInputRef.current.value = ""; }}> <Trash2 className="h-3 w-3"/> </Button>
                     </div>
                  ) : ( <Camera className="h-12 w-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors z-10" /> )}
                  <Button variant="outline" size="lg" onClick={triggerImageUpload} disabled={isLoading} className="shadow-md bg-card hover:bg-accent/10 hover:border-accent group-hover:scale-105 transition-transform duration-300 ease-out z-10"> <Upload className="mr-2 h-5 w-5"/> {imagePreview ? "Change Image" : "Select Image"} </Button>
                  {!imagePreview && <p className="text-sm text-muted-foreground mt-3 z-10">Upload a photo to identify food items.</p>}
              </div>
              <Button onClick={handleImageSubmit} disabled={!imagePreview || isLoading} className="w-full text-base py-3 bg-primary hover:bg-primary/90 shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"> {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</> : <><Send className="mr-2 h-5 w-5"/> Add from Image</>} </Button>
            </TabsContent>

            <TabsContent value="voice" className="space-y-6 animate-in fade-in duration-300">
               <Label className="text-base font-medium block mb-2">Record Meal Description</Label>
                <div className="border border-muted rounded-lg p-6 flex flex-col items-center justify-center space-y-5 min-h-[250px] bg-gradient-to-br from-muted/20 via-card to-muted/30 shadow-inner relative overflow-hidden">
                    {isRecording && (
                       <div className="absolute inset-0 z-0 opacity-30 overflow-hidden rounded-lg"> 
                           <div className="absolute bottom-0 left-1/2 w-[300%] h-[300%] bg-red-500/20 rounded-full animate-pulse origin-bottom" style={{ transform: 'translateX(-50%) scale(1)', animationDuration: '4s' }}></div>
                           <div className="absolute bottom-0 left-1/2 w-[250%] h-[250%] bg-red-500/30 rounded-full animate-pulse origin-bottom" style={{ transform: 'translateX(-50%) scale(0.8)', animationDuration: '4s', animationDelay: '1s' }}></div>
                       </div>
                    )}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center z-10 mb-3">
                       <div className={cn("absolute inset-0 rounded-full border-4 transition-all duration-500 ease-out", isRecording ? "border-red-500/50 scale-110 animate-ping" : "border-primary/30")}></div>
                       <Mic className={cn("h-8 w-8 sm:h-10 sm:w-10 z-10 transition-colors duration-300", isRecording ? "text-red-500" : "text-primary")} />
                  </div>
                  <p className="text-lg font-mono font-semibold text-foreground min-w-[60px] text-center z-10 bg-background/50 px-3 py-1 rounded-md shadow-sm backdrop-blur-sm border border-border/30"> {formatTime(recordingTime)} </p>
                  <Button variant={isRecording ? "destructive" : "outline"} size="lg" onClick={isRecording ? stopRecording : startRecording} disabled={isLoading} className={cn(
                       "w-full sm:w-auto px-8 sm:px-10 py-3 text-base shadow-md bg-card",
                       "transform hover:scale-105 transition-transform rounded-full z-10",
                       "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                       isRecording ? "hover:bg-red-700" : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                    )}>
                       {isRecording ? <Pause className="mr-2 h-5 w-5"/> : <Play className="mr-2 h-5 w-5"/>} {isRecording ? "Stop Recording" : "Start Recording"}
                  </Button>
                   {audioPreviewUrl && !isRecording && (
                       <div className="w-full mt-4 p-3 bg-background rounded shadow-inner border z-10 animate-in fade-in duration-300">
                          <p className="text-sm text-muted-foreground mb-2">Preview Recording:</p>
                          <audio controls src={audioPreviewUrl} className="w-full h-10"></audio>
                          <Button variant="link" size="sm" className="text-xs h-auto p-0 text-muted-foreground hover:text-destructive mt-1" onClick={() => {setAudioPreviewUrl(null); setAudioBlob(null);}}>Clear Recording</Button>
                       </div>
                   )}
                    {!isRecording && !audioPreviewUrl && ( <p className="text-sm text-muted-foreground mt-2 text-center z-10 px-4">Click "Start Recording" and describe your meal aloud.<br className="sm:hidden"/>(e.g., "I had a grilled chicken salad")</p> )}
              </div>
               <Button onClick={handleVoiceSubmit} disabled={!audioBlob || isLoading || isRecording} className="w-full text-base py-3 bg-primary hover:bg-primary/90 shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"> {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><Send className="mr-2 h-5 w-5"/> Add from Voice</>} </Button>
            </TabsContent>
          </Tabs>

          {error && ( <div className="mt-6 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-start gap-2 shadow-sm animate-in fade-in duration-300"> <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5"/> <p className="text-sm font-medium">{error}</p> </div> )}

           {pendingResults.length > 0 && (
             <Card className="mt-8 border-accent/50 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gradient-to-br from-accent/5 via-card to-card overflow-hidden">
               <CardHeader className="bg-accent/10 border-b border-accent/30 p-4">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4">
                     <div>
                         <CardTitle className="text-accent flex items-center gap-2 text-lg md:text-xl"> <Sparkles className="h-5 w-5"/> Review Added Items ({pendingResults.length}) </CardTitle>
                         <CardDescription className="text-sm mt-1 text-muted-foreground">Review Bago's estimations. Remove any incorrect items before confirming.</CardDescription>
                     </div>
                      <Button variant="outline" size="sm" onClick={clearAllPending} className="text-xs flex-shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 self-start sm:self-center transform hover:scale-105 transition-transform focus:ring-1 focus:ring-destructive"> <ListRestart className="mr-1 h-3 w-3"/> Clear All </Button>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                   <div className="max-h-[40vh] overflow-y-auto">
                       <ul className="divide-y divide-border/50">
                            <li className="py-2 px-4 hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0 backdrop-blur-sm z-10 border-b">
                               <span className="col-span-5 pl-1">Food Item (AI Identified)</span>
                               <span className="col-span-2 text-right">Calories (kcal)</span>
                               <span className="col-span-1 text-right">P (g)</span>
                               <span className="col-span-1 text-right">C (g)</span>
                               <span className="col-span-1 text-right">F (g)</span>
                               <span className="col-span-2 text-right">Actions</span>
                            </li>
                           {pendingResults.map((item, index) => (
                           <li key={item.id} className={cn(
                               "py-2.5 px-4 grid grid-cols-6 md:grid-cols-12 gap-2 text-sm items-center group hover:bg-muted/20 transition-colors duration-150",
                               "animate-in fade-in slide-in-from-left-3 duration-300 ease-out"
                           )} style={{ animationDelay: `${index * 30}ms` }}>
                               <div className="col-span-5 md:col-span-5 flex flex-col min-w-0">
                                   <span className="font-medium break-words leading-tight text-foreground"> {item.identifiedFoodName}</span>
                                    {item.originalDescription && item.originalDescription !== item.identifiedFoodName && (
                                       <span className="text-xs text-muted-foreground block italic truncate" title={`Original: ${item.originalDescription}`}> (From: {item.originalDescription.substring(0,25)}...)</span>
                                    )}
                                    <span className="md:hidden text-xs text-muted-foreground tabular-nums mt-1">{item.calories.toFixed(0)} kcal | P:{item.protein.toFixed(1)}g | C:{item.carbohydrates.toFixed(1)}g | F:{item.fat.toFixed(1)}g</span>
                               </div>
                               <span className="hidden md:block col-span-2 text-right tabular-nums font-medium">{item.calories.toFixed(0)}</span>
                               <span className="hidden md:block col-span-1 text-right tabular-nums">{item.protein.toFixed(1)}</span>
                               <span className="hidden md:block col-span-1 text-right tabular-nums">{item.carbohydrates.toFixed(1)}</span>
                               <span className="hidden md:block col-span-1 text-right tabular-nums">{item.fat.toFixed(1)}</span>
                                <div className="col-span-1 md:col-span-2 flex justify-end items-center">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity duration-150 transform hover:scale-110 focus:ring-1 focus:ring-destructive rounded-full" onClick={() => removeItem(item.id)} title="Remove item"> <Trash2 className="h-4 w-4"/> </Button>
                               </div>
                           </li>
                           ))}
                       </ul>
                   </div>
               </CardContent>
                <CardFooter className="p-4 bg-gradient-to-t from-muted/20 via-card to-card border-t border-border/30 mt-auto">
                   <Button onClick={confirmAndLogFood} className="w-full text-base py-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2" disabled={pendingResults.length === 0 || isLoading}> <CheckCircle className="mr-2 h-5 w-5"/> Confirm & Log {pendingResults.length} Item(s) </Button>
                </CardFooter>
             </Card>
           )}
           {pendingResults.length === 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center py-10 text-muted-foreground italic"
              >
                  <p className="mb-1">Add meals using the options above.</p>
                  <p>Your added items will appear here for review before logging.</p>
              </motion.div>
           )}
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
}

