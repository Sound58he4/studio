
// src/components/friends/AISuggestionBar.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, CookingPot, Pizza, Drumstick, X } from 'lucide-react'; // Added Bot, HelpCircle, food icons

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
}

const AISuggestionBar: React.FC<AISuggestionBarProps> = ({ onSuggestionClick, onHide }) => {
    return (
        <div className="p-2 border-t bg-muted/50 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <span className="text-xs font-semibold text-primary mr-2">Suggestions:</span>
              {aiChatSuggestions.map((suggestion, index) => (
                 <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 rounded-full hover:bg-primary/10"
                      onClick={() => onSuggestionClick(suggestion.prompt)}
                 >
                      {React.createElement(suggestion.icon, { size: 14, className: "mr-1 text-muted-foreground" })}
                      {suggestion.label}
                 </Button>
              ))}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground ml-auto" onClick={onHide}>
                  <X size={14} />
              </Button>
         </div>
    );
};

export default AISuggestionBar;
