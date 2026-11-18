import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-[#D8CBB8] bg-[#FFFDF9] px-3.5 py-2 text-sm text-[#231917] placeholder:text-[#8E7F76] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B58938] focus-visible:border-[#6B1426] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
