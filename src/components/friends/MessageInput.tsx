// src/components/friends/MessageInput.tsx
"use client";

import React, { useState, useRef, useCallback, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, Camera, X, Pause, Play, Upload } from 'lucide-react'; // Added icons
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
    newMessage: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: (text: string, voiceUri?: string, imageUri?: string) => void; // Updated signature
    isSending: boolean;
    isAISelected: boolean;
    className?: string; // Added className
}

const MessageInput: React.FC<MessageInputProps> = React.memo(({
    newMessage, onInputChange, onSendMessage, isSending, isAISelected, className // Added className
}) => {
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
        resetImageInput(); // Clear image if starting voice
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
                 recordingIntervalRef.current = null; // Clear interval ref
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
            resetVoiceInput(); // Clear voice if adding image
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
        stopRecording(); // Ensure recording stops
        setAudioBlob(null);
        setAudioPreviewUrl(null);
        setRecordingTime(0);
    };

    const resetImageInput = () => {
        setImageFile(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleSend = () => {
        if (isSending) return;

        const text = newMessage.trim();

        if (!text && !audioBlob && !imagePreview) {
            return;
        }

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
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSend();
        }
    };

    return (
        <motion.div 
            className={cn("p-2 sm:p-3 border-t bg-muted/50 sticky bottom-0 z-10 backdrop-blur-sm", className)}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <AnimatePresence mode="wait">
                {(audioPreviewUrl || imagePreview) && (
                    <motion.div 
                        className="mb-2 p-2 border rounded-md bg-background shadow-sm relative"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {audioPreviewUrl && !isRecording && (
                             <motion.div 
                                 className="flex items-center gap-2"
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: 0.1, duration: 0.2 }}
                             >
                                <audio controls src={audioPreviewUrl} className="w-full h-8 sm:h-10"></audio>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={resetVoiceInput} title="Clear Audio"> 
                                        <X size={14}/> 
                                    </Button>
                                </motion.div>
                             </motion.div>
                        )}
                         {imagePreview && (
                             <motion.div 
                                 className="flex items-center gap-2"
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: 0.1, duration: 0.2 }}
                             >
                                <motion.img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded" 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.2, type: "spring" }}
                                />
                                <span className="text-xs text-muted-foreground truncate flex-grow">{imageFile?.name}</span>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={resetImageInput} title="Clear Image"> 
                                        <X size={14}/> 
                                    </Button>
                                </motion.div>
                             </motion.div>
                        )}
                    </motion.div>
                )}

                {isRecording && (
                     <motion.div 
                         className="mb-2 p-2 border border-red-500/50 rounded-md bg-red-100/30 dark:bg-red-900/20 flex items-center justify-between gap-2"
                         initial={{ opacity: 0, scale: 0.95, y: -10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95, y: -10 }}
                         transition={{ duration: 0.2 }}
                     >
                         <div className="flex items-center gap-2">
                            <motion.div 
                                className="w-2 h-2 rounded-full bg-red-500"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <motion.span 
                                className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                Recording...
                            </motion.span>
                            <span className="text-xs font-mono text-red-700 dark:text-red-300">{formatTime(recordingTime)}</span>
                         </div>
                         <motion.div
                             whileHover={{ scale: 1.1 }}
                             whileTap={{ scale: 0.9 }}
                         >
                             <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-6 sm:w-6 rounded-full" onClick={stopRecording} title="Stop Recording"> 
                                 <Pause size={14}/> 
                             </Button>
                         </motion.div>
                     </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-1.5 sm:gap-2 items-center">
                 {isAISelected && (
                     <>
                        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button type="button" variant="ghost" size="icon" onClick={triggerImageUpload} disabled={isSending || isRecording} className="h-10 w-10 sm:h-11 sm:w-11 text-muted-foreground hover:text-primary flex-shrink-0" title="Attach Image">
                                <Camera size={18}/>
                            </Button>
                        </motion.div>
                         <motion.div
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                             transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
                         >
                             <Button type="button" variant="ghost" size="icon" onClick={isRecording ? stopRecording : startRecording} disabled={isSending || !!imagePreview} className={cn("h-10 w-10 sm:h-11 sm:w-11 text-muted-foreground flex-shrink-0", isRecording ? "text-red-500 hover:text-red-600 hover:bg-red-100/50" : "hover:text-primary")} title={isRecording ? "Stop Recording" : "Record Voice"}>
                                {isRecording ? <Pause size={18}/> : <Mic size={18}/>}
                            </Button>
                         </motion.div>
                     </>
                 )}
                <motion.div
                    className="flex-1"
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                >
                    <Input
                        placeholder={isAISelected ? "Ask Bago AI anything..." : "Send a message..."}
                        value={newMessage}
                        onChange={onInputChange}
                        onKeyDown={handleKeyDown}
                        className="flex-1 h-10 sm:h-11 text-sm bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner"
                        autoComplete="off"
                        aria-label="Chat message input"
                        disabled={isSending || isRecording}
                    />
                </motion.div>
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isSending ? { rotate: [0, 360] } : {}}
                    transition={isSending ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
                >
                    <Button type="submit" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 rounded-lg bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-md" disabled={(!newMessage.trim() && !audioBlob && !imagePreview) || isSending || isRecording}>
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </Button>
                </motion.div>
            </form>
        </motion.div>
    );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
