import React, { useState } from "react"
import { Plus, AlertOctagon, Trash2, Pencil, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DataTable, type DataTableColumn, type DataTableRowAction } from "@/components/corr/data-table"
import { AnimatedNumber } from "@/components/corr/animated-number"
import { calculateFinance, formatCurrency } from "@/lib/calculations"
import type { UnplannedItem, MonthlyPlanState } from "@/types/finance"

interface UnplannedViewProps {
  state: MonthlyPlanState
  onUpdateState: (newState: MonthlyPlanState) => void
}

export function UnplannedView({ state, onUpdateState }: UnplannedViewProps) {
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [newItemReason, setNewItemReason] = useState("")
  const [newItemDate, setNewItemDate] = useState(
    new Date().toLocaleDateString("ru-RU")
  )

  // Filter state
  const [hideDone, setHideDone] = useState(false)

  // Edit state
  const [editingItem, setEditingItem] = useState<UnplannedItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editReason, setEditReason] = useState("")
  const [editDate, setEditDate] = useState("")

  const calc = calculateFinance(state)
  const items = state.unplanned || []

  // Sorting: uncompleted items above completed items
  const sortedItems = [...items].sort((a, b) => {
    const aDone = Boolean(a.done) ? 1 : 0
    const bDone = Boolean(b.done) ? 1 : 0
    return aDone - bDone
  })

  // Display items with active/all filter
  const displayItems = hideDone ? sortedItems.filter((i) => !i.done) : sortedItems
  const activeItemsCount = items.filter((i) => !i.done).length

  const allocated = calc.allocatedUnplan
  const spent = calc.spentUnplan
  const remaining = calc.remUnplan
  const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim() || !newItemAmount) return

    const newItem: UnplannedItem = {
      id: Date.now(),
      name: newItemName.trim(),
      amount: parseFloat(newItemAmount) || 0,
      reason: newItemReason.trim() || "Срочный расход",
      date: newItemDate || new Date().toLocaleDateString("ru-RU"),
      done: true, // Immediately crossed out and counted as spent
    }

    const updated = [newItem, ...items]
    onUpdateState({ ...state, unplanned: updated })
    setNewItemName("")
    setNewItemAmount("")
    setNewItemReason("")
  }

  function handleToggleDone(item: UnplannedItem) {
    const isCurrentlyDone = Boolean(item.done)
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, done: !isCurrentlyDone } : i
    )
    onUpdateState({ ...state, unplanned: updated })
  }

  function handleDelete(item: UnplannedItem) {
    const updated = items.filter((i) => i.id !== item.id)
    onUpdateState({ ...state, unplanned: updated })
  }

  function handleOpenEdit(item: UnplannedItem) {
    setEditingItem(item)
    setEditName(item.name)
    setEditAmount(String(item.amount))
    setEditReason(item.reason || "")
    setEditDate(item.date || new Date().toLocaleDateString("ru-RU"))
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem || !editName.trim() || !editAmount) return

    const updated = items.map((i) =>
      i.id === editingItem.id
        ? {
            ...i,
            name: editName.trim(),
            amount: parseFloat(editAmount) || 0,
            reason: editReason.trim(),
            date: editDate.trim(),
          }
        : i
    )

    onUpdateState({ ...state, unplanned: updated })
    setEditingItem(null)
  }

  const columns: DataTableColumn<UnplannedItem>[] = [
    {
      id: "status",
      header: "Куплено?",
      width: "5rem",
      cell: (row) => {
        const isDone = Boolean(row.done)
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isDone}
              onCheckedChange={() => handleToggleDone(row)}
              className="cursor-pointer"
              title={isDone ? "Списано (зачеркнуто, списано из резерва)" : "Не списано (в плане, не списано)"}
            />
          </div>
        )
      },
    },
    {
      id: "name",
      header: "Расход / Событие",
      sortable: true,
      sortValue: (row) => row.name,
      exportHeader: "Наименование",
      exportValue: (row) => row.name,
      cell: (row) => {
        const isDone = Boolean(row.done)
        return (
          <span
            className={
              isDone
                ? "line-through text-muted-foreground opacity-50"
                : "font-medium text-foreground"
            }
          >
            {row.name}
          </span>
        )
      },
    },
    {
      id: "reason",
      header: "Причина / Комментарий",
      width: "12rem",
      sortable: true,
      sortValue: (row) => row.reason || "",
      cell: (row) => {
        const isDone = Boolean(row.done)
        return (
          <span
            className={`text-xs ${
              isDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"
            }`}
          >
            {row.reason || "—"}
          </span>
        )
      },
    },
    {
      id: "date",
      header: "Дата",
      width: "8rem",
      sortable: true,
      sortValue: (row) => row.date || "",
      exportHeader: "Дата",
      exportValue: (row) => row.date || "",
      cell: (row) => (
        <span
          className={`text-xs ${
            row.done ? "line-through text-muted-foreground/50" : "text-muted-foreground"
          }`}
        >
          {row.date || "—"}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Сумма",
      width: "8rem",
      sortable: true,
      sortValue: (row) => row.amount,
      exportHeader: "Сумма (₽)",
      exportValue: (row) => row.amount,
      cell: (row) => {
        const isDone = Boolean(row.done)
        return (
          <span
            className={`font-mono font-semibold whitespace-nowrap ${
              isDone
                ? "line-through text-muted-foreground opacity-50"
                : "text-foreground"
            }`}
          >
            {formatCurrency(row.amount)}
          </span>
        )
      },
    },
  ]

  const rowActions = (row: UnplannedItem): DataTableRowAction<UnplannedItem>[] => [
    {
      label: "Редактировать",
      onClick: () => handleOpenEdit(row),
    },
    {
      label: row.done ? "Отменить списание" : "Отметить списанным",
      onClick: () => handleToggleDone(row),
    },
    {
      label: "Удалить запись",
      tone: "destructive",
      destructive: true,
      confirmTitle: "Удалить внеплановый расход?",
      confirmDescription: `Вы собираетесь удалить "${row.name}" на сумму ${row.amount} ₽.`,
      confirmKeyword: "DELETE",
      onClick: () => handleDelete(row),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards with Double-Bezel Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Allocated */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Выделено на внеплановые ({calc.pU}%)
                </CardTitle>
                <div className="size-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertOctagon className="size-3.5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                <AnimatedNumber value={allocated} currency />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <span>Аванс: <strong className="text-foreground font-mono">{formatCurrency(calc.unplanAdv)}</strong></span>
                <span>·</span>
                <span>ЗП: <strong className="text-foreground font-mono">{formatCurrency(calc.unplanSal)}</strong></span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Card 2: Actual Spent */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Фактически списано
                </CardTitle>
                <span className="text-[11px] font-mono font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {pct}% резерва
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                <AnimatedNumber value={spent} currency />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Зафиксировано расходов: <strong className="text-foreground">{items.length}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Card 3: Remaining */}
        <div className="p-1 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
          <Card className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xs h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Остаток резерва
                </CardTitle>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  remaining >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {remaining >= 0 ? "В норме" : "Превышен!"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
                remaining < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                <AnimatedNumber value={remaining} currency />
              </div>
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      pct > 90 ? "bg-destructive" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground flex justify-between font-medium">
                  <span>Осталось {Math.max(0, 100 - pct)}% фонда</span>
                  <span>{activeItemsCount} активных</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add Form in Double-Bezel Framing */}
      <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertOctagon className="size-4 text-amber-500" />
              Зафиксировать внеплановый расход
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2.5">
              <Input
                placeholder="Расход / Событие (напр. Ремонт авто, Лекарства)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 h-10 rounded-xl text-base sm:text-sm"
              />
              <Input
                placeholder="Причина / Комментарий"
                value={newItemReason}
                onChange={(e) => setNewItemReason(e.target.value)}
                className="w-full sm:w-56 h-10 rounded-xl text-base sm:text-sm"
              />
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Сумма ₽"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="w-full sm:w-36 h-10 rounded-xl text-base sm:text-sm font-mono font-medium"
              />
              <Input
                placeholder="Дата (ДД.ММ.ГГГГ)"
                value={newItemDate}
                onChange={(e) => setNewItemDate(e.target.value)}
                className="w-full sm:w-36 h-10 rounded-xl text-base sm:text-sm font-mono"
              />
              <Button type="submit" className="gap-2 shrink-0 h-10 px-5 rounded-xl font-semibold shadow-xs active:scale-95 transition-all">
                <Plus className="size-4" />
                Добавить
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* DataTable in Double-Bezel Framing */}
      <div className="p-1 sm:p-1.5 rounded-3xl bg-muted/40 border border-border/40 shadow-soft">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Журнал непредвиденных трат</CardTitle>
                <CardDescription className="text-xs">
                  Покупки списываются и зачеркиваются сразу при добавлении; редактирование доступно в меню строки
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={hideDone ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHideDone(!hideDone)}
                  className="h-8 text-xs gap-1.5 rounded-lg active:scale-95 transition-all"
                >
                  {hideDone ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {hideDone ? `Показать все (${items.length})` : `Скрыть выполненные (${items.length - activeItemsCount})`}
                </Button>
                <Badge variant="secondary" className="font-mono text-xs rounded-lg px-2 py-0.5">
                  {displayItems.length} из {items.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={displayItems}
              getRowId={(row) => String(row.id)}
              searchPlaceholder="Поиск по расходам и причинам..."
              searchableText={(row) => `${row.name} ${row.reason || ""} ${row.amount}`}
              enableSorting
              enableRowSelection={false}
              rowActions={rowActions}
              exportFileName={`unplanned-${new Date().toISOString().slice(0, 7)}.csv`}
              emptyMessage={hideDone ? "Все непредвиденные траты отмечены как выполненные!" : "Внеплановых расходов в этом периоде не зафиксировано."}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-primary" />
              Редактирование расхода
            </DialogTitle>
            <DialogDescription className="text-xs">
              Измените название, причину, сумму или дату
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Расход / Событие</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ремонт авто / Лекарства"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Причина / Комментарий</Label>
              <Input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Срочный ремонт"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Сумма (₽)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Дата</Label>
                <Input
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  placeholder="ДД.ММ.ГГГГ"
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
              >
                Отмена
              </Button>
              <Button type="submit">
                Сохранить изменения
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
