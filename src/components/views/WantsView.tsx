import React, { useState } from "react"
import { Plus, Heart, Trash2, User, Pencil, Tag, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { TagsManagerModal } from "@/components/modals/TagsManagerModal"
import type { WantItem, MonthlyPlanState, User as UserType } from "@/types/finance"

interface WantsViewProps {
  state: MonthlyPlanState
  currentUser: UserType | null
  onUpdateState: (newState: MonthlyPlanState) => void
}

export function WantsView({ state, currentUser, onUpdateState }: WantsViewProps) {
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [newItemAuthor, setNewItemAuthor] = useState<string>(
    currentUser?.username?.toLowerCase() === "lera" ? "lera" : "timur"
  )
  const [newItemCategory, setNewItemCategory] = useState("Покупки")
  const [newItemDate, setNewItemDate] = useState(
    new Date().toLocaleDateString("ru-RU")
  )

  // Filter & Tags state
  const [hideDone, setHideDone] = useState(false)
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false)

  // Edit state
  const [editingItem, setEditingItem] = useState<WantItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editAuthor, setEditAuthor] = useState("timur")
  const [editCategory, setEditCategory] = useState("Покупки")
  const [editDate, setEditDate] = useState("")

  const calc = calculateFinance(state)
  const items = state.wants || []
  const currentTags = state.wantsTags || [
    "Одежда & Обувь",
    "Гаджеты",
    "Книги & Обучение",
    "Рестораны & Кафе",
    "Хобби",
    "Красота",
    "Подарки",
  ]
  
  // Sorting: uncompleted items above completed items
  const sortedItems = [...items].sort((a, b) => {
    const aDone = Boolean(a.done) ? 1 : 0
    const bDone = Boolean(b.done) ? 1 : 0
    return aDone - bDone
  })

  // Display items with active/all filter
  const displayItems = hideDone ? sortedItems.filter((i) => !i.done) : sortedItems
  const activeItemsCount = items.filter((i) => !i.done).length

  const allocated = calc.allocatedWants
  const spent = calc.spentWants
  const remaining = calc.remWants
  const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0

  // Author breakdown (only for done === true)
  const timurWants = items.filter((i) => i.author === "timur" && Boolean(i.done))
  const leraWants = items.filter((i) => i.author === "lera" && Boolean(i.done))
  const timurSpent = timurWants.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const leraSpent = leraWants.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim() || !newItemAmount) return

    const newItem: WantItem = {
      id: Date.now(),
      name: newItemName.trim(),
      amount: parseFloat(newItemAmount) || 0,
      author: newItemAuthor,
      category: newItemCategory.trim() || "Покупки",
      done: true, // Immediately crossed out and counted as spent
      date: newItemDate || new Date().toLocaleDateString("ru-RU"),
    }

    const updated = [newItem, ...items]
    onUpdateState({ ...state, wants: updated })
    setNewItemName("")
    setNewItemAmount("")
  }

  function handleToggleDone(item: WantItem) {
    const isCurrentlyDone = Boolean(item.done)
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, done: !isCurrentlyDone } : i
    )
    onUpdateState({ ...state, wants: updated })
  }

  function handleDelete(item: WantItem) {
    const updated = items.filter((i) => i.id !== item.id)
    onUpdateState({ ...state, wants: updated })
  }

  function handleOpenEdit(item: WantItem) {
    setEditingItem(item)
    setEditName(item.name)
    setEditAmount(String(item.amount))
    setEditAuthor(item.author || "timur")
    setEditCategory(item.category || "Покупки")
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
            author: editAuthor,
            category: editCategory.trim() || "Покупки",
            date: editDate.trim(),
          }
        : i
    )

    onUpdateState({ ...state, wants: updated })
    setEditingItem(null)
  }

  const columns: DataTableColumn<WantItem>[] = [
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
      id: "author",
      header: "Автор",
      width: "7rem",
      sortable: true,
      sortValue: (row) => row.author || "",
      cell: (row) => (
        <Badge variant={row.author === "lera" ? "secondary" : "outline"} className="text-xs">
          {row.author === "lera" ? "Лера" : "Тимур"}
        </Badge>
      ),
    },
    {
      id: "name",
      header: "Желание / Покупка",
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
      id: "category",
      header: "Категория",
      width: "8rem",
      sortable: true,
      sortValue: (row) => row.category || "",
      cell: (row) => {
        const isDone = Boolean(row.done)
        return (
          <span
            className={`text-xs ${
              isDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"
            }`}
          >
            {row.category || "Общее"}
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

  const rowActions = (row: WantItem): DataTableRowAction<WantItem>[] => [
    {
      label: "Редактировать",
      onClick: () => handleOpenEdit(row),
    },
    {
      label: row.done ? "Отменить покупку" : "Отметить купленным",
      onClick: () => handleToggleDone(row),
    },
    {
      label: "Удалить из списка",
      tone: "destructive",
      destructive: true,
      confirmTitle: "Удалить хотелку?",
      confirmDescription: `Вы собираетесь удалить "${row.name}".`,
      confirmKeyword: "DELETE",
      onClick: () => handleDelete(row),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 3 Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Выделено на хотелки ({calc.pW}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={allocated} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Аванс: {formatCurrency(calc.wantsAdv)} · ЗП: {formatCurrency(calc.wantsSal)}
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
              <AnimatedNumber value={spent} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Тимур: {formatCurrency(timurSpent)} · Лера: {formatCurrency(leraSpent)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Остаток фонда желаний
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
              <AnimatedNumber value={remaining} currency />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {remaining >= 0 ? "В пределах бюджета" : "Лимит превышен"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="size-4 text-primary" />
              Добавить новую хотелку в Wish-лист
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
            <Select value={newItemAuthor} onValueChange={setNewItemAuthor}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timur">Тимур</SelectItem>
                <SelectItem value="lera">Лера</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Что хочется купить? (напр. Наушники, Курс, Одежда)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Категория"
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="w-full sm:w-36"
            />
            <Input
              type="number"
              placeholder="Сумма ₽"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-full sm:w-32"
            />
            <Button type="submit" className="gap-1.5 shrink-0">
              <Plus className="size-4" />
              Добавить
            </Button>
          </form>

          {/* Quick Tag Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
              <Tag className="size-3" /> Категории:
            </span>
            {currentTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setNewItemCategory(tag)}
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
              <CardTitle className="text-base">Wish-лист семьи</CardTitle>
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
                {hideDone ? `Показать все (${items.length})` : `Скрыть купленные (${items.length - activeItemsCount})`}
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
            searchPlaceholder="Поиск по желаниям и категориям..."
            searchableText={(row) => `${row.name} ${row.category || ""} ${row.author || ""} ${row.amount}`}
            enableSorting
            enableRowSelection={false}
            rowActions={rowActions}
            exportFileName={`wants-${new Date().toISOString().slice(0, 7)}.csv`}
            emptyMessage={hideDone ? "Все запланированные желания из списка куплены!" : "Список желаний пуст. Добавьте запланированную покупку выше."}
          />
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-primary" />
              Редактирование хотелки
            </DialogTitle>
            <DialogDescription className="text-xs">
              Измените параметры желания или покупки
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Автор</Label>
              <Select value={editAuthor} onValueChange={setEditAuthor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timur">Тимур</SelectItem>
                  <SelectItem value="lera">Лера</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Желание / Покупка</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Наушники / Одежда"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Категория</Label>
                <Input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Покупки"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Сумма (₽)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Дата</Label>
              <Input
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                placeholder="ДД.ММ.ГГГГ"
              />
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
        title="Теги категорий желаний (Wish-лист)"
        description="Создавайте и редактируйте категории для быстрого добавления хотелок"
        tags={currentTags}
        onSaveTags={(newTags) => {
          onUpdateState({
            ...state,
            wantsTags: newTags,
          })
        }}
      />
    </div>
  )
}
