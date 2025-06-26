// src/app/settings/page.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Save, Settings as SettingsIcon, Loader2, Eye, EyeOff, UserSearch, Users, CheckCircle, XCircle, Send, Clock, UserCheck, UserX, AlertCircle, Trash2, Palette, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    getUserProfile, saveUserProfile, searchUsers, sendViewRequest, getIncomingViewRequests,
    acceptViewRequest, declineViewRequest, getFriends, removeFriend
} from '@/services/firestore';
import { deleteCompleteUserAccount } from '@/services/accountDeletionService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { parseISO } from 'date-fns';

// Import necessary types
import type { StoredUserProfile, ProgressViewPermission, SearchResultUser, ViewRequest, UserFriend } from '@/app/dashboard/types';

interface AppSettings {
  theme: 'light' | 'dark';
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  progressViewPermission: ProgressViewPermission;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: 'blue',
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  progressViewPermission: 'request_only',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, userId, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ViewRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");


  // Function to fetch friends
  const fetchFriends = useCallback(async () => {
      if (!userId) return;
      setIsLoadingFriends(true);
      setFirestoreError(null);
      try {
          const friendList = await getFriends(userId);
          setFriends(friendList);
          console.log("[Settings Page] Fetched friends:", friendList);
      } catch (error: any) {
          console.error("[Settings Page] Error fetching friends:", error);
           if (error.message && error.message.includes("Firestore index required")) {
                setFirestoreError(error.message);
           } else {
               toast({ variant: "destructive", title: "Friends Error", description: "Could not load friends list." });
           }
          setFriends([]);
      } finally {
          setIsLoadingFriends(false);
      }
  }, [userId, toast]);

  // Function to fetch incoming requests
  const fetchIncomingRequests = useCallback(async () => {
      if (!userId) return;
      setIsLoadingRequests(true);
      setFirestoreError(null);
      try {
          const requests = await getIncomingViewRequests(userId);
          setIncomingRequests(requests);
           console.log("[Settings Page] Fetched incoming requests:", requests);
      } catch (error: any) {
          console.error("[Settings Page] Error fetching incoming requests:", error);
           if (error.message && error.message.includes("Firestore index required")) {
                setFirestoreError(error.message);
           } else {
               toast({ variant: "destructive", title: "Request Error", description: "Could not load view requests." });
           }
          setIncomingRequests([]);
      } finally {
          setIsLoadingRequests(false);
      }
  }, [userId, toast]);

  // Load profile and settings from Firestore
  const loadProfileAndSettings = useCallback(async () => {
      if (!userId) return;
      console.log("[Settings Page] Loading profile and settings for user:", userId);
      setIsLoading(true);
      setFirestoreError(null);
      try {
          const profile = await getUserProfile(userId);
          setUserProfile(profile);
          if (profile) {
             const rawSettings = { ...DEFAULT_SETTINGS, ...(profile.settings || {}) };
             const loadedSettings: AppSettings = {
                 ...rawSettings,
                 theme: rawSettings.theme === 'system' ? 'light' : (rawSettings.theme as 'light' | 'dark')
             };
             setSettings(loadedSettings);
              console.log("[Settings Page] Loaded settings:", loadedSettings);
              fetchIncomingRequests();
              fetchFriends();
          } else {
              console.log("[Settings Page] No profile found, using defaults and creating profile.");
              setSettings(DEFAULT_SETTINGS);
          }
      } catch (error: any) {
          console.error("[Settings Page] Error loading profile/settings:", error);
          if (error.message && error.message.includes("Firestore index required")) {
            setFirestoreError(error.message);
          } else {
            toast({ variant: "destructive", title: "Load Error", description: "Could not load settings." });
          }
          setSettings(DEFAULT_SETTINGS);
      } finally {
          setIsLoading(false);
      }
  }, [userId, toast, fetchIncomingRequests, fetchFriends]);

  // Load initial data
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
        toast({ variant: "destructive", title: "Access Denied", description: "Please log in." });
        router.replace('/authorize');
        return;
    }
    loadProfileAndSettings();
  }, [authLoading, userId, router, toast, loadProfileAndSettings]);

  // Apply theme and other appearance settings immediately
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    console.log("[Settings Page] Applying appearance settings:", settings);
    const root = window.document.documentElement;
    const body = document.body;
    
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    
    // Sync with localStorage for compatibility with other components
    localStorage.setItem('lightTheme', (settings.theme === 'light').toString());
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'lightTheme',
      newValue: (settings.theme === 'light').toString(),
      oldValue: localStorage.getItem('lightTheme')
    }));
    
    root.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red', 'accent-cyan');
    root.classList.add(`accent-${settings.accentColor}`);
    
    body.classList.remove('text-small', 'text-medium', 'text-large');
    body.classList.add(`text-${settings.fontSize}`);
    
    body.classList.toggle('compact-mode', settings.compactMode);
    body.classList.toggle('reduced-motion', !settings.animations);
    
    const accentColors = {
      blue: { hue: '220', sat: '70%', light: '55%' },
      purple: { hue: '260', sat: '70%', light: '65%' },
      green: { hue: '142', sat: '70%', light: '45%' },
      orange: { hue: '25', sat: '85%', light: '60%' },
      red: { hue: '0', sat: '70%', light: '55%' },
      cyan: { hue: '190', sat: '70%', light: '50%' }
    };
    
    const color = accentColors[settings.accentColor];
    root.style.setProperty('--primary', `${color.hue} ${color.sat} ${color.light}`);
    root.style.setProperty('--accent', `${color.hue} ${color.sat} ${color.light}`);
    
  }, [settings, isLoading]);

  const handleSettingChange = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Save settings to Firestore
  const handleSaveSettings = async () => {
    if (!userId) { toast({ variant: "destructive", title: "Error", description: "User not authenticated." }); return; }
    setIsSaving(true);
    setFirestoreError(null);
    try {
      console.log("[Settings Page] Saving settings to Firestore:", settings, "for user:", userId);
      await saveUserProfile(userId, { settings: settings });
      toast({ title: "Settings Saved", description: "Your preferences have been updated." });
    } catch (error: any) {
      console.error("[Settings Page] Failed to save settings to Firestore:", error);
      if (error.message && error.message.includes("Firestore index required")) {
         setFirestoreError(error.message);
      } else {
         toast({ variant: "destructive", title: "Save Error", description: "Could not save your settings." });
      }
    } finally { setIsSaving(false); }
  };

   // Handle User Search
   const handleSearchUsers = async (event?: React.FormEvent<HTMLFormElement>) => {
       event?.preventDefault();
       if (!userId || searchQuery.trim().length < 2) return;
       setIsSearching(true); setSearchResults([]);
       setFirestoreError(null);
       try {
           const results = await searchUsers(userId, searchQuery.trim());
           setSearchResults(results);
           if (results.length === 0) {
                toast({ title: "No Users Found", description: "Try a different name.", variant: "default" });
           }
       } catch (error: any) {
           console.error("[Settings Page] User search error:", error);
           if (error.message && error.message.includes("Firestore index required")) {
               setFirestoreError(error.message);
           } else {
               toast({ variant: "destructive", title: "Search Error", description: "Could not perform user search." });
           }
       } finally { setIsSearching(false); }
   };

    // Handle Sending View Request
   const handleSendRequest = async (targetUser: SearchResultUser) => {
       if (!userId || !userProfile) { toast({ variant: "destructive", title: "Error", description: "Profile not loaded." }); return; }
       setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, requestStatus: 'pending' } : u));
       try {
           await sendViewRequest(userId, targetUser.id, userProfile);
           toast({ title: "Request Sent", description: `View request sent to ${targetUser.displayName}.` });
       } catch (error: any) {
           console.error("[Settings Page] Error sending view request:", error);
           toast({ variant: "destructive", title: "Request Failed", description: "Could not send view request." });
           setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, requestStatus: 'none' } : u));
       }
   };

    // Handle Incoming Request Acceptance
    const handleAcceptRequest = async (request: ViewRequest) => {
        if (!userId) return;
        setIncomingRequests(prev => prev.filter(req => req.id !== request.id));
        setIsLoadingRequests(true);
        try {
            await acceptViewRequest(userId, request.id);
            toast({ title: `Request Accepted`, description: `You are now friends with ${request.requestingUserDisplayName}.` });
            fetchIncomingRequests();
            fetchFriends();
        } catch (error: any) {
            console.error(`[Settings Page] Error accepting request:`, error);
            toast({ variant: "destructive", title: "Action Failed", description: `Could not accept the request.` });
            fetchIncomingRequests();
        } finally {
             setIsLoadingRequests(false);
        }
    };

    // Handle Incoming Request Decline
    const handleDeclineRequest = async (requestingUserId: string) => {
        if (!userId) return;
        setIncomingRequests(prev => prev.filter(req => req.id !== requestingUserId));
        setIsLoadingRequests(true);
        try {
            await declineViewRequest(userId, requestingUserId);
            toast({ title: `Request Declined` });
            fetchIncomingRequests();
        } catch (error: any) {
            console.error(`[Settings Page] Error declining request:`, error);
            toast({ variant: "destructive", title: "Action Failed", description: `Could not decline the request.` });
            fetchIncomingRequests();
        } finally {
             setIsLoadingRequests(false);
        }
    };

     // Handle Removing Friend
     const handleRemoveFriend = async (friendId: string) => {
         if (!userId) return;
         setFriends(prev => prev.filter(f => f.id !== friendId));
         setIsLoadingFriends(true);
         try {
             await removeFriend(userId, friendId);
             toast({ title: "Friend Removed" });
             fetchFriends();
             setSearchResults(prev => prev.map(u => u.id === friendId ? { ...u, requestStatus: 'none' } : u));
         } catch (error) {
             console.error("Error removing friend:", error);
             toast({ variant: "destructive", title: "Error", description: "Could not remove friend." });
             fetchFriends();
         } finally {
             setIsLoadingFriends(false);
         }
     };

     // Handle account deletion
     const handleDeleteAccount = async () => {
         if (!userId) return;
         setIsDeletingAccount(true);
         setFirestoreError(null);
         try {
             await deleteCompleteUserAccount();
             
             toast({ 
                 title: "Account Deleted", 
                 description: "Your account and all data have been permanently deleted.",
                 duration: 3000
             });
             
             setTimeout(() => {
                 window.location.href = '/';
             }, 1000);
             
         } catch (error: any) {
             console.error("Error deleting account:", error);
             if (error.message.includes("Recent authentication required")) {
                 toast({ 
                     variant: "destructive", 
                     title: "Authentication Required", 
                     description: "Please log out and log back in, then try again."
                 });
             } else {
                 toast({ 
                     variant: "destructive", 
                     title: "Delete Failed", 
                     description: error.message || "Could not delete account."
                 });
             }
         } finally {
             setIsDeletingAccount(false);
         }
     };

   if (authLoading || isLoading) {
     const isDark = settings.theme === 'dark';
     return (
       <div className={`min-h-screen pb-20 md:pb-0 flex justify-center items-center ${
         isDark 
           ? 'bg-[#1a1a1a]' 
           : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'
       }`}>
         <Card className={`w-full max-w-2xl mx-4 border-0 shadow-lg rounded-3xl animate-pulse ${
           isDark 
             ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
             : 'backdrop-blur-sm bg-white/70'
         }`}>
            <CardHeader className="items-center text-center pb-2 md:pb-3">
              <Skeleton className={`h-12 w-12 rounded-2xl mb-4 mx-auto ${
                isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
              }`} />
              <Skeleton className={`h-6 w-40 mb-2 mx-auto ${
                isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
              }`} />
              <Skeleton className={`h-4 w-60 mx-auto ${
                isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
              }`} />
            </CardHeader>
             <CardContent className="p-4 sm:p-6 md:p-8 space-y-6">
                 <div className={`space-y-4 p-4 border rounded-2xl ${
                   isDark 
                     ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
                     : 'bg-white/40'
                 }`}>
                   <Skeleton className={`h-5 w-24 mb-4 ${
                     isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                   }`} />
                   <Skeleton className={`h-10 w-full ${
                     isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                   }`} />
                 </div>
                 <div className={`space-y-4 p-4 border rounded-2xl ${
                   isDark 
                     ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
                     : 'bg-white/40'
                 }`}>
                   <Skeleton className={`h-5 w-32 mb-4 ${
                     isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                   }`} />
                   <Skeleton className={`h-10 w-full ${
                     isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                   }`} />
                 </div>
             </CardContent>
             <CardFooter className={`p-6 justify-center border-t ${
               isDark 
                 ? 'bg-[#1a1a1a]/20 border-[#3a3a3a]' 
                 : 'bg-white/20'
             }`}>
               <Skeleton className={`h-11 w-40 rounded-2xl ${
                 isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
               }`} />
             </CardFooter>
         </Card>
       </div>
     );
   }

    // Display Firestore error prominently
    if (firestoreError) {
        const isDark = settings.theme === 'dark';
        return (
            <div className={`min-h-screen pb-20 md:pb-0 flex justify-center items-center p-4 ${
              isDark 
                ? 'bg-[#1a1a1a]' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'
            }`}>
                <Card className={`w-full max-w-md text-center border-0 shadow-lg rounded-3xl ${
                  isDark 
                    ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
                    : 'backdrop-blur-sm bg-white/70'
                }`}>
                    <CardHeader>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 ${
                          isDark 
                            ? 'bg-red-600' 
                            : 'bg-gradient-to-br from-red-400 to-red-600'
                        }`}>
                          <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className={`text-lg ${
                          isDark ? 'text-red-400' : 'text-red-700'
                        }`}>Database Configuration Needed</CardTitle>
                        <CardDescription className={`text-xs p-2 break-words ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            {firestoreError.includes("index needed") || firestoreError.includes("index required")
                                ? "A Firestore index is required for this feature. Please create the index in your Firebase console:"
                                : "A database error occurred."}
                             {firestoreError.includes("https://console.firebase.google.com") && (
                               <a href={firestoreError.substring(firestoreError.indexOf("https://"))} target="_blank" rel="noopener noreferrer" className={`block mt-2 text-sm hover:underline ${
                                 isDark ? 'text-blue-400' : 'text-blue-500'
                               }`}>
                                   Open Firebase Console to Create Index
                               </a>
                             )}
                             {!firestoreError.includes("https://console.firebase.google.com") && (
                                 <pre className={`mt-2 text-left text-xs p-2 rounded overflow-x-auto ${
                                   isDark 
                                     ? 'bg-[#1a1a1a] border border-[#3a3a3a]' 
                                     : 'bg-white/40'
                                 }`}>{firestoreError}</pre>
                             )}
                        </CardDescription>
                    </CardHeader>
                     <CardFooter className="justify-center">
                         <Button onClick={loadProfileAndSettings} className={`rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 text-white ${
                           isDark 
                             ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' 
                             : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                         }`}>
                           Retry Loading
                         </Button>
                     </CardFooter>
                </Card>
            </div>
        );
    }

  const isDark = settings.theme === 'dark';

  return (
    <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
      isDark 
        ? 'bg-[#1a1a1a]' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'
    }`}>
      <div className="max-w-2xl mx-auto px-3 py-4 md:px-6 md:py-8 space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="mb-6 md:mb-8 animate-slide-down">
          <div className={`rounded-3xl shadow-lg border-0 p-6 text-center transition-all duration-500 ${
            isDark 
              ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
              : 'backdrop-blur-sm bg-white/70'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 animate-scale-in ${
              isDark 
                ? 'bg-[#8b5cf6] text-white' 
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}>
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className={`text-xl md:text-2xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>Application Settings</h1>
            <p className={`text-sm md:text-base ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Customize your Bago experience</p>
          </div>
        </div>

        {/* Appearance Section */}
        <Card className={`rounded-3xl border-0 hover:shadow-lg transition-all duration-300 animate-fade-in ${
          isDark 
            ? 'bg-[#2a2a2a] border-[#3a3a3a] shadow-lg hover:shadow-xl' 
            : 'backdrop-blur-sm bg-white/70 shadow-lg hover:shadow-xl'
        }`}>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-[#8b5cf6] text-white' 
                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}>
                <Palette className="h-5 w-5 text-white" />
              </div>
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className={`rounded-2xl p-4 shadow-lg transition-all duration-300 ${
              isDark 
                ? 'bg-[#1a1a1a] border border-[#3a3a3a]' 
                : 'backdrop-blur-sm bg-white/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className={`font-medium text-sm md:text-base mb-1 flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    {settings.theme === 'light' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                    {settings.theme === 'light' ? 'Light Theme' : 'Dark Theme'}
                  </div>
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {settings.theme === 'light' 
                      ? "Bright and clean interface for daytime use"
                      : "Easy on the eyes for low-light environments"
                    }
                  </p>
                </div>
                <Switch 
                  checked={settings.theme === 'dark'} 
                  onCheckedChange={(checked) => handleSettingChange('theme', checked ? 'dark' : 'light')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Sharing Section */}
        <Card className={`rounded-3xl border-0 hover:shadow-lg transition-all duration-300 animate-fade-in ${
          isDark 
            ? 'bg-[#2a2a2a] border-[#3a3a3a] shadow-lg hover:shadow-xl' 
            : 'backdrop-blur-sm bg-white/70 shadow-lg hover:shadow-xl'
        }`}>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-[#8b5cf6] text-white' 
                  : 'bg-gradient-to-br from-purple-400 to-purple-600'
              }`}>
                <Eye className="h-5 w-5 text-white" />
              </div>
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Progress Sharing</span>
            </CardTitle>
            <p className={`text-xs md:text-sm ml-12 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Control who can see your progress dashboard</p>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 pt-2">
            <div className={`rounded-2xl p-4 shadow-lg transition-all duration-300 ${
              isDark 
                ? 'bg-[#1a1a1a] border border-[#3a3a3a]' 
                : 'backdrop-blur-sm bg-white/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <EyeOff className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`font-medium text-sm md:text-base ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Private</span>
                  </div>
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Only you can see your progress</p>
                </div>
                <Switch 
                  checked={settings.progressViewPermission === 'private'} 
                  onCheckedChange={(checked) => checked && handleSettingChange('progressViewPermission', 'private')}
                />
              </div>
            </div>
            
            <div className={`rounded-2xl p-4 shadow-lg transition-all duration-300 ${
              isDark 
                ? 'bg-[#1a1a1a] border border-[#3a3a3a]' 
                : 'backdrop-blur-sm bg-white/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`font-medium text-sm md:text-base ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Request Only</span>
                  </div>
                  <p className={`text-xs md:text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Others must request to view your progress</p>
                </div>
                <Switch 
                  checked={settings.progressViewPermission === 'request_only'} 
                  onCheckedChange={(checked) => checked && handleSettingChange('progressViewPermission', 'request_only')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Find Users Section */}
        <Card className={`rounded-3xl border-0 hover:shadow-lg transition-all duration-300 animate-fade-in ${
          isDark 
            ? 'bg-[#2a2a2a] border-[#3a3a3a] shadow-lg hover:shadow-xl' 
            : 'backdrop-blur-sm bg-white/70 shadow-lg hover:shadow-xl'
        }`}>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-[#8b5cf6] text-white' 
                  : 'bg-gradient-to-br from-green-400 to-green-600'
              }`}>
                <UserSearch className="h-5 w-5 text-white" />
              </div>
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Find & Follow Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSearchUsers} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <Input
                type="search"
                placeholder="Search by display name..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className={`h-10 sm:h-9 flex-grow text-sm rounded-2xl border-0 shadow-inner ${
                  isDark 
                    ? 'bg-[#1a1a1a] text-white placeholder-gray-400 border border-[#3a3a3a]' 
                    : 'bg-white/60 backdrop-blur-sm'
                }`}
                disabled={isSearching}
              />
              <Button type="submit" className={`h-10 sm:h-9 px-4 whitespace-nowrap rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 text-white ${
                isDark 
                  ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' 
                  : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`} disabled={isSearching || searchQuery.trim().length < 2}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserSearch className="h-4 w-4 mr-2"/>}
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">Find Users</span>
              </Button>
            </form>
            
            {/* Search Results */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {searchResults.length > 0 && searchResults.map(foundUser => (
                <div key={foundUser.id} className={`rounded-2xl p-3 shadow-lg transition-all duration-300 ${
                  isDark 
                    ? 'bg-[#1a1a1a] border border-[#3a3a3a] hover:bg-[#2a2a2a]' 
                    : 'backdrop-blur-sm bg-white/40 hover:bg-white/60'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <Avatar className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0">
                        <AvatarImage src={foundUser.photoURL ?? undefined} alt={foundUser.displayName || 'User'} />
                        <AvatarFallback className={`text-white ${
                          isDark 
                            ? 'bg-[#8b5cf6]' 
                            : 'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>{foundUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow min-w-0">
                        <p className={`text-sm sm:text-sm font-medium truncate ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>{foundUser.displayName || 'Unnamed User'}</p>
                      </div>
                    </div>
                    <Button
                      size="default"
                      variant={foundUser.requestStatus === 'pending' ? 'outline' : foundUser.requestStatus === 'following' ? 'secondary' : 'default'}
                      onClick={() => handleSendRequest(foundUser)}
                      disabled={foundUser.requestStatus === 'pending' || foundUser.requestStatus === 'following' || foundUser.requestStatus === 'is_self'}
                      className={cn(
                        "text-sm h-10 px-4 transition-all duration-200 w-full sm:w-auto min-w-[120px] whitespace-nowrap rounded-2xl shadow-lg",
                        foundUser.requestStatus === 'pending' && `cursor-not-allowed border-dashed ${
                          isDark ? 'text-gray-400 bg-[#1a1a1a] border-[#3a3a3a]' : 'text-gray-500 bg-white/40'
                        }`,
                        foundUser.requestStatus === 'following' && `cursor-default shadow-inner ${
                          isDark 
                            ? 'bg-green-900/30 text-green-400 border-green-700' 
                            : 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 border-green-200'
                        }`,
                        foundUser.requestStatus === 'none' && `text-white hover:scale-105 ${
                          isDark 
                            ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        }`
                      )}
                    >
                      {foundUser.requestStatus === 'pending' ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Requested</span>
                          <span className="sm:hidden">Request Sent</span>
                        </>
                      ) : foundUser.requestStatus === 'following' ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Request View</span>
                          <span className="sm:hidden">Send Request</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {isSearching && (
                <div className="text-center py-6">
                  <Loader2 className={`h-6 w-6 animate-spin mx-auto ${
                    isDark ? 'text-purple-400' : 'text-blue-500'
                  }`}/>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Friends Section */}
        <Card className={`rounded-3xl border-0 hover:shadow-lg transition-all duration-300 animate-fade-in ${
          isDark 
            ? 'bg-[#2a2a2a] border-[#3a3a3a] shadow-lg hover:shadow-xl' 
            : 'backdrop-blur-sm bg-white/70 shadow-lg hover:shadow-xl'
        }`}>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-[#8b5cf6] text-white' 
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Friends ({friends.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoadingFriends ? (
              <div className="space-y-3 py-4">
                <Skeleton className={`h-16 w-full rounded-2xl ${
                  isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                }`} />
              </div>
            ) : friends.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {friends.map(friend => (
                  <div key={friend.id} className={`rounded-2xl p-3 shadow-lg transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#1a1a1a] border border-[#3a3a3a] hover:bg-[#2a2a2a]' 
                      : 'backdrop-blur-sm bg-white/40 hover:bg-white/60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <Avatar className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'User'} />
                          <AvatarFallback className={`text-white ${
                            isDark 
                              ? 'bg-[#8b5cf6]' 
                              : 'bg-gradient-to-br from-green-400 to-green-600'
                          }`}>{friend.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>{friend.displayName || 'Unnamed User'}</p>
                          <p className={`text-xs flex items-center gap-1 ${
                            isDark ? 'text-green-400' : 'text-green-600'
                          }`}>
                            <UserCheck className="h-3 w-3" />
                            Following
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="default" 
                            className={`text-sm h-10 px-4 border-red-200 w-full sm:w-auto min-w-[100px] whitespace-nowrap rounded-2xl shadow-lg transition-all duration-300 ${
                              isDark 
                                ? 'text-red-400 bg-[#1a1a1a] border-red-800 hover:bg-red-900/20' 
                                : 'text-red-600 bg-white/60 hover:bg-red-50'
                            }`}
                            title="Remove Friend"
                          >
                            <UserX className="h-4 w-4 mr-2"/>
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className={`mx-4 max-w-md border-0 shadow-lg rounded-3xl ${
                          isDark 
                            ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
                            : 'backdrop-blur-sm bg-white/90'
                        }`}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={isDark ? 'text-white' : 'text-gray-800'}>Remove Friend?</AlertDialogTitle>
                            <AlertDialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>Stop sharing progress with {friend.displayName || 'this user'}?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className={`w-full sm:w-auto rounded-2xl shadow-lg border-0 ${
                              isDark 
                                ? 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]' 
                                : 'bg-white/60 text-gray-700'
                            }`}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveFriend(friend.id)} 
                              className={cn("w-full sm:w-auto rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white")}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center text-sm italic py-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>Find and add friends to share progress.</p>
            )}
          </CardContent>
        </Card>

        {/* Incoming Requests Section */}
        <Card className={`rounded-3xl border-0 hover:shadow-lg transition-all duration-300 animate-fade-in ${
          isDark 
            ? 'bg-[#2a2a2a] border-[#3a3a3a] shadow-lg hover:shadow-xl' 
            : 'backdrop-blur-sm bg-white/70 shadow-lg hover:shadow-xl'
        }`}>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-[#8b5cf6] text-white' 
                  : 'bg-gradient-to-br from-purple-500 to-purple-600'
              }`}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className={isDark ? 'text-white' : 'text-gray-800'}>Incoming View Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoadingRequests ? (
              <div className="space-y-3 py-4">
                <Skeleton className={`h-16 w-full rounded-2xl ${
                  isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                }`} />
                <Skeleton className={`h-16 w-full rounded-2xl ${
                  isDark ? 'bg-[#3a3a3a]' : 'bg-blue-200'
                }`} />
              </div>
            ) : incomingRequests.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {incomingRequests.map(request => (
                  <div key={request.id} className={`rounded-2xl p-3 shadow-lg transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#1a1a1a] border border-[#3a3a3a]' 
                      : 'backdrop-blur-sm bg-white/40'
                  }`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <Avatar className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarImage src={request.requestingUserPhotoURL ?? undefined} alt={request.requestingUserDisplayName || 'User'} />
                          <AvatarFallback className={`text-white ${
                            isDark 
                              ? 'bg-[#8b5cf6]' 
                              : 'bg-gradient-to-br from-purple-400 to-purple-600'
                          }`}>{request.requestingUserDisplayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>{request.requestingUserDisplayName || 'Unknown User'}</p>
                          <p className={`text-xs flex items-center gap-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3"/>
                            {request.timestamp ? formatDistanceToNow(parseISO(request.timestamp), { addSuffix: true }) : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="default" 
                              className={`h-10 text-sm w-full sm:flex-1 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 text-white ${
                                isDark 
                                  ? 'bg-green-700 hover:bg-green-600' 
                                  : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                              }`}
                              title="Accept"
                            >
                              <CheckCircle className="h-4 w-4 mr-2"/>
                              Accept Request
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={`mx-4 max-w-md border-0 shadow-lg rounded-3xl ${
                            isDark 
                              ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
                              : 'backdrop-blur-sm bg-white/90'
                          }`}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className={isDark ? 'text-white' : 'text-gray-800'}>Accept Request?</AlertDialogTitle>
                              <AlertDialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>Allow {request.requestingUserDisplayName || 'this user'} to view your progress?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className={`w-full sm:w-auto rounded-2xl shadow-lg border-0 ${
                                isDark 
                                  ? 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]' 
                                  : 'bg-white/60 text-gray-700'
                              }`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleAcceptRequest(request)} 
                                className="w-full sm:w-auto rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                              >
                                Accept
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="default" 
                              className={`h-10 text-sm w-full sm:flex-1 rounded-2xl shadow-lg transition-all duration-300 ${
                                isDark 
                                  ? 'text-red-400 border-red-800 bg-[#1a1a1a] hover:bg-red-900/20' 
                                  : 'text-red-600 border-red-200 bg-white/60 hover:bg-red-50'
                              }`}
                              title="Decline"
                            >
                              <XCircle className="h-4 w-4 mr-2"/>
                              Decline
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={`mx-4 max-w-md border-0 shadow-lg rounded-3xl ${
                            isDark 
                              ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
                              : 'backdrop-blur-sm bg-white/90'
                          }`}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className={isDark ? 'text-white' : 'text-gray-800'}>Decline Request?</AlertDialogTitle>
                              <AlertDialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>Deny access for {request.requestingUserDisplayName || 'this user'}?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className={`w-full sm:w-auto rounded-2xl shadow-lg border-0 ${
                                isDark 
                                  ? 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]' 
                                  : 'bg-white/60 text-gray-700'
                              }`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeclineRequest(request.id)} 
                                className="w-full sm:w-auto rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                              >
                                Decline
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center text-sm italic py-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>No pending requests.</p>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className={`rounded-3xl border-0 hover:shadow-lg transition-all duration-300 animate-fade-in shadow-lg hover:shadow-xl ${
          isDark 
            ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
            : 'backdrop-blur-sm bg-gradient-to-br from-red-50/80 to-red-100/80'
        }`}>
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className={`flex items-center space-x-2 text-base md:text-lg ${
              isDark ? 'text-red-400' : 'text-red-700'
            }`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                isDark 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <span>Danger Zone</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`rounded-2xl p-4 shadow-lg border transition-all duration-300 ${
              isDark 
                ? 'bg-[#1a1a1a] border-[#3a3a3a]' 
                : 'backdrop-blur-sm bg-white/50 border-red-200/30'
            }`}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 mt-1 ${
                    isDark 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gradient-to-br from-red-400 to-red-500'
                  }`}>
                    <Trash2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm md:text-base mb-1 ${
                      isDark ? 'text-red-400' : 'text-red-900'
                    }`}>Delete Account</h3>
                    <p className={`text-xs md:text-sm mb-3 ${
                      isDark ? 'text-gray-400' : 'text-red-800'
                    }`}>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <AlertDialog 
                      onOpenChange={(open) => {
                        if (!open) {
                          setConfirmDeleteText('');
                        }
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button className={`rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 h-9 md:h-10 px-4 md:px-6 text-sm md:text-base text-white ${
                          isDark 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                        }`} disabled={isDeletingAccount}>
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className={`mx-4 max-w-md border-0 shadow-lg rounded-3xl ${
                        isDark 
                          ? 'bg-[#2a2a2a] border-[#3a3a3a] backdrop-blur-sm' 
                          : 'backdrop-blur-sm bg-white/90'
                      }`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle className={`text-base md:text-lg flex items-center space-x-2 ${
                            isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                              isDark 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gradient-to-br from-red-400 to-red-600'
                            }`}>
                              <Trash2 className="h-4 w-4 text-white" />
                            </div>
                            <span>Delete Account Permanently?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription className={`text-sm md:text-base mt-3 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <p className="mb-2">This will <strong className={isDark ? 'text-red-400' : 'text-red-600'}>permanently delete</strong> your account and all associated data including:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                              <li>All food and exercise logs</li>
                              <li>Workout plans and progress</li>
                              <li>Friend connections and view requests</li>
                              <li>Quick log items and preferences</li>
                              <li>Points and achievements</li>
                            </ul>
                            <div className={`p-3 rounded-2xl mt-4 border ${
                              isDark 
                                ? 'bg-red-900/20 border-red-800' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <p className={`font-medium text-sm ${
                                isDark ? 'text-red-400' : 'text-red-700'
                              }`}>
                                Type "DELETE" below to confirm:
                              </p>
                              <input 
                                type="text" 
                                id="delete-confirmation"
                                className={`w-full p-3 mt-2 text-sm border rounded-2xl ${
                                  isDark 
                                    ? 'border-red-800 bg-[#1a1a1a] text-white' 
                                    : 'border-red-200 bg-white'
                                }`}
                                placeholder="Type DELETE here"
                                autoComplete="off"
                                value={confirmDeleteText}
                                onChange={(e) => {
                                  setConfirmDeleteText(e.target.value);
                                }}
                              />
                              {confirmDeleteText && confirmDeleteText !== 'DELETE' && (
                                <p className={`text-xs mt-1 ${
                                  isDark ? 'text-red-400' : 'text-red-600'
                                }`}>
                                  Please type "DELETE" exactly as shown to enable the button.
                                </p>
                              )}
                              {confirmDeleteText === 'DELETE' && (
                                <p className={`text-xs mt-1 font-medium ${
                                  isDark ? 'text-green-400' : 'text-green-600'
                                }`}>
                                  ✓ Confirmation correct - button is now enabled.
                                </p>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
                          <AlertDialogCancel disabled={isDeletingAccount} className={`w-full sm:w-auto rounded-2xl shadow-lg border-0 ${
                            isDark 
                              ? 'bg-[#1a1a1a] text-gray-300 hover:bg-[#333]' 
                              : 'bg-white/60 text-gray-700'
                          }`}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            id="confirm-delete-button"
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount || confirmDeleteText !== 'DELETE'}
                            className={cn(
                              "gap-2 focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition-all w-full sm:w-auto rounded-2xl shadow-lg hover:scale-105 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white",
                              confirmDeleteText === 'DELETE' && !isDeletingAccount ? "animate-pulse" : ""
                            )}
                          >
                            {isDeletingAccount ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting Account...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Yes, Delete My Account
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center pt-4 md:pt-6 animate-fade-in">
          <Button 
            onClick={handleSaveSettings} 
            className={`rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 px-6 md:px-8 h-10 md:h-11 text-sm md:text-base w-full sm:w-auto text-white ${
              isDark 
                ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }`}
            disabled={isSaving}
          > 
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                  Saving...
                </motion.div>
              ) : (
                <motion.div
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <Save className="mr-2 h-4 sm:h-5 w-4 sm:w-5"/>
                  Save Preferences
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </div>
  );
}
