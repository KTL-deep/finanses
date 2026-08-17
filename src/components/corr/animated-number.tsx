"use client"

import React from "react"
import { cn } from "@/lib/utils"

export type AnimatedNumberProps = {
  value: number
  className?: string
  currency?: boolean
  prefix?: string
  suffix?: string
  showPlus?: boolean
  willChange?: boolean
}

export function AnimatedNumber({
  value,
  className,
  currency = false,
  prefix = "",
  suffix = "",
  showPlus = false,
}: AnimatedNumberProps) {
  const num = typeof value === "number" && !isNaN(value) ? Math.round(value) : 0
  const isNegative = num < 0
  const isPositive = num > 0
  const absFormatted = Math.abs(num).toLocaleString("ru-RU")

  const sign = isNegative ? "−\u00A0" : showPlus && isPositive ? "+\u00A0" : ""
  const curr = currency ? "\u00A0₽" : ""

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono tabular-nums tracking-tight whitespace-nowrap select-none",
        className
      )}
    >
      {prefix}
      {sign}
      {absFormatted}
      {curr}
      {suffix}
    </span>
  )
}
