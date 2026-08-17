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
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRightLeft,
  Target,
  Calendar,
  PiggyBank,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Layers,
  Check,
} from "lucide-react"
import { calculateFinance } from "@/lib/calculations"
import type { MonthlyPlanState, GoalItem } from "@/types/finance"

interface RollOverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMonth: string
  state: MonthlyPlanState
  onApply: (
    updatedState: MonthlyPlanState,
    nextMonthData?: { month: string; amount: number; phase: "adv" | "sal" }
  ) => Promise<void>
}

export function RollOverModal({
  open,
  onOpenChange,
  currentMonth,
  state,
  onApply,
}: RollOverModalProps) {
  const calc = useMemo(() => calculateFinance(state), [state])

  // Unspent amounts
  const unspentGroc = Math.max(0, calc.remGroc)
  const unspentWants = Math.max(0, calc.remWants)
  const unspentUnplan = Math.max(0, calc.remUnplan)

  // Selection states
  const [includeGroc, setIncludeGroc] = useState(true)
  const [includeWants, setIncludeWants] = useState(true)
  const [includeUnplan, setIncludeUnplan] = useState(true)

  // Total selected unspent
  const totalSelected = useMemo(() => {
    let sum = 0
    if (includeGroc) sum += unspentGroc
    if (includeWants) sum += unspentWants
    if (includeUnplan) sum += unspentUnplan
    return sum
  }, [includeGroc, includeWants, includeUnplan, unspentGroc, unspentWants, unspentUnplan])

  // Destination Strategy: 'goals' | 'next_month' | 'split'
  const [strategy, setStrategy] = useState<"goals" | "next_month" | "split">("goals")
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    state.goals && state.goals.length > 0 ? String(state.goals[0].id) : "all"
  )
  const [nextMonthPhase, setNextMonthPhase] = useState<"adv" | "sal">("adv")
  const [isApplying, setIsApplying] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  // Next month string (YYYY-MM)
  const nextMonthKey = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number)
    const nextDate = new Date(y, m, 1)
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`
  }, [currentMonth])

  // Month name in Russian
  const currentMonthName = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleString("ru-RU", { month: "long", year: "numeric" })
  }, [currentMonth])

  const nextMonthName = useMemo(() => {
    const [y, m] = nextMonthKey.split("-").map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleString("ru-RU", { month: "long", year: "numeric" })
  }, [nextMonthKey])

  async function handleExecute() {
    if (totalSelected <= 0) return
    setIsApplying(true)

    try {
      const updatedGoals = [...(state.goals || [])]

      if (strategy === "goals") {
        // Add full amount to goals
        if (selectedGoalId === "all") {
          const perGoal = Math.round(totalSelected / Math.max(1, updatedGoals.length))
          updatedGoals.forEach((g) => {
            g.saved = (g.saved || 0) + perGoal
          })
        } else {
          const goal = updatedGoals.find((g) => String(g.id) === selectedGoalId)
          if (goal) {
            goal.saved = (goal.saved || 0) + totalSelected
          }
        }
        await onApply({ ...state, goals: updatedGoals })
      } else if (strategy === "next_month") {
        // Transfer to next month's extra income
        await onApply(state, {
          month: nextMonthKey,
          amount: totalSelected,
          phase: nextMonthPhase,
        })
      } else if (strategy === "split") {
        // 50% to goals, 50% to next month
        const halfGoals = Math.round(totalSelected / 2)
        const halfNext = totalSelected - halfGoals

        if (selectedGoalId === "all") {
          const perGoal = Math.round(halfGoals / Math.max(1, updatedGoals.length))
          updatedGoals.forEach((g) => {
            g.saved = (g.saved || 0) + perGoal
          })
        } else {
          const goal = updatedGoals.find((g) => String(g.id) === selectedGoalId)
          if (goal) {
            goal.saved = (goal.saved || 0) + halfGoals
          }
        }

        await onApply(
          { ...state, goals: updatedGoals },
          {
            month: nextMonthKey,
            amount: halfNext,
            phase: nextMonthPhase,
          }
        )
      }

      setAppliedSuccess(true)
      setTimeout(() => {
        setAppliedSuccess(false)
        onOpenChange(false)
      }, 1500)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Умный перенос остатка (Roll-over)</DialogTitle>
              <DialogDescription className="text-xs">
                Распределение сэкономленных средств за {currentMonthName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {appliedSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-lg font-bold">Остаток успешно перенесен!</h3>
            <p className="text-xs text-muted-foreground">
              {totalSelected.toLocaleString("ru-RU")} ₽ направлены в выбранный фонд.
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Step 1: Unspent sources analysis */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Доступные неизрасходованные остатки
                </Label>
                <Badge variant="outline" className="font-mono text-xs">
                  Всего: {(unspentGroc + unspentWants + unspentUnplan).toLocaleString("ru-RU")} ₽
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Groceries Balance */}
                <div
                  onClick={() => setIncludeGroc(!includeGroc)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    includeGroc
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-muted/30 opacity-60 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Продукты</span>
                    <Checkbox checked={includeGroc} onCheckedChange={(c) => setIncludeGroc(Boolean(c))} />
                  </div>
                  <div className="text-base font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    +{unspentGroc.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-[10px] text-muted-foreground">Сэкономлено из лимита</div>
                </div>

                {/* Wants Balance */}
                <div
                  onClick={() => setIncludeWants(!includeWants)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    includeWants
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-muted/30 opacity-60 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Хотелки</span>
                    <Checkbox checked={includeWants} onCheckedChange={(c) => setIncludeWants(Boolean(c))} />
                  </div>
                  <div className="text-base font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    +{unspentWants.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-[10px] text-muted-foreground">Не потрачено в wish-листе</div>
                </div>

                {/* Unplanned Balance */}
                <div
                  onClick={() => setIncludeUnplan(!includeUnplan)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    includeUnplan
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-muted/30 opacity-60 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Внеплановые</span>
                    <Checkbox checked={includeUnplan} onCheckedChange={(c) => setIncludeUnplan(Boolean(c))} />
                  </div>
                  <div className="text-base font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    +{unspentUnplan.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-[10px] text-muted-foreground">Сохраненный резерв</div>
                </div>
              </div>
            </div>

            {/* Total Selected Banner */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                <span className="text-xs font-medium">Сумма к распределению:</span>
              </div>
              <span className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-300">
                +{totalSelected.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            {/* Step 2: Destination Strategy */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Куда направить эти деньги?
              </Label>

              <div className="space-y-2.5">
                {/* Option 1: Goals */}
                <div
                  onClick={() => setStrategy("goals")}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    strategy === "goals"
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${
                    strategy === "goals" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  }`}>
                    {strategy === "goals" && <div className="size-1.5 rounded-full bg-background" />}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <Target className="size-3.5 text-primary" />
                        Ускорить финансовые цели (Накопления)
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        +{totalSelected.toLocaleString("ru-RU")} ₽ в цели
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Деньги сразу добавятся к накоплениям и сократят срок покупки цели без ожидания
                      следующих месяцев.
                    </p>

                    {strategy === "goals" && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        <Label className="text-[11px] text-muted-foreground mb-1 block">
                          Выберите цель для пополнения:
                        </Label>
                        <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                          <SelectTrigger className="h-8 text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Распределить поровну между всеми целями</SelectItem>
                            {(state.goals || []).map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                {g.name} (накоплено {(g.saved || 0).toLocaleString("ru-RU")} из{" "}
                                {g.target.toLocaleString("ru-RU")} ₽)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 2: Next Month */}
                <div
                  onClick={() => setStrategy("next_month")}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    strategy === "next_month"
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${
                    strategy === "next_month" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  }`}>
                    {strategy === "next_month" && <div className="size-1.5 rounded-full bg-background" />}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        Перенести в бюджет следующего месяца ({nextMonthName})
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        +{totalSelected.toLocaleString("ru-RU")} ₽ в {nextMonthKey}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Сумма добавится как дополнительный доход следующего месяца и увеличит свободный
                      фонд жизни.
                    </p>

                    {strategy === "next_month" && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        <Label className="text-[11px] text-muted-foreground mb-1 block">
                          В какую фазу добавить доход?
                        </Label>
                        <Select
                          value={nextMonthPhase}
                          onValueChange={(val: "adv" | "sal") => setNextMonthPhase(val)}
                        >
                          <SelectTrigger className="h-8 text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="adv">Фаза 1: 1-е число (Аванс)</SelectItem>
                            <SelectItem value="sal">Фаза 2: 15-е число (Зарплата)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 3: Split 50/50 */}
                <div
                  onClick={() => setStrategy("split")}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    strategy === "split"
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${
                    strategy === "split" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  }`}>
                    {strategy === "split" && <div className="size-1.5 rounded-full bg-background" />}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <Layers className="size-3.5 text-primary" />
                        Сбалансированно 50 / 50 (Цели + Следующий месяц)
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {Math.round(totalSelected / 2).toLocaleString("ru-RU")} ₽ /{" "}
                        {(totalSelected - Math.round(totalSelected / 2)).toLocaleString("ru-RU")} ₽
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Половина идет на досрочное ускорение целей, а вторая половина переносится в
                      бюджет следующего месяца.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          {!appliedSuccess && (
            <Button
              variant="default"
              size="sm"
              disabled={totalSelected <= 0 || isApplying}
              onClick={handleExecute}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="size-4" />
              Применить перенос (+{totalSelected.toLocaleString("ru-RU")} ₽)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
