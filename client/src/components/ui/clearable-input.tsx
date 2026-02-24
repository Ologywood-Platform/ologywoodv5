import * as React from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearableInputProps extends React.ComponentProps<typeof Input> {
  value: string;
  onClear: () => void;
  /** Additional class for the wrapper div */
  wrapperClassName?: string;
  /** Icon element to show on the left side (e.g., <Search />) */
  leftIcon?: React.ReactNode;
}

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ value, onClear, wrapperClassName, leftIcon, className, ...props }, ref) => {
    return (
      <div className={cn("relative", wrapperClassName)}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        <Input
          ref={ref}
          value={value}
          className={cn(
            leftIcon ? "pl-10" : "",
            value ? "pr-9" : "",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-full p-0.5 hover:bg-muted"
            aria-label="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

ClearableInput.displayName = "ClearableInput";

export { ClearableInput };
