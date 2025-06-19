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
}

const FriendProfile = ({ friend, onBack }: FriendProfileProps) => {
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
          <TableHead className="text-gray-700">Meal</TableHead>
          <TableHead className="text-gray-700">Food</TableHead>
          <TableHead className="text-gray-700">Calories</TableHead>
          <TableHead className="text-gray-700">Protein</TableHead>
          <TableHead className="text-gray-700">Carbs</TableHead>
          <TableHead className="text-gray-700">Fat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nutritionData.map((item, index) => (
          <TableRow key={index} className="border-gray-200">
            <TableCell className="font-medium text-gray-900">{item.meal}</TableCell>
            <TableCell className="text-gray-700">{item.food}</TableCell>
            <TableCell className="text-gray-700">{item.calories} kcal</TableCell>
            <TableCell className="text-gray-700">{item.protein}g</TableCell>
            <TableCell className="text-gray-700">{item.carbs}g</TableCell>
            <TableCell className="text-gray-700">{item.fat}g</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderExerciseTable = (exerciseData: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-gray-700">Activity</TableHead>
          <TableHead className="text-gray-700">Type</TableHead>
          <TableHead className="text-gray-700">Duration</TableHead>
          <TableHead className="text-gray-700">Calories Burned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exerciseData.map((item, index) => (
          <TableRow key={index} className="border-gray-200">
            <TableCell className="font-medium text-gray-900">{item.activity}</TableCell>
            <TableCell className="text-gray-700">{item.type}</TableCell>
            <TableCell className="text-gray-700">{item.duration}</TableCell>
            <TableCell className="text-gray-700">{item.calories} kcal</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-fade-in transition-all duration-500 overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 backdrop-blur-sm rounded-b-3xl shadow-lg border-b border-gray-200/50 p-4 animate-slide-down transition-all duration-300 bg-white/90 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4 max-w-md mx-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 bg-white/60 hover:bg-white/80 text-gray-600"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-gray-800">{friend.displayName || 'Friend'}</h1>
              <p className="text-sm text-gray-600">Active now</p>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="text-center max-w-md mx-auto">
            <div className="text-sm mb-1 text-gray-600">Goal: Stay Fit</div>
            <div className="text-sm text-gray-500">Friend since: 9 days ago</div>
          </div>
        </div>        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pb-safe">
          <div className="max-w-md mx-auto px-3 py-4 space-y-4">            {/* Time Period Tabs */}
            <Tabs defaultValue="today" className="w-full">
              <div className="backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-1 animate-scale-in transition-all duration-300 bg-white/90 sticky top-0 z-10">
                <TabsList className="grid w-full grid-cols-3 p-1 rounded-xl bg-gray-100/50">
                  <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    <Calendar className="w-4 h-4 mr-2" />
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="yesterday" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    Yesterday
                  </TabsTrigger>
                  <TabsTrigger value="week" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900">
                    This Week
                  </TabsTrigger>
                </TabsList>
              </div>              <div className="space-y-4 pt-4 pb-20">
                {Object.entries(summaryData).map(([period, data]) => (
                  <TabsContent key={period} value={period} className="space-y-4">
              {/* Summary */}
              <div className="backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 p-6 animate-slide-up transition-all duration-300 bg-white/90">
                <h2 className="text-xl font-bold mb-2 text-blue-600">{getTabTitle(period)}</h2>
                <p className="text-sm mb-6 text-gray-600">Progress against targets</p>
                
                {/* Calories */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-gray-100/80 border border-gray-200/50">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">{data.calories.current}</div>
                      <div className="text-xs text-gray-500">Calories</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.calories.current} / {data.calories.target} kcal
                  </div>
                </div>

                {/* Macros */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-red-500">Protein</div>
                    <div className="text-sm text-gray-600">
                      {data.macros.protein.current}g / {data.macros.protein.target}g
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-orange-500">Carbs</div>
                    <div className="text-sm text-gray-600">
                      {data.macros.carbs.current}g / {data.macros.carbs.target}g
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-green-500">Fat</div>
                    <div className="text-sm text-gray-600">
                      {data.macros.fat.current}g / {data.macros.fat.target}g
                    </div>
                  </div>
                </div>

                {/* Burned Calories */}
                <div className="text-center py-4 rounded-2xl shadow-lg border border-orange-100/50 transition-all duration-300 bg-orange-50/80">
                  <div className="flex items-center justify-center space-x-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-orange-600">{data.calories.burned} kcal Burned</span>
                  </div>
                </div>
              </div>                    {/* Nutrition Table */}
                    <div className="backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 animate-scale-in transition-all duration-300 bg-white/90">
                      <div className="flex items-center space-x-2 mb-3">
                        <Utensils className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-800">Nutrition</span>
                      </div>
                      <div className="rounded-xl p-4 shadow-lg overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 transition-all duration-300 bg-white/50 border border-gray-200/30">
                        {renderNutritionTable(data.nutrition)}
                      </div>
                    </div>

                    {/* Exercise Table */}
                    <div className="backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 animate-scale-in transition-all duration-300 bg-white/90">
                      <div className="flex items-center space-x-2 mb-3">
                        <Activity className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-800">Exercise</span>
                      </div>
                      <div className="rounded-xl p-4 shadow-lg overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 transition-all duration-300 bg-white/50 border border-gray-200/30">
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
