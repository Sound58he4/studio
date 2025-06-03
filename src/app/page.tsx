"use client";

import { FeatureGrid } from "@/components/feature-grid";
import { HeroSection } from "@/components/hero-section";
import { CTASection } from "@/components/cta-section";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Dumbbell, 
  Target, 
  Activity, 
  Zap, 
  Brain,
  TrendingUp,
  Shield,
  Heart,
  Award,
  Users,
  Timer
} from "lucide-react";

// Enhanced Background Effects Component
function EnhancedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number }>>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });
  
  const gradientX = useTransform(springX, [0, window?.innerWidth || 1920], [0, 100]);
  const gradientY = useTransform(springY, [0, window?.innerHeight || 1080], [0, 100]);

  // Initialize particles
  useEffect(() => {
    const particleCount = 50;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * (window?.innerWidth || 1920),
      y: Math.random() * (window?.innerHeight || 1080),
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1
    }));
    setParticles(newParticles);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Floating geometric shapes
  const geometricShapes = [
    { shape: 'circle', size: 100, delay: 0 },
    { shape: 'triangle', size: 80, delay: 2 },
    { shape: 'square', size: 60, delay: 4 },
    { shape: 'hexagon', size: 120, delay: 1 },
    { shape: 'diamond', size: 90, delay: 3 }
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient background that follows mouse */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                      rgba(139, 92, 246, 0.15), 
                      rgba(59, 130, 246, 0.1), 
                      transparent 50%)`
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.x,
            top: particle.y,
          }}
          animate={{
            y: [particle.y, particle.y - 100],
            opacity: [0.7, 0, 0.7],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 10 + particle.speed * 5,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10
          }}
        />
      ))}

      {/* Large floating geometric shapes */}
      {geometricShapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute opacity-5"
          style={{
            left: `${10 + index * 20}%`,
            top: `${20 + index * 15}%`,
            width: shape.size,
            height: shape.size,
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: "linear",
            delay: shape.delay
          }}
        >
          {shape.shape === 'circle' && (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent" />
          )}
          {shape.shape === 'square' && (
            <div className="w-full h-full bg-gradient-to-br from-accent to-primary rotate-45" />
          )}
          {shape.shape === 'triangle' && (
            <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[60px] 
                          border-l-transparent border-r-transparent border-b-primary/50" />
          )}
          {shape.shape === 'hexagon' && (
            <div className="w-full h-full bg-gradient-to-br from-primary to-accent 
                          transform rotate-30" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }} />
          )}
          {shape.shape === 'diamond' && (
            <div className="w-full h-full bg-gradient-to-br from-accent to-primary rotate-45" />
          )}
        </motion.div>
      ))}

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <motion.div
              key={i}
              className="border border-primary/20"
              animate={{
                opacity: [0.2, 0.5, 0.2],
                borderColor: ['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Pulsing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/10 rounded-full blur-xl"
        animate={{
          scale: [1.2, 0.8, 1.2],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        className="absolute top-3/4 left-3/4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"
        animate={{
          scale: [0.8, 1.3, 0.8],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />
    </div>
  );
}

// Enhanced Features Showcase Section
function FeaturesShowcase() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get personalized workout recommendations based on your performance and goals",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Activity,
      title: "Real-time Tracking",
      description: "Monitor your workouts, heart rate, and progress in real-time",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Goal Setting",
      description: "Set and achieve your fitness goals with smart milestone tracking",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Detailed insights and analytics to track your fitness journey",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Quick Workouts",
      description: "Access lightning-fast workout routines for busy schedules",
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
      description: "Monitor your overall wellness including sleep, stress, and recovery",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Award,
      title: "Achievement System",
      description: "Unlock badges and achievements as you reach new milestones",
      color: "from-amber-500 to-yellow-500"
    },
    {
      icon: Users,
      title: "Community Features",
      description: "Connect with like-minded fitness enthusiasts and share progress",
      color: "from-teal-500 to-green-500"
    },
    {
      icon: Timer,
      title: "Workout Timer",
      description: "Built-in timers for intervals, rest periods, and workout duration",
      color: "from-slate-500 to-gray-500"
    },
    {
      icon: Dumbbell,
      title: "Exercise Library",
      description: "Comprehensive library of exercises with proper form demonstrations",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: Sparkles,
      title: "Adaptive Training",
      description: "Workouts that adapt to your fitness level and preferences",
      color: "from-cyan-500 to-blue-500"
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Powerful Features for Your Fitness Journey
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of fitness technology with AI-driven insights, 
            comprehensive tracking, and personalized recommendations designed to help you achieve your goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl blur-xl 
                            group-hover:blur-sm transition-all duration-500 opacity-0 group-hover:opacity-100" />
              
              <div className="relative p-6 rounded-2xl bg-card/60 backdrop-blur-lg border border-border/20 
                            hover:border-primary/30 transition-all duration-500 h-full
                            hover:shadow-2xl hover:shadow-primary/10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${feature.color} 
                                group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl opacity-0 
                           group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col min-h-screen relative overflow-hidden"
    >
      <EnhancedBackground />
      <div className="relative z-10">
        <HeroSection />
        <FeatureGrid />
        {/* <FeaturesShowcase /> */}
        <CTASection />
      </div>
    </motion.main>
  );
}

