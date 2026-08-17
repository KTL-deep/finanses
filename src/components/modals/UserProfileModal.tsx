import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, KeyRound, LogOut, ShieldCheck, Server, CheckCircle2, AlertCircle } from "lucide-react"
import { changePassword, logout, getApiBaseUrl, setApiBaseUrl, testServerConnection } from "@/lib/api"
import { AnimatedButton } from "@/components/corr/animated-buttons"
import type { User as UserType } from "@/types/finance"

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType | null
  onLogout: () => void
}

export function UserProfileModal({
  open,
  onOpenChange,
  user,
  onLogout,
}: UserProfileModalProps) {
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Server URL
  const [serverUrl, setServerUrl] = useState(() => getApiBaseUrl())
  const [serverStatus, setServerStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle")
  const [serverMsg, setServerMsg] = useState("")

  async function handleTestServer() {
    setServerStatus("testing")
    setServerMsg("")
    const res = await testServerConnection(serverUrl)
    if (res.ok) {
      setServerStatus("ok")
      setServerMsg("Сервер доступен")
      setApiBaseUrl(serverUrl)
    } else {
      setServerStatus("fail")
      setServerMsg(res.message || "Ошибка подключения")
    }
  }

  async function handleChangePassword() {
    setError("")
    setMessage("")
    if (!currentPass || !newPass) {
      setError("Заполните оба поля пароля")
      return
    }
    const res = await changePassword(currentPass, newPass)
    if (res.success) {
      setMessage("Пароль успешно обновлен!")
      setCurrentPass("")
      setNewPass("")
    } else {
      setError(res.error || "Не удалось изменить пароль")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-primary" />
            Профиль пользователя
          </DialogTitle>
          <DialogDescription>
            Вы вошли как <span className="font-semibold text-foreground">{user?.name || user?.username}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Security details */}
          <div className="p-3 rounded-lg border bg-muted/20 flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="size-4" />
            </div>
            <div className="text-xs">
              <div className="font-semibold">Безопасная сессия</div>
              <div className="text-muted-foreground">Шифрование паролей PBKDF2-SHA512 + Salt</div>
            </div>
          </div>

          {/* Server URL for Mobile App */}
          <div className="space-y-2 p-3 rounded-xl border bg-card text-xs">
            <div className="font-semibold uppercase text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <Server className="size-3.5" /> Подключение к серверу
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Авто (по умолчанию)"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleTestServer}
                disabled={serverStatus === "testing"}
                className="h-8 text-xs shrink-0"
              >
                {serverStatus === "testing" ? "..." : "Проверить"}
              </Button>
            </div>
            {serverStatus === "ok" && (
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                {serverMsg}
              </div>
            )}
            {serverStatus === "fail" && (
              <div className="flex items-center gap-1 text-[11px] text-destructive">
                <AlertCircle className="size-3" />
                {serverMsg}
              </div>
            )}
          </div>

          {/* Change password form */}
          <div className="space-y-3 p-4 rounded-xl border bg-card">
            <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="size-3.5" /> Смена пароля
            </div>
            {error && <div className="text-xs text-destructive font-medium">{error}</div>}
            {message && <div className="text-xs text-emerald-600 font-medium">{message}</div>}

            <div className="space-y-1">
              <Label className="text-xs">Текущий пароль</Label>
              <Input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Новый пароль</Label>
              <Input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            <AnimatedButton
              label="Обновить пароль"
              loadingLabel="Сохранение..."
              successLabel="Обновлено!"
              onAction={handleChangePassword}
              className="w-full text-xs"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await logout()
              onLogout()
              onOpenChange(false)
            }}
            className="text-xs gap-1.5"
          >
            <LogOut className="size-3.5" />
            Выйти из аккаунта
          </Button>

          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
