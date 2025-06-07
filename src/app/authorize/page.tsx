"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase/exports';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedWrapper, { FadeInWrapper, SlideUpWrapper } from "@/components/ui/animated-wrapper";

export default function AuthorizePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleEmailSignIn = async () => {
    setIsLoadingEmail(true);
    setError(null);
    console.log("[Authorize Page] Attempting Email/Password sign in...");

    // Client-side validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      setIsLoadingEmail(false);
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      setIsLoadingEmail(false);
      return;
    }

    if (!auth) {
      console.error("[Authorize Page] Firebase Auth instance is not available.");
      setError("Authentication service is not configured correctly.");
      setIsLoadingEmail(false);
      toast({ variant: "destructive", title: "Configuration Error", description: "Authentication service failed to load." });
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Authorize Page] Email/Password sign in result obtained.");
      await setLoginCookieAndRedirect(result.user);
    } catch (err: any) {
      console.error("[Authorize Page] Email/Password sign in error occurred.");
      const friendlyError = getFirebaseAuthErrorMessage(err);
      setError(friendlyError);
      toast({ variant: "destructive", title: "Email Sign-In Failed", description: friendlyError });
      setIsLoadingEmail(false); // Ensure loading state is reset on error
    }
  };

  const handleEmailSignUp = async () => {
    setIsLoadingEmail(true);
    setError(null);
    console.log("[Authorize Page] Attempting Email/Password sign up...");

    // Client-side validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      setIsLoadingEmail(false);
      return;
    }

    if (!password.trim()) {
      setError("Please enter a password.");
      setIsLoadingEmail(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoadingEmail(false);
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your password.");
      setIsLoadingEmail(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoadingEmail(false);
      return;
    }

    if (!auth) {
      console.error("[Authorize Page] Firebase Auth instance is not available.");
      setError("Authentication service is not configured correctly.");
      setIsLoadingEmail(false);
      toast({ variant: "destructive", title: "Configuration Error", description: "Authentication service failed to load." });
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Authorize Page] Email/Password sign up result obtained.");
      await setLoginCookieAndRedirect(result.user);
    } catch (err: any) {
      console.error("[Authorize Page] Email/Password sign up error occurred.");
      const friendlyError = getFirebaseAuthErrorMessage(err);
      setError(friendlyError);
      toast({ variant: "destructive", title: "Email Sign-Up Failed", description: friendlyError });
      setIsLoadingEmail(false); // Ensure loading state is reset on error
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

                {/* Toggle between Sign In and Sign Up */}
                <div className="flex justify-between items-center">
                  <Button
                    variant={isSignUp ? "ghost" : "default"}
                    className="flex-1 mr-2"
                    onClick={() => { 
                      setIsSignUp(false); 
                      setError(null); 
                      setEmail(''); 
                      setPassword(''); 
                      setConfirmPassword(''); 
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={isSignUp ? "default" : "ghost"}
                    className="flex-1 ml-2"
                    onClick={() => { 
                      setIsSignUp(true); 
                      setError(null); 
                      setEmail(''); 
                      setPassword(''); 
                      setConfirmPassword(''); 
                    }}
                  >
                    Sign Up
                  </Button>
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

                {/* Email/Password Sign In Form */}
                {!isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-4"
                  >
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 text-base"
                        disabled={isLoadingEmail}
                        required
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-12 text-base pr-10"
                          disabled={isLoadingEmail}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-12 border-2 border-border/50 hover:border-primary/50 
                                 bg-background/50 hover:bg-primary/5 backdrop-blur-sm
                                 text-base font-medium transition-all duration-300
                                 hover:shadow-lg hover:shadow-primary/10"
                        onClick={handleEmailSignIn}
                        disabled={isLoadingEmail}
                      >
                        {isLoadingEmail ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          "Sign In with Email"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Email/Password Sign Up Form */}
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-4"
                  >
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 text-base"
                        disabled={isLoadingEmail}
                        required
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-12 text-base pr-10"
                          disabled={isLoadingEmail}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 text-base pr-10"
                        disabled={isLoadingEmail}
                        required
                      />
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-12 border-2 border-border/50 hover:border-primary/50 
                                 bg-background/50 hover:bg-primary/5 backdrop-blur-sm
                                 text-base font-medium transition-all duration-300
                                 hover:shadow-lg hover:shadow-primary/10"
                        onClick={handleEmailSignUp}
                        disabled={isLoadingEmail}
                      >
                        {isLoadingEmail ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          "Sign Up with Email"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
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

