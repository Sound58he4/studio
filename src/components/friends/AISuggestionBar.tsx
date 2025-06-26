// src/components/friends/AISuggestionBar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, CookingPot, Pizza, Drumstick, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

interface AISuggestion {
    label: string;
    prompt: string;
    icon: React.ElementType;
}

// Define AI chat suggestion prompts outside the component for better organization
const aiChatSuggestions: AISuggestion[] = [
    { label: "Workout Question", prompt: "I can't do my planned workout today, can you suggest an alternative or should I skip?", icon: HelpCircle },
    { label: "Protein Alternative", prompt: "What's a good vegetarian alternative for chicken breast?", icon: CookingPot },
    { label: "Food Recommendation", prompt: "Suggest a healthy, high-protein dinner for weight loss.", icon: Pizza },
    { label: "Food Alternative", prompt: "I don't have salmon, what's a similar fish I could use?", icon: Drumstick },
];

interface AISuggestionBarProps {
    onSuggestionClick: (prompt: string) => void;
    onHide: () => void;
    className?: string;
    isDark?: boolean;
}

const AISuggestionBar: React.FC<AISuggestionBarProps> = ({ onSuggestionClick, onHide, className, isDark: propIsDark }) => {
    const [lightTheme, setLightTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            // Check if dark theme class is applied to document root
            return !document.documentElement.classList.contains('dark');
        }
        return true; // Default to light theme
    });

    // Use prop value if provided, otherwise detect from document
    const isDark = propIsDark !== undefined ? propIsDark : !lightTheme;

    useEffect(() => {
        if (propIsDark !== undefined) return; // Skip detection if prop is provided
        
        const handleThemeChange = () => {
            if (typeof window !== 'undefined') {
                setLightTheme(!document.documentElement.classList.contains('dark'));
            }
        };

        // Listen for class changes on the document element
        const observer = new MutationObserver(() => {
            handleThemeChange();
        });

        if (typeof window !== 'undefined') {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        return () => observer.disconnect();
    }, [propIsDark]);

    return (
        <motion.div 
            className={cn(`p-4 border-t backdrop-blur-sm flex flex-wrap items-center gap-3 shadow-lg border-0 ${
                isDark 
                    ? 'bg-[#3a3a3a]' 
                    : 'bg-clayGlass shadow-clay'
            }`, className)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
        >
             <motion.span 
                 className={`text-sm font-semibold mr-2 whitespace-nowrap ${
                     isDark ? 'text-white' : 'text-gray-800'
                 }`}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.1 }}
             >
                 Suggestions:
             </motion.span>
              {aiChatSuggestions.map((suggestion, index) => (
                 <motion.div
                     key={index}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.2 + index * 0.1, duration: 0.2 }}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                 >
                     <Button
                          variant="outline"
                          size="sm"
                          className={`text-sm h-10 px-4 rounded-2xl backdrop-blur-sm border-0 shadow-lg transition-all duration-300 flex-shrink-0 ${
                              isDark 
                                  ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-gray-300 hover:text-blue-400' 
                                  : 'bg-white/60 shadow-clayInset hover:shadow-clay hover:bg-blue-50/80 text-gray-700 hover:text-blue-600'
                          }`}
                          onClick={() => onSuggestionClick(suggestion.prompt)}
                     >
                          {React.createElement(suggestion.icon, { 
                              size: 16, 
                              className: `mr-2 flex-shrink-0 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                              }` 
                          })}
                          <span className="hidden sm:inline font-medium">{suggestion.label}</span>
                          <span className="sm:hidden font-medium">{suggestion.label.split(' ')[0]}</span>
                     </Button>
                 </motion.div>
              ))}
              <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
              >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-10 w-10 ml-auto flex-shrink-0 rounded-2xl backdrop-blur-sm shadow-lg transition-all duration-300 ${
                        isDark 
                            ? 'bg-[#4a4a4a] hover:bg-[#5a5a5a] text-gray-400 hover:text-gray-300' 
                            : 'bg-white/60 shadow-clayInset hover:shadow-clay text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={onHide}
                  >
                      <X size={18} />
                  </Button>
              </motion.div>
         </motion.div>
    );
};

export default AISuggestionBar;
