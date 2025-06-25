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
import { Camera, Mic, Type, Loader2, CheckCircle, AlertCircle, Upload, Trash2, Send, PlusCircle, ListRestart, Utensils, Pause, Play, Sparkles, BrainCircuit, Info, Scale, FileText, ChefHat, Brain, Target, Zap, ImageIcon, Volume2, Waves } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { foodImageRecognition, FoodImageRecognitionInput, FoodImageRecognitionOutput } from '@/ai/flows/food-image-recognition';
import { voiceFoodLogging, VoiceFoodLoggingInput, VoiceFoodLoggingOutput } from '@/ai/flows/voice-food-logging';
import { optimizedFoodLogging, OptimizedFoodLoggingInput, OptimizedFoodLoggingOutput } from '@/ai/flows/optimized-food-logging';
import { suggestFoodItems, SuggestFoodItemsInput, SuggestionItem } from '@/ai/flows/suggest-food-items';
import { foodLogCache, FoodCacheUtils } from '@/lib/food-log-cache'; 
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
  confidence?: number;
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
  const [isDark, setIsDark] = useState(false);

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
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean | null>(null);

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
      if (tabToKeep !== 'text') {
          setManualInput("");
      }
  }, []);
  useEffect(() => {
      if (activeTab !== 'text') {
        setAiSuggestions([]);
        setSuggestionError(null);
        setIsSuggesting(false);
      }
      resetInputState(activeTab);
  }, [activeTab, resetInputState]);

  // Check voice recording support on mount
  useEffect(() => {
    // Only check for browser support, not protocol
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    const hasMediaRecorder = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
    setIsVoiceSupported(hasMediaDevices && hasMediaRecorder);
  }, []);

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
          let cachedResult = null;
          
          // Try to get from cache first, but handle any cache errors gracefully
          try {
              const cacheKey = `image_${imageFile?.lastModified}_${imageFile?.size}`;
              cachedResult = await foodLogCache.getCachedAIEstimate(cacheKey);
          } catch (cacheError) {
              console.warn("Image cache lookup failed, proceeding with AI processing:", cacheError);
              // Continue without cache
          }
          
          if (cachedResult) {
              const processedResult: ProcessedFoodResult = {
                  id: `img-${Date.now()}-0`, 
                  identifiedFoodName: cachedResult.identifiedFoodName,
                  ...cachedResult.nutrition, 
                  source: 'image',
                  confidence: cachedResult.confidence
              };
              setPendingResults(prev => [...prev, processedResult].sort((a,b) => b.calories - a.calories));
              toast({ title: "Image Processed (Cached)", description: `Added "${cachedResult.identifiedFoodName}" for review.` });
              resetInputState('image');
              return;
          }

          // Use original image recognition flow (since optimized flow is for text descriptions)
          const input: FoodImageRecognitionInput = { photoDataUri: imagePreview };
          const output: FoodImageRecognitionOutput = await foodImageRecognition(input);
          
          if (!output.foodItems || output.foodItems.length === 0) {
              setError("AI could not identify any food items in the image.");
              toast({ title: "No Items Found", description: "Try a clearer image or manual input.", variant: "destructive" });
              setIsLoading(false); return;
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
          
          // Try to cache the first result for future use, but don't fail if caching doesn't work
          if (processedResults.length > 0) {
              try {
                  const cacheKey = `image_${imageFile?.lastModified}_${imageFile?.size}`;
                  await foodLogCache.cacheAIEstimate(cacheKey, {
                      identifiedFoodName: processedResults[0].identifiedFoodName,
                      nutrition: {
                          calories: processedResults[0].calories,
                          protein: processedResults[0].protein,
                          carbohydrates: processedResults[0].carbohydrates,
                          fat: processedResults[0].fat
                      }
                  });
              } catch (cacheError) {
                  console.warn("Failed to cache image result, but continuing:", cacheError);
              }
          }
          
          setPendingResults(prev => [...prev, ...processedResults].sort((a,b) => b.calories - a.calories));
          toast({ title: "Image Processed", description: `${processedResults.length} item(s) added for review.` });
          resetInputState('image');
      } catch (err: any) {
          console.error("Image recognition error:", err); 
          setError(`Image processing failed: ${err.message}.`);
          toast({ title: "Error", description: "Could not process the image.", variant: "destructive" });
      } finally { 
          setIsLoading(false); 
      }
  };   const startRecording = async () => {
    try {
        // Check if MediaDevices API is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Voice recording is not supported in this browser. Please try text or photo upload instead.");
            toast({ 
                title: "Voice Recording Unavailable", 
                description: "Your browser doesn't support voice recording. Try the text or photo options.", 
                variant: "destructive"
            });
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
            setError("Audio recording is not supported in this browser.");
            toast({ 
                title: "Recording Not Supported", 
                description: "Please try manual input instead.", 
                variant: "destructive"
            });
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        // Try different MIME types for broader browser support
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/wav';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = ''; // Let browser choose
                    }
                }
            }
        }

        mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => { 
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data); 
            }
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/wav' });
            setAudioBlob(blob); 
            const url = URL.createObjectURL(blob); 
            setAudioPreviewUrl(url);
            stream.getTracks().forEach(track => track.stop());
            if (recordingIntervalRef.current) { 
                clearInterval(recordingIntervalRef.current); 
                recordingIntervalRef.current = null; 
            }
        };

        mediaRecorderRef.current.onerror = (event) => {
            console.error("MediaRecorder error:", event);
            setError("Recording failed. Please try again.");
            toast({ title: "Recording Error", description: "Please try again.", variant: "destructive"});
            setIsRecording(false);
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
        
    } catch (err: any) {
        console.error("Error accessing microphone:", err); 
        
        let errorMessage = "Could not access microphone.";
        if (err.name === 'NotAllowedError') {
            errorMessage = "Microphone permission denied. Please allow microphone access.";
        } else if (err.name === 'NotFoundError') {
            errorMessage = "No microphone found. Please check your device.";
        } else if (err.name === 'NotSupportedError') {
            errorMessage = "Voice recording not supported in this browser.";
        } else if (err.name === 'SecurityError') {
            errorMessage = "Voice recording requires HTTPS or localhost.";
        }
        
        setError(errorMessage);
        toast({ 
            title: "Microphone Error", 
            description: errorMessage, 
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
          try {
              mediaRecorderRef.current.stop(); 
              setIsRecording(false); 
          } catch (err) {
              console.error("Error stopping recording:", err);
              setIsRecording(false);
              setError("Error stopping recording.");
          }
      }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60); const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleVoiceSubmit = async () => {
      if (!audioBlob) { setError("Please record your meal description first."); return; }
      setIsLoading(true); setError(null);
      
      const reader = new FileReader(); 
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
          try {
              const base64Audio = reader.result as string;
              
              // Use original voice logging flow (since optimized flow is for text descriptions)
              const input: VoiceFoodLoggingInput = { voiceRecordingDataUri: base64Audio };
              const output: VoiceFoodLoggingOutput = await voiceFoodLogging(input);
              
              if (!output.foodItems || output.foodItems.length === 0) {
                  setError("AI could not identify any food items from the recording.");
                  toast({ title: "No Items Found", description: "Try speaking clearly or use manual input.", variant: "destructive" });
                  setIsLoading(false); return;
              }
              
              const processedResults: ProcessedFoodResult[] = output.foodItems.map((item, index) => ({
                id: `voice-${Date.now()}-${index}`, 
                identifiedFoodName: item.foodItem, 
                ...item.nutrition, 
                source: 'voice',
              }));
              
              // Try to cache the voice result if available, but don't fail if caching doesn't work
              if (processedResults.length > 0) {
                  try {
                      const cacheKey = `voice-${Date.now()}`;
                      await foodLogCache.cacheAIEstimate(cacheKey, {
                          identifiedFoodName: processedResults[0].identifiedFoodName,
                          nutrition: {
                              calories: processedResults[0].calories,
                              protein: processedResults[0].protein,
                              carbohydrates: processedResults[0].carbohydrates,
                              fat: processedResults[0].fat
                          }
                      });
                  } catch (cacheError) {
                      console.warn("Failed to cache voice result, but continuing:", cacheError);
                  }
              }
              
              setPendingResults(prev => [...prev, ...processedResults].sort((a,b) => b.calories - a.calories));
              toast({ title: "Voice Log Processed", description: `${processedResults.length} item(s) added for review.` });
              resetInputState('voice');
          } catch (err: any) {
              console.error("Voice logging error:", err); 
              setError(`Voice processing failed: ${err.message}.`);
              toast({ title: "Error", description: "Could not process voice input.", variant: "destructive" });
          } finally { 
              setIsLoading(false); 
          }
      }
      reader.onerror = (error) => {
          console.error("Error converting blob:", error); 
          setError("Failed to prepare audio data."); 
          setIsLoading(false);
          toast({ title: "Error", description: "Failed preparing audio.", variant: "destructive" });
      }
  };

  const handleManualSubmit = async () => {
      const description = manualInput.trim();
      if (!description) { setError("Please enter your meal description."); return; }
      setIsLoading(true); setError(null);
      
      try {
          let cachedResult = null;
          
          // Try to get from cache first, but handle any cache errors gracefully
          try {
              cachedResult = await foodLogCache.getCachedAIEstimate(description);
          } catch (cacheError) {
              console.warn("Cache lookup failed, proceeding with AI processing:", cacheError);
              // Continue without cache
          }
          
          if (cachedResult) {
              const processedResult: ProcessedFoodResult = {
                  id: `manual-${Date.now()}-0`, 
                  identifiedFoodName: cachedResult.identifiedFoodName,
                  originalDescription: description, 
                  ...cachedResult.nutrition,
                  source: 'manual',
                  confidence: cachedResult.confidence
              };
              setPendingResults(prev => [...prev, processedResult].sort((a,b) => b.calories - a.calories));
              setManualInput("");
              toast({ title: "Food Processed (Cached)", description: `Added "${cachedResult.identifiedFoodName}" for review.` });
              return;
          }

          // Use optimized AI flow
          const input: OptimizedFoodLoggingInput = { foodDescription: description };
          const output: OptimizedFoodLoggingOutput = await optimizedFoodLogging(input);
          
          if (!output.foodItems || output.foodItems.length === 0) {
              setError("AI could not identify any food items from the description.");
              toast({ title: "No Items Found", description: "Try rephrasing your description.", variant: "destructive" });
              setIsLoading(false);
              return;
          }

          // Map all returned items
          const processedResults: ProcessedFoodResult[] = output.foodItems.map((item, index) => ({
            id: `manual-${Date.now()}-${index}`,
            identifiedFoodName: item.identifiedFoodName,
            originalDescription: description,
            calories: item.nutrition.calories,
            protein: item.nutrition.protein,
            carbohydrates: item.nutrition.carbohydrates,
            fat: item.nutrition.fat,
            source: 'manual',
            confidence: item.confidence
          }));

          // Cache the first item for performance (if needed)
          try {
              await foodLogCache.cacheAIEstimate(description, {
                  identifiedFoodName: processedResults[0].identifiedFoodName,
                  nutrition: {
                      calories: processedResults[0].calories,
                      protein: processedResults[0].protein,
                      carbohydrates: processedResults[0].carbohydrates,
                      fat: processedResults[0].fat
                  },
                  confidence: processedResults[0].confidence
              });
          } catch (cacheError) {
              console.warn("Failed to cache result, but continuing:", cacheError);
          }

          setPendingResults(prev => [...prev, ...processedResults].sort((a, b) => b.calories - a.calories));
          setManualInput("");
          toast({ title: "Food Processed", description: `${processedResults.length} item(s) added for review.` });
      } catch (err: any) {
          console.error("Manual logging AI error:", err); 
          setError(`Processing failed: ${err.message}.`);
          toast({ title: "Processing Error", description: `Could not process: ${err.message}`, variant: "destructive" });
      } finally { 
          setIsLoading(false); 
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
        
        // Try to update cache and invalidate daily cache, but don't fail if it doesn't work
        try {
            await foodLogCache.invalidateDateCache(userId, new Date());
        } catch (cacheError) {
            console.warn("Failed to invalidate cache, but continuing:", cacheError);
        }
        
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
    } finally { 
        setIsLoading(false); 
    }
  };
  if (authLoading) {
    return (
      <div className={`min-h-screen pb-20 md:pb-0 transition-all duration-500 ${
        isDark 
          ? 'bg-[#1a1a1a]' 
          : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
      }`}>
        <div className="p-3 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className={`backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl ${
                isDark 
                  ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                  : 'bg-clay-100/70'
              }`}>
                <CardContent className="p-4 md:p-6 flex justify-center items-center">
                  <Loader2 className={`h-8 w-8 animate-spin ${
                    isDark ? 'text-[#8b5cf6]' : 'text-purple-600'
                  }`}/>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }  if (!userId && !authLoading) {
    return (
      <div className={`min-h-screen pb-20 md:pb-0 transition-all duration-500 ${
        isDark 
          ? 'bg-[#1a1a1a]' 
          : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
      }`}>
        <div className="p-3 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className={`backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl ${
                isDark 
                  ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                  : 'bg-clay-100/70'
              }`}>
                <CardContent className="p-4 md:p-6 text-center">
                  <h2 className={`text-xl font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Authentication Required</h2>
                  <p className={`${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Please log in to access this page.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }return (    <div className={`min-h-screen pb-20 md:pb-0 transition-all duration-500 ${
      isDark 
        ? 'bg-[#1a1a1a]' 
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
    }`}>
      <div className="p-3 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
        <motion.div 
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={`backdrop-blur-sm rounded-3xl shadow-clayStrong border-0 p-4 md:p-6 text-center transition-all duration-500 ${
            isDark 
              ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
              : 'bg-clay-100/70'
          }`}>
            <div className="flex items-center justify-center space-x-3 md:space-x-4 mb-3 md:mb-4">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}>
                <ChefHat className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  Log Your Meal
                </h1>
                <div className="flex items-center justify-center space-x-2">
                  <Brain className={`w-4 h-4 md:w-5 md:h-5 ${
                    isDark ? 'text-[#8b5cf6]' : 'text-purple-600'
                  }`} />
                  <span className={`text-sm md:text-base font-semibold ${
                    isDark ? 'text-[#8b5cf6]' : 'text-purple-600'
                  }`}>AI-Powered Nutrition</span>
                </div>
              </div>
            </div>
            <p className={`text-sm md:text-base max-w-2xl mx-auto ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Transform your nutrition tracking with intelligent meal logging using text, photos, or voice commands.
            </p>
          </div>
        </motion.div>        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className={`backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl overflow-hidden mb-6 md:mb-8 ${
            isDark 
              ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
              : 'bg-clay-100/70'
          }`}>
            <div className={`flex relative p-2 ${
              isDark ? 'bg-[#3a3a3a]/20' : 'bg-white/20'
            }`}>
              {/* Active Tab Indicator */}
              <div 
                className={`absolute top-2 bottom-2 rounded-xl shadow-lg transition-all duration-500 ease-in-out ${
                  isDark 
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                    : 'bg-gradient-to-r from-purple-500 to-purple-600'
                } ${
                  activeTab === 'manual' ? 'left-2 right-[66.66%]' :
                  activeTab === 'image' ? 'left-[33.33%] right-[33.33%]' :
                  'left-[66.66%] right-2'
                }`}
              ></div>
              
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 text-center font-bold transition-all duration-300 flex items-center justify-center space-x-1.5 md:space-x-2 relative z-10 rounded-xl ${
                  activeTab === 'manual' 
                    ? 'text-white shadow-sm' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]/30' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base font-semibold">Text</span>
              </button>
              
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 text-center font-bold transition-all duration-300 flex items-center justify-center space-x-1.5 md:space-x-2 relative z-10 rounded-xl ${
                  activeTab === 'image' 
                    ? 'text-white shadow-sm' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]/30' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                <Camera className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base font-semibold">Photo</span>
              </button>
              
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 py-3 md:py-4 px-2 md:px-4 text-center font-bold transition-all duration-300 flex items-center justify-center space-x-1.5 md:space-x-2 relative z-10 rounded-xl ${
                  activeTab === 'voice' 
                    ? 'text-white shadow-sm' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]/30' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'
                }`}
              >
                <Mic className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base font-semibold">Voice</span>
              </button>
            </div>
          </Card>
        </motion.div>{/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className={`backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl ${
            isDark 
              ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
              : 'bg-clay-100/70'
          }`}>
            <CardContent className="p-4 md:p-6">{/* Manual Tab Content */}
            {activeTab === 'manual' && (
              <div className="space-y-6 md:space-y-8">
                <div>                  <div className="flex items-center space-x-3 mb-4 md:mb-6">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg flex items-center justify-center shadow-clayInset ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Describe Your Meal</h3>
                  </div>                  <div className={`backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border ${
                    isDark 
                      ? 'bg-[#3a3a3a]/40 border-[#8b5cf6]/20' 
                      : 'bg-clay-100/40'
                  }`}>
                    <Textarea
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Try describing: '2 scrambled eggs with whole wheat toast and avocado', 'Large grilled chicken Caesar salad', 'Homemade beef stir-fry with brown rice'..."
                      className={`w-full min-h-[120px] md:min-h-[140px] resize-none bg-transparent border-0 shadow-none text-sm sm:text-base md:text-lg focus:ring-0 focus:outline-none ${
                        isDark 
                          ? 'text-white placeholder:text-gray-400' 
                          : 'text-gray-800 placeholder:text-gray-500'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                </div>                {/* Main Action Button */}
                <Button
                  onClick={handleManualSubmit}
                  className={`w-full h-12 sm:h-14 md:h-16 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-clayStrong flex items-center justify-center space-x-2 md:space-x-3 text-sm sm:text-base md:text-lg text-white ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea]' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  }`}
                  disabled={!manualInput.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 md:w-6 md:h-6" />
                      <span>Analyze & Estimate Nutrition</span>
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    </>
                  )}
                </Button>

                {/* AI Analysis Section */}
                {pendingResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card className={`backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl mt-6 md:mt-8 ${
                      isDark 
                        ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                        : 'bg-clay-100/70'
                    }`}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-clayInset flex items-center justify-center ${
                              isDark 
                                ? 'bg-green-600' 
                                : 'bg-green-500'
                            }`}>
                              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <div>
                              <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                                isDark ? 'text-white' : 'text-gray-800'
                              }`}>
                                AI Analysis Complete ({pendingResults.length} items)
                              </h3>
                              <p className={`text-sm md:text-base ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>Review and confirm before logging</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllPending}
                            className={`backdrop-blur-sm border flex items-center space-x-2 transition-all duration-200 shadow-clayStrong rounded-xl px-4 md:px-6 font-semibold text-xs md:text-sm w-full sm:w-auto text-red-600 hover:bg-red-50 border-red-200 ${
                              isDark 
                                ? 'bg-[#3a3a3a]/80 hover:bg-red-900/20 border-red-400/30' 
                                : 'bg-white/80'
                            }`}
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            <span>Clear All</span>
                          </Button>
                        </div>
                        <div className={`backdrop-blur-sm rounded-2xl p-4 md:p-6 border shadow-clayStrong ${
                          isDark 
                            ? 'bg-green-900/30 border-green-500/30' 
                            : 'bg-green-100/60'
                        }`}>
                          <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                            <Brain className={`w-4 h-4 md:w-5 md:h-5 ${
                              isDark ? 'text-green-400' : 'text-green-600'
                            }`} />
                            <span className={`font-bold text-sm md:text-base ${
                              isDark ? 'text-green-300' : 'text-green-700'
                            }`}>Smart Nutrition Analysis</span>
                          </div>
                          <p className={`leading-relaxed text-xs sm:text-sm md:text-base ${
                            isDark ? 'text-green-400' : 'text-green-600'
                          }`}>
                            Our AI has analyzed your meal and estimated the nutritional content. Review the results below and remove any incorrect items before confirming.
                          </p>
                        </div>                        {/* Items Display - Mobile Cards & Desktop Table */}
                        <div className="mt-6">
                          {/* Mobile Card View */}
                          <div className="block md:hidden space-y-3">
                            {pendingResults.map((item, index) => (
                              <div key={item.id} className={`backdrop-blur-sm rounded-2xl border shadow-clayStrong p-4 transition-colors duration-200 ${
                                isDark 
                                  ? 'bg-[#3a3a3a]/60 hover:bg-[#3a3a3a]/70 border-[#4a4a4a]' 
                                  : 'bg-clay-100/60 hover:bg-clay-200/40 border-clay-200'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className={`text-sm font-bold mb-1 ${
                                      isDark ? 'text-white' : 'text-gray-800'
                                    }`}>{item.identifiedFoodName}</h4>
                                    {item.originalDescription && (
                                      <div className={`text-xs backdrop-blur-sm rounded-lg px-2 py-1 inline-block shadow-sm border mb-2 ${
                                        isDark 
                                          ? 'bg-[#4a4a4a]/60 border-[#5a5a5a] text-gray-300' 
                                          : 'bg-clay-100/60 border-clay-200 text-gray-600'
                                      }`}>
                                        From: {item.originalDescription.substring(0, 25)}...
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                    className={`h-8 w-8 rounded-xl transition-all duration-200 shadow-sm ml-2 ${
                                      isDark 
                                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-purple-900/40 border border-purple-500/30' 
                                      : 'bg-purple-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-purple-300' : 'text-purple-600'
                                    }`}>Calories</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-purple-200' : 'text-purple-700'
                                    }`}>{item.calories.toFixed(0)}</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-blue-900/40 border border-blue-500/30' 
                                      : 'bg-blue-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-blue-300' : 'text-blue-600'
                                    }`}>Protein</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-blue-200' : 'text-blue-700'
                                    }`}>{item.protein.toFixed(1)}g</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-green-900/40 border border-green-500/30' 
                                      : 'bg-green-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-green-300' : 'text-green-600'
                                    }`}>Carbs</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-green-200' : 'text-green-700'
                                    }`}>{item.carbohydrates.toFixed(1)}g</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-orange-900/40 border border-orange-500/30' 
                                      : 'bg-orange-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-orange-300' : 'text-orange-600'
                                    }`}>Fat</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-orange-200' : 'text-orange-700'
                                    }`}>{item.fat.toFixed(1)}g</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Desktop Table View */}
                          <div className={`hidden md:block overflow-hidden rounded-2xl border shadow-clayStrong backdrop-blur-sm ${
                            isDark 
                              ? 'bg-[#3a3a3a]/40 border-[#4a4a4a]' 
                              : 'bg-clay-100/40 border-clay-200'
                          }`}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className={`backdrop-blur-sm ${
                                  isDark 
                                    ? 'bg-[#4a4a4a]/50' 
                                    : 'bg-clay-300/50'
                                }`}>
                                  <tr>
                                    <th className={`text-left py-3 md:py-5 px-3 md:px-6 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>AI Identified Food</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Calories</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Protein</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Carbs</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Fat</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody className={`backdrop-blur-sm ${
                                  isDark 
                                    ? 'bg-[#3a3a3a]/30' 
                                    : 'bg-clay-100/30'
                                }`}>
                                  {pendingResults.map((item, index) => (
                                    <tr key={item.id} className={`border-b transition-colors duration-200 ${
                                      isDark 
                                        ? 'hover:bg-[#3a3a3a]/40 bg-[#3a3a3a]/30 border-[#4a4a4a]' 
                                        : 'hover:bg-clay-200/40 bg-clay-100/30 border-clay-200'
                                    }`}>
                                      <td className="py-3 md:py-5 px-3 md:px-6">
                                        <div>
                                          <div className={`text-sm md:text-base font-bold mb-1 md:mb-2 ${
                                            isDark ? 'text-white' : 'text-gray-800'
                                          }`}>{item.identifiedFoodName}</div>
                                          {item.originalDescription && (
                                            <div className={`text-xs md:text-sm backdrop-blur-sm rounded-xl px-2 md:px-4 py-1 md:py-2 inline-block shadow-clayStrong border ${
                                              isDark 
                                                ? 'bg-[#4a4a4a]/60 border-[#5a5a5a] text-gray-300' 
                                                : 'bg-clay-100/60 border-clay-200 text-gray-600'
                                            }`}>
                                              From: {item.originalDescription.substring(0, 30)}...
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-bold ${
                                        isDark ? 'text-purple-300' : 'text-purple-600'
                                      }`}>{item.calories.toFixed(0)}</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-blue-300' : 'text-blue-700'
                                      }`}>{item.protein.toFixed(1)}g</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-green-300' : 'text-green-700'
                                      }`}>{item.carbohydrates.toFixed(1)}g</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-orange-300' : 'text-orange-700'
                                      }`}>{item.fat.toFixed(1)}g</td>
                                      <td className="text-center py-3 md:py-5 px-2 md:px-4">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(item.id)}
                                          className={`h-8 w-8 md:h-10 md:w-10 rounded-xl transition-all duration-200 shadow-clayStrong ${
                                            isDark 
                                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                              : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                          }`}
                                        >
                                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        {/* Confirm Button */}
                        <Button
                          onClick={confirmAndLogFood}
                          className="w-full h-12 sm:h-14 md:h-16 font-bold rounded-2xl mt-6 md:mt-8 flex items-center justify-center space-x-2 md:space-x-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-clayStrong text-sm sm:text-base md:text-lg bg-green-500 hover:bg-green-600 text-white"
                          disabled={pendingResults.length === 0 || isLoading}
                        >
                          <Target className="w-4 h-4 md:w-6 md:h-6" />
                          <span>Confirm & Log {pendingResults.length} Item{pendingResults.length > 1 ? 's' : ''}</span>
                          <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* AI Suggestions Section */}
                <div className={`backdrop-blur-sm rounded-2xl p-4 md:p-6 border shadow-lg ${
                  isDark 
                    ? 'bg-[#3a3a3a]/40 border-[#8b5cf6]/20' 
                    : 'bg-clay-100/40'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-lg flex items-center justify-center ${
                        isDark 
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                          : 'bg-gradient-to-r from-purple-500 to-purple-600'
                      }`}>
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <span className={`text-sm sm:text-base md:text-lg font-bold ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>AI-Powered Smart Suggestions</span>
                        <p className={`text-xs md:text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>Personalized recommendations just for you</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSuggestions}
                      className={`backdrop-blur-sm rounded-xl px-4 md:px-6 font-semibold text-xs md:text-sm w-full sm:w-auto border-0 shadow-lg hover:shadow-clayStrong ${
                        isDark 
                          ? 'bg-[#3a3a3a]/80 text-gray-300 hover:bg-[#3a3a3a]/90' 
                          : 'bg-white/80 text-gray-700 hover:bg-white/90'
                      }`}
                      disabled={!userId || isSuggesting}
                    >
                      <Target className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      {isSuggesting ? "Getting..." : "Get Suggestions"}
                    </Button>
                  </div>                  <p className={`leading-relaxed text-xs sm:text-sm md:text-base ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Get intelligent food recommendations tailored to your dietary preferences, nutritional goals, and eating patterns.
                  </p>
                  
                  {/* AI Suggestions Display */}
                  <div className="mt-4">
                    {isSuggesting ? (
                      <div className="flex flex-wrap gap-2 animate-pulse">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-md bg-muted/50" />)}
                      </div>
                    ) : suggestionError ? (
                      <p className="text-xs text-destructive">{suggestionError}</p>
                    ) : aiSuggestions.length > 0 ? (
                      <TooltipProvider delayDuration={100}>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {aiSuggestions.slice(0, 8).map((suggestion, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={`text-xs rounded-lg border-dashed hover:bg-primary/10 hover:border-primary/50 h-8 px-2 sm:px-3 group relative overflow-hidden shadow-sm transition-all duration-300 ease-out animate-in fade-in zoom-in-95 flex-shrink-0`}
                                  onClick={() => {
                                    const textToSet = suggestion.quantity
                                      ? `${suggestion.suggestionName} (${suggestion.quantity})`
                                      : suggestion.suggestionName;
                                    setManualInput(textToSet);
                                  }}
                                  title={`Add "${suggestion.suggestionName}" to input`}
                                >
                                  <span className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                  <span className="relative z-10 truncate max-w-[120px] sm:max-w-none">{suggestion.suggestionName}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="p-2 sm:p-3 max-w-xs bg-popover text-popover-foreground border shadow-lg rounded-md text-xs z-50">
                                <p className="font-semibold text-sm mb-1">{suggestion.suggestionName}</p>
                                <p className="text-muted-foreground mb-2 italic text-xs">{suggestion.reason}</p>
                                {suggestion.quantity && (
                                  <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                                    <Scale size={12} /> Quantity: <span className="font-medium text-foreground/90">{suggestion.quantity}</span>
                                  </p>
                                )}
                                <Separator className="my-2" />
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 tabular-nums text-xs">
                                  <span>Calories:</span><span className="font-medium">{suggestion.estimatedNutrition.calories.toFixed(0)} kcal</span>
                                  <span>Protein:</span><span className="font-medium">{suggestion.estimatedNutrition.protein.toFixed(1)} g</span>
                                  <span>Carbs:</span><span className="font-medium">{suggestion.estimatedNutrition.carbohydrates.toFixed(1)} g</span>
                                  <span>Fat:</span><span className="font-medium">{suggestion.estimatedNutrition.fat.toFixed(1)} g</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-1">Click "Get Suggestions" to see personalized food recommendations based on your eating habits.</p>
                    )}
                  </div>
                </div>
              </div>
            )}            {/* Image Tab Content */}
            {activeTab === 'image' && (
              <div className="space-y-6 md:space-y-8">                  <div className="flex items-center space-x-3 mb-4 md:mb-6">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg flex items-center justify-center shadow-clayInset ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      <Camera className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Upload Meal Photo</h3>
                  </div>
                  {/* Image Upload Area */}
                <div className="text-center space-y-4 md:space-y-6">
                  <div className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[250px] transition-colors duration-200 group overflow-hidden ${
                    isDark 
                      ? 'border-[#8b5cf6]/30 hover:border-[#8b5cf6]/50 bg-[#3a3a3a]/30' 
                      : 'border-gray-300 hover:border-purple-400 bg-clay-100/30'
                  }`}>
                    <Input 
                      ref={imageInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange} 
                    />
                    {imagePreview ? (
                      <div className="relative mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300 ease-out z-10">
                        <Image 
                          src={imagePreview} 
                          alt="Meal preview" 
                          width={150} 
                          height={150}
                          className="max-h-32 sm:max-h-40 w-auto rounded-2xl object-contain shadow-lg border"
                        />
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md opacity-80 hover:opacity-100 transform hover:scale-110 transition-transform" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setImagePreview(null); 
                            setImageFile(null); 
                            if (imageInputRef.current) imageInputRef.current.value = ""; 
                          }}
                        > 
                          <Trash2 className="h-3 w-3"/> 
                        </Button>
                      </div>
                    ) : (
                      <Camera className={`h-16 w-16 md:h-20 md:h-20 mb-3 sm:mb-4 group-hover:text-primary transition-colors z-10 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    )}
                    <div>
                      <h4 className={`text-base sm:text-lg md:text-xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-800'
                      }`}>Upload your meal photo</h4>
                      <p className={`mb-4 md:mb-6 max-w-md mx-auto leading-relaxed text-xs sm:text-sm md:text-base ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Take a clear photo of your meal for instant AI analysis
                      </p>
                      <Button
                        onClick={triggerImageUpload}
                        className={`flex items-center space-x-2 mx-auto shadow-clayStrong rounded-xl px-6 md:px-8 py-2 md:py-3 font-semibold text-sm md:text-base text-white ${
                          isDark 
                            ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea]' 
                            : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                        }`}
                        disabled={isLoading}
                      >
                        <Upload className="w-4 h-4 md:w-5 md:h-5" />
                        <span>{imagePreview ? "Change Image" : "Browse Files"}</span>
                      </Button>
                    </div>
                  </div>
                </div>                {/* Add from Image Button */}
                <Button
                  onClick={handleImageSubmit}
                  className={`w-full h-12 sm:h-14 md:h-16 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-clayStrong flex items-center justify-center space-x-2 md:space-x-3 text-sm sm:text-base md:text-lg text-white ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea]' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  }`}
                  disabled={!imagePreview || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 md:w-6 md:h-6" />
                      <span>Analyze Photo</span>
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    </>
                  )}
                </Button>

                {/* AI Analysis Section for Image */}
                {pendingResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card className="backdrop-blur-sm border-0 bg-clay-100/70 shadow-clayStrong rounded-3xl mt-6 md:mt-8">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-clayInset flex items-center justify-center bg-green-500">
                              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                                AI Analysis Complete ({pendingResults.length} items)
                              </h3>
                              <p className="text-sm md:text-base text-gray-600">Review and confirm before logging</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllPending}
                            className="backdrop-blur-sm border flex items-center space-x-2 transition-all duration-200 shadow-clayStrong rounded-xl px-4 md:px-6 font-semibold text-xs md:text-sm w-full sm:w-auto bg-white/80 text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            <span>Clear All</span>
                          </Button>
                        </div>
                        <div className="backdrop-blur-sm rounded-2xl p-4 md:p-6 border shadow-clayStrong bg-green-100/60">
                          <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                            <Brain className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                            <span className="font-bold text-sm md:text-base text-green-700">Smart Nutrition Analysis</span>
                          </div>
                          <p className="leading-relaxed text-xs sm:text-sm md:text-base text-green-600">
                            Our AI has analyzed your meal photo and estimated the nutritional content. Review the results below and remove any incorrect items before confirming.
                          </p>
                        </div>

                        {/* Items Display - Mobile Cards & Desktop Table */}
                        <div className="mt-6">
                          {/* Mobile Card View */}
                          <div className="block md:hidden space-y-3">
                            {pendingResults.map((item, index) => (
                              <div key={item.id} className={`backdrop-blur-sm rounded-2xl border shadow-clayStrong p-4 transition-colors duration-200 ${
                                isDark 
                                  ? 'bg-[#3a3a3a]/60 hover:bg-[#3a3a3a]/70 border-[#4a4a4a]' 
                                  : 'bg-clay-100/60 hover:bg-clay-200/40 border-clay-200'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className={`text-sm font-bold mb-1 ${
                                      isDark ? 'text-white' : 'text-gray-800'
                                    }`}>{item.identifiedFoodName}</h4>
                                    {item.originalDescription && (
                                      <div className={`text-xs backdrop-blur-sm rounded-lg px-2 py-1 inline-block shadow-sm border mb-2 ${
                                        isDark 
                                          ? 'bg-[#4a4a4a]/60 border-[#5a5a5a] text-gray-300' 
                                          : 'bg-clay-100/60 border-clay-200 text-gray-600'
                                      }`}>
                                        From: {item.originalDescription.substring(0, 25)}...
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                    className={`h-8 w-8 rounded-xl transition-all duration-200 shadow-sm ml-2 ${
                                      isDark 
                                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-purple-900/40 border border-purple-500/30' 
                                      : 'bg-purple-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-purple-300' : 'text-purple-600'
                                    }`}>Calories</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-purple-200' : 'text-purple-700'
                                    }`}>{item.calories.toFixed(0)}</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-blue-900/40 border border-blue-500/30' 
                                      : 'bg-blue-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-blue-300' : 'text-blue-600'
                                    }`}>Protein</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-blue-200' : 'text-blue-700'
                                    }`}>{item.protein.toFixed(1)}g</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-green-900/40 border border-green-500/30' 
                                      : 'bg-green-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-green-300' : 'text-green-600'
                                    }`}>Carbs</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-green-200' : 'text-green-700'
                                    }`}>{item.carbohydrates.toFixed(1)}g</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-orange-900/40 border border-orange-500/30' 
                                      : 'bg-orange-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-orange-300' : 'text-orange-600'
                                    }`}>Fat</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-orange-200' : 'text-orange-700'
                                    }`}>{item.fat.toFixed(1)}g</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Desktop Table View */}
                          <div className={`hidden md:block overflow-hidden rounded-2xl border shadow-clayStrong backdrop-blur-sm ${
                            isDark 
                              ? 'bg-[#3a3a3a]/40 border-[#4a4a4a]' 
                              : 'bg-clay-100/40 border-clay-200'
                          }`}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className={`backdrop-blur-sm ${
                                  isDark 
                                    ? 'bg-[#4a4a4a]/50' 
                                    : 'bg-clay-300/50'
                                }`}>
                                  <tr>
                                    <th className={`text-left py-3 md:py-5 px-3 md:px-6 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>AI Identified Food</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Calories</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${

                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Protein</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Carbs</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Fat</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody className={`backdrop-blur-sm ${
                                  isDark 
                                    ? 'bg-[#3a3a3a]/30' 
                                    : 'bg-clay-100/30'
                                }`}>
                                  {pendingResults.map((item, index) => (
                                    <tr key={item.id} className={`border-b transition-colors duration-200 ${
                                      isDark 
                                        ? 'hover:bg-[#3a3a3a]/40 bg-[#3a3a3a]/30 border-[#4a4a4a]' 
                                        : 'hover:bg-clay-200/40 bg-clay-100/30 border-clay-200'
                                    }`}>
                                      <td className="py-3 md:py-5 px-3 md:px-6">
                                        <div>
                                          <div className={`text-sm md:text-base font-bold mb-1 md:mb-2 ${
                                            isDark ? 'text-white' : 'text-gray-800'
                                          }`}>{item.identifiedFoodName}</div>
                                          {item.originalDescription && (
                                            <div className={`text-xs md:text-sm backdrop-blur-sm rounded-xl px-2 md:px-4 py-1 md:py-2 inline-block shadow-clayStrong border ${
                                              isDark 
                                                ? 'bg-[#4a4a4a]/60 border-[#5a5a5a] text-gray-300' 
                                                : 'bg-clay-100/60 border-clay-200 text-gray-600'
                                            }`}>
                                              From: {item.originalDescription.substring(0, 30)}...
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-bold ${
                                        isDark ? 'text-purple-300' : 'text-purple-600'
                                      }`}>{item.calories.toFixed(0)}</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-blue-300' : 'text-blue-700'
                                      }`}>{item.protein.toFixed(1)}g</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-green-300' : 'text-green-700'
                                      }`}>{item.carbohydrates.toFixed(1)}g</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-orange-300' : 'text-orange-700'
                                      }`}>{item.fat.toFixed(1)}g</td>
                                      <td className="text-center py-3 md:py-5 px-2 md:px-4">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(item.id)}
                                          className={`h-8 w-8 md:h-10 md:w-10 rounded-xl transition-all duration-200 shadow-clayStrong ${
                                            isDark 
                                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                              : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                          }`}
                                        >
                                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        {/* Confirm Button */}
                        <Button
                          onClick={confirmAndLogFood}
                          className="w-full h-12 sm:h-14 md:h-16 font-bold rounded-2xl mt-6 md:mt-8 flex items-center justify-center space-x-2 md:space-x-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-clayStrong text-sm sm:text-base md:text-lg bg-green-500 hover:bg-green-600 text-white"
                          disabled={pendingResults.length === 0 || isLoading}
                        >
                          <Target className="w-4 h-4 md:w-6 md:h-6" />
                          <span>Confirm & Log {pendingResults.length} Item{pendingResults.length > 1 ? 's' : ''}</span>
                          <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}

            {/* Voice Tab Content */}
            {activeTab === 'voice' && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center space-x-3 mb-4 md:mb-6">                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-clayInset flex items-center justify-center ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                      : 'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}>
                    <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Voice Recording</h3>
                </div>                  <div className={`rounded-3xl p-6 md:p-10 shadow-lg transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#3a3a3a]/40' 
                      : 'bg-clay-100/40'
                  }`}>
                  <div className="flex flex-col items-center space-y-6 md:space-y-8">
                    
                    {/* Voice Support Check */}
                    {isVoiceSupported === false && (
                      <div className={`w-full mb-4 p-4 rounded-2xl border shadow-sm ${
                        isDark 
                          ? 'bg-yellow-900/20 border-yellow-600/30' 
                          : 'bg-yellow-100/80 border-yellow-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            isDark ? 'text-yellow-400' : 'text-yellow-600'
                          }`} />
                          <div>
                            <h4 className={`text-sm font-bold mb-1 ${
                              isDark ? 'text-yellow-300' : 'text-yellow-800'
                            }`}>Voice Recording Unavailable</h4>
                            <p className={`text-xs leading-relaxed ${
                              isDark ? 'text-yellow-400' : 'text-yellow-700'
                            }`}>
                              Voice recording requires browser support and microphone permissions. Please try the <strong>Text</strong> or <strong>Photo</strong> options instead.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Voice Interface */}
                    <div className="relative">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-clayStrong ${
                          isVoiceSupported === false 
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : isRecording
                            ? 'bg-red-400 hover:bg-red-500 scale-110'
                            : isDark
                            ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] hover:scale-105'
                            : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:scale-105'
                        }`}
                        disabled={isLoading || isVoiceSupported === false}
                      >
                        {isRecording ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-sm"></div>
                            <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-sm"></div>
                          </div>
                        ) : (
                          <Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        )}
                      </button>
                    </div>{/* Timer Display */}
                    <div className={`px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-clayStrong ${
                      isDark ? 'bg-[#3a3a3a]' : 'bg-gray-700'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                        <span className="text-2xl md:text-3xl font-mono font-bold text-white">
                          {formatTime(recordingTime)}
                        </span>
                      </div>
                    </div>                    {/* Status */}
                    <div className="text-center space-y-3 md:space-y-4">                      <h4 className={`text-lg md:text-xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                        {isVoiceSupported === false 
                          ? 'Voice Recording Unavailable'
                          : isRecording 
                          ? 'Recording...' 
                          : 'Tap to record'
                        }
                      </h4>
                      <p className={`leading-relaxed text-sm md:text-base max-w-md ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {isVoiceSupported === false
                          ? 'Your browser doesn\'t support voice recording. Please use the Text or Photo upload options above.'
                          : isRecording 
                          ? 'Speak clearly about your meal. Tap again when finished.' 
                          : 'Tap the microphone to start recording your meal description'
                        }
                      </p>
                    </div>

                    {/* Audio Preview */}
                    {audioPreviewUrl && !isRecording && (
                      <div className={`w-full mt-3 sm:mt-4 p-2 sm:p-3 rounded shadow-inner border z-10 animate-in fade-in duration-300 ${
                        isDark 
                          ? 'bg-[#3a3a3a] border-[#8b5cf6]/20' 
                          : 'bg-background'
                      }`}>
                        <p className={`text-xs sm:text-sm mb-2 ${
                          isDark ? 'text-gray-400' : 'text-muted-foreground'
                        }`}>Preview Recording:</p>
                        <audio controls src={audioPreviewUrl} className="w-full h-8 sm:h-10"></audio>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className={`text-xs h-auto p-0 mt-1 hover:text-destructive ${
                            isDark ? 'text-gray-400' : 'text-muted-foreground'
                          }`}
                          onClick={() => {
                            if (audioPreviewUrl) {
                              URL.revokeObjectURL(audioPreviewUrl);
                            }
                            setAudioPreviewUrl(null); 
                            setAudioBlob(null);
                          }}
                        >
                          Clear Recording
                        </Button>
                      </div>
                    )}
                  </div>
                </div>                {/* Action Button */}
                <Button
                  onClick={handleVoiceSubmit}
                  className={`w-full h-12 sm:h-14 md:h-16 font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-clayStrong flex items-center justify-center space-x-2 md:space-x-3 text-sm sm:text-base md:text-lg ${
                    isVoiceSupported === false
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : isDark
                      ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                  }`}
                  disabled={!audioBlob || isLoading || isRecording || isVoiceSupported === false}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isVoiceSupported === false ? (
                    <>
                      <AlertCircle className="w-4 h-4 md:w-6 md:h-6" />
                      <span>Voice Recording Not Available</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 md:w-6 md:h-6" />
                      <span>Process Voice Recording</span>
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    </>
                  )}
                </Button>

                {/* AI Analysis Section for Voice */}
                {pendingResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Card className="backdrop-blur-sm border-0 bg-clay-100/70 shadow-clayStrong rounded-3xl mt-6 md:mt-8">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-0 mb-6 md:mb-8">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-clayInset flex items-center justify-center bg-green-500">
                              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                                AI Analysis Complete ({pendingResults.length} items)
                              </h3>
                              <p className="text-sm md:text-base text-gray-600">Review and confirm before logging</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllPending}
                            className="backdrop-blur-sm border flex items-center space-x-2 transition-all duration-200 shadow-clayStrong rounded-xl px-4 md:px-6 font-semibold text-xs md:text-sm w-full sm:w-auto bg-white/80 text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            <span>Clear All</span>
                          </Button>
                        </div>
                        <div className="backdrop-blur-sm rounded-2xl p-4 md:p-6 border shadow-clayStrong bg-green-100/60">
                          <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                            <Brain className={`w-4 h-4 md:w-5 md:h-5 text-green-600`}
                            />
                            <span className={`font-bold text-sm md:text-base text-green-700`}>Smart Nutrition Analysis</span>
                          </div>
                          <p className={`leading-relaxed text-xs sm:text-sm md:text-base text-green-600`}>
                            Our AI has analyzed your voice recording and estimated the nutritional content. Review the results below and remove any incorrect items before confirming.
                          </p>
                        </div>

                        {/* Items Display - Mobile Cards & Desktop Table */}
                        <div className="mt-6">
                          {/* Mobile Card View */}
                          <div className="block md:hidden space-y-3">
                            {pendingResults.map((item, index) => (
                              <div key={item.id} className={`backdrop-blur-sm rounded-2xl border shadow-clayStrong p-4 transition-colors duration-200 ${
                                isDark 
                                  ? 'bg-[#3a3a3a]/60 hover:bg-[#3a3a3a]/70 border-[#4a4a4a]' 
                                  : 'bg-clay-100/60 hover:bg-clay-200/40 border-clay-200'
                              }`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className={`text-sm font-bold mb-1 ${
                                      isDark ? 'text-white' : 'text-gray-800'
                                    }`}>{item.identifiedFoodName}</h4>
                                    {item.originalDescription && (
                                      <div className={`text-xs backdrop-blur-sm rounded-lg px-2 py-1 inline-block shadow-sm border mb-2 ${
                                        isDark 
                                          ? 'bg-[#4a4a4a]/60 border-[#5a5a5a] text-gray-300' 
                                          : 'bg-clay-100/60 border-clay-200 text-gray-600'
                                      }`}>
                                        From: {item.originalDescription.substring(0, 25)}...
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                    className={`h-8 w-8 rounded-xl transition-all duration-200 shadow-sm ml-2 ${
                                      isDark 
                                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-purple-900/40 border border-purple-500/30' 
                                      : 'bg-purple-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-purple-300' : 'text-purple-600'
                                    }`}>Calories</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-purple-200' : 'text-purple-700'
                                    }`}>{item.calories.toFixed(0)}</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-blue-900/40 border border-blue-500/30' 
                                      : 'bg-blue-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-blue-300' : 'text-blue-600'
                                    }`}>Protein</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-blue-200' : 'text-blue-700'
                                    }`}>{item.protein.toFixed(1)}g</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-green-900/40 border border-green-500/30' 
                                      : 'bg-green-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-green-300' : 'text-green-600'
                                    }`}>Carbs</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-green-200' : 'text-green-700'
                                    }`}>{item.carbohydrates.toFixed(1)}g</div>
                                  </div>
                                  <div className={`rounded-lg p-2 ${
                                    isDark 
                                      ? 'bg-orange-900/40 border border-orange-500/30' 
                                      : 'bg-orange-50'
                                  }`}>
                                    <div className={`text-xs font-medium ${
                                      isDark ? 'text-orange-300' : 'text-orange-600'
                                    }`}>Fat</div>
                                    <div className={`text-sm font-bold ${
                                      isDark ? 'text-orange-200' : 'text-orange-700'
                                    }`}>{item.fat.toFixed(1)}g</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Desktop Table View */}
                          <div className={`hidden md:block overflow-hidden rounded-2xl border shadow-clayStrong backdrop-blur-sm ${
                            isDark 
                              ? 'bg-[#3a3a3a]/40 border-[#4a4a4a]' 
                              : 'bg-clay-100/40 border-clay-200'
                          }`}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className={`backdrop-blur-sm ${
                                  isDark 
                                    ? 'bg-[#4a4a4a]/50' 
                                    : 'bg-clay-300/50'
                                }`}>
                                  <tr>
                                    <th className={`text-left py-3 md:py-5 px-3 md:px-6 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>AI Identified Food</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Calories</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Protein</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Carbs</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Fat</th>
                                    <th className={`text-center py-3 md:py-5 px-2 md:px-4 text-xs md:text-sm font-bold ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody className={`backdrop-blur-sm ${
                                  isDark 
                                    ? 'bg-[#3a3a3a]/30' 
                                    : 'bg-clay-100/30'
                                }`}>
                                  {pendingResults.map((item, index) => (
                                    <tr key={item.id} className={`border-b transition-colors duration-200 ${
                                      isDark 
                                        ? 'hover:bg-[#3a3a3a]/40 bg-[#3a3a3a]/30 border-[#4a4a4a]' 
                                        : 'hover:bg-clay-200/40 bg-clay-100/30 border-clay-200'
                                    }`}>
                                      <td className="py-3 md:py-5 px-3 md:px-6">
                                        <div>
                                          <div className={`text-sm md:text-base font-bold mb-1 md:mb-2 ${
                                            isDark ? 'text-white' : 'text-gray-800'
                                          }`}>{item.identifiedFoodName}</div>
                                          {item.originalDescription && (
                                            <div className={`text-xs md:text-sm backdrop-blur-sm rounded-xl px-2 md:px-4 py-1 md:py-2 inline-block shadow-clayStrong border ${
                                              isDark 
                                                ? 'bg-[#4a4a4a]/60 border-[#5a5a5a] text-gray-300' 
                                                : 'bg-clay-100/60 border-clay-200 text-gray-600'
                                            }`}>
                                              From: {item.originalDescription.substring(0, 30)}...
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-bold ${
                                        isDark ? 'text-purple-300' : 'text-purple-600'
                                      }`}>{item.calories.toFixed(0)}</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-blue-300' : 'text-blue-700'
                                      }`}>{item.protein.toFixed(1)}g</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-green-300' : 'text-green-700'
                                      }`}>{item.carbohydrates.toFixed(1)}g</td>
                                      <td className={`text-center py-3 md:py-5 px-2 md:px-4 text-sm md:text-base font-semibold ${
                                        isDark ? 'text-orange-300' : 'text-orange-700'
                                      }`}>{item.fat.toFixed(1)}g</td>
                                      <td className="text-center py-3 md:py-5 px-2 md:px-4">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(item.id)}
                                          className={`h-8 w-8 md:h-10 md:w-10 rounded-xl transition-all duration-200 shadow-clayStrong ${
                                            isDark 
                                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                              : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                          }`}
                                        >
                                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        {/* Confirm Button */}
                        <Button
                          onClick={confirmAndLogFood}
                          className="w-full h-12 sm:h-14 md:h-16 font-bold rounded-2xl mt-6 md:mt-8 flex items-center justify-center space-x-2 md:space-x-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-clayStrong text-sm sm:text-base md:text-lg bg-green-500 hover:bg-green-600 text-white"
                          disabled={pendingResults.length === 0 || isLoading}
                        >
                          <Target className="w-4 h-4 md:w-6 md:h-6" />
                          <span>Confirm & Log {pendingResults.length} Item{pendingResults.length > 1 ? 's' : ''}</span>
                          <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}{/* Bottom Information */}
            {pendingResults.length === 0 && !isLoading && (
              <div className="text-center mt-8 md:mt-10 pt-6 md:pt-8 border-t border-opacity-20">
                <div className="backdrop-blur-sm rounded-2xl p-4 md:p-6 border shadow-clayStrong bg-clay-100/40">
                  <div className="flex items-center justify-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                    <h4 className="text-base md:text-lg font-bold text-gray-800">Ready to Transform Your Nutrition?</h4>
                  </div>
                  <p className="leading-relaxed text-sm md:text-base text-gray-600">
                    Your identified food items will appear below for review and confirmation before adding to your daily log.
                  </p>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </motion.div>        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className={`backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl mb-6 md:mb-8 ${
              isDark 
                ? 'bg-red-900/30 border-red-600/30' 
                : 'bg-red-100/70'
            }`}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`} />
                  <p className={`text-sm md:text-base font-medium ${
                    isDark ? 'text-red-300' : 'text-red-700'
                  }`}>
                    {error}
                  </p>
                </div>
              </CardContent>
            </Card>          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}
