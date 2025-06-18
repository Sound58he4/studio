// src/components/friends/AISuggestionBar.tsx
"use client";

import React from 'react';
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
}

const AISuggestionBar: React.FC<AISuggestionBarProps> = ({ onSuggestionClick, onHide, className }) => {
    return (
        <motion.div 
            className={cn("p-4 border-t bg-clayGlass backdrop-blur-sm flex flex-wrap items-center gap-3 shadow-clay border-0", className)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
        >
             <motion.span 
                 className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap"
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
                          className="text-sm h-10 px-4 rounded-2xl bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:shadow-clay hover:bg-blue-50/80 text-gray-700 hover:text-blue-600 transition-all duration-300 flex-shrink-0"
                          onClick={() => onSuggestionClick(suggestion.prompt)}
                     >
                          {React.createElement(suggestion.icon, { size: 16, className: "mr-2 text-gray-600 flex-shrink-0" })}
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
                    className="h-10 w-10 text-gray-600 hover:text-gray-800 ml-auto flex-shrink-0 rounded-2xl bg-white/60 backdrop-blur-sm shadow-clayInset hover:shadow-clay transition-all duration-300" 
                    onClick={onHide}
                  >
                      <X size={18} />
                  </Button>
              </motion.div>
         </motion.div>
    );
};

export default AISuggestionBar;
