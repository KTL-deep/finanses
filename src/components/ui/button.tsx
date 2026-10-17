import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.96] active:opacity-90",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 hover:shadow-soft",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-border/80 bg-background/60 backdrop-blur-xs shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-border",
        secondary:
          "bg-secondary/80 text-secondary-foreground shadow-xs hover:bg-secondary",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "glass-card text-foreground hover:bg-card/90 shadow-soft",
      },
      size: {
        default: "h-9.5 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-base",
        icon: "h-9 w-9 rounded-xl",
        "icon-sm": "h-7.5 w-7.5 rounded-lg",
        "icon-xs": "h-6.5 w-6.5 rounded-md",
        "icon-lg": "h-10.5 w-10.5 rounded-xl",
        pill: "h-9 px-5 rounded-full text-xs font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
