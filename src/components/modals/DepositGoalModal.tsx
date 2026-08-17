import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Sparkles, TrendingUp, Check, Plus, Calendar } from "lucide-react"
import type { GoalItem } from "@/types/finance"

interface DepositGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: GoalItem | null
  selectedMonth: string
  onDeposit: (goalId: string | number, amount: number, note?: string) => Promise<void>
}

export function DepositGoalModal({
  open,
  onOpenChange,
  goal,
  selectedMonth,
  onDeposit,
}: DepositGoalModalProps) {
  const [amountStr, setAmountStr] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const depositAmount = parseFloat(amountStr) || 0

  const target = goal?.target || 0
  const currentSaved = goal?.saved || 0
  const newSaved = Math.min(target, currentSaved + depositAmount)
  const oldPct = target > 0 ? Math.min(100, Math.round((currentSaved / target) * 100)) : 0
  const newPct = target > 0 ? Math.min(100, Math.round((newSaved / target) * 100)) : 0

  // Forecast calculation
  const months = goal?.months && goal.months > 0 ? goal.months : 12
  const monthlyRate = Math.round(target / months)

  const oldRemaining = Math.max(0, target - currentSaved)
  const newRemaining = Math.max(0, target - newSaved)

  const oldRemainingMonths = monthlyRate > 0 ? Math.ceil(oldRemaining / monthlyRate) : months
  const newRemainingMonths = monthlyRate > 0 ? Math.ceil(newRemaining / monthlyRate) : months

  const savedMonthsCount = Math.max(0, oldRemainingMonths - newRemainingMonths)

  function formatMonthForecast(remainingM: number) {
    if (remainingM <= 0) return "Цель полностью достигнута!"
    const now = selectedMonth ? new Date(selectedMonth + "-01") : new Date()
    const targetDate = new Date(now.getFullYear(), now.getMonth() + remainingM, 1)
    const monthName = targetDate.toLocaleString("ru-RU", { month: "long", year: "numeric" })
    return monthName.charAt(0).toUpperCase() + monthName.slice(1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal || depositAmount <= 0) return
    setIsSubmitting(true)
    try {
      await onDeposit(goal.id, depositAmount, note)
      setAmountStr("")
      setNote("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleQuickAdd(val: number) {
    setAmountStr(String((parseFloat(amountStr) || 0) + val))
  }

  if (!goal) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base">Внести пополнение в цель</DialogTitle>
              <DialogDescription className="text-xs">
                Досрочное ускорение цели «{goal.name}»
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Goal Progress Preview */}
          <div className="p-3 rounded-lg border bg-muted/20 space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold">{goal.name}</span>
                <div className="text-[11px] text-muted-foreground">
                  Плановый взнос: {monthlyRate.toLocaleString("ru-RU")} ₽/мес
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {newPct}% ({newSaved.toLocaleString("ru-RU")} из {target.toLocaleString("ru-RU")} ₽)
              </Badge>
            </div>

            <Progress value={newPct} className="h-2" />

            {/* Forecast impact */}
            <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-primary" />
                Срок закрытия:
              </span>
              <span className="font-medium text-foreground">
                {formatMonthForecast(newRemainingMonths)}
                {savedMonthsCount > 0 && (
                  <span className="ml-1.5 text-emerald-600 font-semibold">
                    (на {savedMonthsCount} мес. быстрее! ⚡)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Сумма досрочного взноса (₽)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="text-lg font-mono font-semibold"
              autoFocus
            />
          </div>

          {/* Quick Amount Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[5000, 10000, 25000, 50000, 100000].map((val) => (
              <Button
                key={val}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(val)}
                className="h-7 text-xs font-mono"
              >
                +{val >= 1000 ? `${val / 1000}к` : val} ₽
              </Button>
            ))}
          </div>

          {/* Source / Note */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Источник / Комментарий (необязательно)</Label>
            <Input
              placeholder="Премия, Бонус, Подарок, Сэкономленные"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={depositAmount <= 0 || isSubmitting}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="size-4" />
              Внести {depositAmount > 0 ? `${depositAmount.toLocaleString("ru-RU")} ₽` : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
