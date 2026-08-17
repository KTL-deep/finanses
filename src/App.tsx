import React, { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  KeyRound,
  Settings,
  LogOut,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { DashboardView } from "@/components/views/DashboardView"
import { GroceriesView } from "@/components/views/GroceriesView"
import { WantsView } from "@/components/views/WantsView"
import { UnplannedView } from "@/components/views/UnplannedView"
import { StatsView } from "@/components/views/StatsView"

import { EditPlanModal } from "@/components/modals/EditPlanModal"
import { CreditCardModal } from "@/components/modals/CreditCardModal"
import { TBankImportModal } from "@/components/modals/TBankImportModal"
import { StatsModal } from "@/components/modals/StatsModal"
import { UserProfileModal } from "@/components/modals/UserProfileModal"
import { MemoModal } from "@/components/modals/MemoModal"
import { LoginModal } from "@/components/modals/LoginModal"
import { RollOverModal } from "@/components/modals/RollOverModal"
import { DepositGoalModal } from "@/components/modals/DepositGoalModal"

import { checkAuth, getPlan, savePlan, logout, defaultState } from "@/lib/api"
import { calculateFinance } from "@/lib/calculations"
import type { MonthlyPlanState, User, GoalItem } from "@/types/finance"

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Current month (YYYY-MM)
  const today = new Date()
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)

  // Financial plan state
  const [planState, setPlanState] = useState<MonthlyPlanState>(defaultState)
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced")

  // Active tab
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    )
  })

  // Modals
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [creditCardOpen, setCreditCardOpen] = useState(false)
  const [tbankImportOpen, setTbankImportOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [memoOpen, setMemoOpen] = useState(false)
  const [rollOverOpen, setRollOverOpen] = useState(false)
  const [depositGoal, setDepositGoal] = useState<GoalItem | null>(null)

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDarkMode])

  // Initial Auth Check
  useEffect(() => {
    checkAuth().then((res) => {
      if (res.authenticated && res.user) {
        setCurrentUser(res.user)
      }
      setAuthChecked(true)
    })
  }, [])

  // Load monthly plan
  const loadMonthData = useCallback(async (month: string) => {
    setSyncStatus("saving")
    const { state } = await getPlan(month)
    setPlanState(state)
    setSyncStatus("synced")
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadMonthData(selectedMonth)
    }
  }, [currentUser, selectedMonth, loadMonthData])

  // Save changes
  async function handleStateUpdate(newState: MonthlyPlanState) {
    setPlanState(newState)
    setSyncStatus("saving")
    const res = await savePlan(selectedMonth, newState)
    if (res.success) {
      setSyncStatus("synced")
    } else {
      setSyncStatus("error")
    }
  }

  // Handle Roll-over execution
  async function handleApplyRollOver(
    updatedCurrentMonthState: MonthlyPlanState,
    nextMonthData?: { month: string; amount: number; phase: "adv" | "sal" }
  ) {
    await handleStateUpdate(updatedCurrentMonthState)

    if (nextMonthData && nextMonthData.amount > 0) {
      const { state: nextState } = await getPlan(nextMonthData.month)
      const existingIncomes = nextState.incomes || { tAdv: 62000, tSal: 48000, lAdv: 65000, lSal: 30000 }
      
      const newNextState: MonthlyPlanState = {
        ...nextState,
        incomes: {
          ...existingIncomes,
          extraAdv:
            nextMonthData.phase === "adv"
              ? (existingIncomes.extraAdv || 0) + nextMonthData.amount
              : (existingIncomes.extraAdv || 0),
          extraSal:
            nextMonthData.phase === "sal"
              ? (existingIncomes.extraSal || 0) + nextMonthData.amount
              : (existingIncomes.extraSal || 0),
        },
        goals: updatedCurrentMonthState.goals || nextState.goals,
      }
      await savePlan(nextMonthData.month, newNextState)
    }
  }

  // Handle Quick Goal Deposit
  async function handleDepositGoal(goalId: string | number, amount: number) {
    const updatedGoals = (planState.goals || []).map((g) => {
      if (String(g.id) === String(goalId)) {
        return {
          ...g,
          saved: (g.saved || 0) + amount,
        }
      }
      return g
    })
    await handleStateUpdate({ ...planState, goals: updatedGoals })
  }

  // Month navigation
  function handlePrevMonth() {
    const [y, m] = selectedMonth.split("-").map(Number)
    const prev = new Date(y, m - 2, 1)
    const nextKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
    setSelectedMonth(nextKey)
  }

  function handleNextMonth() {
    const [y, m] = selectedMonth.split("-").map(Number)
    const next = new Date(y, m, 1)
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
    setSelectedMonth(nextKey)
  }

  function formatMonthTitle(monthStr: string) {
    const [y, m] = monthStr.split("-").map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
  }

  const calc = calculateFinance(planState)

  if (!authChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="size-5 animate-spin text-primary" />
          Загрузка финансовой системы...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-8 max-w-7xl mx-auto justify-between gap-2">
          {/* Left: Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="size-7 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs shrink-0">
              TL
            </div>
            <span className="font-semibold text-xs sm:text-sm tracking-tight hidden md:inline">
              Финансовая Архитектура
            </span>

            {/* Sync status */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`size-2 rounded-full ${
                  syncStatus === "synced"
                    ? "bg-emerald-500"
                    : syncStatus === "saving"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-destructive"
                }`}
              />
              <span className="text-[11px]">
                {syncStatus === "synced" ? "Синхронизировано" : "Сохранение..."}
              </span>
            </div>
          </div>

          {/* Center: Month Selector */}
          <div className="flex items-center gap-0.5 sm:gap-1 border rounded-md px-1 py-0.5 bg-background shadow-xs shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevMonth}
              className="h-7 w-7"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="font-semibold text-[11px] sm:text-xs px-1 sm:px-2 text-center min-w-24 sm:min-w-28 uppercase tracking-wide">
              {formatMonthTitle(selectedMonth)}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextMonth}
              className="h-7 w-7"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {/* Right: Theme Toggle & User Nav */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-8 w-8"
              title="Переключить тему"
            >
              {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="font-semibold text-xs bg-muted">
                        {currentUser.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        @{currentUser.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Сменить пароль</span>
                  </DropdownMenuItem>
                  {currentUser.username.toLowerCase() === "timur" && (
                    <DropdownMenuItem onClick={() => setEditPlanOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Настройки плана</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout()
                      setCurrentUser(null)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with shadcn/ui Tabs */}
      <div className="flex-1 space-y-4 p-3 sm:p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/70 p-1 w-full max-w-full overflow-x-auto justify-start flex-nowrap scrollbar-none gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm shrink-0">
              Обзор
            </TabsTrigger>
            <TabsTrigger value="groceries" className="text-xs sm:text-sm shrink-0">
              Продукты ({calc.pG}%)
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                {(planState.groceries || []).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="wants" className="text-xs sm:text-sm shrink-0">
              Хотелки ({calc.pW}%)
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                {(planState.wants || []).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unplanned" className="text-xs sm:text-sm shrink-0">
              Внеплановые ({calc.pU}%)
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                {(planState.unplanned || []).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm shrink-0">
              Статистика
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <DashboardView
              state={planState}
              selectedMonth={selectedMonth}
              currentUser={currentUser}
              onUpdateState={handleStateUpdate}
              onOpenEditModal={() => setEditPlanOpen(true)}
              onOpenCreditModal={() => setCreditCardOpen(true)}
              onOpenStatsModal={() => setStatsOpen(true)}
              onOpenTBankModal={() => setTbankImportOpen(true)}
              onOpenMemoModal={() => setMemoOpen(true)}
              onOpenRollOverModal={() => setRollOverOpen(true)}
              onOpenDepositGoalModal={(g) => setDepositGoal(g)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </TabsContent>

          {/* Groceries Tab */}
          <TabsContent value="groceries" className="space-y-4">
            <GroceriesView state={planState} onUpdateState={handleStateUpdate} />
          </TabsContent>

          {/* Wants Tab */}
          <TabsContent value="wants" className="space-y-4">
            <WantsView
              state={planState}
              currentUser={currentUser}
              onUpdateState={handleStateUpdate}
            />
          </TabsContent>

          {/* Unplanned Tab */}
          <TabsContent value="unplanned" className="space-y-4">
            <UnplannedView state={planState} onUpdateState={handleStateUpdate} />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <StatsView state={planState} selectedMonth={selectedMonth} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 md:px-8 max-w-7xl mx-auto w-full text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
        <p>Тимур & Лера · Семейная Финансовая Архитектура</p>
        <p className="text-[11px]">Двухфазный денежный поток · SQLite Data Engine</p>
      </footer>

      {/* Modals */}
      <EditPlanModal
        open={editPlanOpen}
        onOpenChange={setEditPlanOpen}
        state={planState}
        onSave={handleStateUpdate}
      />

      <CreditCardModal
        open={creditCardOpen}
        onOpenChange={setCreditCardOpen}
        state={planState}
        onSave={handleStateUpdate}
      />

      <TBankImportModal
        open={tbankImportOpen}
        onOpenChange={setTbankImportOpen}
        state={planState}
        onImport={handleStateUpdate}
      />

      <StatsModal open={statsOpen} onOpenChange={setStatsOpen} />

      <UserProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      <MemoModal
        open={memoOpen}
        onOpenChange={setMemoOpen}
        state={planState}
        onSave={handleStateUpdate}
      />

      <RollOverModal
        open={rollOverOpen}
        onOpenChange={setRollOverOpen}
        currentMonth={selectedMonth}
        state={planState}
        onApply={handleApplyRollOver}
      />

      <DepositGoalModal
        open={Boolean(depositGoal)}
        onOpenChange={(open) => !open && setDepositGoal(null)}
        goal={depositGoal}
        selectedMonth={selectedMonth}
        onDeposit={handleDepositGoal}
      />

      {/* Login Modal */}
      <LoginModal
        open={!currentUser}
        onSuccess={(user) => {
          setCurrentUser(user)
          loadMonthData(selectedMonth)
        }}
      />
    </div>
  )
}
