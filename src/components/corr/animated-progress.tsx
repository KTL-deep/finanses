"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export function AnimatedProgress({
  value = 0,
  showValue = false,
  className,
}: {
  value: number
  showValue?: boolean
  className?: string
}) {
  const boundedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${boundedValue}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {showValue ? (
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {Math.round(boundedValue)}%
        </span>
      ) : null}
    </div>
  )
}
