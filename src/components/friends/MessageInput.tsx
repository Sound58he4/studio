// src/components/friends/MessageInput.tsx
"use client";

import React, { useState, useRef, useCallback, ChangeEvent, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, Camera, X, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
    newMessage: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: (text: string, voiceUri?: string, imageUri?: string) => void;
    isSending: boolean;
    isAISelected: boolean;
    className?: string;
}

const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(({
    newMessage, onInputChange, onSendMessage, isSending, isAISelected, className
}, ref) => {
    const { toast } = useToast();
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const startRecording = async () => {
        resetImageInput();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioPreviewUrl(url);
                stream.getTracks().forEach(track => track.stop());
                if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioPreviewUrl(null);
            setAudioBlob(null);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            console.error("Mic error:", err);
            toast({ variant: "destructive", title: "Microphone Error", description: "Could not access microphone. Check permissions." });
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
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            resetVoiceInput();
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else if (file) {
            toast({ variant: "destructive", title: "Invalid File", description: "Please select an image file." });
        }
    };

    const triggerImageUpload = () => imageInputRef.current?.click();

    const resetVoiceInput = () => {
        stopRecording();
        setAudioBlob(null);
        setAudioPreviewUrl(null);
        setRecordingTime(0);
    };

    const resetImageInput = () => {
        setImageFile(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };    const handleSend = useCallback(() => {
        if (isSending) return;
        const text = newMessage.trim();
        if (!text && !audioBlob && !imagePreview) return;

        if (audioBlob) {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const voiceUri = reader.result as string;
                onSendMessage(text, voiceUri, undefined);
                resetVoiceInput();
            };
            reader.onerror = () => {
                 toast({ variant: "destructive", title: "Error", description: "Failed to process audio." });
            }
        } else if (imagePreview) {
            onSendMessage(text, undefined, imagePreview); 
            resetImageInput();
        } else {
            onSendMessage(text, undefined, undefined); 
        }
    }, [newMessage, audioBlob, imagePreview, isSending, onSendMessage, resetVoiceInput, resetImageInput, toast]);    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSend();
        }
    }, [handleSend]);    return (
        <div className={cn("flex items-center space-x-2 sm:space-x-3", className)}>
            {isAISelected && (
                <>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={triggerImageUpload}
                        disabled={isSending || isRecording}
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-300 flex-shrink-0 text-gray-500 hover:text-purple-600 hover:bg-purple-50/80"
                    >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isSending || !!imagePreview}
                        className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-300 flex-shrink-0",
                            isRecording 
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50/80" 
                                : "text-gray-500 hover:text-purple-600 hover:bg-purple-50/80"
                        )}
                    >
                        {isRecording ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </Button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={imageInputRef} 
                        onChange={handleImageChange} 
                        className="hidden" 
                        aria-label="Upload image"
                        title="Upload image"
                    />
                </>
            )}
            
            <div className="flex-1 relative min-w-0">
                <Input
                    ref={ref}
                    value={newMessage}
                    onChange={onInputChange}
                    placeholder="Type a message..."
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isRecording}
                    className="pr-10 sm:pr-12 border-0 rounded-full h-8 sm:h-10 text-xs sm:text-sm focus:ring-2 focus:ring-purple-200/50 transition-all backdrop-blur-sm bg-gray-100/80 focus:bg-white/80"
                />
                <Button
                    onClick={handleSend}
                    disabled={(!newMessage.trim() && !audioBlob && !imagePreview) || isSending || isRecording}
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 rounded-full disabled:opacity-50 shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600"
                >
                    {isSending ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </motion.div>
                    ) : (
                        <Send className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    )}
                </Button>
            </div>

            {/* Preview containers */}
            <AnimatePresence mode="wait">
                {(audioPreviewUrl || imagePreview) && (
                    <motion.div 
                        className="absolute bottom-full left-0 right-0 mb-2 p-2 sm:p-3 border rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg border-gray-200/50 relative"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        layout
                    >
                        {audioPreviewUrl && !isRecording && (
                            <motion.div 
                                className="flex items-center gap-2 sm:gap-3"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <audio controls src={audioPreviewUrl} className="w-full h-6 sm:h-8 rounded-xl"></audio>
                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 flex-shrink-0" onClick={resetVoiceInput} title="Clear Audio"> 
                                    <X size={14}/> 
                                </Button>
                            </motion.div>
                        )}
                        {imagePreview && (
                            <motion.div 
                                className="flex items-center gap-2 sm:gap-3"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <img src={imagePreview} alt="Preview" className="h-8 w-8 sm:h-12 sm:w-12 object-cover rounded-xl shadow-lg flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-600 truncate flex-grow font-medium">{imageFile?.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 flex-shrink-0" onClick={resetImageInput} title="Clear Image"> 
                                    <X size={14}/> 
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recording indicator */}
            <AnimatePresence mode="wait">
                {isRecording && (
                    <motion.div 
                        className="absolute bottom-full left-0 right-0 mb-2 p-2 sm:p-3 border border-red-300/50 rounded-xl sm:rounded-2xl bg-red-50/90 backdrop-blur-sm flex items-center justify-between gap-2 sm:gap-3 shadow-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        layout
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div 
                                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <span className="text-xs sm:text-sm font-medium text-red-700">Recording...</span>
                            <span className="text-xs sm:text-sm font-mono text-red-600 bg-red-100/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl">{formatTime(recordingTime)}</span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-red-100/80 border-red-300/50 text-red-600 hover:bg-red-200/80 hover:border-red-400/50 transition-all duration-300 flex-shrink-0" 
                            onClick={stopRecording} 
                            title="Stop Recording"
                        > 
                            <Pause size={12} className="sm:size-4"/> 
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

MessageInput.displayName = 'MessageInput';
export default MessageInput;
