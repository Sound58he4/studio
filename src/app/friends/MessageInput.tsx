// src/components/friends/MessageInput.tsx
"use client";

import React, { useState, useRef, useCallback, ChangeEvent, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, Camera, X, Pause, Play } from 'lucide-react'; // Removed Upload, not used
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
    newMessage: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: (text: string, voiceUri?: string, imageUri?: string) => void;
    isSending: boolean;
    isAISelected: boolean;
    isDark?: boolean;
}

const MessageInput = forwardRef<HTMLInputElement, MessageInputProps>(({
    newMessage, onInputChange, onSendMessage, isSending, isAISelected, isDark = false
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
    // const localInputRef = useRef<HTMLInputElement>(null); // For internal focus if needed

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
    };

    const handleSend = () => {
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
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSend();
        }
    };

    return (
        <div className={`p-2 border-t backdrop-blur-sm shadow-clay flex-shrink-0 min-h-[56px] flex flex-col justify-center ${
            isDark 
                ? 'bg-[#2a2a2a]/80 border-[#3a3a3a]/30' 
                : 'bg-clayGlass border-clay-300/30'
        }`}>
            {(audioPreviewUrl || imagePreview) && (
                <div className={`mb-2 p-2 border rounded-xl backdrop-blur-sm shadow-clay relative ${
                    isDark 
                        ? 'bg-[#3a3a3a]/60 border-[#4a4a4a]/30' 
                        : 'bg-clayGlass border-clay-300/30'
                }`}>
                    {audioPreviewUrl && !isRecording && (
                         <div className="flex items-center gap-2">
                            <audio controls src={audioPreviewUrl} className={`w-full h-8 ${
                                isDark ? 'bg-[#1a1a1a] text-gray-300' : ''
                            }`}></audio>
                            <Button variant="ghost" size="icon" className={`h-6 w-6 hover:text-destructive ${
                                isDark ? 'text-gray-400' : 'text-muted-foreground'
                            }`} onClick={resetVoiceInput} title="Clear Audio"> <X size={14}/> </Button>
                         </div>
                    )}
                     {imagePreview && (
                         <div className="flex items-center gap-2">
                            <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                            <span className={`text-xs truncate flex-grow ${
                                isDark ? 'text-gray-400' : 'text-muted-foreground'
                            }`}>{imageFile?.name}</span>
                            <Button variant="ghost" size="icon" className={`h-6 w-6 hover:text-destructive ${
                                isDark ? 'text-gray-400' : 'text-muted-foreground'
                            }`} onClick={resetImageInput} title="Clear Image"> <X size={14}/> </Button>
                         </div>
                    )}
                </div>
            )}

            {isRecording && (
                 <div className={`mb-2 p-2 border border-red-500/50 rounded-xl backdrop-blur-sm flex items-center justify-between gap-2 animate-pulse shadow-clay ${
                     isDark 
                         ? 'bg-red-900/20' 
                         : 'bg-red-50/30'
                 }`}>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping duration-1000"></div>
                        <span className={`text-xs font-medium ${
                            isDark ? 'text-red-400' : 'text-red-600'
                        }`}>Recording...</span>
                        <span className={`text-xs font-mono ${
                            isDark ? 'text-red-300' : 'text-red-700'
                        }`}>{formatTime(recordingTime)}</span>
                     </div>
                     <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={stopRecording} title="Stop Recording"> <Pause size={14}/> </Button>
                 </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-center min-w-0">
                 {isAISelected && (
                     <>
                        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" title="Image file input" />
                        <Button type="button" variant="ghost" size="icon" onClick={triggerImageUpload} disabled={isSending || isRecording} className={`h-10 w-10 backdrop-blur-sm flex-shrink-0 rounded-xl transition-all duration-300 ${
                            isDark 
                                ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-600/10' 
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                        }`} title="Attach Image">
                            <Camera size={18}/>
                        </Button>
                         <Button type="button" variant="ghost" size="icon" onClick={isRecording ? stopRecording : startRecording} disabled={isSending || !!imagePreview} className={cn("h-10 w-10 flex-shrink-0 rounded-xl transition-all duration-300", 
                             isRecording 
                                 ? isDark 
                                     ? "text-red-400 hover:text-red-300 hover:bg-red-600/10 backdrop-blur-sm" 
                                     : "text-red-500 hover:text-red-600 hover:bg-red-100/50 backdrop-blur-sm"
                                 : isDark 
                                     ? "text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 backdrop-blur-sm" 
                                     : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 backdrop-blur-sm"
                         )} title={isRecording ? "Stop Recording" : "Record Voice"}>
                            {isRecording ? <Pause size={18}/> : <Mic size={18}/>}
                        </Button>
                     </>
                 )}
                <Input
                    ref={ref}
                    placeholder={isAISelected ? "Ask Bago AI anything..." : "Send a message..."}
                    value={newMessage}
                    onChange={onInputChange}
                    onKeyDown={handleKeyDown}
                    className={`flex-grow min-w-0 h-10 text-sm backdrop-blur-sm border transition-all duration-200 shadow-clay rounded-xl ${
                        isDark 
                            ? 'bg-[#3a3a3a]/60 border-[#4a4a4a]/30 text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400' 
                            : 'bg-clayGlass border-clay-300/30 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                    }`}
                    autoComplete="off"
                    aria-label="Chat message input"
                    disabled={isSending || isRecording}
                />
                <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-clay hover:shadow-clayStrong transform hover:scale-105" disabled={(!newMessage.trim() && !audioBlob && !imagePreview) || isSending || isRecording}>
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
            </form>
        </div>
    );
});

MessageInput.displayName = 'MessageInput';
export default MessageInput;

