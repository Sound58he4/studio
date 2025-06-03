
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '@/lib/firebase/exports';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Dumbbell, 
  Activity, 
  Target, 
  TrendingUp, 
  Zap,
  Shield,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedWrapper, { FadeInWrapper, SlideUpWrapper } from "@/components/ui/animated-wrapper";

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

  const setLoginCookieAndRedirect = (user: any) => {
    console.log("[Authorize Page] Login successful for user:", user.uid, user.email);
    console.log("[Authorize Page] Setting isLoggedIn cookie...");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString(); // 7 days expiration
    const cookieOptions = `path=/; expires=${expires}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    document.cookie = `isLoggedIn=true; ${cookieOptions}`;
    console.log("[Authorize Page] isLoggedIn cookie set. Current document.cookie:", document.cookie);

    toast({
      title: "Login Successful",
      description: `Welcome! Redirecting to profile...`,
      variant: 'default',
    });

    console.log("[Authorize Page] Navigating to /profile...");
    router.replace('/profile'); // Use replace to avoid auth page in history
    console.log("[Authorize Page] Navigation to /profile initiated.");
  };

  const getFirebaseAuthErrorMessage = (err: any): string => {
    console.error("[Authorize Page] Raw Firebase Auth Error:", err);
    const code = err.code || 'unknown';
    console.log("[Authorize Page] Formatting Firebase error code:", code);
    switch (code) {
      case 'auth/popup-closed-by-user': return 'Sign-in process cancelled by user.';
      case 'auth/cancelled-popup-request':
      case 'auth/popup-blocked': return 'Sign-in popup blocked/cancelled. Check browser settings.';
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
      setLoginCookieAndRedirect(result.user);
    } catch (err: any) {
      console.error("[Authorize Page] Google sign in error occurred.");
      const friendlyError = getFirebaseAuthErrorMessage(err);
      setError(friendlyError);
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: friendlyError });
      setIsLoadingGoogle(false); // Ensure loading state is reset on error
    }
  };

  const features = [
    { icon: Activity, title: "Track Progress", description: "Monitor your fitness journey" },
    { icon: Target, title: "Set Goals", description: "Achieve your fitness targets" },
    { icon: TrendingUp, title: "Analytics", description: "Detailed workout insights" },
    { icon: Zap, title: "AI Powered", description: "Smart recommendations" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <FadeInWrapper delay={0.2}>
            <div className="max-w-lg">
              <motion.div
                className="flex items-center space-x-3 mb-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="relative">
                  <Dumbbell className="h-10 w-10 text-primary" />
                  <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-full blur-md"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Bago Fitness
                </h1>
              </motion.div>

              <motion.h2
                className="text-3xl font-bold text-foreground mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Transform Your Fitness Journey
              </motion.h2>

              <motion.p
                className="text-xl text-muted-foreground mb-12 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                Experience the future of fitness tracking with AI-powered insights, 
                personalized workouts, and comprehensive progress monitoring.
              </motion.p>

              <div className="grid grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="group"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 
                                    hover:bg-card/80 hover:border-primary/30 transition-all duration-300
                                    hover:shadow-lg hover:shadow-primary/10">
                      <feature.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeInWrapper>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <SlideUpWrapper delay={0.4}>
            <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/20 shadow-2xl 
                           hover:shadow-3xl transition-all duration-500 hover:bg-card/90">
              {/* Card Header with Gradient */}
              <div className="relative overflow-hidden rounded-t-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                <CardHeader className="relative text-center py-8 px-6">
                  <motion.div
                    className="flex justify-center mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="relative">
                      <Dumbbell className="h-12 w-12 text-primary-foreground drop-shadow-lg" />
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-full blur-lg"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>
                  
                  <CardTitle className="text-2xl font-bold text-primary-foreground mb-2">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80 text-base">
                    Sign in to continue your fitness journey
                  </CardDescription>
                </CardHeader>
              </div>

              <CardContent className="p-8 space-y-6">
                {/* Mobile Logo for Small Screens */}
                <div className="lg:hidden text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Dumbbell className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Bago Fitness
                    </span>
                  </div>
                  <p className="text-muted-foreground">Transform your fitness journey with AI</p>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"
                    >
                      <p className="text-sm font-medium text-destructive text-center">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-border/50 hover:border-primary/50 
                             bg-background/50 hover:bg-primary/5 backdrop-blur-sm
                             text-base font-medium transition-all duration-300
                             hover:shadow-lg hover:shadow-primary/10
                             group relative overflow-hidden"
                    onClick={handleGoogleSignIn}
                    disabled={isLoadingGoogle}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-center justify-center space-x-3">
                      {isLoadingGoogle ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <svg 
                            className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 1.98-4.52 1.98-5.45 0-9.84-4.38-9.84-9.8s4.39-9.8 9.84-9.8c2.78 0 4.96 1.08 6.48 2.48l-2.94 2.76c-.84-.79-2-1.23-3.54-1.23-4.21 0-7.6 3.42-7.6 7.63s3.39 7.63 7.6 7.63c2.68 0 4.36-1.16 5.58-2.25.96-1.08 1.58-2.68 1.79-4.83h-7.37z" 
                              fill="#4285F4"
                            />
                          </svg>
                          <span>Continue with Google</span>
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center space-x-6 pt-4 border-t border-border/20">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Trusted by you!</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SlideUpWrapper>
        </div>
      </div>
    </div>
  );
}

