// src/components/workout/YouTubeWorkoutExplanation.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Play, ExternalLink, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YouTubeWorkoutExplanationProps {
  youtubeUrl: string;
  workoutName: string;
  description?: string;
  className?: string;
  autoPlay?: boolean;
}

const YouTubeWorkoutExplanation: React.FC<YouTubeWorkoutExplanationProps> = ({
  youtubeUrl,
  workoutName,
  description,
  className,
  autoPlay = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchVideo = () => {
    setIsLoading(true);
    // Open YouTube in a new tab
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <Card className="bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-900/10 dark:via-background dark:to-red-900/10 border-red-200 dark:border-red-800 shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <Youtube className="h-5 w-5 text-red-600" />
            Workout Explanation Video
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Video Preview Card */}
          <div className="relative bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-white ml-0.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    {workoutName}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    How to perform this workout
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleWatchVideo}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                size="sm"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Youtube className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 mr-2" />
                    Watch Now
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              <span>Opens in YouTube</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📱 Mobile friendly</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YouTubeWorkoutExplanation;
