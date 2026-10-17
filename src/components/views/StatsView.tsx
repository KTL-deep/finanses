import React, { useEffect, useState } from "react"
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Wallet,
  ShoppingBag,
  Heart,
  AlertOctagon,
  Home,
  Target,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import { calculateFinance, formatCurrency } from "@/lib/calculations"
import { getStats } from "@/lib/api"
import type { MonthlyPlanState, MonthRecord } from "@/types/finance"
import { AnimatedNumber } from "@/components/corr/animated-number"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface StatsViewProps {
  state: MonthlyPlanState
  selectedMonth: string
}

export function StatsView({ state, selectedMonth }: StatsViewProps) {
  const [history, setHistory] = useState<MonthRecord[]>([])
  const calc = calculateFinance(state)

  useEffect(() => {
    getStats().then((data) => setHistory(data))
  }, [selectedMonth])

  // Current month breakdown
  const grocSpent = calc.spentGroc
  const grocAllocated = calc.allocatedGroc

  const timurWants = (state.wants || []).filter(
    (i) => i.author === "timur" && Boolean(i.done)
  )
  const leraWants = (state.wants || []).filter(
    (i) => i.author === "lera" && Boolean(i.done)
  )
  const timurWantsSpent = timurWants.reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0
  )
  const leraWantsSpent = leraWants.reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0
  )
  const totalWantsSpent = calc.spentWants
  const wantsAllocated = calc.allocatedWants

  const unplanSpent = calc.spentUnplan
  const unplanAllocated = calc.allocatedUnplan

  const fixedSpent = calc.comm + calc.rent
  const goalsDeductions = calc.totalMonthlyGoals
  const creditCardAmount = calc.ccAmount

  const totalActualSpent =
    grocSpent +
    totalWantsSpent +
    unplanSpent +
    fixedSpent +
    goalsDeductions +
    creditCardAmount

  // Doughnut Chart data for expense types
  const doughnutData = {
    labels: [
      "Продукты",
      "Хотелки (Тимур)",
      "Хотелки (Лера)",
      "Внеплановые",
      "Погашение кредитки",
      "ЖКУ и Аренда",
      "Накопления и цели",
    ],
    datasets: [
      {
        data: [
          grocSpent,
          timurWantsSpent,
          leraWantsSpent,
          unplanSpent,
          creditCardAmount,
          fixedSpent,
          goalsDeductions,
        ],
        backgroundColor: [
          "#3b82f6", // Blue
          "#6366f1", // Indigo
          "#ec4899", // Pink
          "#f59e0b", // Amber
          "#ef4444", // Red
          "#64748b", // Slate
          "#10b981", // Emerald
        ],
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
    ],
  }

  // Plan vs Actual Bar Chart data
  const barData = {
    labels: [
      "Продукты",
      "Хотелки",
      "Внеплановые",
      "Кредитка",
      "Обязательные",
      "Цели",
    ],
    datasets: [
      {
        label: "План / Лимит (₽)",
        data: [
          grocAllocated,
          wantsAllocated,
          unplanAllocated,
          creditCardAmount,
          fixedSpent,
          goalsDeductions,
        ],
        backgroundColor: "rgba(100, 116, 139, 0.4)",
        borderRadius: 4,
      },
      {
        label: "Факт списаний (₽)",
        data: [
          grocSpent,
          totalWantsSpent,
          unplanSpent,
          creditCardAmount,
          fixedSpent,
          goalsDeductions,
        ],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderRadius: 4,
      },
    ],
  }

  // Multi-month dynamics
  const monthLabels = history.map((r) => r.month)
  const historyIncomes = history.map((r) => calculateFinance(r.state).totalInc)
  const historySpends = history.map((r) => {
    const c = calculateFinance(r.state)
    return (
      c.spentGroc +
      c.spentWants +
      c.spentUnplan +
      c.ccAmount +
      (c.comm + c.rent) +
      c.totalMonthlyGoals
    )
  })
  const historySavings = history.map((r) => calculateFinance(r.state).totalMonthlyGoals)

  const multiMonthData = {
    labels: monthLabels.length > 0 ? monthLabels : [selectedMonth],
    datasets: [
      {
        label: "Доходы (₽)",
        data: historyIncomes.length > 0 ? historyIncomes : [calc.totalInc],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
      },
      {
        label: "Все расходы (₽)",
        data: historySpends.length > 0 ? historySpends : [totalActualSpent],
        borderColor: "#f43f5e",
        backgroundColor: "rgba(244, 63, 94, 0.1)",
        tension: 0.3,
      },
      {
        label: "Отчисления в цели (₽)",
        data: historySavings.length > 0 ? historySavings : [goalsDeductions],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
      },
    ],
  }

  const expenseCategories = [
    {
      name: "Продукты и быт",
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      plan: grocAllocated,
      spent: grocSpent,
      share: totalActualSpent > 0 ? Math.round((grocSpent / totalActualSpent) * 100) : 0,
      status: grocSpent <= grocAllocated ? "В норме" : "Превышение",
    },
    {
      name: "Хотелки (Тимур)",
      icon: Heart,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      plan: Math.round(wantsAllocated / 2),
      spent: timurWantsSpent,
      share: totalActualSpent > 0 ? Math.round((timurWantsSpent / totalActualSpent) * 100) : 0,
      status: "Личный фонд",
    },
    {
      name: "Хотелки (Лера)",
      icon: Heart,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      plan: Math.round(wantsAllocated / 2),
      spent: leraWantsSpent,
      share: totalActualSpent > 0 ? Math.round((leraWantsSpent / totalActualSpent) * 100) : 0,
      status: "Личный фонд",
    },
    {
      name: "Внеплановые траты",
      icon: AlertOctagon,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      plan: unplanAllocated,
      spent: unplanSpent,
      share: totalActualSpent > 0 ? Math.round((unplanSpent / totalActualSpent) * 100) : 0,
      status: unplanSpent <= unplanAllocated ? "В норме" : "Превышение",
    },
    {
      name: "Погашение кредитной карты",
      icon: CreditCard,
      color: "text-red-500",
      bg: "bg-red-500/10",
      plan: creditCardAmount,
      spent: creditCardAmount,
      share: totalActualSpent > 0 ? Math.round((creditCardAmount / totalActualSpent) * 100) : 0,
      status: creditCardAmount > 0 ? `Погашена ${calc.ccPhase === "advance" ? "1-го числа" : "15-го числа"}` : "Нет долга",
    },
    {
      name: "Обязательные счета (ЖКУ + Аренда)",
      icon: Home,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      plan: fixedSpent,
      spent: fixedSpent,
      share: totalActualSpent > 0 ? Math.round((fixedSpent / totalActualSpent) * 100) : 0,
      status: "Фиксировано",
    },
    {
      name: "Цели и сбережения",
      icon: Target,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      plan: goalsDeductions,
      spent: goalsDeductions,
      share: totalActualSpent > 0 ? Math.round((goalsDeductions / totalActualSpent) * 100) : 0,
      status: "Инвестиции",
    },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Key Summary Cards with Double-Bezel Architecture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Общий доход
                </CardTitle>
                <div className="size-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Wallet className="size-3.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={calc.totalInc} currency />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <span>Фаза 1: <strong className="text-foreground font-mono">{formatCurrency(calc.incAdv)}</strong></span>
                <span>·</span>
                <span>Фаза 2: <strong className="text-foreground font-mono">{formatCurrency(calc.incSal)}</strong></span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Free Pool */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Свободный фонд
                </CardTitle>
                <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <PieChart className="size-3.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                <AnimatedNumber value={calc.totalFree} currency />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                На жизнь после обязательных счетов и целей
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Total Actual Spent */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Всего списано (Факт)
                </CardTitle>
                <div className="size-7 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <ArrowDownRight className="size-3.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                <AnimatedNumber value={totalActualSpent} currency />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                <strong className="text-foreground">{calc.totalInc > 0 ? Math.round((totalActualSpent / calc.totalInc) * 100) : 0}%</strong> от суммарных доходов
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Goals Deposited */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Отложено в цели
                </CardTitle>
                <div className="size-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Target className="size-3.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={goalsDeductions} currency />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                <strong className="text-foreground">{(state.goals || []).length}</strong> активных накопительных целей
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Chart: Expense Breakdown */}
        <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/40 shadow-soft lg:col-span-1">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieChart className="size-4 text-primary" />
                Структура расходов
              </CardTitle>
              <CardDescription className="text-xs">
                Распределение фактических трат по типам в текущем месяце
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2">
              <div className="w-full max-w-[220px] aspect-square relative my-2">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    cutout: "70%",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Всего трат</span>
                  <span className="text-base font-black font-mono">
                    {totalActualSpent.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              {/* Legend list */}
              <div className="w-full space-y-2 mt-4 text-xs">
                {expenseCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: doughnutData.datasets[0].backgroundColor[idx],
                        }}
                      />
                      <span className="text-muted-foreground font-medium truncate max-w-[150px]">{cat.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground shrink-0">
                      {cat.spent.toLocaleString("ru-RU")} ₽ <span className="text-muted-foreground text-[10px]">({cat.share}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan vs Actual Bar Chart */}
        <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/40 shadow-soft lg:col-span-2">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                Сравнение: План vs Факт по категориям
              </CardTitle>
              <CardDescription className="text-xs">
                Выделенный лимит бюджета в сравнении с фактически совершенными списаниями
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                        labels: {
                          boxWidth: 12,
                          font: { size: 11, family: "Plus Jakarta Sans" },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (val) => `${Number(val) / 1000}k ₽`,
                          font: { size: 10, family: "JetBrains Mono" },
                        },
                      },
                      x: {
                        ticks: { font: { size: 11, family: "Plus Jakarta Sans" } },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Category Table */}
      <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Детализация расходов по типам</CardTitle>
            <CardDescription className="text-xs">
              Подробный сводный отчет использования бюджета за {selectedMonth}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <div className="divide-y min-w-[700px]">
                <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-4">Тип расхода</div>
                  <div className="col-span-2 text-right">План / Лимит</div>
                  <div className="col-span-2 text-right">Факт списаний</div>
                  <div className="col-span-2 text-right">Остаток / Разница</div>
                  <div className="col-span-2 text-center">Доля трат</div>
                </div>

                {expenseCategories.map((cat, idx) => {
                  const Icon = cat.icon
                  const diff = cat.plan - cat.spent
                  const isOver = diff < 0

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-3 items-center text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${cat.bg}`}>
                          <Icon className={`size-4 ${cat.color}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{cat.name}</div>
                          <div className="text-[11px] text-muted-foreground">{cat.status}</div>
                        </div>
                      </div>

                      <div className="col-span-2 text-right font-mono font-medium text-muted-foreground">
                        {cat.plan.toLocaleString("ru-RU")} ₽
                      </div>

                      <div className="col-span-2 text-right font-mono font-bold text-foreground">
                        {cat.spent.toLocaleString("ru-RU")} ₽
                      </div>

                      <div className="col-span-2 text-right font-mono font-bold">
                        <span className={isOver ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}>
                          {diff > 0 ? `+${diff.toLocaleString("ru-RU")}` : diff.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <div className="w-16">
                          <Progress value={cat.share} className="h-1.5 rounded-full" />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground w-8 text-right">
                          {cat.share}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-month Dynamics */}
      {history.length > 1 && (
        <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                Динамика доходов и расходов по месяцам
              </CardTitle>
              <CardDescription className="text-xs">
                История финансовых циклов и накоплений
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <Line
                  data={multiMonthData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                        labels: { boxWidth: 12, font: { size: 11, family: "Plus Jakarta Sans" } },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (val) => `${Number(val) / 1000}k ₽`,
                          font: { size: 10, family: "JetBrains Mono" },
                        },
                      },
                      x: {
                        ticks: { font: { size: 11, family: "Plus Jakarta Sans" } },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
