"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '@/lib/firebase/exports';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Dumbbell, 
  Shield,
  Users
} from "lucide-react";

export default function AuthorizePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remove the problematic isClient state and loading guard
  useEffect(() => {
    console.log("[Authorize Page] Component mounted.");
    // Middleware handles redirecting logged-in users away from /authorize
  }, []);

  const setLoginCookieAndRedirect = async (user: any) => {
    console.log("[Authorize Page] Login successful for user:", user.uid, user.email);
    console.log("[Authorize Page] Setting login cookies...");
    
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString(); // 7 days expiration
    const cookieOptions = `path=/; expires=${expires}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    
    // Set the isLoggedIn cookie
    document.cookie = `isLoggedIn=true; ${cookieOptions}`;
    
    // Get the display name from Firebase user or fallback to email or user ID
    let displayName = user.displayName;
    if (!displayName && user.email) {
      displayName = user.email.split('@')[0]; // Use email prefix as fallback
    }
    if (!displayName) {
      displayName = `user_${user.uid.substring(0, 6)}`; // Use user ID prefix as fallback
    }
    
    // Set the userDisplayName cookie for middleware access
    document.cookie = `userDisplayName=${encodeURIComponent(displayName)}; ${cookieOptions}`;
    
    console.log("[Authorize Page] Cookies set - isLoggedIn: true, userDisplayName:", displayName);
    console.log("[Authorize Page] Current document.cookie:", document.cookie);

    toast({
      title: "Login Successful",
      description: `Welcome ${displayName}! Redirecting to profile...`,
      variant: 'default',
    });

    console.log("[Authorize Page] Navigating to /profile...");
    router.replace('/profile'); // Use replace to avoid auth page in history
    console.log("[Authorize Page] Navigation to /profile initiated.");
    
    // Refresh page after 100ms to ensure auth state is updated
    setTimeout(() => {
      console.log("[Authorize Page] Refreshing page after navigation...");
      window.location.reload();
    }, 100);
  };

  const getFirebaseAuthErrorMessage = (err: any): string => {
    console.error("[Authorize Page] Raw Firebase Auth Error:", err);
    const code = err.code || 'unknown';
    console.log("[Authorize Page] Formatting Firebase error code:", code);
    switch (code) {
      // Google OAuth errors
      case 'auth/popup-closed-by-user': return 'Sign-in process cancelled by user.';
      case 'auth/cancelled-popup-request':
      case 'auth/popup-blocked': return 'Sign-in popup blocked/cancelled. Check browser settings.';
      
      // Email/Password specific errors
      case 'auth/user-not-found': return 'No account found with this email address.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/invalid-email': return 'Invalid email address format.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.';
      case 'auth/invalid-credential': return 'Invalid email or password.';
      
      // General errors
      case 'auth/network-request-failed': return 'Network error. Check connection.';
      case 'auth/operation-not-allowed': return 'Sign-in method not enabled.';
      case 'auth/unauthorized-domain': return 'Domain not authorized. Contact support.';
      case 'auth/internal-error': return 'Internal auth error. Try again later.';
      default:
        return `An unexpected error occurred (${code}). Please try again.`;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    console.log("[Authorize Page] Attempting Google sign in...");

    if (!auth) {
      console.error("[Authorize Page] Firebase Auth instance is not available.");
      setError("Authentication service is not configured correctly.");
      setIsLoadingGoogle(false);
      toast({ variant: "destructive", title: "Configuration Error", description: "Authentication service failed to load." });
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      console.log("[Authorize Page] Google sign in result obtained.");
      await setLoginCookieAndRedirect(result.user);
    } catch (err: any) {
      console.error("[Authorize Page] Google sign in error occurred.");
      const friendlyError = getFirebaseAuthErrorMessage(err);
      setError(friendlyError);
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: friendlyError });
      setIsLoadingGoogle(false); // Ensure loading state is reset on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          {/* Brand Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-card/70 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-inner border border-border/50">
                <Dumbbell className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-foreground">Bago Fitness</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Transform your fitness journey with AI-powered insights
            </p>
          </div>

          {/* Glass Card Container */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-border/50 p-6 sm:p-8">
            
            {/* Welcome Text */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Welcome to Bago Fitness
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sign in with your Google account to get started
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-xl sm:rounded-2xl">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Google Login */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="w-full h-12 sm:h-14 bg-card/80 backdrop-blur-sm hover:bg-card/90 disabled:opacity-50 disabled:cursor-not-allowed text-foreground border border-border/50 font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:scale-[1.02] text-sm sm:text-base"
            >
              {isLoadingGoogle ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  {/* Google Icon */}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Footer Icons/Text */}
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Trusted by you!</span>
              </div>
            </div>
          </div>

          {/* Terms Text */}
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-muted-foreground px-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

