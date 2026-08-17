import React, { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, CheckCircle2 } from "lucide-react"
import { AnimatedButton } from "@/components/corr/animated-buttons"
import type { MonthlyPlanState } from "@/types/finance"

interface CreditCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: MonthlyPlanState
  onSave: (newState: MonthlyPlanState) => Promise<void>
}

export function CreditCardModal({
  open,
  onOpenChange,
  state,
  onSave,
}: CreditCardModalProps) {
  const [amount, setAmount] = useState(state.creditCard?.amount || 0)
  const [phase, setPhase] = useState<"advance" | "salary">(
    state.creditCard?.phase || "salary"
  )
  const [isPaid, setIsPaid] = useState(Boolean(state.creditCard?.isPaid))

  useEffect(() => {
    setAmount(state.creditCard?.amount || 0)
    setPhase(state.creditCard?.phase || "salary")
    setIsPaid(Boolean(state.creditCard?.isPaid))
  }, [state, open])

  async function handleQuickPayoff() {
    const updated: MonthlyPlanState = {
      ...state,
      creditCard: {
        ...state.creditCard,
        amount,
        phase,
        isPaid: true,
        paidDate: new Date().toLocaleDateString("ru-RU"),
      },
    }
    await onSave(updated)
    onOpenChange(false)
  }

  async function handleSaveAmount() {
    const updated: MonthlyPlanState = {
      ...state,
      creditCard: {
        ...state.creditCard,
        amount,
        phase,
        isPaid,
        paidDate: isPaid ? (state.creditCard?.paidDate || new Date().toLocaleDateString("ru-RU")) : "",
      },
    }
    await onSave(updated)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="size-5 text-primary" />
            Управление кредитной картой
          </DialogTitle>
          <DialogDescription>
            Зафиксируйте задолженность, фазу списания и статус погашения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Сумма задолженности к списанию (₽)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="text-lg font-mono font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Списывать в первую очередь из:</Label>
              <Select value={phase} onValueChange={(val: "advance" | "salary") => setPhase(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Фаза 1: Аванс (1-е число)</SelectItem>
                  <SelectItem value="salary">Фаза 2: Зарплата (15-е число)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="is-paid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(Boolean(checked))}
              />
              <label
                htmlFor="is-paid"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Отметить как полностью погашенную в этом месяце
              </label>
            </div>
          </div>

          {amount > 0 && !isPaid && (
            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Долг уже закрыт?</span>
              </div>
              <AnimatedButton
                label="Погасить сейчас"
                loadingLabel="Погашение..."
                successLabel="Погашено!"
                onAction={handleQuickPayoff}
                className="text-xs h-7 min-w-28 bg-emerald-600 hover:bg-emerald-700 text-white"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <AnimatedButton
            label="Сохранить"
            loadingLabel="Сохранение..."
            successLabel="Готово"
            onAction={handleSaveAmount}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
