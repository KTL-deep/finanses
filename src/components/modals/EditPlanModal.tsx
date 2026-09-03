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
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Eye, EyeOff, AlertCircle, ShoppingCart, Heart, AlertOctagon, PiggyBank, CreditCard } from "lucide-react"
import { AnimatedButtons } from "@/components/corr/animated-buttons"
import { calculateFinance } from "@/lib/calculations"
import type { MonthlyPlanState, GoalItem } from "@/types/finance"

interface EditPlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: MonthlyPlanState
  onSave: (newState: MonthlyPlanState) => Promise<void>
}

export function EditPlanModal({
  open,
  onOpenChange,
  state,
  onSave,
}: EditPlanModalProps) {
  const [form, setForm] = useState<MonthlyPlanState>(state)

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(state)))
  }, [state, open])

  const tempCalc = calculateFinance(form)

  const totalDist =
    (form.distPct?.groc || 0) +
    (form.distPct?.wants || 0) +
    (form.distPct?.unplan || 0) +
    (form.distPct?.save || 0)

  function handleAddGoal() {
    const newGoal: GoalItem = {
      id: Date.now(),
      name: "Новая цель",
      target: 100000,
      months: 12,
      saved: 0,
      isSecret: false,
    }
    setForm((prev) => ({
      ...prev,
      goals: [...(prev.goals || []), newGoal],
    }))
  }

  function handleRemoveGoal(id: string | number) {
    setForm((prev) => ({
      ...prev,
      goals: (prev.goals || []).filter((g) => g.id !== id),
    }))
  }

  async function handleSubmit() {
    await onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Настройка финансового плана месяца</DialogTitle>
          <DialogDescription>
            Доходы по фазам, обязательные списания, доли категорий и цели накоплений
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Phase 1 Incomes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              1. Доходы: Фаза 1 (1-е число — Аванс)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Тимур (аванс ₽)</Label>
                <Input
                  type="number"
                  value={form.incomes?.tAdv ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      incomes: {
                        ...form.incomes,
                        tAdv: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Лера (аванс ₽)</Label>
                <Input
                  type="number"
                  value={form.incomes?.lAdv ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      incomes: {
                        ...form.incomes,
                        lAdv: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Доп. доход (аванс ₽)</Label>
                <Input
                  type="number"
                  value={form.incomes?.extraAdv ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      incomes: {
                        ...form.incomes,
                        extraAdv: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Phase 2 Incomes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              2. Доходы: Фаза 2 (15-е число — Зарплата)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Тимур (зарплата ₽)</Label>
                <Input
                  type="number"
                  value={form.incomes?.tSal ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      incomes: {
                        ...form.incomes,
                        tSal: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Лера (зарплата ₽)</Label>
                <Input
                  type="number"
                  value={form.incomes?.lSal ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      incomes: {
                        ...form.incomes,
                        lSal: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Доп. доход (зарплата ₽)</Label>
                <Input
                  type="number"
                  value={form.incomes?.extraSal ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      incomes: {
                        ...form.incomes,
                        extraSal: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Mandatory Fixed Bills */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              3. Обязательные регулярные платежи
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ЖКУ / Коммуналка (Фаза 1: Аванс)</Label>
                <Input
                  type="number"
                  value={form.fixed?.comm ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fixed: {
                        ...form.fixed,
                        comm: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Аренда жилья (Фаза 2: Зарплата)</Label>
                <Input
                  type="number"
                  value={form.fixed?.rent ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fixed: {
                        ...form.fixed,
                        rent: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Credit card payoff */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <CreditCard className="size-4" />
              4. Погашение кредитной карты
            </h4>
            <p className="text-xs text-muted-foreground">
              Укажите долг и дату поступления, из которого он будет полностью погашен в первую очередь. Остальные суммы пересчитаются автоматически.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3.5">
              <div className="space-y-1">
                <Label className="text-xs">Сумма погашения (₽)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.creditCard?.amount ?? 0}
                  onChange={(e) => {
                    const amount = Math.max(0, parseFloat(e.target.value) || 0)
                    setForm({
                      ...form,
                      creditCard: {
                        ...form.creditCard,
                        amount,
                        isPaid: amount > 0,
                        paidDate: amount > 0 ? (form.creditCard?.paidDate || "По плану месяца") : "",
                      },
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Погасить при поступлении</Label>
                <select
                  value={form.creditCard?.phase || "advance"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      creditCard: {
                        ...form.creditCard,
                        phase: e.target.value as "advance" | "salary",
                      },
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="advance">1-е число — Аванс</option>
                  <option value="salary">15-е число — Зарплата</option>
                </select>
              </div>
            </div>
            {form.creditCard?.amount > 0 && (
              <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                После погашения {tempCalc.ccPhase === "advance" ? "1-го числа" : "15-го числа"} на остальные задачи останется пересчитанный бюджет фазы: {tempCalc.ccPhase === "advance" ? tempCalc.phase1Free.toLocaleString("ru-RU") : tempCalc.phase2Free.toLocaleString("ru-RU")} ₽.
              </div>
            )}
          </div>

          <Separator />

          {/* Distribution Percentages */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                  5. Доли распределения свободного фонда (%)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Свободный фонд к распределению: <span className="font-bold text-foreground font-mono">{tempCalc.totalFree.toLocaleString("ru-RU")} ₽</span> (1-е число: {tempCalc.phase1Free.toLocaleString("ru-RU")} ₽ · 15-е число: {tempCalc.phase2Free.toLocaleString("ru-RU")} ₽)
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-md self-start sm:self-auto shrink-0 ${
                  Math.abs(totalDist - 100) < 0.1
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/40"
                }`}
              >
                Сумма: {totalDist}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Groceries Card */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                      <ShoppingCart className="size-4" />
                    </div>
                    <Label className="text-sm font-semibold cursor-pointer">Продукты</Label>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Выделено</div>
                    <div className="text-sm font-mono font-bold text-primary">
                      {tempCalc.allocatedGroc.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Доля от свободного:</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={form.distPct?.groc ?? 55}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          distPct: {
                            ...form.distPct,
                            groc: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-20 h-8 text-xs font-mono font-semibold text-center"
                    />
                    <span className="text-xs text-muted-foreground font-bold">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>1-е число: <strong className="font-mono text-foreground">{tempCalc.grocAdv.toLocaleString("ru-RU")} ₽</strong></span>
                  <span>15-е число: <strong className="font-mono text-foreground">{tempCalc.grocSal.toLocaleString("ru-RU")} ₽</strong></span>
                </div>
              </div>

              {/* Wants Card */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                      <Heart className="size-4" />
                    </div>
                    <Label className="text-sm font-semibold cursor-pointer">Хотелки</Label>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Выделено</div>
                    <div className="text-sm font-mono font-bold text-primary">
                      {tempCalc.allocatedWants.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Доля от свободного:</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={form.distPct?.wants ?? 20}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          distPct: {
                            ...form.distPct,
                            wants: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-20 h-8 text-xs font-mono font-semibold text-center"
                    />
                    <span className="text-xs text-muted-foreground font-bold">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>1-е число: <strong className="font-mono text-foreground">{tempCalc.wantsAdv.toLocaleString("ru-RU")} ₽</strong></span>
                  <span>15-е число: <strong className="font-mono text-foreground">{tempCalc.wantsSal.toLocaleString("ru-RU")} ₽</strong></span>
                </div>
              </div>

              {/* Unplanned Card */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                      <AlertOctagon className="size-4" />
                    </div>
                    <Label className="text-sm font-semibold cursor-pointer">Внеплановые</Label>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Резерв</div>
                    <div className="text-sm font-mono font-bold text-primary">
                      {tempCalc.allocatedUnplan.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Доля от свободного:</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={form.distPct?.unplan ?? 10}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          distPct: {
                            ...form.distPct,
                            unplan: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-20 h-8 text-xs font-mono font-semibold text-center"
                    />
                    <span className="text-xs text-muted-foreground font-bold">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>1-е число: <strong className="font-mono text-foreground">{tempCalc.unplanAdv.toLocaleString("ru-RU")} ₽</strong></span>
                  <span>15-е число: <strong className="font-mono text-foreground">{tempCalc.unplanSal.toLocaleString("ru-RU")} ₽</strong></span>
                </div>
              </div>

              {/* Savings Card */}
              <div className="p-3.5 rounded-lg border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                      <PiggyBank className="size-4" />
                    </div>
                    <Label className="text-sm font-semibold cursor-pointer">Накопления</Label>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Подушка</div>
                    <div className="text-sm font-mono font-bold text-emerald-600">
                      {tempCalc.allocatedSave.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Доля от свободного:</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={form.distPct?.save ?? 15}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          distPct: {
                            ...form.distPct,
                            save: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-20 h-8 text-xs font-mono font-semibold text-center"
                    />
                    <span className="text-xs text-muted-foreground font-bold">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>1-е число: <strong className="font-mono text-foreground">{tempCalc.saveAdv.toLocaleString("ru-RU")} ₽</strong></span>
                  <span>15-е число: <strong className="font-mono text-foreground">{tempCalc.saveSal.toLocaleString("ru-RU")} ₽</strong></span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Goals & Funds */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                6. Финансовые цели и сроки
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddGoal}
                className="text-xs h-7 gap-1"
              >
                <Plus className="size-3" /> Добавить цель
              </Button>
            </div>

            {(form.goals || []).map((goal) => (
              <div key={goal.id} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Название цели (напр. Отпуск, Ремонт)"
                    value={goal.name}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm({
                        ...form,
                        goals: form.goals.map((g) =>
                          g.id === goal.id ? { ...g, name: val } : g
                        ),
                      })
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setForm({
                        ...form,
                        goals: form.goals.map((g) =>
                          g.id === goal.id ? { ...g, isSecret: !g.isSecret } : g
                        ),
                      })
                    }}
                    title={goal.isSecret ? "Секретная цель (скрыта для Леры)" : "Обычная цель"}
                  >
                    {goal.isSecret ? <EyeOff className="size-4 text-primary" /> : <Eye className="size-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px]">Целевая сумма (₽)</Label>
                    <Input
                      type="number"
                      value={goal.target}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setForm({
                          ...form,
                          goals: form.goals.map((g) =>
                            g.id === goal.id ? { ...g, target: val } : g
                          ),
                        })
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Срок (в месяцах)</Label>
                    <Input
                      type="number"
                      value={goal.months || 12}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 12
                        setForm({
                          ...form,
                          goals: form.goals.map((g) =>
                            g.id === goal.id ? { ...g, months: val } : g
                          ),
                        })
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Уже накоплено (₽)</Label>
                    <Input
                      type="number"
                      value={goal.saved || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setForm({
                          ...form,
                          goals: form.goals.map((g) =>
                            g.id === goal.id ? { ...g, saved: val } : g
                          ),
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <AnimatedButtons
            confirmLabel="Сохранить план"
            cancelLabel="Отмена"
            loadingLabel="Сохранение..."
            successLabel="Сохранено!"
            onAction={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
