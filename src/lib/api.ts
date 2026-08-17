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

// Server URL configuration for mobile and web
export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem("finance_api_url")
  if (customUrl) return customUrl.trim().replace(/\/+$/, "")
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).trim().replace(/\/+$/, "")
  }
  return ""
}

export function setApiBaseUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, "")
  if (clean) {
    localStorage.setItem("finance_api_url", clean)
  } else {
    localStorage.removeItem("finance_api_url")
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("finance_auth_token")
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem("finance_auth_token", token)
  } else {
    localStorage.removeItem("finance_auth_token")
  }
}

// Generic API fetch wrapper with token and baseURL injection
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getApiBaseUrl()
  const fullUrl = base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : path
  
  const headers = new Headers(init?.headers)
  const token = getAuthToken()
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(fullUrl, {
    ...init,
    headers,
    credentials: "include",
  })
}

export async function testServerConnection(url?: string): Promise<{ ok: boolean; status?: string; message?: string }> {
  try {
    const base = (url !== undefined ? url : getApiBaseUrl()).trim().replace(/\/+$/, "")
    const fullUrl = base ? `${base}/api/health` : "/api/health"
    const res = await fetch(fullUrl, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      return { ok: true, status: data.status || "ok" }
    }
    return { ok: false, message: `HTTP ${res.status}` }
  } catch (err: any) {
    return { ok: false, message: err.message || "Ошибка подключения" }
  }
}

export async function checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
  try {
    const res = await apiFetch("/api/auth/me")
    if (!res.ok) return { authenticated: false }
    return await res.json()
  } catch {
    return { authenticated: false }
  }
}

export async function fetchUsersList(): Promise<User[]> {
  try {
    const res = await apiFetch("/api/auth/users")
    if (!res.ok) return []
    const data = await res.json()
    return data.users || []
  } catch {
    return []
  }
}

export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || "Ошибка входа" }
    }
    if (data.token) {
      setAuthToken(data.token)
    }
    return { success: true, user: data.user }
  } catch {
    return { success: false, error: "Ошибка подключения к серверу" }
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" })
  } catch (err) {
    console.error("Logout error:", err)
  } finally {
    setAuthToken(null)
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch("/api/auth/change-password", {
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
    const res = await apiFetch(`/api/plans/${month}`)
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
    const res = await apiFetch(`/api/plans/${month}`, {
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
    const res = await apiFetch("/api/stats")
    if (!res.ok) return []
    const data = await res.json()
    return data.history || []
  } catch {
    return []
  }
}
