import type { MonthlyPlanState, MonthRecord, User } from "@/types/finance"

export const defaultGroceriesTemplate = [
  { id: "def_1", name: "Зал", amount: 6000, done: false, pinned: true },
  { id: "def_2", name: "Кофе", amount: 5000, done: false, pinned: true },
  { id: "def_3", name: "Корм Арии", amount: 3500, done: false, pinned: true },
  { id: "def_4", name: "Интернет", amount: 1150, done: false, pinned: true },
  { id: "def_5", name: "Телефон", amount: 1500, done: false, pinned: true },
  { id: "def_6", name: "Гемини", amount: 2000, done: false, pinned: true },
  { id: "def_7", name: "Бензин", amount: 6000, done: false, pinned: true },
  { id: "def_8", name: "Протеин и креатин", amount: 2500, done: false, pinned: true },
]

export const defaultState: MonthlyPlanState = {
  incomes: {
    tAdv: 62000,
    tSal: 48000,
    lAdv: 65000,
    lSal: 30000,
    extraAdv: 0,
    extraSal: 0,
  },
  fixed: {
    comm: 8000,
    rent: 32000,
  },
  creditCard: {
    amount: 0,
    phase: "salary",
    isPaid: false,
    paidDate: "",
  },
  goals: [
    { id: 1, name: "Кольцо", target: 250000, months: 12, saved: 0, isSecret: true },
    { id: 2, name: "Отпуск", target: 500000, months: 12, saved: 0, isSecret: false },
  ],
  distPct: {
    groc: 55,
    wants: 20,
    unplan: 10,
    save: 15,
  },
  groceries: [...defaultGroceriesTemplate],
  wants: [],
  unplanned: [],
  memos: "",
  groceryTags: ["ВкусВилл", "Супермаркет", "Аптека", "Мясо & Рыба", "Кофе & Завтраки", "Бытовая химия", "Корм Арии"],
  wantsTags: ["Одежда & Обувь", "Гаджеты", "Книги & Обучение", "Рестораны & Кафе", "Хобби", "Красота", "Подарки"],
}

export async function checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
  try {
    const res = await fetch("/api/auth/me")
    if (!res.ok) return { authenticated: false }
    return await res.json()
  } catch {
    return { authenticated: false }
  }
}

export async function fetchUsersList(): Promise<User[]> {
  try {
    const res = await fetch("/api/auth/users")
    if (!res.ok) return []
    const data = await res.json()
    return data.users || []
  } catch {
    return []
  }
}

export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || "Ошибка входа" }
    }
    return { success: true, user: data.user }
  } catch {
    return { success: false, error: "Ошибка подключения к серверу" }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch (err) {
    console.error("Logout error:", err)
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || "Ошибка изменения пароля" }
    }
    return { success: true }
  } catch {
    return { success: false, error: "Ошибка подключения" }
  }
}

export async function getPlan(month: string): Promise<{ state: MonthlyPlanState; updatedAt?: string; notFound?: boolean }> {
  try {
    const res = await fetch(`/api/plans/${month}`)
    if (res.status === 404) {
      return { state: defaultState, notFound: true }
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // Ensure all keys exist
    const merged: MonthlyPlanState = {
      ...defaultState,
      ...data.state,
      incomes: { ...defaultState.incomes, ...(data.state.incomes || {}) },
      fixed: { ...defaultState.fixed, ...(data.state.fixed || {}) },
      creditCard: { ...defaultState.creditCard, ...(data.state.creditCard || {}) },
      distPct: { ...defaultState.distPct, ...(data.state.distPct || {}) },
      goals: data.state.goals || defaultState.goals,
      groceries: data.state.groceries || defaultState.groceries,
      wants: data.state.wants || [],
      unplanned: data.state.unplanned || [],
    }
    return { state: merged, updatedAt: data.updatedAt }
  } catch (err) {
    console.error("Error loading plan:", err)
    return { state: defaultState, notFound: true }
  }
}

export async function savePlan(month: string, state: MonthlyPlanState): Promise<{ success: boolean; updatedAt?: string }> {
  try {
    const res = await fetch(`/api/plans/${month}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    })
    if (!res.ok) throw new Error("Failed to save")
    const data = await res.json()
    return { success: true, updatedAt: data.updatedAt }
  } catch (err) {
    console.error("Save plan error:", err)
    return { success: false }
  }
}

export async function getStats(): Promise<MonthRecord[]> {
  try {
    const res = await fetch("/api/stats")
    if (!res.ok) return []
    const data = await res.json()
    return data.history || []
  } catch {
    return []
  }
}
