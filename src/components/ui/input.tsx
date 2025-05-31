import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  Icon?: LucideIcon; // Make Icon optional
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, Icon, value, onChange, ...props }, ref) => {

    // Handle controlled component value for number type: allow empty string
    const displayValue = type === 'number' && (value === undefined || value === null) ? '' : value;

    return (
      <div className="relative flex items-center w-full group"> {/* Added group */}
        {Icon && ( // Conditionally render the icon if provided
          <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none z-10 transition-colors group-focus-within:text-primary" /> // Icon changes color on focus
        )}
        <input
          type={type}
          value={displayValue} // Use displayValue
          onChange={onChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "transition-all duration-200 ease-in-out hover:border-primary/50 focus-within:border-primary/70 focus-within:shadow-glow-primary/50", // Added hover/focus styles
            Icon ? "pl-10 pr-3" : "px-3", // Add padding-left if icon exists
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
