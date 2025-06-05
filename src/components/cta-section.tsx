"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Download, 
  Star, 
  Shield, 
  Zap, 
  Heart,
  Smartphone,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";

export function CTASection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/authorize');
    //Refresh the page after 1000 milliseconds
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const benefits = [
    {
      icon: Shield,
      text: "Privacy Focused"
    },
    {
      icon: Zap,
      text: "Quick Setup"
    },
    {
      icon: Heart,
      text: "No Ads or Subscriptions"
    },
    {
      icon: Trophy,
      text: "Offline Capable"
    }  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.1, 0.9, 1.1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main CTA Content */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-8"
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Available on All Platforms
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">Ready to Start Your</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Transformation?
            </span>
          </motion.h2>          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Take control of your fitness journey with AI-powered workouts, 
            personalized nutrition tracking, and comprehensive progress insights.
          </motion.p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 mb-10"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border/30"
              >
                <benefit.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{benefit.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button 
              size="lg" 
              className="group px-8 py-4 text-lg h-auto relative overflow-hidden min-w-[200px]"
              onClick={handleGetStarted}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
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
              className="group px-8 py-4 text-lg h-auto backdrop-blur-sm min-w-[200px]"
            >
              <Download className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Download App
            </Button>
          </motion.div>          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-6">
              Everything you need to succeed
            </p>
            
            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20"
              >
                <div className="flex justify-center mb-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  AI-Powered Workouts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Personalized exercise plans that adapt to your progress and goals
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20"
              >
                <div className="flex justify-center mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Nutrition Tracking
                </h3>
                <p className="text-xs text-muted-foreground">
                  Smart calorie and macro tracking with food image recognition
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20"
              >
                <div className="flex justify-center mb-2">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Progress Analytics
                </h3>
                <p className="text-xs text-muted-foreground">
                  Detailed insights and trends to keep you motivated and on track
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-3 h-3 bg-primary/40 rounded-full blur-sm"
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-accent/50 rounded-full blur-sm"
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
    </section>
  );
}
