"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Flame, 
    Timer, 
    Zap, 
    Target, 
    TrendingUp, 
    Dumbbell, 
    Activity,
    Heart,
    Clock,
    RotateCcw,
    CheckCircle,
    Info,
    Sparkles
} from 'lucide-react';
import { cn } from "@/lib/utils";
import type { ExerciseDetail } from '@/app/dashboard/types';

interface CalisthenicsCalorieLoggerProps {
    exercise: ExerciseDetail;
    onLogCalories: (calories: number, isEstimated: boolean) => void;
    onCancel: () => void;
    isDark: boolean;
    isEstimating?: boolean;
}

// Calisthenics exercise categories and their typical calorie burn rates (per minute)
const CALISTHENICS_EXERCISES = {
    'Push Exercises': {
        icon: <Zap className="w-4 h-4" />,
        color: 'from-red-500 to-orange-500',
        exercises: {
            'Push-ups': { baseCalories: 8, difficulty: 'medium' },
            'Pike Push-ups': { baseCalories: 9, difficulty: 'hard' },
            'Handstand Push-ups': { baseCalories: 12, difficulty: 'extreme' },
            'Dips': { baseCalories: 10, difficulty: 'medium' },
            'Diamond Push-ups': { baseCalories: 9, difficulty: 'hard' },
        }
    },
    'Pull Exercises': {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'from-blue-500 to-cyan-500',
        exercises: {
            'Pull-ups': { baseCalories: 10, difficulty: 'hard' },
            'Chin-ups': { baseCalories: 9, difficulty: 'medium' },
            'Muscle-ups': { baseCalories: 15, difficulty: 'extreme' },
            'Australian Pull-ups': { baseCalories: 7, difficulty: 'medium' },
        }
    },
    'Core & Abs': {
        icon: <Target className="w-4 h-4" />,
        color: 'from-green-500 to-emerald-500',
        exercises: {
            'Plank': { baseCalories: 5, difficulty: 'easy' },
            'Mountain Climbers': { baseCalories: 12, difficulty: 'hard' },
            'Burpees': { baseCalories: 15, difficulty: 'extreme' },
            'L-Sit': { baseCalories: 8, difficulty: 'hard' },
            'Leg Raises': { baseCalories: 6, difficulty: 'medium' },
        }
    },
    'Legs & Lower': {
        icon: <Activity className="w-4 h-4" />,
        color: 'from-purple-500 to-pink-500',
        exercises: {
            'Squats': { baseCalories: 7, difficulty: 'easy' },
            'Lunges': { baseCalories: 8, difficulty: 'medium' },
            'Jump Squats': { baseCalories: 12, difficulty: 'hard' },
            'Pistol Squats': { baseCalories: 10, difficulty: 'extreme' },
            'Calf Raises': { baseCalories: 4, difficulty: 'easy' },
        }
    },
    'Full Body': {
        icon: <Dumbbell className="w-4 h-4" />,
        color: 'from-yellow-500 to-red-500',
        exercises: {
            'Burpees': { baseCalories: 15, difficulty: 'extreme' },
            'Bear Crawl': { baseCalories: 11, difficulty: 'hard' },
            'Turkish Get-ups': { baseCalories: 9, difficulty: 'medium' },
            'Mountain Climbers': { baseCalories: 12, difficulty: 'hard' },
        }
    }
};

const INTENSITY_LEVELS = {
    light: { multiplier: 0.7, label: 'Light', color: 'bg-green-500', description: 'Easy pace, focusing on form' },
    moderate: { multiplier: 1.0, label: 'Moderate', color: 'bg-yellow-500', description: 'Steady effort, controlled' },
    intense: { multiplier: 1.3, label: 'Intense', color: 'bg-orange-500', description: 'Challenging, pushing limits' },
    extreme: { multiplier: 1.6, label: 'Extreme', color: 'bg-red-500', description: 'Maximum effort, beast mode' }
};

const CalisthenicsCalorieLogger: React.FC<CalisthenicsCalorieLoggerProps> = ({
    exercise,
    onLogCalories,
    onCancel,
    isDark,
    isEstimating = false
}) => {
    const [activeTab, setActiveTab] = useState<'quick' | 'detailed' | 'manual'>('quick');
    const [duration, setDuration] = useState<number>(10);
    const [intensity, setIntensity] = useState<keyof typeof INTENSITY_LEVELS>('moderate');
    const [manualCalories, setManualCalories] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    React.useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Auto-detect exercise category and type
    const detectedExercise = useMemo(() => {
        const exerciseName = exercise.exercise.toLowerCase();
        
        for (const [category, data] of Object.entries(CALISTHENICS_EXERCISES)) {
            for (const [exerciseType, details] of Object.entries(data.exercises)) {
                if (exerciseName.includes(exerciseType.toLowerCase()) || 
                    exerciseType.toLowerCase().includes(exerciseName)) {
                    return { category, exerciseType, ...details };
                }
            }
        }
        
        // Default fallback
        return { category: 'Full Body', exerciseType: 'General Exercise', baseCalories: 8, difficulty: 'medium' };
    }, [exercise.exercise]);

    // Calculate estimated calories
    const estimatedCalories = useMemo(() => {
        let baseCalories = detectedExercise.baseCalories;
        
        if (selectedExercise && selectedCategory) {
            const categoryData = CALISTHENICS_EXERCISES[selectedCategory as keyof typeof CALISTHENICS_EXERCISES];
            if (categoryData && categoryData.exercises) {
                const exerciseData = (categoryData.exercises as any)[selectedExercise];
                if (exerciseData && exerciseData.baseCalories) {
                    baseCalories = exerciseData.baseCalories;
                }
            }
        }
        
        const intensityMultiplier = INTENSITY_LEVELS[intensity].multiplier;
        return Math.round(baseCalories * (duration / 60) * intensityMultiplier * 60); // calories per hour calculation
    }, [duration, intensity, selectedExercise, selectedCategory, detectedExercise]);

    const handleQuickLog = () => {
        onLogCalories(estimatedCalories, true);
    };

    const handleDetailedLog = () => {
        onLogCalories(estimatedCalories, true);
    };

    const handleManualLog = () => {
        const calories = parseInt(manualCalories);
        if (calories && calories > 0) {
            onLogCalories(calories, false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'hard': return 'bg-orange-500';
            case 'extreme': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full ${isMobile ? 'max-w-xs mx-2 max-h-[85vh] flex flex-col' : 'max-w-2xl mx-auto'} rounded-3xl border-0 shadow-2xl backdrop-blur-sm ${
                isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-gradient-to-br from-white/95 via-blue-50/80 to-purple-50/80'
            }`}
        >
            {/* Header */}
            <div className={`text-center space-y-3 ${isMobile ? 'pt-3 px-3 flex-shrink-0' : 'pt-6 px-6'}`}>
                <motion.div 
                    className={`mx-auto ${isMobile ? 'w-10 h-10' : 'w-16 h-16'} rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Flame className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} text-white`} />
                </motion.div>
                
                <div>
                    <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'}`}>
                        Calisthenics Calorie Logger
                    </h2>
                    <div className={`space-y-2 ${isMobile ? 'mt-2' : 'mt-3'}`}>
                        <p className={`font-medium ${isMobile ? 'text-xs' : 'text-base'} ${isDark ? 'text-white' : 'text-gray-800'}`}>{exercise.exercise}</p>
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant="secondary" className={`${getDifficultyColor(detectedExercise.difficulty)} text-white ${isMobile ? 'text-xs px-1.5 py-0.5' : ''}`}>
                                {detectedExercise.difficulty.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={isMobile ? 'text-xs px-1.5 py-0.5' : ''}>{detectedExercise.category}</Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={`${isMobile ? 'px-3 py-2 flex-1 overflow-hidden' : 'px-6 py-4'}`}>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className={`w-full ${isMobile ? 'h-full flex flex-col' : ''}`}>
                    <TabsList className={`grid w-full grid-cols-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white/50'} ${isMobile ? 'h-8 flex-shrink-0' : 'h-12'}`}>
                        <TabsTrigger value="quick" className={`flex items-center gap-1 ${isMobile ? 'text-xs px-1' : 'gap-2'}`}>
                            <Zap className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            {!isMobile && 'Quick'}
                            {isMobile && 'Quick'}
                        </TabsTrigger>
                        <TabsTrigger value="detailed" className={`flex items-center gap-1 ${isMobile ? 'text-xs px-1' : 'gap-2'}`}>
                            <Target className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            {!isMobile && 'Detailed'}
                            {isMobile && 'Detail'}
                        </TabsTrigger>
                        <TabsTrigger value="manual" className={`flex items-center gap-1 ${isMobile ? 'text-xs px-1' : 'gap-2'}`}>
                            <Flame className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                            {!isMobile && 'Manual'}
                            {isMobile && 'Manual'}
                        </TabsTrigger>
                    </TabsList>

                    {/* Quick Tab */}
                    <TabsContent value="quick" className={`space-y-3 mt-3 ${isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
                        <Card className={`${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'bg-white/50 border-blue-200/30'}`}>
                            <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
                                <div className={`text-center space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'} text-yellow-500`} />
                                        <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-base'} ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            Smart Estimate
                                        </span>
                                    </div>
                                    
                                    <div className={`space-y-1 ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
                                        <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                            {estimatedCalories}
                                        </div>
                                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            calories burned
                                        </div>
                                    </div>

                                    <div className={`${isMobile ? 'p-2' : 'p-3'} rounded-xl border ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-blue-50/50 border-blue-200/30'}`}>
                                        <div className="flex items-start gap-2">
                                            <Info className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                                            <p className={`${isMobile ? 'text-xs' : 'text-xs'} leading-relaxed ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                                                <strong>Auto-detected:</strong> {detectedExercise.exerciseType} • {detectedExercise.difficulty} difficulty • ~10 min moderate intensity
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Detailed Tab */}
                    <TabsContent value="detailed" className={`space-y-3 mt-3 ${isMobile ? 'flex-1 overflow-y-auto pb-2' : ''}`}>
                        <div className={`space-y-3 ${isMobile ? 'min-h-0' : ''}`}>
                            {/* Duration Control */}
                            <Card className={`${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'bg-white/50 border-blue-200/30'}`}>
                                <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
                                    <div className={`space-y-2 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                                        <div className="flex items-center gap-2">
                                            <Timer className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                            <Label className={`font-semibold ${isMobile ? 'text-xs' : 'text-base'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                                Duration: {duration} minutes
                                            </Label>
                                        </div>
                                        <Slider
                                            value={[duration]}
                                            onValueChange={(value) => setDuration(value[0])}
                                            max={60}
                                            min={1}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                                            <span>1 min</span>
                                            <span>60 min</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Intensity Control */}
                            <Card className={`${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'bg-white/50 border-blue-200/30'}`}>
                                <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
                                    <div className={`space-y-2 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                                        <div className="flex items-center gap-2">
                                            <Heart className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                            <Label className={`font-semibold ${isMobile ? 'text-xs' : 'text-base'} ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                                Intensity Level
                                            </Label>
                                        </div>
                                        <div className={`grid ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-2 gap-2'}`}>
                                            {Object.entries(INTENSITY_LEVELS).map(([key, level]) => (
                                                <motion.button
                                                    key={key}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setIntensity(key as keyof typeof INTENSITY_LEVELS)}
                                                    className={cn(
                                                        `${isMobile ? 'p-1.5' : 'p-3'} rounded-xl border-2 transition-all duration-200`,
                                                        intensity === key
                                                            ? "border-orange-500 bg-orange-500/20"
                                                            : "border-gray-200 hover:border-gray-300",
                                                        isDark ? "bg-[#2a2a2a] hover:bg-[#333]" : "bg-white/50 hover:bg-white/70"
                                                    )}
                                                >
                                                    <div className={`text-center ${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
                                                        <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${level.color} mx-auto`} />
                                                        <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                            {level.label}
                                                        </div>
                                                        {!isMobile && (
                                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {level.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Calorie Display */}
                            <Card className={`${isDark ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-500/30' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'}`}>
                                <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
                                    <div className={`text-center space-y-1 ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
                                        <div className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                            {estimatedCalories} kcal
                                        </div>
                                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {duration}min • {INTENSITY_LEVELS[intensity].label} intensity
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Manual Tab */}
                    <TabsContent value="manual" className={`space-y-3 mt-3 ${isMobile ? 'flex-1 overflow-y-auto' : ''}`}>
                        <Card className={`${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'bg-white/50 border-blue-200/30'}`}>
                            <CardContent className={`${isMobile ? 'p-2' : 'p-4'}`}>
                                <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                                    <Label htmlFor="manual-calories" className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                        Enter Calories Burned 🔥
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="manual-calories"
                                            type="number"
                                            placeholder="Enter calories manually"
                                            value={manualCalories}
                                            onChange={(e) => setManualCalories(e.target.value)}
                                            className={`rounded-2xl border-2 backdrop-blur-sm focus:ring-2 focus:ring-opacity-20 pl-4 pr-16 ${isMobile ? 'py-1.5 text-sm' : 'py-3 text-lg'} font-medium transition-all duration-300 shadow-sm ${
                                                isDark 
                                                    ? 'border-[#3a3a3a] bg-[#1a1a1a] focus:border-orange-500 focus:ring-orange-500 placeholder:text-gray-500 text-white' 
                                                    : 'border-gray-200/50 bg-white/70 focus:border-orange-400 focus:ring-orange-400 placeholder:text-gray-400 text-gray-800'
                                            }`}
                                        />
                                        <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 font-medium ${isMobile ? 'text-xs' : 'text-sm'} ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                                            kcal
                                        </div>
                                    </div>
                                    
                                    <div className={`${isMobile ? 'p-2' : 'p-3'} rounded-xl border ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-blue-50/50 border-blue-200/30'}`}>
                                        <div className="flex items-start gap-2">
                                            <Info className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                                            <p className={`${isMobile ? 'text-xs' : 'text-xs'} leading-relaxed ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                                                <strong>Tip:</strong> Use this if you have a specific calorie count from a fitness tracker or manual calculation
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Footer Buttons */}
            <div className={`flex gap-2 ${isMobile ? 'px-3 pb-3' : 'px-6 pb-6'}`}>
                <Button 
                    variant="outline"
                    onClick={onCancel}
                    className={`rounded-2xl border-2 backdrop-blur-sm font-medium ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-6 py-3'} transition-all duration-200 flex-1 ${
                        isDark 
                            ? 'border-[#3a3a3a] bg-[#1a1a1a] hover:bg-[#333] text-gray-300' 
                            : 'border-gray-200 bg-white/70 hover:bg-gray-50/80 text-gray-700'
                    }`}
                >
                    Cancel
                </Button>
                
                <Button 
                    onClick={
                        activeTab === 'quick' ? handleQuickLog :
                        activeTab === 'detailed' ? handleDetailedLog : 
                        handleManualLog
                    }
                    disabled={activeTab === 'manual' && (!manualCalories || parseInt(manualCalories) <= 0)}
                    className={`rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white font-semibold ${isMobile ? 'px-3 py-1.5 text-xs' : 'px-6 py-3'} shadow-lg hover:shadow-xl transition-all duration-200 flex-1 transform hover:scale-[1.02]`}
                >
                    {isEstimating ? (
                        <>
                            <RotateCcw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1 animate-spin`} />
                            Logging...
                        </>
                    ) : (
                        <>
                            <CheckCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
                            Log {activeTab === 'manual' ? manualCalories || 0 : estimatedCalories} kcal
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
};

export default CalisthenicsCalorieLogger;
