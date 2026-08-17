import React, { useState } from "react"
import { Plus, ShoppingCart, Pin, Trash2, Pencil, Tag, Eye, EyeOff } from "lucide-react"
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
import { calculateFinance } from "@/lib/calculations"
import { TagsManagerModal } from "@/components/modals/TagsManagerModal"
import type { GroceryItem, MonthlyPlanState } from "@/types/finance"

interface GroceriesViewProps {
  state: MonthlyPlanState
  onUpdateState: (newState: MonthlyPlanState) => void
}

export function GroceriesView({ state, onUpdateState }: GroceriesViewProps) {
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [newItemDate, setNewItemDate] = useState(
    new Date().toLocaleDateString("ru-RU")
  )

  // Filter & Tags state
  const [hideDone, setHideDone] = useState(false)
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false)

  // Edit state
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")

  const calc = calculateFinance(state)
  const items = state.groceries || []
  const currentTags = state.groceryTags || [
    "ВкусВилл",
    "Супермаркет",
    "Аптека",
    "Мясо & Рыба",
    "Кофе & Завтраки",
    "Бытовая химия",
    "Корм Арии",
  ]
  
  // Sorting: Pinned uncompleted -> uncompleted -> Pinned completed -> completed
  const sortedItems = [...items].sort((a, b) => {
    const aDone = Boolean(a.done)
    const bDone = Boolean(b.done)
    const aPinned = Boolean(a.pinned)
    const bPinned = Boolean(b.pinned)

    const getScore = (done: boolean, pinned: boolean) => {
      if (pinned && !done) return 0
      if (!pinned && !done) return 1
      if (pinned && done) return 2
      return 3
    }

    return getScore(aDone, aPinned) - getScore(bDone, bPinned)
  })

  // Display items with active/all filter
  const displayItems = hideDone ? sortedItems.filter((i) => !i.done) : sortedItems
  const activeItemsCount = items.filter((i) => !i.done).length

  const allocated = calc.allocatedGroc
  const spent = calc.spentGroc
  const remaining = calc.remGroc
  const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim() || !newItemAmount) return

    const newItem: GroceryItem = {
      id: Date.now(),
      name: newItemName.trim(),
      amount: parseFloat(newItemAmount) || 0,
      done: true, // Immediately crossed out and counted as spent
      date: newItemDate || new Date().toLocaleDateString("ru-RU"),
      pinned: false,
    }

    const updated = [newItem, ...items]
    onUpdateState({ ...state, groceries: updated })
    setNewItemName("")
    setNewItemAmount("")
  }

  function handleToggleDone(item: GroceryItem) {
    const isCurrentlyDone = Boolean(item.done)
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, done: !isCurrentlyDone } : i
    )
    onUpdateState({ ...state, groceries: updated })
  }

  function handleTogglePin(item: GroceryItem) {
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, pinned: !i.pinned } : i
    )
    onUpdateState({ ...state, groceries: updated })
  }

  function handleDelete(item: GroceryItem) {
    const updated = items.filter((i) => i.id !== item.id)
    onUpdateState({ ...state, groceries: updated })
  }

  function handleOpenEdit(item: GroceryItem) {
    setEditingItem(item)
    setEditName(item.name)
    setEditAmount(String(item.amount))
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
            date: editDate.trim(),
          }
        : i
    )

    onUpdateState({ ...state, groceries: updated })
    setEditingItem(null)
  }

  const columns: DataTableColumn<GroceryItem>[] = [
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
              title={isDone ? "Куплено (зачеркнуто, списано)" : "Не куплено (в плане, не списано)"}
            />
          </div>
        )
      },
    },
    {
      id: "name",
      header: "Наименование / Магазин",
      sortable: true,
      sortValue: (row) => row.name,
      exportHeader: "Наименование",
      exportValue: (row) => row.name,
      cell: (row) => {
        const isDone = Boolean(row.done)
        return (
          <div className="flex items-center gap-2">
            {row.pinned && <Pin className="size-3 text-primary fill-primary shrink-0" />}
            <span
              className={
                isDone
                  ? "line-through text-muted-foreground opacity-50"
                  : "font-medium text-foreground"
              }
            >
              {row.name}
            </span>
          </div>
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
            className={`font-mono font-semibold ${
              isDone
                ? "line-through text-muted-foreground opacity-50"
                : "text-foreground"
            }`}
          >
            {row.amount.toLocaleString("ru-RU")} ₽
          </span>
        )
      },
    },
  ]

  const rowActions = (row: GroceryItem): DataTableRowAction<GroceryItem>[] => [
    {
      label: "Редактировать",
      onClick: () => handleOpenEdit(row),
    },
    {
      label: row.done ? "Отменить покупку" : "Отметить купленным",
      onClick: () => handleToggleDone(row),
    },
    {
      label: row.pinned ? "Открепить" : "Закрепить в шаблоне",
      onClick: () => handleTogglePin(row),
    },
    {
      label: "Удалить запись",
      tone: "destructive",
      destructive: true,
      confirmTitle: "Удалить покупку?",
      confirmDescription: `Вы собираетесь удалить "${row.name}" на сумму ${row.amount} ₽.`,
      confirmKeyword: "DELETE",
      onClick: () => handleDelete(row),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards matching financial rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Выделено на продукты ({calc.pG}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={allocated} /> ₽
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Аванс: {calc.grocAdv.toLocaleString("ru-RU")} ₽ · ЗП: {calc.grocSal.toLocaleString("ru-RU")} ₽
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Фактически списано
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={spent} /> ₽
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pct}% от выделенного лимита
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Остаток бюджета
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
              <AnimatedNumber value={remaining} /> ₽
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {remaining >= 0 ? "В пределах лимита" : "Превышение бюджета!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Bar */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              Добавить покупку продуктов
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTagsManagerOpen(true)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Tag className="size-3.5 text-primary" />
              Настроить теги ({currentTags.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Магазин / Товар (напр. ВкусВилл, Молоко, Мясо)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Сумма ₽"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-full sm:w-36"
            />
            <Input
              placeholder="Дата (ДД.ММ.ГГГГ)"
              value={newItemDate}
              onChange={(e) => setNewItemDate(e.target.value)}
              className="w-full sm:w-36"
            />
            <Button type="submit" className="gap-1.5 shrink-0">
              <Plus className="size-4" />
              Добавить
            </Button>
          </form>

          {/* Quick Tag Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
              <Tag className="size-3" /> Быстрые теги:
            </span>
            {currentTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setNewItemName(tag)}
                className="text-[11px] px-2 py-0.5 rounded-md border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Список покупок продуктов</CardTitle>
              <CardDescription className="text-xs">
                Покупки списываются и зачеркиваются сразу при добавлении; редактирование доступно в меню строки
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={hideDone ? "default" : "outline"}
                size="sm"
                onClick={() => setHideDone(!hideDone)}
                className="h-8 text-xs gap-1.5 shadow-xs"
              >
                {hideDone ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                {hideDone ? `Показать все (${items.length})` : `Скрыть выполненные (${items.length - activeItemsCount})`}
              </Button>
              <Badge variant="secondary" className="font-mono text-xs">
                Показано: {displayItems.length} из {items.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={displayItems}
            getRowId={(row) => String(row.id)}
            searchPlaceholder="Поиск по магазину или товару..."
            searchableText={(row) => `${row.name} ${row.amount} ${row.date || ""}`}
            enableSorting
            enableRowSelection={false}
            rowActions={rowActions}
            exportFileName={`groceries-${new Date().toISOString().slice(0, 7)}.csv`}
            emptyMessage={hideDone ? "Все запланированные покупки продуктов выполнены!" : "Список покупок продуктов пуст."}
          />
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-primary" />
              Редактирование покупки
            </DialogTitle>
            <DialogDescription className="text-xs">
              Измените название, сумму или дату покупки
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Наименование / Магазин</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="ВкусВилл / Продукты"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Сумма (₽)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Дата</Label>
                <Input
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  placeholder="ДД.ММ.ГГГГ"
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

      {/* Tags Manager Modal */}
      <TagsManagerModal
        open={tagsManagerOpen}
        onOpenChange={setTagsManagerOpen}
        title="Теги покупок продуктов"
        description="Создавайте и редактируйте теги для быстрого ввода частых магазинов и товаров"
        tags={currentTags}
        onSaveTags={(newTags) => {
          onUpdateState({
            ...state,
            groceryTags: newTags,
          })
        }}
      />
    </div>
  )
}
