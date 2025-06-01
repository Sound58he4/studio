// src/components/workout/WorkoutQuoteDisplay.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutQuoteDisplayProps {
  quote: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'minimal' | 'featured';
}

const WorkoutQuoteDisplay: React.FC<WorkoutQuoteDisplayProps> = ({
  quote,
  className,
  showIcon = true,
  variant = 'default'
}) => {
  const variants = {
    default: "bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-primary/20",
    minimal: "bg-muted/30 border-border/50",
    featured: "bg-gradient-to-br from-orange-500/10 via-red-500/5 to-yellow-500/10 border-orange-200 dark:border-orange-800"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Card className={cn(
        "shadow-sm border-2 overflow-hidden transition-all duration-300 hover:shadow-md",
        variants[variant]
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            {showIcon && (
              <motion.div
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex-shrink-0"
              >
                <Quote className={cn(
                  "h-6 w-6 sm:h-8 sm:w-8",
                  variant === 'featured' ? "text-orange-600 dark:text-orange-400" : "text-primary"
                )} />
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex-1"
            >
              <blockquote className={cn(
                "text-sm sm:text-base font-medium leading-relaxed italic",
                variant === 'featured' 
                  ? "text-orange-800 dark:text-orange-200" 
                  : "text-foreground/90"
              )}>
                "{quote}"
              </blockquote>
            </motion.div>
          </div>
          
          {/* Decorative elements for featured variant */}
          {variant === 'featured' && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-4 h-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WorkoutQuoteDisplay;
