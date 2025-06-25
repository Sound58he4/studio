// src/components/report/MacronutrientChart.tsx
"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartData {
    name: string;
    consumed: number;
    target: number;
    fill: string; // Color for the bar
}

interface MacronutrientChartProps {
    data: ChartData[];
    title: string;
    valueKey: keyof ChartData;
    targetKey: keyof ChartData;
    unit: string;
    showLabels?: boolean; // Optional prop to show labels on bars
    isDark?: boolean;
}

const MacronutrientChart: React.FC<MacronutrientChartProps> = ({ data, title, valueKey, targetKey, unit, showLabels = false, isDark = false }) => {

     // Ensure data has valid numeric values, default to 0 if not
     const processedData = data.map(item => ({
         ...item,
         [valueKey]: typeof item[valueKey] === 'number' ? item[valueKey] : 0,
         [targetKey]: typeof item[targetKey] === 'number' ? item[targetKey] : 0,
     }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          const consumed = payload[0].payload[valueKey];
          const target = payload[0].payload[targetKey];
          const percentage = target > 0 ? ((consumed / target) * 100).toFixed(0) : 0;
          return (
            <div className={`p-2 border rounded-md shadow-lg backdrop-blur-sm text-xs transition-all duration-300 ${
                isDark 
                    ? 'bg-[#2a2a2a] border-[#3a3a3a] text-gray-200' 
                    : 'bg-background/80 border-border'
            }`}>
              <p className="font-semibold">{label}</p>
              <p>Consumed: {consumed.toFixed(1)}{unit}</p>
              <p>Target: {target.toFixed(1)}{unit}</p>
              <p>Progress: {percentage}%</p>
            </div>
          );
        }
        return null;
      };

    return (
        <div className="space-y-2 h-[200px] md:h-[250px]"> {/* Added height constraint */}
             <h4 className={`text-sm font-medium text-center transition-all duration-300 ${
                 isDark ? 'text-gray-400' : 'text-muted-foreground'
             }`}>{title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} layout="vertical" margin={{ top: 5, right: 10, left: showLabels ? 0 : -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgb(75 85 99 / 0.5)' : 'hsl(var(--border)/0.5)'} />
                     <XAxis 
                         type="number" 
                         stroke={isDark ? 'rgb(156 163 175)' : 'hsl(var(--muted-foreground))'} 
                         fontSize={10} 
                         tickFormatter={(value) => `${value}${unit}`} 
                     />
                     <YAxis 
                         type="category" 
                         dataKey="name" 
                         stroke={isDark ? 'rgb(156 163 175)' : 'hsl(var(--muted-foreground))'} 
                         fontSize={10} 
                         width={showLabels ? 60 : 0} 
                         tickLine={showLabels} 
                         axisLine={showLabels} 
                     />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgb(75 85 99 / 0.3)' : 'hsl(var(--muted)/0.3)' }}/>
                     {/* Background Bar for Target */}
                     <Bar 
                         dataKey={targetKey} 
                         fill={isDark ? 'rgb(75 85 99 / 0.5)' : 'hsl(var(--muted)/0.5)'} 
                         radius={[0, 4, 4, 0]} 
                         background={{ fill: isDark ? 'rgb(31 41 55)' : 'hsl(var(--background))', radius: 4 }} 
                         barSize={16} 
                     />
                     {/* Consumed Bar */}
                     <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} barSize={16}>
                        {processedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                     </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MacronutrientChart; // Ensure default export
