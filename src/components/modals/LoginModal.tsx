import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Server, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { login, fetchUsersList, getApiBaseUrl, setApiBaseUrl, testServerConnection } from "@/lib/api"
import { AnimatedButton } from "@/components/corr/animated-buttons"
import type { User } from "@/types/finance"

interface LoginModalProps {
  open: boolean
  onSuccess: (user: User) => void
}

export function LoginModal({ open, onSuccess }: LoginModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsername, setSelectedUsername] = useState("timur")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Server URL settings for mobile app / remote VPS
  const [showServerConfig, setShowServerConfig] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState(() => getApiBaseUrl())
  const [serverTestStatus, setServerTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle")
  const [serverTestMessage, setServerTestMessage] = useState("")

  function loadUsers() {
    fetchUsersList().then((list) => {
      if (list.length > 0) {
        setUsers(list)
        setSelectedUsername(list[0].username)
      }
    })
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleTestServer() {
    setServerTestStatus("testing")
    setServerTestMessage("")
    const res = await testServerConnection(serverUrlInput)
    if (res.ok) {
      setServerTestStatus("ok")
      setServerTestMessage("Сервер доступен")
      setApiBaseUrl(serverUrlInput)
      loadUsers()
    } else {
      setServerTestStatus("fail")
      setServerTestMessage(res.message || "Ошибка подключения")
    }
  }

  async function handleLogin() {
    setError("")
    if (!password) {
      setError("Введите пароль")
      return
    }
    const res = await login(selectedUsername, password)
    if (res.success && res.user) {
      setPassword("")
      onSuccess(res.user)
    } else {
      setError(res.error || "Неверный пароль")
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit mb-2">
            <Lock className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Финансовая Архитектура Семьи
          </DialogTitle>
          <DialogDescription className="text-xs">
            Авторизация для Тимура и Леры
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User selector chips */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Выберите пользователя
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(users.length > 0
                ? users
                : [
                    { id: 1, username: "timur", name: "Тимур" },
                    { id: 2, username: "lera", name: "Лера" },
                  ]
              ).map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => setSelectedUsername(u.username)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-sm font-medium transition-all ${
                    selectedUsername === u.username
                      ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedUsername === u.username
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {u.name.slice(0, 1)}
                  </div>
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Пароль</Label>
            <Input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="text-base"
            />
          </div>

          {error && <div className="text-xs text-destructive font-medium">{error}</div>}

          <AnimatedButton
            label="Войти в систему"
            loadingLabel="Авторизация..."
            successLabel="Успешно!"
            onAction={handleLogin}
            className="w-full text-sm font-semibold h-10 mt-2"
          />

          {/* Server Config Collapsible for Mobile App */}
          <div className="pt-2 border-t text-xs">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground py-1 text-[11px]"
            >
              <span className="flex items-center gap-1.5">
                <Server className="size-3.5" />
                Настройки сервера (для мобильного приложения)
              </span>
              {showServerConfig ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {showServerConfig && (
              <div className="mt-2 space-y-2 p-3 bg-muted/40 rounded-lg border border-border/60">
                <Label className="text-[11px] text-muted-foreground">
                  URL сервера (например http://192.168.1.50:3000 или https://fin.domain.com)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Оставьте пустым для авто"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleTestServer}
                    disabled={serverTestStatus === "testing"}
                    className="h-8 text-xs"
                  >
                    {serverTestStatus === "testing" ? "..." : "Проверить"}
                  </Button>
                </div>
                {serverTestStatus === "ok" && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    {serverTestMessage}
                  </div>
                )}
                {serverTestStatus === "fail" && (
                  <div className="flex items-center gap-1 text-[11px] text-destructive">
                    <AlertCircle className="size-3" />
                    {serverTestMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-center text-muted-foreground">
            По умолчанию: <code className="bg-muted px-1 rounded">timur</code> /{" "}
            <code className="bg-muted px-1 rounded">lera</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
