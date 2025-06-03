"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Activity, 
  Target, 
  TrendingUp, 
  Zap, 
  Shield,
  Heart,
  Award,
  Users,
  Timer,
  Dumbbell,
  Sparkles,
  BarChart3,
  Calendar,
  MessageCircle,
  Camera
} from "lucide-react";

const primaryFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get personalized workout recommendations and real-time form corrections powered by advanced machine learning",
    color: "from-purple-500 to-pink-500",
    highlight: true
  },
  {
    icon: Activity,
    title: "Real-time Tracking",
    description: "Monitor your workouts, heart rate, calories, and performance metrics in real-time with precision",
    color: "from-blue-500 to-cyan-500",
    highlight: true
  },
  {
    icon: Target,
    title: "Smart Goal Setting",
    description: "Set and achieve your fitness goals with intelligent milestone tracking and adaptive targets",
    color: "from-green-500 to-emerald-500",
    highlight: true
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description: "Comprehensive insights and detailed analytics to visualize your fitness journey and improvements",
    color: "from-orange-500 to-red-500",
    highlight: true
  }
];

const secondaryFeatures = [
  {
    icon: Zap,
    title: "Quick Workouts",
    description: "Lightning-fast workout routines designed for busy schedules",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Shield,
    title: "Health Monitoring",
    description: "Comprehensive health metrics and safety recommendations",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: Heart,
    title: "Wellness Tracking",
    description: "Monitor sleep, stress, recovery, and overall wellness",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: Award,
    title: "Achievement System",
    description: "Unlock badges and achievements as you reach milestones",
    color: "from-amber-500 to-yellow-500"
  },
  {
    icon: Users,
    title: "Community Features",
    description: "Connect with fitness enthusiasts and share progress",
    color: "from-teal-500 to-green-500"
  },
  {
    icon: Timer,
    title: "Workout Timer",
    description: "Built-in timers for intervals and workout duration",
    color: "from-slate-500 to-gray-500"
  },
  {
    icon: Dumbbell,
    title: "Exercise Library",
    description: "Comprehensive library with proper form demonstrations",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Sparkles,
    title: "Adaptive Training",
    description: "Workouts that adapt to your fitness level and preferences",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: BarChart3,
    title: "Performance Metrics",
    description: "Detailed performance analysis and improvement suggestions",
    color: "from-red-500 to-pink-500"
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent workout scheduling based on your availability",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: MessageCircle,
    title: "AI Coach Chat",
    description: "24/7 AI fitness coach for guidance and motivation",
    color: "from-green-500 to-teal-500"
  },
  {
    icon: Camera,
    title: "Form Analysis",
    description: "Real-time exercise form analysis using computer vision",
    color: "from-purple-500 to-indigo-500"
  }
];

export function FeatureGrid() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Premium Features
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover powerful features designed to transform your fitness journey with cutting-edge technology, 
            personalized insights, and comprehensive tracking capabilities.
          </p>
        </motion.div>

        {/* Primary Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {primaryFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-xl 
                            group-hover:blur-lg transition-all duration-500 opacity-0 group-hover:opacity-100" />
              
              <div className="relative p-8 rounded-2xl bg-card/80 backdrop-blur-lg border border-border/30 
                            hover:border-primary/40 transition-all duration-500
                            hover:shadow-2xl hover:shadow-primary/20">
                <div className="flex items-start gap-6">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${feature.color} 
                                group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <feature.icon className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl opacity-0 
                           group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  initial={{ scale: 0.95 }}
                  whileHover={{ scale: 1 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {secondaryFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl blur-lg 
                            group-hover:blur-sm transition-all duration-500 opacity-0 group-hover:opacity-100" />
              
              <div className="relative p-6 rounded-xl bg-card/60 backdrop-blur-md border border-border/20 
                            hover:border-primary/30 transition-all duration-500 h-full
                            hover:shadow-xl hover:shadow-primary/10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} 
                                group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white drop-shadow-md" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/8 to-accent/8 rounded-xl opacity-0 
                           group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  initial={{ scale: 0.9 }}
                  whileHover={{ scale: 1 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16 pt-8 border-t border-border/20"
        >
          <p className="text-lg text-muted-foreground mb-2">
            Ready to experience the future of fitness?
          </p>
          <p className="text-sm text-muted-foreground/80">
            Join millions of users who have transformed their lives with our advanced platform
          </p>
        </motion.div>
      </div>
    </section>
  );
}
