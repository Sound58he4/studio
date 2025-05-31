// src/app/page.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, Target as TargetIcon, Zap, BarChart2 as ReportIconLucide, Users, BrainCircuit, Sparkles, ClipboardList, Eye, Star } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { cn } from "@/lib/utils";

// Component for Feature Cards
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  dataAiHint?: string;
  animationDelay?: string;
}

const FeatureCard = React.memo(function FeatureCard({ icon, title, description, dataAiHint, animationDelay = '0ms' }: FeatureCardProps) {
  return (
      <Card className={cn(
        "bg-card hover:border-primary/40 border border-border/20",
        "transition-all duration-300 h-full",
        "flex flex-col text-center shadow-md hover:shadow-xl",
        "transform hover:-translate-y-1 hover:scale-[1.03]",
        "animate-in fade-in zoom-in-95 card-interactive"
      )}
      style={{ animationDelay }}
      data-ai-hint={dataAiHint}
      >
        <CardHeader className="items-center pb-4 pt-6">
           <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full mb-3 transition-transform duration-300 group-hover:scale-110 ring-1 ring-primary/10">
              {icon}
           </div>
          <CardTitle className="mt-1 text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow px-5 pb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
  );
});
FeatureCard.displayName = 'FeatureCard';


export default function Home() {
  const firebaseLogoUrl = "https://firebasestorage.googleapis.com/v0/b/nutritransform-ai.firebasestorage.app/o/WhatsApp%20Image%202025-05-12%20at%205.56.15%20PM.jpeg?alt=media&token=cbc230df-adcd-48e4-b7dd-4706a96b32f5";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,0px)-var(--footer-height,0px)-var(--bottom-nav-height,0px))] md:min-h-[calc(100vh-var(--header-height-md,0px)-var(--footer-height-md,0px))] space-y-10 text-center px-4 animate-in fade-in duration-700 ease-out">

      {/* Hero Section */}
      <section
        className={cn(
            "relative w-full py-20 md:py-28 lg:py-32 rounded-xl shadow-2xl border border-border/10 overflow-hidden group",
            "bg-glowing-blue-hero" 
        )}
        data-ai-hint="fitness workout gym"
      >
         <div className="absolute inset-0 bg-black/5 dark:bg-black/20 z-0"></div> {/* Subtle Overlay for text contrast */}

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className={cn(
                  "p-1 bg-card/90 backdrop-blur-sm rounded-full shadow-xl border-2 border-border/20 flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 overflow-hidden",
                  "animate-subtle-pulse group-hover:animate-none" // Apply animation, stop on hover
                )}>
                  <Image
                    src={firebaseLogoUrl}
                    alt="Bago AI Logo"
                    width={96}
                    height={96}
                    className="rounded-full object-cover group-hover:scale-110 transition-transform duration-300 ease-out"
                    priority
                    unoptimized={true}
                  />
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-lg animate-slide-in-fade-up animation-delay-200"
              >
                <span className="text-cyan-400">Transform Your Fitness with</span>
                <span className="block mt-2 text-yellow-400"> Bago AI</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 dark:text-foreground/70 max-w-xl mx-auto font-medium drop-shadow-sm animate-slide-in-fade-up animation-delay-300">
                Your intelligent partner for fitness success. Log meals effortlessly, track detailed progress, get personalized plans, and achieve your goals faster with AI insights.
              </p>
              <Link href="/authorize" className="animate-slide-in-fade-up animation-delay-400">
                <Button size="lg" className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transform hover:scale-105 transition-all duration-300 ease-out focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background font-semibold text-base py-3.5 px-10 rounded-full group btn">
                   Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl pt-20 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 ease-out">
         <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Why Choose Bago AI?</h2>
             <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">Unlock your full potential with features designed for your fitness journey.</p>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<TargetIcon className="h-8 w-8 text-primary" />}
              title="Personalized Goals"
              description="Define your unique profile and let Bago AI tailor nutrition and workout targets specifically for you."
              dataAiHint="goal target success"
              animationDelay="100ms"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="Smart Logging"
              description="Effortlessly log meals using camera, voice, or text. AI instantly estimates nutrition."
              dataAiHint="food logging mobile app"
              animationDelay="200ms"
            />
            <FeatureCard
              icon={<ClipboardList className="h-8 w-8 text-primary" />}
              title="AI Workout Plans"
              description="Receive dynamic, gym-focused weekly workout plans generated based on your goals and profile."
              dataAiHint="workout plan schedule"
              animationDelay="300ms"
            />
            <FeatureCard
              icon={<ReportIconLucide className="h-8 w-8 text-primary" />}
              title="Insightful Reports"
              description="Track progress with detailed daily, weekly, and monthly reports powered by AI feedback."
              dataAiHint="analytics chart report"
              animationDelay="400ms"
            />
             <FeatureCard
              icon={<Users className="h-8 w-8 text-primary" />}
              title="Social Connection"
              description="Find friends, share progress based on permissions, and stay motivated together."
              dataAiHint="community friends social"
              animationDelay="500ms"
            />
             <FeatureCard
               icon={<BrainCircuit className="h-8 w-8 text-primary" />}
               title="AI Chat Assistant"
               description="Ask Bago anything! Get personalized fitness advice, food alternatives, and support based on your data."
               dataAiHint="ai chat bot assistant"
               animationDelay="600ms"
             />
          </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full max-w-4xl py-16 md:py-24 text-center animate-in fade-in duration-1000 delay-500">
        <Sparkles className="h-12 w-12 text-amber-400 mx-auto mb-6 animate-pulse duration-3000 animation-delay-1000" />
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Elevate Your Fitness?</h2>
        <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-xl mx-auto">
          Join Bago AI today and take the first step towards a healthier, stronger you.
          Let's achieve your goals together!
        </p>
        <Link href="/authorize">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300 py-4 px-12 text-lg rounded-full group btn">
            Get Started for Free
            <Star className="ml-2 h-5 w-5 group-hover:animate-ping once" />
          </Button>
        </Link>
      </section>

    </div>
  );
}

