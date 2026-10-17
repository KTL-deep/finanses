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
  LayoutDashboard,
  ShoppingCart,
  Heart,
  AlertOctagon,
  BarChart3,
  Sparkles,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

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
        groceryTags: updatedCurrentMonthState.groceryTags || nextState.groceryTags,
        wantsTags: updatedCurrentMonthState.wantsTags || nextState.wantsTags,
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
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 glass-nav border-b border-border/70 safe-top transition-colors">
        <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 md:px-8 max-w-7xl mx-auto justify-between gap-2">
          {/* Left: Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="size-8 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xs tracking-tight shadow-soft shrink-0">
              TL
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm tracking-tight leading-tight flex items-center gap-1.5">
                Финансовая Архитектура
                <span className="hidden xl:inline-block size-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline leading-none font-medium">
                Тимур & Лера
              </span>
            </div>

            {/* Sync status */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
              <span
                className={cn(
                  "size-2 rounded-full",
                  syncStatus === "synced"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : syncStatus === "saving"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-destructive"
                )}
              />
              <span className="text-[10.5px] font-medium">
                {syncStatus === "synced" ? "Синхронизировано" : syncStatus === "saving" ? "Сохранение..." : "Ошибка связи"}
              </span>
            </div>
          </div>

          {/* Center: Month Selector with Double-Bezel touch */}
          <div className="flex items-center gap-1 border border-border/80 rounded-full px-1 py-0.5 bg-card/80 shadow-xs shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="font-semibold text-[11px] sm:text-xs px-2 text-center min-w-24 sm:min-w-28 uppercase tracking-wider font-mono">
              {formatMonthTitle(selectedMonth)}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {/* Right: Theme Toggle & User Nav */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-8.5 w-8.5 rounded-xl border border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
              title="Переключить тему"
              aria-label="Переключить тему"
            >
              {isDarkMode ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </Button>

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8.5 w-8.5 rounded-full p-0">
                    <Avatar className="h-8.5 w-8.5 border border-border/80 shadow-xs">
                      <AvatarFallback className="font-bold text-xs bg-muted text-foreground">
                        {currentUser.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl glass-card p-1.5 shadow-glass">
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        @{currentUser.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)} className="rounded-lg cursor-pointer">
                    <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Сменить пароль</span>
                  </DropdownMenuItem>
                  {currentUser.username.toLowerCase() === "timur" && (
                    <DropdownMenuItem onClick={() => setEditPlanOpen(true)} className="rounded-lg cursor-pointer">
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Настройки плана</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout()
                      setCurrentUser(null)
                    }}
                    className="text-destructive focus:text-destructive rounded-lg cursor-pointer"
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

      {/* Main Container */}
      <main className="flex-1 space-y-6 p-3.5 sm:p-5 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center justify-between">
            <TabsList className="bg-muted/50 border border-border/60 p-1.5 rounded-2xl flex items-center gap-1 shadow-xs">
              <TabsTrigger
                value="overview"
                className="rounded-xl text-xs sm:text-sm px-3.5 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft font-medium flex items-center gap-2 transition-all"
              >
                <LayoutDashboard className="size-4" />
                Обзор
              </TabsTrigger>
              <TabsTrigger
                value="groceries"
                className="rounded-xl text-xs sm:text-sm px-3.5 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft font-medium flex items-center gap-2 transition-all"
              >
                <ShoppingCart className="size-4" />
                Продукты ({calc.pG}%)
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono rounded-md">
                  {(planState.groceries || []).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="wants"
                className="rounded-xl text-xs sm:text-sm px-3.5 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft font-medium flex items-center gap-2 transition-all"
              >
                <Heart className="size-4" />
                Хотелки ({calc.pW}%)
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono rounded-md">
                  {(planState.wants || []).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="unplanned"
                className="rounded-xl text-xs sm:text-sm px-3.5 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft font-medium flex items-center gap-2 transition-all"
              >
                <AlertOctagon className="size-4" />
                Внеплановые ({calc.pU}%)
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono rounded-md">
                  {(planState.unplanned || []).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="rounded-xl text-xs sm:text-sm px-3.5 py-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft font-medium flex items-center gap-2 transition-all"
              >
                <BarChart3 className="size-4" />
                Статистика
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Fluid Tab Views with Motion */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <TabsContent key="overview" value="overview" className="mt-0 focus-visible:outline-none" forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <DashboardView
                    state={planState}
                    selectedMonth={selectedMonth}
                    currentUser={currentUser}
                    onUpdateState={handleStateUpdate}
                    onOpenEditModal={() => setEditPlanOpen(true)}
                    onOpenStatsModal={() => setStatsOpen(true)}
                    onOpenTBankModal={() => setTbankImportOpen(true)}
                    onOpenMemoModal={() => setMemoOpen(true)}
                    onOpenRollOverModal={() => setRollOverOpen(true)}
                    onOpenDepositGoalModal={(g) => setDepositGoal(g)}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "groceries" && (
              <TabsContent key="groceries" value="groceries" className="mt-0 focus-visible:outline-none" forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <GroceriesView state={planState} onUpdateState={handleStateUpdate} />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "wants" && (
              <TabsContent key="wants" value="wants" className="mt-0 focus-visible:outline-none" forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <WantsView
                    state={planState}
                    currentUser={currentUser}
                    onUpdateState={handleStateUpdate}
                  />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "unplanned" && (
              <TabsContent key="unplanned" value="unplanned" className="mt-0 focus-visible:outline-none" forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <UnplannedView state={planState} onUpdateState={handleStateUpdate} />
                </motion.div>
              </TabsContent>
            )}

            {activeTab === "stats" && (
              <TabsContent key="stats" value="stats" className="mt-0 focus-visible:outline-none" forceMount>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                >
                  <StatsView state={planState} selectedMonth={selectedMonth} />
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Mobile Native Bottom Navigation Dock */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-border/70 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-2 px-3 shadow-glass">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {[
            { id: "overview", label: "Обзор", icon: LayoutDashboard },
            { id: "groceries", label: "Еда", icon: ShoppingCart, count: (planState.groceries || []).length },
            { id: "wants", label: "Хотелки", icon: Heart, count: (planState.wants || []).length },
            { id: "unplanned", label: "Внеплан", icon: AlertOctagon, count: (planState.unplanned || []).length },
            { id: "stats", label: "Статы", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 relative",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active-pill"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <div className="relative">
                  <Icon className={cn("size-5 transition-transform", isActive && "scale-110")} />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-mono font-bold flex items-center justify-center leading-none shadow-xs">
                      {tab.count}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] mt-1 tracking-tight leading-none z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="hidden md:block border-t border-border/60 py-6 md:px-8 max-w-7xl mx-auto w-full text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <p className="font-medium">Тимур & Лера · Семейная Финансовая Архитектура</p>
          <p className="text-[11px] font-mono">Двухфазный денежный поток · SQLite Data Engine</p>
        </div>
      </footer>

      {/* Modals */}
      <EditPlanModal
        open={editPlanOpen}
        onOpenChange={setEditPlanOpen}
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
