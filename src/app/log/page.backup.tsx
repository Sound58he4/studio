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
import { Camera, Mic, FileText, Loader2, CheckCircle, AlertCircle, Upload, Trash2, Send, PlusCircle, ListRestart, Utensils, Pause, Play, Sparkles, Brain, Target, ChefHat, Zap, ImageIcon } from "lucide-react"; 
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
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'voice'>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false); 
  const [pendingResults, setPendingResults] = useState<ProcessedFoodResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mealDescription, setMealDescription] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<SuggestionItem[]>([]); 
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [showReviewSection, setShowReviewSection] = useState(false);

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
      if (tabToKeep !== 'text') {
          setMealDescription("");
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

  useEffect(() => {
    setShowReviewSection(pendingResults.length > 0);
  }, [pendingResults]);

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
  };

   const startRecording = async () => {
    try {
        // Check if MediaDevices API is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Voice recording is not supported in this browser or requires HTTPS.");
            toast({ 
                title: "Voice Recording Unavailable", 
                description: "Please use a modern browser with HTTPS or try manual input.", 
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGetAISuggestions = () => {
    console.log('Getting AI suggestions for:', mealDescription);
    if (mealDescription.trim()) {
      fetchSuggestions();
    } else {
      toast({ title: "No description", description: "Please enter a meal description first.", variant: "destructive" });
    }
  };

  const handleIdentifyAndEstimate = () => {
    if (!mealDescription.trim()) {
      setError("Please enter a meal description first.");
      return;
    }
    handleManualSubmit();
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleClearAll = () => {
    clearAllPending();
    setShowReviewSection(false);
  };

  const handleConfirmAndLog = () => {
    confirmAndSaveLogs();
  };

  const handleSelectImage = () => {
    triggerImageUpload();
  };

  const handleAddFromImage = () => {
    handleImageSubmit();
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAddFromVoice = () => {
    handleVoiceSubmit();
  };

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
          setMealDescription("");
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

  useEffect(() => {
    setShowReviewSection(pendingResults.length > 0);
  }, [pendingResults]);

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
  };

   const startRecording = async () => {
    try {
        // Check if MediaDevices API is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Voice recording is not supported in this browser or requires HTTPS.");
            toast({ 
                title: "Voice Recording Unavailable", 
                description: "Please use a modern browser with HTTPS or try manual input.", 
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGetAISuggestions = () => {
    console.log('Getting AI suggestions for:', mealDescription);
    if (mealDescription.trim()) {
      fetchSuggestions();
    } else {
      toast({ title: "No description", description: "Please enter a meal description first.", variant: "destructive" });
    }
  };

  const handleIdentifyAndEstimate = () => {
    if (!mealDescription.trim()) {
      setError("Please enter a meal description first.");
      return;
    }
    handleManualSubmit();
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleClearAll = () => {
    clearAllPending();
    setShowReviewSection(false);
  };

  const handleConfirmAndLog = () => {
    confirmAndSaveLogs();
  };

  const handleSelectImage = () => {
    triggerImageUpload();
  };

  const handleAddFromImage = () => {
    handleImageSubmit();
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAddFromVoice = () => {
    handleVoiceSubmit();
  };

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
          setMealDescription("");
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

  useEffect(() => {
    setShowReviewSection(pendingResults.length > 0);
  }, [pendingResults]);

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
  };

   const startRecording = async () => {
    try {
        // Check if MediaDevices API is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Voice recording is not supported in this browser or requires HTTPS.");
            toast({ 
                title: "Voice Recording Unavailable", 
                description: "Please use a modern browser with HTTPS or try manual input.", 
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGetAISuggestions = () => {
    console.log('Getting AI suggestions for:', mealDescription);
    if (mealDescription.trim()) {
      fetchSuggestions();
    } else {
      toast({ title: "No description", description: "Please enter a meal description first.", variant: "destructive" });
    }
  };

  const handleIdentifyAndEstimate = () => {
    if (!mealDescription.trim()) {
      setError("Please enter a meal description first.");
      return;
    }
    handleManualSubmit();
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleClearAll = () => {
    clearAllPending();
    setShowReviewSection(false);
  };

  const handleConfirmAndLog = () => {
    confirmAndSaveLogs();
  };

  const handleSelectImage = () => {
    triggerImageUpload();
  };

  const handleAddFromImage = () => {
    handleImageSubmit();
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAddFromVoice = () => {
    handleVoiceSubmit();
  };

  // ...existing image change handler...

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
      className="min-h-screen w-full px-2 sm:px-4 py-2 sm:py-4 md:py-8"
    >
      {/* Animated background gradient */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="fixed inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none -z-10" 
      />
      
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="shadow-xl border border-border/20 bg-card/95 backdrop-blur-sm relative overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-card to-card border-b p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                 <Utensils className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"/> 
                 <span className="leading-tight">Log Your Meal</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1 text-muted-foreground">
                Add meals using text, image, or voice. Review AI estimations before confirming.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-3 sm:p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 bg-muted/80 h-10 sm:h-12 shadow-inner">
                  <TabsTrigger value="manual" className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-l-md">
                    <Type className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5"/>
                    <span className="hidden xs:inline">Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200">
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5"/>
                    <span className="hidden xs:inline">Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200 rounded-r-md">
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5"/>
                    <span className="hidden xs:inline">Voice</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                    <Label htmlFor="manual-food" className="text-sm sm:text-base font-medium block mb-1">Describe Your Meal</Label>
                    <Textarea 
                      id="manual-food" 
                      placeholder="E.g., 'Large bowl of oatmeal with berries and nuts', 'Chicken curry with rice'" 
                      value={manualInput} 
                      onChange={(e) => setManualInput(e.target.value)} 
                      className="min-h-[100px] sm:min-h-[120px] resize-y text-sm sm:text-base p-2 sm:p-3 shadow-sm focus:ring-2 focus:ring-primary/50 border-input bg-background/90 transition-shadow hover:shadow-md" 
                      disabled={isLoading} 
                      rows={3} 
                    />
                     <div className="space-y-3 pt-2 sm:pt-3">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                             <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                <BrainCircuit size={16} className="text-primary"/> 
                                <span>AI Suggestions</span>
                                {isSuggesting && <Loader2 size={14} className="animate-spin text-primary ml-1"/>}
                             </Label>
                             <Button
                                 type="button"
                                 variant="secondary"
                                 onClick={fetchSuggestions}
                                 disabled={isSuggesting || !userId}
                                 className={cn(
                                   "text-sm h-9 px-4 font-medium transition-all duration-200",
                                   "relative overflow-hidden group shadow hover:shadow-md",
                                   "border border-primary/20 hover:border-primary/40",
                                   "w-full sm:w-auto rounded-md",
                                   isSuggesting ? "bg-primary/10" : "bg-gradient-to-r from-primary/10 via-background to-primary/5"
                                 )}
                             >
                                 <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                 <BrainCircuit size={16} className="mr-2 text-primary" /> 
                                 <span className="relative z-10">{isSuggesting ? "Getting Suggestions..." : "Get AI Suggestions"}</span>
                                 {isSuggesting && <Loader2 size={16} className="ml-2 animate-spin text-primary" />}
                             </Button>
                         </div>
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
                                                    className={cn(
                                                        "text-xs rounded-lg border-dashed hover:bg-primary/10 hover:border-primary/50 h-8 px-2 sm:px-3",
                                                        "group relative overflow-hidden shadow-sm", 
                                                        "transition-all duration-300 ease-out",
                                                        "animate-in fade-in zoom-in-95 flex-shrink-0"
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
                                                    <span className="relative z-10 truncate max-w-[120px] sm:max-w-none">{suggestion.suggestionName}</span>
                                               </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="p-2 sm:p-3 max-w-xs bg-popover text-popover-foreground border shadow-lg rounded-md text-xs z-50">
                                                <p className="font-semibold text-sm mb-1">{suggestion.suggestionName}</p>
                                                <p className="text-muted-foreground mb-2 italic text-xs">{suggestion.reason}</p>
                                                {suggestion.quantity && (
                                                     <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs"><Scale size={12} /> Quantity: <span className="font-medium text-foreground/90">{suggestion.quantity}</span></p>
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
                              <p className="text-xs text-muted-foreground italic py-1">Click "Get AI Suggestions" to see personalized food recommendations based on your eating habits.</p>
                         )}
                     </div>

                     <Button onClick={handleManualSubmit} disabled={!manualInput.trim() || isLoading} className="w-full text-sm sm:text-base py-2.5 sm:py-3 bg-primary hover:bg-primary/90 shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2">
                       {isLoading && <><Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Processing...</>}
                       {!isLoading && <><Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> Identify & Estimate</>}
                     </Button>
                </TabsContent>

                <TabsContent value="image" className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                   <Label htmlFor="picture" className="text-sm sm:text-base font-medium block mb-1">Upload Meal Photo</Label>
                   <div className="relative border-2 border-dashed border-muted rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center min-h-[200px] sm:min-h-[250px] bg-muted/30 hover:border-primary transition-colors duration-200 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-card via-muted/10 to-card opacity-50 z-0"></div>
                      <Input ref={imageInputRef} id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      {imagePreview ? (
                         <div className="relative mb-3 sm:mb-4 group-hover:scale-105 transition-transform duration-300 ease-out z-10">
                           <Image src={imagePreview} alt="Meal preview" width={150} height={150} className="max-h-32 sm:max-h-40 w-auto rounded-md object-contain shadow-lg border" />
                           <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md opacity-80 hover:opacity-100 transform hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); if (imageInputRef.current) imageInputRef.current.value = ""; }}> <Trash2 className="h-3 w-3"/> </Button>
                         </div>
                      ) : ( <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4 group-hover:text-primary transition-colors z-10" /> )}
                      <Button variant="outline" size="lg" onClick={triggerImageUpload} disabled={isLoading} className="shadow-md bg-card hover:bg-accent/10 hover:border-accent group-hover:scale-105 transition-transform duration-300 ease-out z-10 text-sm sm:text-base px-4 sm:px-6"> 
                        <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> {imagePreview ? "Change Image" : "Select Image"} 
                      </Button>
                      {!imagePreview && <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 z-10 px-2">Upload a photo to identify food items.</p>}
                  </div>
                  <Button onClick={handleImageSubmit} disabled={!imagePreview || isLoading} className="w-full text-sm sm:text-base py-2.5 sm:py-3 bg-primary hover:bg-primary/90 shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"> 
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Analyzing...</> : <><Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> Add from Image</>} 
                  </Button>
                </TabsContent>

                <TabsContent value="voice" className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                   <Label className="text-sm sm:text-base font-medium block mb-2">Record Meal Description</Label>
                    <div className="border border-muted rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center space-y-4 sm:space-y-5 min-h-[200px] sm:min-h-[250px] bg-gradient-to-br from-muted/20 via-card to-muted/30 shadow-inner relative overflow-hidden">
                        {isRecording && (
                           <div className="absolute inset-0 z-0 opacity-30 overflow-hidden rounded-lg"> 
                               <div className="absolute bottom-0 left-1/2 w-[300%] h-[300%] bg-red-500/20 rounded-full animate-pulse origin-bottom" style={{ transform: 'translateX(-50%) scale(1)', animationDuration: '4s' }}></div>
                               <div className="absolute bottom-0 left-1/2 w-[250%] h-[250%] bg-red-500/30 rounded-full animate-pulse origin-bottom" style={{ transform: 'translateX(-50%) scale(0.8)', animationDuration: '4s', animationDelay: '1s' }}></div>
                           </div>
                        )}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center z-10 mb-2 sm:mb-3">
                           <div className={cn("absolute inset-0 rounded-full border-4 transition-all duration-500 ease-out", isRecording ? "border-red-500/50 scale-110 animate-ping" : "border-primary/30")}></div>
                           <Mic className={cn("h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 z-10 transition-colors duration-300", isRecording ? "text-red-500" : "text-primary")} />
                      </div>
                      <p className="text-base sm:text-lg font-mono font-semibold text-foreground min-w-[60px] text-center z-10 bg-background/50 px-2 sm:px-3 py-1 rounded-md shadow-sm border border-border/30"> {formatTime(recordingTime)} </p>
                      <Button variant={isRecording ? "destructive" : "outline"} size="lg" onClick={isRecording ? stopRecording : startRecording} disabled={isLoading} className={cn(
                           "w-full sm:w-auto px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 text-sm sm:text-base shadow-md bg-card",
                           "transform hover:scale-105 transition-transform rounded-full z-10",
                           "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                           isRecording ? "hover:bg-red-700" : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                        )}>
                           {isRecording ? <Pause className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> : <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>} 
                           <span className="hidden xs:inline">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                           <span className="xs:hidden">{isRecording ? "Stop" : "Record"}</span>
                      </Button>
                       {audioPreviewUrl && !isRecording && (
                           <div className="w-full mt-3 sm:mt-4 p-2 sm:p-3 bg-background rounded shadow-inner border z-10 animate-in fade-in duration-300">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Preview Recording:</p>
                              <audio controls src={audioPreviewUrl} className="w-full h-8 sm:h-10"></audio>
                              <Button variant="link" size="sm" className="text-xs h-auto p-0 text-muted-foreground hover:text-destructive mt-1" onClick={() => {
                                  if (audioPreviewUrl) {
                                      URL.revokeObjectURL(audioPreviewUrl);
                                  }
                                  setAudioPreviewUrl(null); 
                                  setAudioBlob(null);
                              }}>Clear Recording</Button>
                           </div>
                       )}
                        {!isRecording && !audioPreviewUrl && ( 
                            <div className="text-center z-10 px-2 sm:px-4">
                                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Click "Start Recording" and describe your meal aloud.</p>
                                <p className="text-xs text-muted-foreground">(e.g., "I had a grilled chicken salad")</p>
                                <p className="text-xs text-muted-foreground mt-2 italic">Note: Requires microphone permission and HTTPS/localhost</p>
                            </div>
                        )}
                  </div>
                   <Button onClick={handleVoiceSubmit} disabled={!audioBlob || isLoading || isRecording} className="w-full text-sm sm:text-base py-2.5 sm:py-3 bg-primary hover:bg-primary/90 shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"> 
                     {isLoading ? <><Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Processing...</> : <><Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> Add from Voice</>} 
                   </Button>
                </TabsContent>

              </Tabs>

              {error && ( 
                <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-start gap-2 shadow-sm animate-in fade-in duration-300"> 
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5"/> 
                  <p className="text-xs sm:text-sm font-medium">{error}</p> 
                </div> 
              )}

               {pendingResults.length > 0 && (
                 <Card className="mt-4 sm:mt-6 md:mt-8 border-accent/50 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gradient-to-br from-accent/5 via-card to-card overflow-hidden">
                   <CardHeader className="bg-accent/10 border-b border-accent/30 p-3 sm:p-4">
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-4">
                         <div>
                             <CardTitle className="text-accent flex items-center gap-2 text-base sm:text-lg md:text-xl"> 
                               <Sparkles className="h-4 w-4 sm:h-5 sm:w-5"/> Review Added Items ({pendingResults.length}) 
                             </CardTitle>
                             <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">Review AI estimations. Remove incorrect items before confirming.</CardDescription>
                         </div>
                          <Button variant="outline" size="sm" onClick={clearAllPending} className="text-xs flex-shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 self-start sm:self-center transform hover:scale-105 transition-transform focus:ring-1 focus:ring-destructive px-2 sm:px-3"> 
                            <ListRestart className="mr-1 h-3 w-3"/> Clear All 
                          </Button>
                     </div>
                   </CardHeader>
                   <CardContent className="p-0">
                       <div className="max-h-[50vh] sm:max-h-[40vh] overflow-y-auto">
                           <ul className="divide-y divide-border/50">
                                <li className="py-2 px-3 sm:px-4 hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0 backdrop-blur-sm z-10 border-b">
                                   <span className="col-span-5 pl-1">Food Item (AI Identified)</span>
                                   <span className="col-span-2 text-right">Calories (kcal)</span>
                                   <span className="col-span-1 text-right">P (g)</span>
                                   <span className="col-span-1 text-right">C (g)</span>
                                   <span className="col-span-1 text-right">F (g)</span>
                                   <span className="col-span-2 text-right">Actions</span>
                                </li>
                               {pendingResults.map((item, index) => (
                               <li key={item.id} className={cn(
                                   "py-2.5 px-3 sm:px-4 grid grid-cols-6 sm:grid-cols-12 gap-2 text-sm items-center group hover:bg-muted/20 transition-colors duration-150",
                                   "animate-in fade-in slide-in-from-left-3 duration-300 ease-out"
                               )} style={{ animationDelay: `${index * 30}ms` }}>
                                   <div className="col-span-5 sm:col-span-5 flex flex-col min-w-0">
                                       <span className="font-medium break-words leading-tight text-foreground text-xs sm:text-sm"> {item.identifiedFoodName}</span>
                                        {item.originalDescription && item.originalDescription !== item.identifiedFoodName && (
                                           <span className="text-xs text-muted-foreground block italic truncate" title={`Original: ${item.originalDescription}`}> (From: {item.originalDescription.substring(0,20)}...)</span>
                                        )}
                                        <span className="sm:hidden text-xs text-muted-foreground tabular-nums mt-1">{item.calories.toFixed(0)} kcal | P:{item.protein.toFixed(1)}g | C:{item.carbohydrates.toFixed(1)}g | F:{item.fat.toFixed(1)}g</span>
                                   </div>
                                   <span className="hidden sm:block col-span-2 text-right tabular-nums font-medium text-sm">{item.calories.toFixed(0)}</span>
                                   <span className="hidden sm:block col-span-1 text-right tabular-nums text-sm">{item.protein.toFixed(1)}</span>
                                   <span className="hidden sm:block col-span-1 text-right tabular-nums text-sm">{item.carbohydrates.toFixed(1)}</span>
                                   <span className="hidden sm:block col-span-1 text-right tabular-nums text-sm">{item.fat.toFixed(1)}</span>
                                    <div className="col-span-1 sm:col-span-2 flex justify-end items-center">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity duration-150 transform hover:scale-110 focus:ring-1 focus:ring-destructive rounded-full" onClick={() => removeItem(item.id)} title="Remove item"> <Trash2 className="h-3 w-3 sm:h-4 sm:w-4"/> </Button>
                                   </div>
                               </li>
                               ))}
                           </ul>
                       </div>
                   </CardContent>
                    <CardFooter className="p-3 sm:p-4 bg-gradient-to-t from-muted/20 via-card to-card border-t border-border/30 mt-auto">
                       <Button onClick={confirmAndLogFood} className="w-full text-sm sm:text-base py-2.5 sm:py-3 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-[1.02] transition-transform duration-200 focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2" disabled={pendingResults.length === 0 || isLoading}> 
                         <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> Confirm & Log {pendingResults.length} Item(s) 
                       </Button>
                    </CardFooter>
                 </Card>
               )}
               {pendingResults.length === 0 && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center py-6 sm:py-8 md:py-10 text-muted-foreground italic"
                  >
                      <p className="mb-1 text-sm sm:text-base">Add meals using the options above.</p>
                      <p className="text-xs sm:text-sm">Your added items will appear here for review before logging.</p>
                  </motion.div>
               )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
