import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  Icon?: LucideIcon; // Make Icon optional
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, Icon, ...props }, ref) => {
    return (
      <div className="relative w-full group"> {/* Added group */}
        {Icon && ( // Conditionally render the icon if provided
          <Icon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none z-10 transition-colors group-focus-within:text-primary" /> // Icon changes color on focus
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'transition-all duration-200 ease-in-out hover:border-primary/50 focus-within:border-primary/70 focus-within:shadow-glow-primary/50', // Added hover/focus styles
            Icon ? "pl-10 pt-3" : "px-3 py-2", // Add padding if icon exists
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
