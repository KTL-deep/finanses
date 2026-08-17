import * as React from "react"
import { cn } from "@/lib/utils"

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex -space-x-px rounded-md shadow-sm [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md",
      className
    )}
    {...props}
  />
))
ButtonGroup.displayName = "ButtonGroup"

const ButtonGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center border border-input bg-muted px-3 text-xs text-muted-foreground",
      className
    )}
    {...props}
  />
))
ButtonGroupText.displayName = "ButtonGroupText"

export { ButtonGroup, ButtonGroupText }
