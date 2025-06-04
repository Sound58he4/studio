// src/components/friends/AISuggestionBar.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, CookingPot, Pizza, Drumstick, X } from 'lucide-react'; // Added Bot, HelpCircle, food icons
import { cn } from "@/lib/utils";

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
    onHide: () => void; // Callback to hide the bar
    className?: string; // Added className
}

const AISuggestionBar: React.FC<AISuggestionBarProps> = ({ onSuggestionClick, onHide, className }) => {
    return (
        <div className={cn("p-2 sm:p-3 border-t bg-muted/50 flex flex-wrap items-center gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>
             <span className="text-xs font-semibold text-primary mr-1 sm:mr-2 whitespace-nowrap">Suggestions:</span>
              {aiChatSuggestions.map((suggestion, index) => (
                 <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 sm:h-7 px-1.5 sm:px-2 rounded-full hover:bg-primary/10 flex-shrink-0"
                      onClick={() => onSuggestionClick(suggestion.prompt)}
                 >
                      {React.createElement(suggestion.icon, { size: 12, className: "mr-0.5 sm:mr-1 text-muted-foreground flex-shrink-0" })}
                      <span className="hidden sm:inline">{suggestion.label}</span>
                      <span className="sm:hidden">{suggestion.label.split(' ')[0]}</span>
                 </Button>
              ))}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground ml-auto flex-shrink-0" onClick={onHide}>
                  <X size={14} />
              </Button>
         </div>
    );
};

export default AISuggestionBar;
