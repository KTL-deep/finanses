import type { MonthlyPlanState, GoalItem } from "@/types/finance"

export function calcGoalsRatio(
  incAdv: number,
  comm: number,
  incSal: number,
  rent: number
) {
  const netAdv = Math.max(0, incAdv - comm)
  const netSal = Math.max(0, incSal - rent)
  const totalNet = netAdv + netSal

  if (totalNet > 0) {
    return {
      rAdv: netAdv / totalNet,
      rSal: netSal / totalNet,
    }
  }
  return { rAdv: 0.5, rSal: 0.5 }
}

export function calculateFinance(state: MonthlyPlanState) {
  const incAdv =
    (state.incomes?.tAdv || 0) +
    (state.incomes?.lAdv || 0) +
    (state.incomes?.extraAdv || 0)
  const incSal =
    (state.incomes?.tSal || 0) +
    (state.incomes?.lSal || 0) +
    (state.incomes?.extraSal || 0)
  const totalInc = incAdv + incSal

  // Fixed Mandatory Bills
  const comm = state.fixed?.comm || 0
  const rent = state.fixed?.rent || 0

  // Credit Card
  const cc = state.creditCard || {
    amount: 0,
    phase: "salary",
    isPaid: false,
  }
  const ccAmount = typeof cc.amount === "number" && cc.amount > 0 ? cc.amount : 0
  const ccPhase = cc.phase || "salary"
  const ccIsPaid = Boolean(cc.isPaid)

  const ccAdv = ccPhase === "advance" && ccAmount > 0 ? ccAmount : 0
  const ccSal = ccPhase === "salary" && ccAmount > 0 ? ccAmount : 0

  // Dynamic Ratio based on Net Cash Flows
  const { rAdv, rSal } = calcGoalsRatio(
    incAdv,
    comm + ccAdv,
    incSal,
    rent + ccSal
  )

  // Goals Calculation (sum monthly deductions for all goals)
  const goals = state.goals || []
  let totalMonthlyGoals = 0

  goals.forEach((g) => {
    const months = g.months && g.months > 0 ? g.months : 12
    const monthly = Math.round(g.target / months)
    totalMonthlyGoals += monthly
  })

  // Proportional Split of Goals between Phase 1 (Advance) and Phase 2 (Salary)
  const goalsAdvTotal = Math.round(totalMonthlyGoals * rAdv)
  const goalsSalTotal = totalMonthlyGoals - goalsAdvTotal

  // Phase 1 (Advance) Deductions & Free Cash Flow
  const phase1Deductions = comm + ccAdv + goalsAdvTotal
  const phase1Free = Math.max(0, incAdv - phase1Deductions)

  // Phase 2 (Salary) Deductions & Free Cash Flow
  const phase2Deductions = rent + ccSal + goalsSalTotal
  const phase2Free = Math.max(0, incSal - phase2Deductions)

  // Total Month Overview
  const totalFixedAndGoals =
    comm + rent + ccAdv + ccSal + totalMonthlyGoals
  const totalFree = phase1Free + phase2Free

  // Category Distribution Percentages
  const pG = state.distPct?.groc ?? 55
  const pW = state.distPct?.wants ?? 20
  const pU = state.distPct?.unplan ?? 10
  const pS = state.distPct?.save ?? 15
  const totalPct = pG + pW + pU + pS

  // Category Split by Phase
  const grocAdv = Math.round(phase1Free * (pG / 100))
  const wantsAdv = Math.round(phase1Free * (pW / 100))
  const unplanAdv = Math.round(phase1Free * (pU / 100))
  const saveAdv = Math.round(phase1Free * (pS / 100))

  const grocSal = Math.round(phase2Free * (pG / 100))
  const wantsSal = Math.round(phase2Free * (pW / 100))
  const unplanSal = Math.round(phase2Free * (pU / 100))
  const saveSal = Math.round(phase2Free * (pS / 100))

  // Total Category Budgets
  const allocatedGroc = grocAdv + grocSal
  const allocatedWants = wantsAdv + wantsSal
  const allocatedUnplan = unplanAdv + unplanSal
  const allocatedSave = saveAdv + saveSal

  // Actual Spends (only items where done === true are counted as completed/spent)
  const spentGroc = (state.groceries || [])
    .filter((i) => Boolean(i.done))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)

  const spentWants = (state.wants || [])
    .filter((i) => Boolean(i.done))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)

  const spentUnplan = (state.unplanned || [])
    .filter((i) => Boolean(i.done))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)

  const remGroc = allocatedGroc - spentGroc
  const remWants = allocatedWants - spentWants
  const remUnplan = allocatedUnplan - spentUnplan

  return {
    incAdv,
    incSal,
    totalInc,
    comm,
    rent,
    ccAmount,
    ccPhase,
    ccIsPaid,
    ccAdv,
    ccSal,
    rAdv,
    rSal,
    totalMonthlyGoals,
    goalsAdvTotal,
    goalsSalTotal,
    phase1Deductions,
    phase1Free,
    phase2Deductions,
    phase2Free,
    totalFixedAndGoals,
    totalFree,
    pG,
    pW,
    pU,
    pS,
    totalPct,
    grocAdv,
    grocSal,
    allocatedGroc,
    wantsAdv,
    wantsSal,
    allocatedWants,
    unplanAdv,
    unplanSal,
    allocatedUnplan,
    saveAdv,
    saveSal,
    allocatedSave,
    spentGroc,
    remGroc,
    spentWants,
    remWants,
    spentUnplan,
    remUnplan,
  }
}
