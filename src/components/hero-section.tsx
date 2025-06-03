"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Users, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const router = useRouter();

  const handleStartJourney = () => {
    router.push('/authorize');
    //Refresh the apge after 100 milliseconds
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Hero Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-8"
          >
            <Star className="h-4 w-4 text-primary fill-current" />
            <span className="text-sm font-medium text-primary">
              #1 AI-Powered Fitness App
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Transform Your
            </span>
            <br />
            <span className="text-foreground">
              Fitness Journey
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Experience the future of fitness with AI-powered workouts, 
            real-time tracking, and personalized insights that adapt to your goals.
          </motion.p>          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">AI-Powered</span>
              <span>Workout Plans</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Real-Time</span>
              <span>Progress Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Personalized</span>
              <span>Nutrition Insights</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >            <Button 
              size="lg" 
              className="group px-8 py-4 text-lg h-auto relative overflow-hidden"
              onClick={handleStartJourney}
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.05 }}
              />
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              className="group px-8 py-4 text-lg h-auto backdrop-blur-sm"
            >
              <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-border/20"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by leading fitness professionals and athletes worldwide
            </p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              {/* Placeholder for brand logos */}
              <div className="h-8 w-24 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 rounded" />
              <div className="h-8 w-24 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 rounded" />
              <div className="h-8 w-24 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 rounded" />
              <div className="h-8 w-24 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 rounded hidden sm:block" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary/30 rounded-full blur-sm"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 w-3 h-3 bg-accent/40 rounded-full blur-sm"
        animate={{
          y: [0, -15, 0],
          x: [0, 10, 0],
          opacity: [0.4, 0.9, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-500/50 rounded-full blur-sm"
        animate={{
          y: [0, -10, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </section>
  );
}
