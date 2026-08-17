export interface User {
  id: number
  username: string
  name: string
}

export interface IncomesState {
  tAdv: number
  tSal: number
  lAdv: number
  lSal: number
  extraAdv?: number
  extraSal?: number
}

export interface FixedExpensesState {
  comm: number
  rent: number
}

export interface CreditCardState {
  amount: number
  phase: "advance" | "salary"
  isPaid: boolean
  paidDate?: string
}

export interface GoalItem {
  id: string | number
  name: string
  target: number
  months: number
  saved: number
  isSecret?: boolean
}

export interface DistributionPercentages {
  groc: number // e.g. 55%
  wants: number // e.g. 20%
  unplan: number // e.g. 10%
  save: number // e.g. 15%
}

export interface GroceryItem {
  id: string | number
  name: string
  amount: number
  done: boolean
  pinned?: boolean
  date?: string
}

export interface WantItem {
  id: string | number
  name: string
  amount: number
  done: boolean
  author?: "timur" | "lera" | string
  category?: string
  date?: string
}

export interface UnplannedItem {
  id: string | number
  name: string
  amount: number
  reason?: string
  date?: string
  done?: boolean
}

export interface MonthlyPlanState {
  incomes: IncomesState
  fixed: FixedExpensesState
  creditCard: CreditCardState
  goals: GoalItem[]
  distPct: DistributionPercentages
  groceries: GroceryItem[]
  wants: WantItem[]
  unplanned: UnplannedItem[]
  memos?: string
  groceryTags?: string[]
  wantsTags?: string[]
}

export interface MonthRecord {
  month: string
  state: MonthlyPlanState
  updatedAt: string
}
