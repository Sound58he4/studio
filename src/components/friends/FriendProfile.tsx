import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, Flame, Utensils, Activity } from 'lucide-react';
import type { UserFriend } from '@/app/dashboard/types';

interface FriendProfileProps {
  friend: UserFriend;
  onBack: () => void;
  isDark?: boolean;
}

const FriendProfile = ({ friend, onBack, isDark = false }: FriendProfileProps) => {
  // Mock summary data for different time periods
  const summaryData = {
    today: {
      calories: { current: 0, target: 1948, burned: 0 },
      macros: {
        protein: { current: 0.0, target: 120.0 },
        carbs: { current: 0.0, target: 246.0 },
        fat: { current: 0.0, target: 54.0 }
      },
      nutrition: [
        { meal: 'Breakfast', food: 'No food logged', calories: 0, protein: 0, carbs: 0, fat: 0 },
        { meal: 'Lunch', food: 'No food logged', calories: 0, protein: 0, carbs: 0, fat: 0 },
        { meal: 'Dinner', food: 'No food logged', calories: 0, protein: 0, carbs: 0, fat: 0 }
      ],
      exercise: [
        { activity: 'Morning Exercise', type: 'No exercise logged', duration: '0 min', calories: 0 }
      ]
    },
    yesterday: {
      calories: { current: 1850, target: 1948, burned: 420 },
      macros: {
        protein: { current: 98.0, target: 120.0 },
        carbs: { current: 210.0, target: 246.0 },
        fat: { current: 45.0, target: 54.0 }
      },
      nutrition: [
        { meal: 'Breakfast', food: 'Oatmeal with berries', calories: 350, protein: 12, carbs: 65, fat: 8 },
        { meal: 'Lunch', food: 'Grilled chicken salad', calories: 450, protein: 35, carbs: 25, fat: 18 },
        { meal: 'Dinner', food: 'Salmon with quinoa', calories: 550, protein: 42, carbs: 45, fat: 22 },
        { meal: 'Snacks', food: 'Greek yogurt & nuts', calories: 200, protein: 15, carbs: 12, fat: 8 }
      ],
      exercise: [
        { activity: 'Morning Run', type: 'Cardio', duration: '30 min', calories: 280 },
        { activity: 'Strength Training', type: 'Weight Lifting', duration: '45 min', calories: 140 }
      ]
    },
    week: {
      calories: { current: 11200, target: 13636, burned: 2800 },
      macros: {
        protein: { current: 650.0, target: 840.0 },
        carbs: { current: 1400.0, target: 1722.0 },
        fat: { current: 320.0, target: 378.0 }
      },
      nutrition: [
        { meal: 'Weekly Total', food: 'All meals logged', calories: 11200, protein: 650, carbs: 1400, fat: 320 },
        { meal: 'Daily Average', food: 'Average per day', calories: 1600, protein: 93, carbs: 200, fat: 46 },
        { meal: 'Most Common', food: 'Grilled chicken', calories: 450, protein: 35, carbs: 25, fat: 18 }
      ],
      exercise: [
        { activity: 'Total Workouts', type: 'Mixed Training', duration: '4.5 hours', calories: 2800 },
        { activity: 'Cardio Sessions', type: 'Running/Cycling', duration: '2 hours', calories: 1200 },
        { activity: 'Strength Training', type: 'Weight Lifting', duration: '2.5 hours', calories: 1600 }
      ]
    }
  };

  const getTabTitle = (activeTab: string) => {
    switch (activeTab) {
      case 'yesterday': return "Yesterday's Summary";
      case 'week': return "This Week's Summary";
      default: return "Today's Summary";
    }
  };

  const renderNutritionTable = (nutritionData: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Meal</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Food</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Calories</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Protein</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Carbs</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Fat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nutritionData.map((item, index) => (
          <TableRow key={index} className={isDark ? 'border-[#3a3a3a]' : 'border-gray-200'}>
            <TableCell className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.meal}</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.food}</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.calories} kcal</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.protein}g</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.carbs}g</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.fat}g</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderExerciseTable = (exerciseData: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Activity</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Type</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Duration</TableHead>
          <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Calories Burned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exerciseData.map((item, index) => (
          <TableRow key={index} className={isDark ? 'border-[#3a3a3a]' : 'border-gray-200'}>
            <TableCell className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.activity}</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.type}</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.duration}</TableCell>
            <TableCell className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.calories} kcal</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  return (
    <div className={`min-h-screen animate-fade-in transition-all duration-500 overflow-hidden ${
      isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-blue-50 via-blue-100 to-gray-50'
    }`}>
      <div className="h-screen flex flex-col">
        {/* Fixed Header */}
        <div className={`flex-shrink-0 backdrop-blur-sm rounded-b-3xl shadow-lg border-b p-4 animate-slide-down transition-all duration-300 sticky top-0 z-10 ${
          isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between mb-4 max-w-md mx-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-10 h-10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 text-gray-600 ${
                isDark ? 'bg-[#3a3a3a]/60 hover:bg-[#3a3a3a]/80' : 'bg-white/60 hover:bg-white/80'
              }`}
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1">
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{friend.displayName || 'Friend'}</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active now</p>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="text-center max-w-md mx-auto">
            <div className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Goal: Stay Fit</div>
            <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Friend since: 9 days ago</div>
          </div>
        </div>        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto pb-safe ${
          isDark ? 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30' : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400'
        }`}>
          <div className="max-w-md mx-auto px-3 py-4 space-y-4">            {/* Time Period Tabs */}
            <Tabs defaultValue="today" className="w-full">
              <div className={`backdrop-blur-sm rounded-2xl shadow-lg border p-1 animate-scale-in transition-all duration-300 sticky top-0 z-10 ${
                isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
              }`}>
                <TabsList className={`grid w-full grid-cols-3 p-1 rounded-xl ${
                  isDark ? 'bg-[#3a3a3a]/50' : 'bg-gray-100/50'
                }`}>
                  <TabsTrigger value="today" className={`rounded-lg ${
                    isDark ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-white data-[state=active]:text-gray-900'
                  }`}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="yesterday" className={`rounded-lg ${
                    isDark ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-white data-[state=active]:text-gray-900'
                  }`}>
                    Yesterday
                  </TabsTrigger>
                  <TabsTrigger value="week" className={`rounded-lg ${
                    isDark ? 'data-[state=active]:bg-blue-600 data-[state=active]:text-white' : 'data-[state=active]:bg-white data-[state=active]:text-gray-900'
                  }`}>
                    This Week
                  </TabsTrigger>
                </TabsList>
              </div>              <div className="space-y-4 pt-4 pb-20">
                {Object.entries(summaryData).map(([period, data]) => (
                  <TabsContent key={period} value={period} className="space-y-4">
              {/* Summary */}
              <div className={`backdrop-blur-sm rounded-3xl shadow-lg border p-6 animate-slide-up transition-all duration-300 ${
                isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
              }`}>
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-600'}`}>{getTabTitle(period)}</h2>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Progress against targets</p>
                
                {/* Calories */}
                <div className="text-center mb-8">
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border ${
                    isDark ? 'bg-[#3a3a3a]/80 border-blue-500/30' : 'bg-gray-100/80 border-gray-200/50'
                  }`}>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.calories.current}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Calories</div>
                    </div>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {data.calories.current} / {data.calories.target} kcal
                  </div>
                </div>

                {/* Macros */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-red-500">Protein</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.macros.protein.current}g / {data.macros.protein.target}g
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-medium ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>Carbs</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.macros.carbs.current}g / {data.macros.carbs.target}g
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-500'}`}>Fat</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.macros.fat.current}g / {data.macros.fat.target}g
                    </div>
                  </div>
                </div>

                {/* Burned Calories */}
                <div className={`text-center py-4 rounded-2xl shadow-lg border transition-all duration-300 ${
                  isDark ? 'bg-orange-900/20 border-orange-400/20' : 'bg-orange-50/80 border-orange-100/50'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <Flame className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                    <span className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{data.calories.burned} kcal Burned</span>
                  </div>
                </div>
              </div>                    {/* Nutrition Table */}
                    <div className={`backdrop-blur-sm rounded-2xl shadow-lg border p-4 animate-scale-in transition-all duration-300 ${
                      isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
                    }`}>
                      <div className="flex items-center space-x-2 mb-3">
                        <Utensils className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Nutrition</span>
                      </div>
                      <div className={`rounded-xl p-4 shadow-lg overflow-x-auto max-h-64 overflow-y-auto transition-all duration-300 border ${
                        isDark ? 'bg-[#3a3a3a]/50 border-[#3a3a3a] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'bg-white/50 border-gray-200/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
                      }`}>
                        {renderNutritionTable(data.nutrition)}
                      </div>
                    </div>

                    {/* Exercise Table */}
                    <div className={`backdrop-blur-sm rounded-2xl shadow-lg border p-4 animate-scale-in transition-all duration-300 ${
                      isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
                    }`}>
                      <div className="flex items-center space-x-2 mb-3">
                        <Activity className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Exercise</span>
                      </div>
                      <div className={`rounded-xl p-4 shadow-lg overflow-x-auto max-h-64 overflow-y-auto transition-all duration-300 border ${
                        isDark ? 'bg-[#3a3a3a]/50 border-[#3a3a3a] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : 'bg-white/50 border-gray-200/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
                      }`}>
                        {renderExerciseTable(data.exercise)}
                      </div>
                    </div></TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfile;
