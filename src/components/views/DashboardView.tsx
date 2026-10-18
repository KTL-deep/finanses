import React, { useState } from "react"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Target,
  ArrowUpRight,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowRight,
  Settings2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  PieChart,
  HelpCircle,
  AlertTriangle,
  ShoppingCart,
  Heart,
  AlertOctagon,
  PiggyBank,
  Lock,
  Calendar,
  Plus,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AnimatedNumber } from "@/components/corr/animated-number"
import { calculateFinance, formatCurrency } from "@/lib/calculations"
import { cn } from "@/lib/utils"
import type { MonthlyPlanState, User, GoalItem } from "@/types/finance"

interface DashboardViewProps {
  state: MonthlyPlanState
  selectedMonth: string
  currentUser: User | null
  onUpdateState: (newState: MonthlyPlanState) => void
  onOpenEditModal: () => void
  onOpenStatsModal: () => void
  onOpenTBankModal: () => void
  onOpenMemoModal: () => void
  onOpenDepositGoalModal: (goal: GoalItem) => void
  onNavigateTab: (tab: string) => void
}

export function DashboardView({
  state,
  selectedMonth,
  currentUser,
  onUpdateState,
  onOpenEditModal,
  onOpenStatsModal,
  onOpenTBankModal,
  onOpenMemoModal,
  onOpenDepositGoalModal,
  onNavigateTab,
}: DashboardViewProps) {
  const [showSecretGoals, setShowSecretGoals] = useState(false)
  const isAdmin = currentUser?.username?.toLowerCase() === "timur"

  const calc = calculateFinance(state)

  function formatMoney(val: number) {
    return formatCurrency(val)
  }

  // Filter goals based on user role
  const visibleGoals = (state.goals || []).filter((g) => {
    if (!g.isSecret) return true
    return isAdmin || showSecretGoals
  })

  function getGoalTransfers(phase: "advance" | "salary") {
    const goals = state.goals || []
    const phaseTotal = phase === "advance" ? calc.goalsAdvTotal : calc.goalsSalTotal
    const ratio = phase === "advance" ? calc.rAdv : calc.rSal
    let distributed = 0

    const transfers = goals.map((goal, index) => {
      const monthly = Math.round(goal.target / (goal.months > 0 ? goal.months : 12))
      const amount = index === goals.length - 1
        ? Math.max(0, phaseTotal - distributed)
        : Math.round(monthly * ratio)
      distributed += amount
      return { goal, amount }
    })

    if (isAdmin) return transfers

    const publicTransfers = transfers.filter(({ goal }) => !goal.isSecret)
    const secretAmount = transfers
      .filter(({ goal }) => goal.isSecret)
      .reduce((sum, item) => sum + item.amount, 0)

    return secretAmount > 0
      ? [...publicTransfers, { goal: { id: "secret", name: "Целевые накопления", target: 0, months: 1, saved: 0 }, amount: secretAmount }]
      : publicTransfers
  }

  const advanceGoalTransfers = getGoalTransfers("advance")
  const salaryGoalTransfers = getGoalTransfers("salary")

  // Recent transactions list from state
  const recentTransactions = [
    ...(state.groceries || []).map((i) => ({
      name: i.name,
      amount: i.amount,
      date: i.date,
      type: "Продукты",
      avatar: "G",
      done: i.done,
    })),
    ...(state.wants || []).map((i) => ({
      name: i.name,
      amount: i.amount,
      date: i.date,
      type: "Хотелки",
      avatar: "W",
      done: i.done,
    })),
    ...(state.unplanned || []).map((i) => ({
      name: i.name,
      amount: i.amount,
      date: i.date,
      type: "Внепланово",
      avatar: "U",
      done: true,
    })),
  ].slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10.5px] uppercase tracking-[0.18em] font-semibold bg-primary/10 text-primary border border-primary/20 w-fit">
            <Sparkles className="size-3" />
            Двухфазный бюджет
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Панель управления</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Баланс семьи, списания по фазам и контроль 4 свободных фондов
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTBankModal}
            className="text-xs h-9 px-3 gap-1.5 rounded-xl border-border/80 shadow-xs hover:bg-accent"
          >
            <FileSpreadsheet className="size-3.5 text-muted-foreground" />
            Импорт Т-Банка
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMemoModal}
            className="text-xs h-9 px-3 gap-1.5 rounded-xl border-border/80 shadow-xs hover:bg-accent"
          >
            Заметки
          </Button>
          {isAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenEditModal}
              className="text-xs h-9 px-3.5 gap-2 rounded-xl shadow-soft"
            >
              <Settings2 className="size-3.5" />
              <span>Настройки плана</span>
            </Button>
          )}
        </div>
      </div>

      {/* Credit card payoff fact */}
      {calc.ccAmount > 0 && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-foreground shadow-xs">
          <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
              Кредитная карта закрыта на сумму {formatMoney(calc.ccAmount)}
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-600">
                1-й приоритет
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Списано в первую очередь:{" "}
              <span className="font-medium text-foreground">
                {calc.ccPhase === "salary" ? "15-е число (Зарплата)" : "1-е число (Аванс)"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warning if totalPct != 100 */}
      {Math.abs(calc.totalPct - 100) > 0.1 && (
        <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          <span>
            Внимание: Сумма долей распределения не равна 100% ({calc.totalPct}%). Настройте проценты в параметрах плана.
          </span>
        </div>
      )}

      {/* High-End Asymmetrical Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Income Card (Span 2 on large screens) */}
        <div className="md:col-span-2 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-primary" />
                Общий ежемесячный доход
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-mono">
                <AnimatedNumber value={calc.totalInc} currency />
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 rounded-lg border-border/80">
              2 фазы
            </Badge>
          </div>

          <div className="mt-5 space-y-2 pt-3 border-t border-border/60">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                <div className="text-muted-foreground text-[11px] font-medium">1-е число · Аванс</div>
                <div className="font-bold text-sm sm:text-base font-mono mt-0.5 text-foreground">
                  {formatMoney(calc.incAdv)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                <div className="text-muted-foreground text-[11px] font-medium">15-е число · Зарплата</div>
                <div className="font-bold text-sm sm:text-base font-mono mt-0.5 text-foreground">
                  {formatMoney(calc.incSal)}
                </div>
              </div>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full"
                style={{ width: `${calc.totalInc > 0 ? (calc.incAdv / calc.totalInc) * 100 : 50}%` }}
                title="Доля аванса"
              />
              <div
                className="bg-primary/40 h-full"
                style={{ width: `${calc.totalInc > 0 ? (calc.incSal / calc.totalInc) * 100 : 50}%` }}
                title="Доля зарплаты"
              />
            </div>
          </div>
        </div>

        {/* Free Cash for Living Card */}
        <Card className="rounded-3xl border-primary/30 bg-primary/[0.02] shadow-xs flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Target className="size-3.5" />
                Свободный фонд жизни
              </div>
              <span className="size-2 rounded-full bg-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-primary font-mono">
              <AnimatedNumber value={calc.totalFree} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              На продукты, хотелки, резерв и подушку
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Аванс (свободно):</span>
              <span className="font-mono font-medium text-foreground">{formatMoney(calc.phase1Free)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ЗП (свободно):</span>
              <span className="font-mono font-medium text-foreground">{formatMoney(calc.phase2Free)}</span>
            </div>
          </div>
        </Card>

        {/* Mandatory & Goals Card */}
        <Card className="rounded-3xl shadow-xs flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-muted-foreground" />
                Обязательства & Цели
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Фиксировано
              </Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 font-mono">
              <AnimatedNumber value={calc.totalFixedAndGoals} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              ЖКУ ({formatMoney(calc.comm)}) + Аренда ({formatMoney(calc.rent)})
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Цели (накопления):</span>
              <span className="font-mono font-medium text-foreground">{formatMoney(calc.totalMonthlyGoals)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Погашение долга:</span>
              <span className="font-mono font-medium text-foreground">{formatMoney(calc.ccAmount)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Two-Phase Salary Architecture Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Phase 1 (1st - Advance) */}
        <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/80 shadow-xs">
          <div className="rounded-2xl bg-card p-5 border border-border/50 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="font-mono font-semibold text-xs px-2.5 py-0.5 rounded-lg border-primary/30 text-primary bg-primary/5">
                  1-е число
                </Badge>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Фаза 1: Аванс</h3>
                  <p className="text-[11px] text-muted-foreground">Первая половина месяца</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">Доход фазы</div>
                <div className="text-lg font-extrabold font-mono text-foreground">{formatMoney(calc.incAdv)}</div>
              </div>
            </div>

            {/* Income breakdown */}
            <div className="space-y-1.5 text-xs bg-muted/30 p-3 rounded-xl border border-border/40">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Тимур (аванс):</span>
                <span className="font-semibold font-mono">{formatMoney(state.incomes?.tAdv || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Лера (аванс):</span>
                <span className="font-semibold font-mono">{formatMoney(state.incomes?.lAdv || 0)}</span>
              </div>
              {(state.incomes?.extraAdv || 0) > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Доп. поступления:</span>
                  <span className="font-mono">+{formatMoney(state.incomes.extraAdv)}</span>
                </div>
              )}
            </div>

            {/* Deductions breakdown */}
            <div className="rounded-xl bg-muted/40 p-3.5 space-y-2.5 text-xs border border-border/50">
              <div className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Обязательные списания:</span>
                <span className="font-mono text-destructive font-semibold">
                  −{formatMoney((calc.ccAdv || 0) + calc.comm + calc.goalsAdvTotal)}
                </span>
              </div>
              {calc.ccAdv > 0 && (
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">0. Кредитная карта:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    {formatMoney(calc.ccAdv)} (погашена)
                  </span>
                </div>
              )}
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">1. ЖКУ / Коммуналка:</span>
                <span className="font-semibold font-mono">{formatMoney(calc.comm)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">2. Взнос в финансовые цели ({Math.round(calc.rAdv * 100)}%):</span>
                <span className="font-semibold font-mono">{formatMoney(calc.goalsAdvTotal)}</span>
              </div>
              {advanceGoalTransfers.map(({ goal, amount }) => (
                <div key={goal.id} className="flex justify-between gap-3 pl-4 text-[11px] text-muted-foreground">
                  <span className="truncate">↳ {goal.name}</span>
                  <span className="font-medium font-mono text-foreground shrink-0">{formatMoney(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2.5 border-t border-border/60 font-bold text-sm text-primary">
                <span>Свободный остаток аванса:</span>
                <span className="font-mono">{formatMoney(calc.phase1Free)}</span>
              </div>
            </div>

            {/* 4-fund Allocation for Phase 1 */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3.5 space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-[10.5px] text-primary flex items-center justify-between">
                <span>Распределение свободного остатка</span>
                <span className="text-[10px] text-muted-foreground font-normal">100%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  ["Продукты", calc.grocAdv, `${calc.pG}%`],
                  ["Хотелки", calc.wantsAdv, `${calc.pW}%`],
                  ["Внеплан", calc.unplanAdv, `${calc.pU}%`],
                  ["Подушка", calc.saveAdv, `${calc.pS}%`],
                ].map(([label, amount, pct]) => (
                  <div key={String(label)} className="p-2 rounded-lg bg-card/80 border border-border/50 flex flex-col justify-between">
                    <span className="text-muted-foreground text-[10.5px] font-medium flex justify-between">
                      {label}
                      <span className="font-mono text-muted-foreground/70">{pct}</span>
                    </span>
                    <span className="font-bold font-mono text-foreground text-xs sm:text-sm mt-0.5">
                      {formatMoney(Number(amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2 (15th - Salary) */}
        <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/80 shadow-xs">
          <div className="rounded-2xl bg-card p-5 border border-border/50 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="font-mono font-semibold text-xs px-2.5 py-0.5 rounded-lg border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                  15-е число
                </Badge>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Фаза 2: Зарплата</h3>
                  <p className="text-[11px] text-muted-foreground">Вторая половина месяца</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">Доход фазы</div>
                <div className="text-lg font-extrabold font-mono text-foreground">{formatMoney(calc.incSal)}</div>
              </div>
            </div>

            {/* Income breakdown */}
            <div className="space-y-1.5 text-xs bg-muted/30 p-3 rounded-xl border border-border/40">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Тимур (зарплата):</span>
                <span className="font-semibold font-mono">{formatMoney(state.incomes?.tSal || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Лера (зарплата):</span>
                <span className="font-semibold font-mono">{formatMoney(state.incomes?.lSal || 0)}</span>
              </div>
              {(state.incomes?.extraSal || 0) > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Доп. поступления:</span>
                  <span className="font-mono">+{formatMoney(state.incomes.extraSal)}</span>
                </div>
              )}
            </div>

            {/* Deductions breakdown */}
            <div className="rounded-xl bg-muted/40 p-3.5 space-y-2.5 text-xs border border-border/50">
              <div className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Обязательные списания:</span>
                <span className="font-mono text-destructive font-semibold">
                  −{formatMoney((calc.ccSal || 0) + calc.rent + calc.goalsSalTotal)}
                </span>
              </div>
              {calc.ccSal > 0 && (
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">0. Кредитная карта:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    {formatMoney(calc.ccSal)} (погашена)
                  </span>
                </div>
              )}
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">1. Аренда квартиры:</span>
                <span className="font-semibold font-mono">{formatMoney(calc.rent)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">2. Взнос в финансовые цели ({Math.round(calc.rSal * 100)}%):</span>
                <span className="font-semibold font-mono">{formatMoney(calc.goalsSalTotal)}</span>
              </div>
              {salaryGoalTransfers.map(({ goal, amount }) => (
                <div key={goal.id} className="flex justify-between gap-3 pl-4 text-[11px] text-muted-foreground">
                  <span className="truncate">↳ {goal.name}</span>
                  <span className="font-medium font-mono text-foreground shrink-0">{formatMoney(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2.5 border-t border-border/60 font-bold text-sm text-primary">
                <span>Свободный остаток зарплаты:</span>
                <span className="font-mono">{formatMoney(calc.phase2Free)}</span>
              </div>
            </div>

            {/* 4-fund Allocation for Phase 2 */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3.5 space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-[10.5px] text-primary flex items-center justify-between">
                <span>Распределение свободного остатка</span>
                <span className="text-[10px] text-muted-foreground font-normal">100%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  ["Продукты", calc.grocSal, `${calc.pG}%`],
                  ["Хотелки", calc.wantsSal, `${calc.pW}%`],
                  ["Внеплан", calc.unplanSal, `${calc.pU}%`],
                  ["Подушка", calc.saveSal, `${calc.pS}%`],
                ].map(([label, amount, pct]) => (
                  <div key={String(label)} className="p-2 rounded-lg bg-card/80 border border-border/50 flex flex-col justify-between">
                    <span className="text-muted-foreground text-[10.5px] font-medium flex justify-between">
                      {label}
                      <span className="font-mono text-muted-foreground/70">{pct}</span>
                    </span>
                    <span className="font-bold font-mono text-foreground text-xs sm:text-sm mt-0.5">
                      {formatMoney(Number(amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Category Allocation Cards with visual meters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight">Распределение свободного бюджета жизни</h3>
            <p className="text-xs text-muted-foreground">
              Автоматический расчет лимитов от свободного фонда ({formatMoney(calc.totalFree)})
            </p>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={onOpenEditModal} className="text-xs h-7.5 rounded-lg border-border/80">
              Настроить %
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Groceries Card */}
          <div
            onClick={() => onNavigateTab("groceries")}
            className="group p-5 rounded-3xl border border-border/80 bg-card hover:border-primary/50 shadow-xs cursor-pointer transition-all duration-200 active:scale-[0.98] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                <div className="size-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShoppingCart className="size-3.5" />
                </div>
                <span>Продукты ({calc.pG}%)</span>
              </div>
              <Badge variant={calc.remGroc < 0 ? "destructive" : "secondary"} className="text-[10.5px] font-mono font-semibold rounded-md">
                Остаток: {formatMoney(calc.remGroc)}
              </Badge>
            </div>

            <div>
              <div className="text-2xl font-extrabold tracking-tight font-mono text-foreground">
                {formatMoney(calc.allocatedGroc)}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                1-е: {formatMoney(calc.grocAdv)} · 15-е: {formatMoney(calc.grocSal)}
              </p>
            </div>

            {/* Spend progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    calc.allocatedGroc > 0 && (calc.spentGroc / calc.allocatedGroc) > 1
                      ? "bg-destructive"
                      : (calc.spentGroc / calc.allocatedGroc) > 0.85
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  )}
                  style={{ width: `${calc.allocatedGroc > 0 ? Math.min(100, Math.round((calc.spentGroc / calc.allocatedGroc) * 100)) : 0}%` }}
                />
              </div>
              <div className="text-[11px] flex justify-between text-muted-foreground font-mono">
                <span>Факт: {formatMoney(calc.spentGroc)}</span>
                <span>{calc.allocatedGroc > 0 ? Math.round((calc.spentGroc / calc.allocatedGroc) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Wants Card */}
          <div
            onClick={() => onNavigateTab("wants")}
            className="group p-5 rounded-3xl border border-border/80 bg-card hover:border-primary/50 shadow-xs cursor-pointer transition-all duration-200 active:scale-[0.98] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                <div className="size-6 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                  <Heart className="size-3.5" />
                </div>
                <span>Хотелки ({calc.pW}%)</span>
              </div>
              <Badge variant={calc.remWants < 0 ? "destructive" : "secondary"} className="text-[10.5px] font-mono font-semibold rounded-md">
                Остаток: {formatMoney(calc.remWants)}
              </Badge>
            </div>

            <div>
              <div className="text-2xl font-extrabold tracking-tight font-mono text-foreground">
                {formatMoney(calc.allocatedWants)}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                1-е: {formatMoney(calc.wantsAdv)} · 15-е: {formatMoney(calc.wantsSal)}
              </p>
            </div>

            {/* Spend progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    calc.allocatedWants > 0 && (calc.spentWants / calc.allocatedWants) > 1
                      ? "bg-destructive"
                      : (calc.spentWants / calc.allocatedWants) > 0.85
                        ? "bg-amber-500"
                        : "bg-pink-500"
                  )}
                  style={{ width: `${calc.allocatedWants > 0 ? Math.min(100, Math.round((calc.spentWants / calc.allocatedWants) * 100)) : 0}%` }}
                />
              </div>
              <div className="text-[11px] flex justify-between text-muted-foreground font-mono">
                <span>Куплено: {formatMoney(calc.spentWants)}</span>
                <span>{calc.allocatedWants > 0 ? Math.round((calc.spentWants / calc.allocatedWants) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Unplanned Card */}
          <div
            onClick={() => onNavigateTab("unplanned")}
            className="group p-5 rounded-3xl border border-border/80 bg-card hover:border-primary/50 shadow-xs cursor-pointer transition-all duration-200 active:scale-[0.98] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                <div className="size-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertOctagon className="size-3.5" />
                </div>
                <span>Внеплан ({calc.pU}%)</span>
              </div>
              <Badge variant={calc.remUnplan < 0 ? "destructive" : "secondary"} className="text-[10.5px] font-mono font-semibold rounded-md">
                Остаток: {formatMoney(calc.remUnplan)}
              </Badge>
            </div>

            <div>
              <div className="text-2xl font-extrabold tracking-tight font-mono text-foreground">
                {formatMoney(calc.allocatedUnplan)}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                1-е: {formatMoney(calc.unplanAdv)} · 15-е: {formatMoney(calc.unplanSal)}
              </p>
            </div>

            {/* Spend progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    calc.allocatedUnplan > 0 && (calc.spentUnplan / calc.allocatedUnplan) > 1
                      ? "bg-destructive"
                      : "bg-amber-500"
                  )}
                  style={{ width: `${calc.allocatedUnplan > 0 ? Math.min(100, Math.round((calc.spentUnplan / calc.allocatedUnplan) * 100)) : 0}%` }}
                />
              </div>
              <div className="text-[11px] flex justify-between text-muted-foreground font-mono">
                <span>Факт: {formatMoney(calc.spentUnplan)}</span>
                <span>{calc.allocatedUnplan > 0 ? Math.round((calc.spentUnplan / calc.allocatedUnplan) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Savings / Reserve Card */}
          <div className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <PiggyBank className="size-3.5" />
                </div>
                <span>Подушка ({calc.pS}%)</span>
              </div>
              <Badge variant="outline" className="text-[10.5px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/40 rounded-md">
                Сбережения
              </Badge>
            </div>

            <div>
              <div className="text-2xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {formatMoney(calc.allocatedSave)}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                1-е: {formatMoney(calc.saveAdv)} · 15-е: {formatMoney(calc.saveSal)}
              </p>
            </div>

            {/* Steady accumulation visual */}
            <div className="space-y-1">
              <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
              <div className="text-[11px] flex justify-between text-muted-foreground">
                <span>Неприкосновенный фонд</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Goals & Accumulation Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/60 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Target className="size-3.5" />
              </div>
              Финансовые цели & Накопления
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Суммарный взнос: <span className="font-mono font-semibold text-foreground">{formatMoney(calc.totalMonthlyGoals)}</span> (Аванс: <span className="font-mono text-foreground">{formatMoney(calc.goalsAdvTotal)}</span> · ЗП: <span className="font-mono text-foreground">{formatMoney(calc.goalsSalTotal)}</span>)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecretGoals(!showSecretGoals)}
                className="gap-1.5 text-xs h-8 rounded-xl border-border/80 hover:bg-accent"
              >
                {showSecretGoals ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {showSecretGoals ? "Скрыть секреты" : "Показать все"}
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEditModal}
                className="text-xs h-8 rounded-xl border-border/80 hover:bg-accent"
              >
                Настроить цели
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleGoals.map((goal) => {
              const months = goal.months && goal.months > 0 ? goal.months : 12
              const monthly = Math.round(goal.target / months)
              const saved = goal.saved || 0
              const remaining = Math.max(0, goal.target - saved)
              const remainingMonths = monthly > 0 ? Math.ceil(remaining / monthly) : months
              const isDone = remaining <= 0

              let forecastDateStr = "Цель достигнута! 🎉"
              if (!isDone) {
                const [y, m] = selectedMonth.split("-").map(Number)
                const targetDate = new Date(y, m - 1 + remainingMonths, 1)
                const mName = targetDate.toLocaleString("ru-RU", { month: "long", year: "numeric" })
                forecastDateStr = mName.charAt(0).toUpperCase() + mName.slice(1)
              }

              const pct =
                goal.target > 0
                  ? Math.min(100, Math.round((saved / goal.target) * 100))
                  : 0

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl border border-border/80 bg-background/60 shadow-xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm tracking-tight flex items-center gap-1.5 truncate">
                          <span className="truncate">{goal.name}</span>
                          {goal.isSecret && (
                            <Badge variant="secondary" className="text-[9.5px] px-1.5 py-0 flex items-center gap-1 shrink-0 bg-muted/80 rounded-md">
                              <Lock className="size-2.5" />
                              Секрет
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground mt-0.5 font-mono">
                          {formatMoney(monthly)} / мес · {months} мес
                        </div>
                      </div>
                      <Badge variant={isDone ? "default" : "secondary"} className="font-mono text-xs font-semibold shrink-0 rounded-md">
                        {pct}%
                      </Badge>
                    </div>

                    <div className="w-full bg-muted/70 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isDone ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground text-[11px]">Накоплено:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatMoney(saved)} <span className="text-muted-foreground font-normal">/ {formatMoney(goal.target)}</span>
                      </span>
                    </div>

                    {/* Forecast date line */}
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1.5 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-primary" />
                        Прогноз:
                      </span>
                      <span className="font-medium text-foreground">
                        {forecastDateStr} {!isDone && `(${remainingMonths} мес.)`}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDepositGoalModal(goal)}
                    className="w-full text-xs h-8 gap-1.5 font-medium rounded-xl border-border/80 hover:bg-primary/5 hover:text-primary hover:border-primary/40 mt-1 transition-all"
                  >
                    <Plus className="size-3.5" />
                    Внести досрочно
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
