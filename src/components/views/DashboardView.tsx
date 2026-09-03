import React, { useState } from "react"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Target,
  ArrowUpRight,
  ShieldAlert,
  Eye,
  EyeOff,
  Zap,
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
  ArrowRightLeft,
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
import type { MonthlyPlanState, User, GoalItem } from "@/types/finance"

interface DashboardViewProps {
  state: MonthlyPlanState
  selectedMonth: string
  currentUser: User | null
  onUpdateState: (newState: MonthlyPlanState) => void
  onOpenEditModal: () => void
  onOpenCreditModal: () => void
  onOpenStatsModal: () => void
  onOpenTBankModal: () => void
  onOpenMemoModal: () => void
  onOpenRollOverModal: () => void
  onOpenDepositGoalModal: (goal: GoalItem) => void
  onNavigateTab: (tab: string) => void
}

export function DashboardView({
  state,
  selectedMonth,
  currentUser,
  onUpdateState,
  onOpenEditModal,
  onOpenCreditModal,
  onOpenStatsModal,
  onOpenTBankModal,
  onOpenMemoModal,
  onOpenRollOverModal,
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

  const allocationPlans = [
    {
      key: "advance" as const,
      date: "1-е число",
      title: "Пришёл аванс",
      income: calc.incAdv,
      credit: calc.ccAdv,
      mandatoryLabel: "ЖКУ / коммуналка",
      mandatory: calc.comm,
      goals: getGoalTransfers("advance"),
      goalsTotal: calc.goalsAdvTotal,
      free: calc.phase1Free,
      categories: [
        { label: "Продукты и регулярные расходы", amount: calc.grocAdv, icon: ShoppingCart },
        { label: "Хотелки", amount: calc.wantsAdv, icon: Heart },
        { label: "Внеплановый резерв", amount: calc.unplanAdv, icon: AlertOctagon },
        { label: "Сбережения / подушка", amount: calc.saveAdv, icon: PiggyBank },
      ],
    },
    {
      key: "salary" as const,
      date: "15-е число",
      title: "Пришла зарплата",
      income: calc.incSal,
      credit: calc.ccSal,
      mandatoryLabel: "Аренда квартиры",
      mandatory: calc.rent,
      goals: getGoalTransfers("salary"),
      goalsTotal: calc.goalsSalTotal,
      free: calc.phase2Free,
      categories: [
        { label: "Продукты и регулярные расходы", amount: calc.grocSal, icon: ShoppingCart },
        { label: "Хотелки", amount: calc.wantsSal, icon: Heart },
        { label: "Внеплановый резерв", amount: calc.unplanSal, icon: AlertOctagon },
        { label: "Сбережения / подушка", amount: calc.saveSal, icon: PiggyBank },
      ],
    },
  ]

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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Панель управления</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Точное распределение финансов семьи по фазам и фондам
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenRollOverModal}
            className="text-xs h-9 gap-1.5 shadow-xs border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
          >
            <ArrowRightLeft className="size-4 text-emerald-600 dark:text-emerald-400" />
            Перенос остатков
            {(Math.max(0, calc.remGroc) + Math.max(0, calc.remWants) + Math.max(0, calc.remUnplan)) > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                +{formatMoney(Math.max(0, calc.remGroc) + Math.max(0, calc.remWants) + Math.max(0, calc.remUnplan))}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTBankModal}
            className="text-xs h-9 gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="size-4 text-muted-foreground" />
            Импорт Т-Банка
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMemoModal}
            className="text-xs h-9 gap-1.5 shadow-xs"
          >
            Заметки
          </Button>
          {isAdmin && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenEditModal}
              className="text-xs h-9 gap-1.5 shadow-xs"
            >
              <Settings2 className="size-4" />
              Настроить план
            </Button>
          )}
        </div>
      </div>

      {/* Credit card alert banner */}
      {calc.ccAmount > 0 && !calc.ccIsPaid && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-foreground shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                Кредитная задолженность к погашению: {formatMoney(calc.ccAmount)}
              </div>
              <div className="text-xs text-muted-foreground">
                Списание в 1-ю очередь:{" "}
                <span className="font-medium text-foreground">
                  {calc.ccPhase === "salary" ? "Фаза 2 (Зарплата)" : "Фаза 1 (Аванс)"}
                </span>{" "}
                | Ожидает закрытия при поступлении дохода
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={onOpenCreditModal}
              className="font-medium text-xs shadow-xs"
            >
              <Zap className="mr-1.5 size-3.5" />
              Погасить долг ({formatMoney(calc.ccAmount)})
            </Button>
          </div>
        </div>
      )}

      {/* Warning if totalPct != 100 */}
      {Math.abs(calc.totalPct - 100) > 0.1 && (
        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          <span>
            Внимание: Сумма долей распределения не равна 100% ({calc.totalPct}%). Настройте проценты в параметрах плана.
          </span>
        </div>
      )}

      {/* 4 Main Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedNumber value={calc.totalInc} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Аванс: {formatMoney(calc.incAdv)} · ЗП: {formatMoney(calc.incSal)}
            </p>
          </CardContent>
        </Card>

        {/* Mandatory + Goals */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Кредитка + Обязательные + Цели</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedNumber value={calc.totalFixedAndGoals} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Кредитка ({formatMoney(calc.ccAmount)}) + ЖКУ ({formatMoney(calc.comm)}) + Аренда ({formatMoney(calc.rent)}) + Цели ({formatMoney(calc.totalMonthlyGoals)})
            </p>
          </CardContent>
        </Card>

        {/* Free Cash for Living */}
        <Card className="shadow-xs border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Свободный фонд жизни</CardTitle>
            <Target className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-primary">
              <AnimatedNumber value={calc.totalFree} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Аванс: {formatMoney(calc.phase1Free)} · ЗП: {formatMoney(calc.phase2Free)}
            </p>
          </CardContent>
        </Card>

        {/* Extra Savings Allocated */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Подушка / Сбережения</CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              <AnimatedNumber value={calc.allocatedSave} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Доля {calc.pS}% от свободного остатка
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-Phase Salary Architecture Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Phase 1 (1st - Advance) */}
        <Card className="shadow-xs">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold text-xs">
                  1-е число
                </Badge>
                <CardTitle className="text-base font-semibold">
                  Фаза 1: Аванс
                </CardTitle>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-medium">Доход фазы</div>
                <div className="text-base font-bold font-mono">{formatMoney(calc.incAdv)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Тимур (аванс):</span>
                <span className="font-medium">{formatMoney(state.incomes?.tAdv || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Лера (аванс):</span>
                <span className="font-medium">{formatMoney(state.incomes?.lAdv || 0)}</span>
              </div>
              {(state.incomes?.extraAdv || 0) > 0 && (
                <div className="flex justify-between py-1 border-b text-emerald-600">
                  <span>Доп. поступления:</span>
                  <span className="font-medium">+{formatMoney(state.incomes.extraAdv)}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs">
              <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                Списания фазы 1:
              </div>
              {calc.ccAdv > 0 && (
                <div className="flex justify-between">
                  <span>0. Кредитная карта:</span>
                  <span className={calc.ccIsPaid ? "line-through text-emerald-600 font-medium" : "text-destructive font-semibold"}>
                    {formatMoney(calc.ccAdv)} {calc.ccIsPaid && "(погашена)"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>1. ЖКУ / Коммуналка:</span>
                <span className="font-semibold">{formatMoney(calc.comm)}</span>
              </div>
              <div className="flex justify-between">
                <span>2. Взнос в финансовые цели ({Math.round(calc.rAdv * 100)}%):</span>
                <span className="font-semibold">{formatMoney(calc.goalsAdvTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-sm text-primary">
                <span>Свободный остаток аванса:</span>
                <span className="font-mono">{formatMoney(calc.phase1Free)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 2 (15th - Salary) */}
        <Card className="shadow-xs">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-semibold text-xs">
                  15-е число
                </Badge>
                <CardTitle className="text-base font-semibold">
                  Фаза 2: Зарплата
                </CardTitle>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-medium">Доход фазы</div>
                <div className="text-base font-bold font-mono">{formatMoney(calc.incSal)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Тимур (зарплата):</span>
                <span className="font-medium">{formatMoney(state.incomes?.tSal || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Лера (зарплата):</span>
                <span className="font-medium">{formatMoney(state.incomes?.lSal || 0)}</span>
              </div>
              {(state.incomes?.extraSal || 0) > 0 && (
                <div className="flex justify-between py-1 border-b text-emerald-600">
                  <span>Доп. поступления:</span>
                  <span className="font-medium">+{formatMoney(state.incomes.extraSal)}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs">
              <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                Списания фазы 2:
              </div>
              {calc.ccSal > 0 && (
                <div className="flex justify-between">
                  <span>0. Кредитная карта:</span>
                  <span className={calc.ccIsPaid ? "line-through text-emerald-600 font-medium" : "text-destructive font-semibold"}>
                    {formatMoney(calc.ccSal)} {calc.ccIsPaid && "(погашена)"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>1. Аренда квартиры:</span>
                <span className="font-semibold">{formatMoney(calc.rent)}</span>
              </div>
              <div className="flex justify-between">
                <span>2. Взнос в финансовые цели ({Math.round(calc.rSal * 100)}%):</span>
                <span className="font-semibold">{formatMoney(calc.goalsSalTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-sm text-primary">
                <span>Свободный остаток зарплаты:</span>
                <span className="font-mono">{formatMoney(calc.phase2Free)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exact payday transfer plans */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Что делать, когда пришли деньги</h3>
          <p className="text-xs text-muted-foreground">
            Точные суммы переводов в правильном порядке: сначала кредитка, затем обязательные платежи, цели и фонды.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {allocationPlans.map((plan) => {
            const debtExceedsIncome = plan.credit > plan.income
            return (
              <Card key={plan.key} className="shadow-xs overflow-hidden">
                <CardHeader className="border-b bg-primary/[0.04] pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="mb-2 text-[10px]">{plan.date}</Badge>
                      <CardTitle className="text-base">{plan.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Получено: <span className="font-semibold text-foreground">{formatMoney(plan.income)}</span>
                      </CardDescription>
                    </div>
                    <ArrowRightLeft className="size-5 text-primary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <CreditCard className="size-4 text-destructive" />
                        0. Погасить кредитку
                      </span>
                      <span className="font-bold font-mono text-destructive">{formatMoney(plan.credit)}</span>
                    </div>
                    {debtExceedsIncome && (
                      <p className="text-[11px] text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5" /> Денег этой фазы недостаточно для полного погашения долга.
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Layers className="size-4 text-muted-foreground" />
                        1. {plan.mandatoryLabel}
                      </span>
                      <span className="font-bold font-mono">{formatMoney(plan.mandatory)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between gap-3 text-sm font-semibold">
                      <span className="flex items-center gap-2"><Target className="size-4 text-primary" />2. Отложить на цели</span>
                      <span className="font-mono">{formatMoney(plan.goalsTotal)}</span>
                    </div>
                    <div className="pl-6 space-y-1.5">
                      {plan.goals.length === 0 ? (
                        <div className="text-xs text-muted-foreground">Целей в этом месяце нет</div>
                      ) : plan.goals.map(({ goal, amount }) => (
                        <div key={goal.id} className="flex justify-between gap-3 text-xs border-t pt-1.5 first:border-0 first:pt-0">
                          <span className="text-muted-foreground">{goal.name}</span>
                          <span className="font-semibold font-mono">{formatMoney(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 space-y-2">
                    <div className="flex justify-between gap-3 text-sm font-semibold text-primary">
                      <span>3. Распределить остаток</span>
                      <span className="font-mono">{formatMoney(plan.free)}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plan.categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <div key={category.label} className="flex justify-between gap-2 rounded-md bg-background border p-2.5 text-xs">
                            <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="size-3.5" />{category.label}</span>
                            <span className="font-semibold font-mono whitespace-nowrap">{formatMoney(category.amount)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 4 Category Allocation Cards (55% Groceries, 20% Wants, 10% Unplanned, 15% Savings) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">Распределение свободного бюджета жизни</h3>
            <p className="text-xs text-muted-foreground">
              Автоматический расчет лимитов от свободного фонда ({formatMoney(calc.totalFree)})
            </p>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={onOpenEditModal} className="text-xs h-7">
              Настроить %
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Groceries Card */}
          <Card className="shadow-xs cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigateTab("groceries")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 truncate">
                  <ShoppingCart className="size-3.5 shrink-0" />
                  <span>Продукты ({calc.pG}%)</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Остаток: {formatMoney(calc.remGroc)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="text-xl font-bold tracking-tight font-mono">
                {formatMoney(calc.allocatedGroc)}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                1-е: {formatMoney(calc.grocAdv)} · 15-е: {formatMoney(calc.grocSal)}
              </p>
              <div className="text-[11px] pt-1 text-muted-foreground flex justify-between border-t border-border/40">
                <span>Факт потрачено:</span>
                <span className="font-medium text-foreground font-mono">{formatMoney(calc.spentGroc)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Wants Card */}
          <Card className="shadow-xs cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigateTab("wants")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 truncate">
                  <Heart className="size-3.5 shrink-0" />
                  <span>Хотелки ({calc.pW}%)</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Остаток: {formatMoney(calc.remWants)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="text-xl font-bold tracking-tight font-mono">
                {formatMoney(calc.allocatedWants)}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                1-е: {formatMoney(calc.wantsAdv)} · 15-е: {formatMoney(calc.wantsSal)}
              </p>
              <div className="text-[11px] pt-1 text-muted-foreground flex justify-between border-t border-border/40">
                <span>Факт куплено:</span>
                <span className="font-medium text-foreground font-mono">{formatMoney(calc.spentWants)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Unplanned Card */}
          <Card className="shadow-xs cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onNavigateTab("unplanned")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 truncate">
                  <AlertOctagon className="size-3.5 shrink-0" />
                  <span>Внеплановые ({calc.pU}%)</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Остаток: {formatMoney(calc.remUnplan)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="text-xl font-bold tracking-tight font-mono">
                {formatMoney(calc.allocatedUnplan)}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                1-е: {formatMoney(calc.unplanAdv)} · 15-е: {formatMoney(calc.unplanSal)}
              </p>
              <div className="text-[11px] pt-1 text-muted-foreground flex justify-between border-t border-border/40">
                <span>Факт потрачено:</span>
                <span className="font-medium text-foreground font-mono">{formatMoney(calc.spentUnplan)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Savings / Reserve Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5 truncate">
                  <PiggyBank className="size-3.5 shrink-0" />
                  <span>Доп. накопления ({calc.pS}%)</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-emerald-600 shrink-0">
                  Подушка
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {formatMoney(calc.allocatedSave)}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                1-е: {formatMoney(calc.saveAdv)} · 15-е: {formatMoney(calc.saveSal)}
              </p>
              <div className="text-[11px] pt-1 text-muted-foreground border-t border-border/40">
                Откладывается в накопительный фонд
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Goals & Accumulation Card */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="size-4 text-primary" />
              Финансовые цели & Накопления
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Суммарный ежемесячный взнос: {formatMoney(calc.totalMonthlyGoals)} (Аванс: {formatMoney(calc.goalsAdvTotal)} | ЗП: {formatMoney(calc.goalsSalTotal)})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecretGoals(!showSecretGoals)}
                className="gap-1.5 text-xs h-8"
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
                className="text-xs h-8"
              >
                Настроить цели
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
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
                  className="p-4 rounded-xl border bg-card shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {goal.name}
                          {goal.isSecret && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 flex items-center gap-1">
                              <Lock className="size-2.5" />
                              Секрет
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {formatMoney(monthly)} / мес · {months} мес
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {pct}%
                      </Badge>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-foreground h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Накоплено:</span>
                      <span className="font-mono font-medium">
                        {formatMoney(saved)} / {formatMoney(goal.target)}
                      </span>
                    </div>

                    {/* Forecast date line */}
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
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
                    className="w-full text-xs h-7.5 gap-1.5 font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/40 mt-1"
                  >
                    <Plus className="size-3.5" />
                    Внести досрочно
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
