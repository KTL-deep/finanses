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
import { Lock, UserCheck, Shield } from "lucide-react"
import { login, fetchUsersList } from "@/lib/api"
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

  useEffect(() => {
    fetchUsersList().then((list) => {
      if (list.length > 0) {
        setUsers(list)
        setSelectedUsername(list[0].username)
      }
    })
  }, [])

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
      <DialogContent className="sm:max-w-md [&>button]:hidden">
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

          <div className="text-[11px] text-center text-muted-foreground pt-1">
            По умолчанию для тестов: <code className="bg-muted px-1 rounded">timur</code> /{" "}
            <code className="bg-muted px-1 rounded">lera</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
