import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex items-center rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring",
      className
    )}
    {...props}
  />
))
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "flex-1 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
InputGroupInput.displayName = "InputGroupInput"

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "inline-start" | "inline-end" }
>(({ className, align = "inline-start", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-2 text-muted-foreground",
      align === "inline-start" ? "order-first" : "order-last",
      className
    )}
    {...props}
  />
))
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("text-xs font-medium", className)} {...props} />
))
InputGroupText.displayName = "InputGroupText"

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "icon-xs" | "icon-sm" | "icon" }
>(({ className, size = "icon-xs", ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex items-center justify-center rounded-sm hover:bg-accent hover:text-accent-foreground",
      size === "icon-xs" && "h-5 w-5",
      size === "icon-sm" && "h-6 w-6",
      className
    )}
    {...props}
  />
))
InputGroupButton.displayName = "InputGroupButton"

export {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
}
