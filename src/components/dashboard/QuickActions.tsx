
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, History, BarChart2, Activity, PlusCircle, Users } from 'lucide-react'; // Added Users, removed Dumbbell
import Link from 'next/link';
import { cn } from "@/lib/utils";


// Helper component for Quick Action Buttons
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  isButton?: boolean;
}

function QuickActionButton({ icon, label, href, onClick, disabled = false, isButton = false }: QuickActionButtonProps) {
  const commonClasses = cn(
    "flex flex-col items-center justify-center text-center p-3 sm:p-4 gap-1.5 sm:gap-2 rounded-lg border border-border/60", // Adjusted padding/gap
    "hover:border-primary hover:bg-primary/5 hover:text-primary",
    "transform hover:scale-[1.04] hover:-translate-y-0.5 shadow-sm hover:shadow-lg", // Enhanced hover effect
    "transition-all duration-200 ease-out group",
    disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground hover:border-border/50" : "cursor-pointer",
     "bg-gradient-to-br from-card via-card to-muted/20 backdrop-blur-sm" // Subtle gradient
  );

  const content = (
    <>
       {/* Icon with hover animation - Adjusted size */}
      <div className="text-primary text-lg sm:text-xl md:text-2xl mb-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]">{React.cloneElement(icon as React.ReactElement, { size: 20 })}</div>
      <span className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
    </>
  );

  if (isButton) {
    return (
      <button onClick={onClick} className={commonClasses} disabled={disabled}>
        {content}
      </button>
    );
  } else if (href) {
    const LinkComponent = disabled ? 'div' : Link;
    const linkProps = disabled ? {} : { href };

    return (
       // @ts-ignore - LinkComponent type issue with dynamic tag
       <LinkComponent
         className={commonClasses}
         aria-disabled={disabled}
         onClick={(e: React.MouseEvent<HTMLElement>) => {
              if (disabled) e.preventDefault();
         }}
          {...linkProps}
       >
          {content}
       </LinkComponent>
    );
  }

  return null;
}


const QuickActions: React.FC = () => {
  return (
     // Slightly enhanced card style
    <Card className="shadow-md border border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4 sm:pb-3 sm:pt-5 sm:px-5">
        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 text-foreground/90">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Quick Actions
        </CardTitle>
      </CardHeader>
       {/* Adjusted grid columns for responsiveness */}
      <CardContent className="p-3 sm:p-4 md:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
         {/* Updated labels/icons potentially */}
        <QuickActionButton icon={<PlusCircle />} label="Log Meal" href="/log" />
        <QuickActionButton icon={<Users />} label="Friends" href="/friends" /> {/* Changed icon and label */}
        <QuickActionButton icon={<History />} label="View History" href="/history" />
        <QuickActionButton icon={<BarChart2 />} label="View Reports" href="/report" />
      </CardContent>
    </Card>
  );
};

export default QuickActions;
