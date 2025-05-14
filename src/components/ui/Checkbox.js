"use client";

import React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
  return (
    <div className="flex items-center">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
          className
        )}
        {...props}
      />
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };