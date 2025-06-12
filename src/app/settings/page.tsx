// src/app/settings/page.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input"; // Added Input
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Save, Settings as SettingsIcon, Loader2, Eye, EyeOff, UserSearch, Users, CheckCircle, XCircle, Send, Clock, UserCheck, UserX, AlertCircle, Trash2, Palette, Type, Monitor, Smartphone, Tablet, Zap, Layout } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    getUserProfile, saveUserProfile, searchUsers, sendViewRequest, getIncomingViewRequests,
    acceptViewRequest, declineViewRequest, getFriends, removeFriend // Import new/updated functions
} from '@/services/firestore';
import { deleteCompleteUserAccount } from '@/services/accountDeletionService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Added AlertDialog
import { buttonVariants } from "@/components/ui/button"; // Added buttonVariants
import { Separator } from '@/components/ui/separator'; // Added Separator
import { formatDistanceToNow } from 'date-fns'; // For relative time
import { parseISO } from 'date-fns'; // Import parseISO

// Import necessary types
import type { StoredUserProfile, ProgressViewPermission, SearchResultUser, ViewRequest, UserFriend } from '@/app/dashboard/types'; // Added UserFriend

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
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null); // State for full profile
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Search loading state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ViewRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [friends, setFriends] = useState<UserFriend[]>([]); // State for friends
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null); // State for Firestore errors
  const [isDeletingAccount, setIsDeletingAccount] = useState(false); // State for account deletion
  const [confirmDeleteText, setConfirmDeleteText] = useState(""); // State for delete confirmation text


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
      setFirestoreError(null); // Clear previous errors
      try {
          const requests = await getIncomingViewRequests(userId);
          setIncomingRequests(requests);
           console.log("[Settings Page] Fetched incoming requests:", requests);
      } catch (error: any) {
          console.error("[Settings Page] Error fetching incoming requests:", error);
           // Check if it's a Firestore index error
           if (error.message && error.message.includes("Firestore index required")) {
                setFirestoreError(error.message); // Store the specific error message
           } else {
               toast({ variant: "destructive", title: "Request Error", description: "Could not load view requests." });
           }
          setIncomingRequests([]); // Clear requests on error
      } finally {
          setIsLoadingRequests(false);
      }
  }, [userId, toast]);


  // Load profile and settings from Firestore
  const loadProfileAndSettings = useCallback(async () => {
      if (!userId) return;
      console.log("[Settings Page] Loading profile and settings for user:", userId);
      setIsLoading(true);
      setFirestoreError(null); // Clear previous errors
      try {
          const profile = await getUserProfile(userId);
          setUserProfile(profile); // Store full profile
          if (profile) {
             const rawSettings = { ...DEFAULT_SETTINGS, ...(profile.settings || {}) };
             // Convert legacy 'system' theme to 'light' for compatibility
             const loadedSettings: AppSettings = {
                 ...rawSettings,
                 theme: rawSettings.theme === 'system' ? 'light' : (rawSettings.theme as 'light' | 'dark')
             };
             setSettings(loadedSettings);
              console.log("[Settings Page] Loaded settings:", loadedSettings);
              // Fetch incoming requests & friends after loading profile
              fetchIncomingRequests();
              fetchFriends();
          } else {
              console.log("[Settings Page] No profile found, using defaults and creating profile.");
              setSettings(DEFAULT_SETTINGS);
              // If profile doesn't exist, it's created in getUserProfile now
          }
      } catch (error: any) {
          console.error("[Settings Page] Error loading profile/settings:", error);
          if (error.message && error.message.includes("Firestore index required")) {
            setFirestoreError(error.message); // Store the specific error message
          } else {
            toast({ variant: "destructive", title: "Load Error", description: "Could not load settings." });
          }
          setSettings(DEFAULT_SETTINGS);
      } finally {
          setIsLoading(false);
      }
  }, [userId, toast, fetchIncomingRequests, fetchFriends]); // Include fetchFriends


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
    
    // Apply theme
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    
    // Apply accent color
    root.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red', 'accent-cyan');
    root.classList.add(`accent-${settings.accentColor}`);
    
    // Apply font size
    body.classList.remove('text-small', 'text-medium', 'text-large');
    body.classList.add(`text-${settings.fontSize}`);
    
    // Apply compact mode
    body.classList.toggle('compact-mode', settings.compactMode);
    
    // Apply animations preference
    body.classList.toggle('reduced-motion', !settings.animations);
    
    // Update CSS custom properties for accent color
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
    setFirestoreError(null); // Clear previous errors
    try {
      console.log("[Settings Page] Saving settings to Firestore:", settings, "for user:", userId);
      await saveUserProfile(userId, { settings: settings }); // Save only settings object
      toast({ title: "Settings Saved", description: "Your preferences have been updated." });
    } catch (error: any) {
      console.error("[Settings Page] Failed to save settings to Firestore:", error);
      if (error.message && error.message.includes("Firestore index required")) {
         setFirestoreError(error.message); // Store the specific error message
      } else {
         toast({ variant: "destructive", title: "Save Error", description: "Could not save your settings." });
      }
    } finally { setIsSaving(false); }
  };

   // Handle User Search
   const handleSearchUsers = async (event?: React.FormEvent<HTMLFormElement>) => {
       event?.preventDefault(); // Prevent form submission if used
       if (!userId || searchQuery.trim().length < 2) return;
       setIsSearching(true); setSearchResults([]); // Clear previous results
       setFirestoreError(null); // Clear previous errors
       try {
           const results = await searchUsers(userId, searchQuery.trim());
           setSearchResults(results);
           if (results.length === 0) {
                toast({ title: "No Users Found", description: "Try a different name.", variant: "default" });
           }
       } catch (error: any) {
           console.error("[Settings Page] User search error:", error);
           if (error.message && error.message.includes("Firestore index required")) {
               setFirestoreError(error.message); // Store the specific error message
           } else {
               toast({ variant: "destructive", title: "Search Error", description: "Could not perform user search." });
           }
       } finally { setIsSearching(false); }
   };

    // Handle Sending View Request
   const handleSendRequest = async (targetUser: SearchResultUser) => {
       if (!userId || !userProfile) { toast({ variant: "destructive", title: "Error", description: "Profile not loaded." }); return; }
       // Disable button temporarily
       setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, requestStatus: 'pending' } : u));
       try {
           await sendViewRequest(userId, targetUser.id, userProfile);
           toast({ title: "Request Sent", description: `View request sent to ${targetUser.displayName}.` });
           // Status updated locally immediately, will be confirmed by searchUsers next time
       } catch (error: any) {
           console.error("[Settings Page] Error sending view request:", error);
           toast({ variant: "destructive", title: "Request Failed", description: "Could not send view request." });
           // Revert button state on failure
           setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, requestStatus: 'none' } : u));
       }
   };

    // Handle Incoming Request Acceptance
    const handleAcceptRequest = async (request: ViewRequest) => {
        if (!userId) return;
        // Optimistically update UI (optional, can just rely on refetch)
        setIncomingRequests(prev => prev.filter(req => req.id !== request.id));
        setIsLoadingRequests(true); // Show loading while processing
        try {
            await acceptViewRequest(userId, request.id); // Pass requesting user's ID
            toast({ title: `Request Accepted`, description: `You are now friends with ${request.requestingUserDisplayName}.` });
            fetchIncomingRequests(); // Refresh requests
            fetchFriends(); // Refresh friends list
        } catch (error: any) {
            console.error(`[Settings Page] Error accepting request:`, error);
            toast({ variant: "destructive", title: "Action Failed", description: `Could not accept the request.` });
            fetchIncomingRequests(); // Re-fetch to get actual state
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
            fetchIncomingRequests(); // Refresh requests
        } catch (error: any) {
            console.error(`[Settings Page] Error declining request:`, error);
            toast({ variant: "destructive", title: "Action Failed", description: `Could not decline the request.` });
            fetchIncomingRequests(); // Re-fetch to get actual state
        } finally {
             setIsLoadingRequests(false);
        }
    };

     // Handle Removing Friend
     const handleRemoveFriend = async (friendId: string) => {
         if (!userId) return;
         // Optimistic UI update (optional)
         setFriends(prev => prev.filter(f => f.id !== friendId));
         setIsLoadingFriends(true);
         try {
             await removeFriend(userId, friendId);
             toast({ title: "Friend Removed" });
             fetchFriends(); // Refresh friends list
             setSearchResults(prev => prev.map(u => u.id === friendId ? { ...u, requestStatus: 'none' } : u)); // Reset search status if applicable
         } catch (error) {
             console.error("Error removing friend:", error);
             toast({ variant: "destructive", title: "Error", description: "Could not remove friend." });
             fetchFriends(); // Revert optimistic update if failed
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
             
             // Show success toast before navigation
             toast({ 
                 title: "Account Deleted", 
                 description: "Your account and all data have been permanently deleted.",
                 duration: 3000
             });
             
             // Wait a brief moment for the toast to be visible
             setTimeout(() => {
                 // Force hard navigation to home page to clear all state
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
     return (
       <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
         <Card className="w-full max-w-2xl animate-pulse">
            <CardHeader className="items-center text-center"> <Skeleton className="h-10 w-10 rounded-full bg-muted mb-3 mx-auto" /> <Skeleton className="h-6 w-40 bg-muted mb-1 mx-auto" /> <Skeleton className="h-4 w-60 bg-muted mx-auto" /> </CardHeader>
             <CardContent className="p-4 sm:p-6 md:p-8 space-y-8">
                 {/* Skeleton for Appearance */}
                 <div className="space-y-5 p-4 sm:p-5 border rounded-lg bg-muted/10"> <Skeleton className="h-5 w-24 bg-muted mb-4" /> <Skeleton className="h-10 w-full bg-muted" /> <Skeleton className="h-10 w-full bg-muted" /> <Skeleton className="h-10 w-full bg-muted" /> </div>
                 {/* Skeleton for Privacy */}
                 <div className="space-y-5 p-4 sm:p-5 border rounded-lg bg-muted/10"> <Skeleton className="h-5 w-32 bg-muted mb-4" /> <Skeleton className="h-10 w-full bg-muted" /> <Skeleton className="h-10 w-full bg-muted" /> <Skeleton className="h-10 w-full bg-muted" /> </div>
                 {/* Skeleton for Search/Friends */}
                 <div className="space-y-4 p-5 border rounded-lg bg-muted/10"> <Skeleton className="h-5 w-28 bg-muted" /> <Skeleton className="h-10 w-full bg-muted" /> </div>
                 {/* Skeleton for Requests */}
                 <div className="space-y-4 p-5 border rounded-lg bg-muted/10"> <Skeleton className="h-5 w-36 bg-muted" /> <Skeleton className="h-16 w-full bg-muted" /> <Skeleton className="h-16 w-full bg-muted" /> </div>
             </CardContent>
             <CardFooter className="p-6 justify-center border-t bg-muted/10"> <Skeleton className="h-11 w-40 bg-muted" /> </CardFooter>
         </Card>
       </div>
     );
   }

    // Display Firestore error prominently
    if (firestoreError) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-4">
                <Card className="w-full max-w-md text-center border-destructive">
                    <CardHeader>
                        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                        <CardTitle className="text-destructive">Database Configuration Needed</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground p-2 break-words">
                            {firestoreError.includes("index needed") || firestoreError.includes("index required")
                                ? "A Firestore index is required for this feature. Please create the index in your Firebase console:"
                                : "A database error occurred."}
                             {firestoreError.includes("https://console.firebase.google.com") && (
                               <a href={firestoreError.substring(firestoreError.indexOf("https://"))} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-2 text-sm">
                                   Open Firebase Console to Create Index
                               </a>
                             )}
                             {!firestoreError.includes("https://console.firebase.google.com") && (
                                 <pre className="mt-2 text-left text-xs bg-muted p-2 rounded overflow-x-auto">{firestoreError}</pre>
                             )}
                        </CardDescription>
                    </CardHeader>
                     <CardFooter className="justify-center">
                         <Button onClick={loadProfileAndSettings}>Retry Loading</Button>
                     </CardFooter>
                </Card>
            </div>
        );
    }


  return (
    <motion.div 
      className="max-w-2xl mx-auto my-4 sm:my-8 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="relative overflow-hidden rounded-lg"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="shadow-xl border border-border/20 overflow-hidden bg-card/95 backdrop-blur-sm">
          <motion.div
            className="absolute inset-0 opacity-30 pointer-events-none"
            animate={{ 
              background: [
                "radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)",
                "radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)",
                "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
              ]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <CardHeader className="text-center bg-gradient-to-r from-primary/10 via-card to-card border-b pb-4 pt-6 relative z-10">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            >
              <SettingsIcon className="mx-auto h-10 w-10 text-primary mb-3 transition-transform duration-300 hover:rotate-12" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <CardTitle className="text-2xl md:text-3xl font-bold">Application Settings</CardTitle>
              <CardDescription className="text-base mt-1 text-muted-foreground">
                Customize your Bago experience.
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 md:p-8 space-y-8 relative z-10">

          {/* --- Simplified Theme Section --- */}
          <section className="space-y-5 p-4 sm:p-5 border rounded-lg shadow-sm bg-card/50 transition-shadow hover:shadow-md duration-300">
             <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 mb-4 text-foreground/90">
               <Palette className="h-5 w-5 text-blue-500"/>
               Appearance
             </h3>
             
             {/* Theme Toggle Switch */}
             <div className="flex items-center justify-between space-x-2 sm:space-x-4 p-2 rounded-md hover:bg-muted/50 transition-colors duration-200 cursor-pointer" onClick={() => handleSettingChange('theme', settings.theme === 'light' ? 'dark' : 'light')}>
               <Label htmlFor="theme-toggle" className="flex flex-col space-y-1 flex-grow cursor-pointer pr-2">
                 <span className="font-medium flex items-center gap-1.5 text-sm sm:text-base">
                   {settings.theme === 'light' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                   {settings.theme === 'light' ? 'Light Theme' : 'Dark Theme'}
                 </span>
                 <span className="text-xs font-normal leading-snug text-muted-foreground">
                   {settings.theme === 'light' 
                     ? "Bright and clear interface for daytime use"
                     : "Easy on the eyes for low-light environments"
                   }
                 </span>
               </Label>
               <Switch 
                 id="theme-toggle" 
                 checked={settings.theme === 'dark'} 
                 onCheckedChange={(checked) => handleSettingChange('theme', checked ? 'dark' : 'light')}
                 className="cursor-pointer"
               />
             </div>
           </section>

           {/* --- Progress View Permissions Section --- */}
           <section className="space-y-5 p-4 sm:p-5 border rounded-lg shadow-sm bg-card/50 transition-shadow hover:shadow-md duration-300">
             <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 mb-4 text-foreground/90"> <Eye className="h-5 w-5 text-blue-500"/> Progress Sharing </h3>
             <p className="text-xs text-muted-foreground -mt-2 mb-3">Control who can see your progress dashboard.</p>
             {[
                 { id: 'private', label: 'Private', description: 'Only you can see your progress.', icon: <EyeOff className="h-4 w-4"/> },
                 { id: 'request_only', label: 'Request Only', description: 'Others must request to view your progress.', icon: <Users className="h-4 w-4"/> },
                 // { id: 'public', label: 'Public (Not Implemented)', description: 'Anyone with a link could potentially view.', icon: <Eye className="h-4 w-4"/> } // Kept commented out
             ].map(permOption => (
                 <div key={permOption.id} className="flex items-center justify-between space-x-2 sm:space-x-4 p-2 rounded-md hover:bg-muted/50 transition-colors duration-200 cursor-pointer" onClick={() => handleSettingChange('progressViewPermission', permOption.id as ProgressViewPermission)}>
                     <Label htmlFor={`perm-${permOption.id}`} className="flex flex-col space-y-1 flex-grow cursor-pointer pr-2"> <span className="font-medium flex items-center gap-1.5 text-sm sm:text-base">{permOption.icon} {permOption.label}</span> <span className="text-xs font-normal leading-snug text-muted-foreground"> {permOption.description} </span> </Label>
                     <Switch id={`perm-${permOption.id}`} checked={settings.progressViewPermission === permOption.id} onCheckedChange={(checked) => checked && handleSettingChange('progressViewPermission', permOption.id as ProgressViewPermission)} className="cursor-pointer"/>
                 </div>
             ))}
           </section>

            {/* --- Find Users Section --- */}
            <section className="space-y-4 p-4 sm:p-5 border rounded-lg shadow-sm bg-card/50 transition-shadow hover:shadow-md duration-300">
               <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 mb-4 text-foreground/90"> <UserSearch className="h-5 w-5 text-green-500"/> Find & Follow Users </h3>
               <form onSubmit={handleSearchUsers} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                   <Input
                     type="search"
                     placeholder="Search by display name..."
                     value={searchQuery}
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                     className="h-10 sm:h-9 flex-grow text-sm"
                     disabled={isSearching}
                   />
                   <Button type="submit" size="default" className="h-10 sm:h-9 px-4 whitespace-nowrap" disabled={isSearching || searchQuery.trim().length < 2}>
                     {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserSearch className="h-4 w-4 mr-2"/>}
                     <span className="hidden sm:inline">Search</span>
                     <span className="sm:hidden">Find Users</span>
                   </Button>
               </form>
                {/* Search Results */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {searchResults.length > 0 && searchResults.map(foundUser => (
                        <div key={foundUser.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                                <Avatar className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0">
                                    <AvatarImage src={foundUser.photoURL ?? undefined} alt={foundUser.displayName || 'User'} />
                                    <AvatarFallback>{foundUser.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow min-w-0">
                                     <p className="text-sm sm:text-sm font-medium truncate">{foundUser.displayName || 'Unnamed User'}</p>
                                     {/* <p className="text-xs text-muted-foreground truncate">{foundUser.email}</p> */}
                                </div>
                            </div>
                             <Button
                                 size="default"
                                 variant={foundUser.requestStatus === 'pending' ? 'outline' : foundUser.requestStatus === 'following' ? 'secondary' : 'default'}
                                 onClick={() => handleSendRequest(foundUser)}
                                 disabled={foundUser.requestStatus === 'pending' || foundUser.requestStatus === 'following' || foundUser.requestStatus === 'is_self'}
                                 className={cn("text-sm h-10 px-4 transition-all duration-200 w-full sm:w-auto min-w-[120px] whitespace-nowrap",
                                      foundUser.requestStatus === 'pending' && "cursor-not-allowed border-dashed text-muted-foreground",
                                      foundUser.requestStatus === 'following' && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-200 dark:border-green-700 cursor-default"
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
                    ))}
                    {isSearching && <div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto"/></div>}
                </div>
            </section>

            {/* --- Friends Section --- */}
            <section className="space-y-4 p-4 sm:p-5 border rounded-lg shadow-sm bg-card/50 transition-shadow hover:shadow-md duration-300">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 mb-4 text-foreground/90"> <UserCheck className="h-5 w-5 text-green-600"/> Friends ({friends.length}) </h3>
                {isLoadingFriends ? (
                     <div className="space-y-3 py-4"> <Skeleton className="h-16 w-full bg-muted/50" /> </div>
                 ) : friends.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                         {friends.map(friend => (
                             <div key={friend.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                 <div className="flex items-center gap-3 flex-grow min-w-0">
                                     <Avatar className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0">
                                         <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'User'} />
                                         <AvatarFallback>{friend.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                     </Avatar>
                                     <div className="flex-grow min-w-0">
                                          <p className="text-sm font-medium truncate">{friend.displayName || 'Unnamed User'}</p>
                                          <p className="text-xs text-green-600 flex items-center gap-1">
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
                                            className="text-sm h-10 px-4 text-destructive border-destructive/50 hover:bg-destructive/10 w-full sm:w-auto min-w-[100px] whitespace-nowrap" 
                                            title="Remove Friend"
                                          >
                                            <UserX className="h-4 w-4 mr-2"/>
                                            Remove
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="mx-4 max-w-md">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
                                            <AlertDialogDescription>Stop sharing progress with {friend.displayName || 'this user'}?</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleRemoveFriend(friend.id)} 
                                              className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}
                                            >
                                              Remove
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <p className="text-center text-muted-foreground text-sm italic py-6">Find and add friends to share progress.</p>
                 )}
            </section>

             {/* --- Incoming Requests Section --- */}
             <section className="space-y-4 p-4 sm:p-5 border rounded-lg shadow-sm bg-card/50 transition-shadow hover:shadow-md duration-300">
               <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 mb-4 text-foreground/90"> <Users className="h-5 w-5 text-purple-500"/> Incoming View Requests </h3>
                {isLoadingRequests ? (
                    <div className="space-y-3 py-4"> <Skeleton className="h-16 w-full bg-muted/50" /> <Skeleton className="h-16 w-full bg-muted/50" /> </div>
                ) : incomingRequests.length > 0 ? (
                     <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {incomingRequests.map(request => (
                            <div key={request.id} className="flex flex-col gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                    <Avatar className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0">
                                        <AvatarImage src={request.requestingUserPhotoURL ?? undefined} alt={request.requestingUserDisplayName || 'User'} />
                                        <AvatarFallback>{request.requestingUserDisplayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow min-w-0">
                                         <p className="text-sm font-medium truncate">{request.requestingUserDisplayName || 'Unknown User'}</p>
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                                               className="h-10 text-sm bg-green-600 hover:bg-green-700 text-white w-full sm:flex-1" 
                                               title="Accept"
                                             >
                                               <CheckCircle className="h-4 w-4 mr-2"/>
                                               Accept Request
                                             </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="mx-4 max-w-md">
                                             <AlertDialogHeader>
                                               <AlertDialogTitle>Accept Request?</AlertDialogTitle>
                                               <AlertDialogDescription>Allow {request.requestingUserDisplayName || 'this user'} to view your progress?</AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                               <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                               <AlertDialogAction 
                                                 onClick={() => handleAcceptRequest(request)} 
                                                 className={cn(buttonVariants({ className: "bg-green-600 hover:bg-green-700 w-full sm:w-auto" }))}
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
                                               className="h-10 text-sm text-red-600 border-red-200 hover:bg-red-50 w-full sm:flex-1" 
                                               title="Decline"
                                             >
                                               <XCircle className="h-4 w-4 mr-2"/>
                                               Decline
                                             </Button>
                                         </AlertDialogTrigger>
                                         <AlertDialogContent className="mx-4 max-w-md">
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Decline Request?</AlertDialogTitle>
                                                <AlertDialogDescription>Deny access for {request.requestingUserDisplayName || 'this user'}?</AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                  onClick={() => handleDeclineRequest(request.id)} 
                                                  className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}
                                                >
                                                  Decline
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                         </AlertDialogContent>
                                    </AlertDialog>
                                 </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground text-sm italic py-6">No pending requests.</p>
                )}
             </section>

             {/* --- Account Deletion Section --- */}
             <section className="space-y-4 p-4 sm:p-5 border-2 rounded-lg shadow-sm bg-destructive/5 border-destructive/30 transition-shadow hover:shadow-md duration-300 mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-destructive/30 pb-2 mb-4 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                </h3>
                <div className="space-y-3">
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <h4 className="text-sm font-medium text-destructive mb-1">Delete Account</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <AlertDialog 
                            onOpenChange={(open) => {
                                if (!open) {
                                    setConfirmDeleteText(''); // Clear text when dialog closes
                                }
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    size="default" 
                                    className="text-sm h-10 px-4 w-full sm:w-auto"
                                    disabled={isDeletingAccount}
                                >
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
                            <AlertDialogContent className="border-destructive/30 mx-4 max-w-md">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                        <Trash2 className="h-5 w-5" />
                                        Delete Account Permanently?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm leading-relaxed">
                                        <p className="mb-2">This will <strong className="text-destructive">permanently delete</strong> your account and all associated data including:</p>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                            <li>All food and exercise logs</li>
                                            <li>Workout plans and progress</li>
                                            <li>Friend connections and view requests</li>
                                            <li>Quick log items and preferences</li>
                                            <li>Points and achievements</li>
                                        </ul>
                                        <div className="bg-destructive/10 p-3 rounded-md mt-4 border border-destructive/20">
                                            <p className="text-destructive font-medium text-sm">
                                                Type "DELETE" below to confirm:
                                            </p>
                                            <input 
                                                type="text" 
                                                id="delete-confirmation"
                                                className="w-full p-3 mt-2 text-sm border border-destructive/30 rounded-md bg-background"
                                                placeholder="Type DELETE here"
                                                autoComplete="off"
                                                value={confirmDeleteText}
                                                onChange={(e) => {
                                                    setConfirmDeleteText(e.target.value);
                                                }}
                                            />
                                            {confirmDeleteText && confirmDeleteText !== 'DELETE' && (
                                                <p className="text-xs text-destructive mt-1">
                                                    Please type "DELETE" exactly as shown to enable the button.
                                                </p>
                                            )}
                                            {confirmDeleteText === 'DELETE' && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                                    ✓ Confirmation correct - button is now enabled.
                                                </p>
                                            )}
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel disabled={isDeletingAccount} className="w-full sm:w-auto">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                        id="confirm-delete-button"
                                        onClick={handleDeleteAccount}
                                        disabled={isDeletingAccount || confirmDeleteText !== 'DELETE'}
                                        className={cn(
                                            buttonVariants({ variant: "destructive" }), 
                                            "gap-2 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all w-full sm:w-auto",
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
             </section>

        </CardContent>
        <CardFooter className="p-6 justify-center border-t bg-muted/20 relative z-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              onClick={handleSaveSettings} 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-all duration-200 text-sm sm:text-base focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2" 
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
          </motion.div>
        </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
