import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, X } from 'lucide-react';
import { Friend } from '@/types/friends';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendsChartProps {
  friends: Friend[];
  isOpen: boolean;
  onClose: () => void;
}

const FriendsChart = ({ friends, isOpen, onClose }: FriendsChartProps) => {
  const [chartType, setChartType] = useState<'workouts' | 'streaks'>('workouts');

  // Prepare chart data
  const chartData = friends.map(friend => ({
    name: friend.name.split(' ')[0], // First name only for cleaner display
    workouts: friend.completedWorkouts,
    streak: friend.streak,
    goal: friend.weeklyGoal,
    totalWorkouts: friend.stats.totalWorkouts
  }));

  const chartConfig = {
    workouts: {
      label: "Workouts",
      color: "hsl(var(--chart-1))",
    },
    streak: {
      label: "Streak",
      color: "hsl(var(--chart-2))",
    },
    goal: {
      label: "Goal",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <Card className="w-full h-full bg-clayGlass backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 bg-white/60 backdrop-blur-sm border-b border-white/20">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Friends Fitness Analytics
                  </CardTitle>
                </motion.div>
                <motion.div 
                  className="flex gap-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={chartType === 'workouts' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('workouts')}
                      className={`rounded-2xl transition-all duration-300 ${
                        chartType === 'workouts' 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-clay border-0'
                          : 'bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:shadow-clay text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      Weekly Progress
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={chartType === 'streaks' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('streaks')}
                      className={`rounded-2xl transition-all duration-300 ${
                        chartType === 'streaks'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-clay border-0'
                          : 'bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:shadow-clay text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      Streaks
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClose}
                      className="rounded-2xl bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:shadow-clay text-gray-600 hover:text-red-600 hover:bg-red-50/80 transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              </CardHeader>
              
              <CardContent className="space-y-6 p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <AnimatePresence mode="wait">
                  {chartType === 'workouts' && (
                    <motion.div
                      key="workouts"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 sm:p-6 rounded-3xl bg-white/60 backdrop-blur-sm shadow-clayInset border-0"
                    >
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Weekly Workout Progress
                      </h3>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="workouts" fill="hsl(220, 70%, 50%)" name="Completed" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="goal" fill="hsl(220, 70%, 80%)" name="Goal" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </motion.div>
                  )}

                  {chartType === 'streaks' && (
                    <motion.div
                      key="streaks"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 sm:p-6 rounded-3xl bg-white/60 backdrop-blur-sm shadow-clayInset border-0"
                    >
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Workout Streaks
                      </h3>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line 
                              type="monotone" 
                              dataKey="streak" 
                              stroke="hsl(142, 70%, 50%)" 
                              strokeWidth={3}
                              name="Current Streak"
                              dot={{ fill: 'hsl(142, 70%, 50%)', strokeWidth: 2, r: 6 }}
                              activeDot={{ r: 8, stroke: 'hsl(142, 70%, 50%)', strokeWidth: 2, fill: 'white' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Summary Stats */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 bg-clayGlass backdrop-blur-sm border-0 shadow-clay rounded-2xl hover:shadow-clayStrong transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {chartData.reduce((sum, friend) => sum + friend.workouts, 0)}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Total Workouts This Week</div>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 bg-clayGlass backdrop-blur-sm border-0 shadow-clay rounded-2xl hover:shadow-clayStrong transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.max(...chartData.map(friend => friend.streak))}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Longest Current Streak</div>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 bg-clayGlass backdrop-blur-sm border-0 shadow-clay rounded-2xl hover:shadow-clayStrong transition-all duration-300">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(chartData.reduce((sum, friend) => sum + friend.workouts, 0) / chartData.length)}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">Average Workouts</div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FriendsChart;