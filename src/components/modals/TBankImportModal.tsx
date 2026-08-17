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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FileSpreadsheet, UploadCloud, Check } from "lucide-react"
import { AnimatedButton } from "@/components/corr/animated-buttons"
import type { GroceryItem, WantItem, UnplannedItem, MonthlyPlanState } from "@/types/finance"

interface ParsedTransaction {
  id: string
  name: string
  amount: number
  date: string
  category: "groceries" | "wants" | "unplanned"
  selected: boolean
}

interface TBankImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: MonthlyPlanState
  onImport: (newState: MonthlyPlanState) => Promise<void>
}

export function TBankImportModal({
  open,
  onOpenChange,
  state,
  onImport,
}: TBankImportModalProps) {
  const [csvText, setCsvText] = useState("")
  const [parsedItems, setParsedItems] = useState<ParsedTransaction[]>([])
  const [step, setStep] = useState<"input" | "preview">("input")

  function parseCSV(text: string) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
    const results: ParsedTransaction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip typical CSV headers
      if (line.toLowerCase().includes("дата операции") || line.toLowerCase().includes("сумма платежа")) continue

      // Support semicolons, commas, or tab separators
      const parts = line.split(/[;,]/).map((p) => p.replace(/^["']|["']$/g, "").trim())
      if (parts.length < 3) continue

      const dateStr = parts[0]
      // Find amount column
      let amount = 0
      let name = ""
      let rawCategory = ""

      for (const part of parts) {
        const clean = part.replace(/\s+/g, "").replace(",", ".")
        const num = parseFloat(clean)
        if (!isNaN(num) && Math.abs(num) > 0 && amount === 0) {
          amount = Math.abs(num)
        } else if (part.length > 2 && !name && isNaN(Number(part))) {
          name = part
        } else if (part.length > 2 && name && !rawCategory && isNaN(Number(part))) {
          rawCategory = part
        }
      }

      if (amount > 0) {
        const lower = (name + " " + rawCategory).toLowerCase()
        let cat: "groceries" | "wants" | "unplanned" = "unplanned"

        if (
          lower.includes("вкусвилл") ||
          lower.includes("азбука") ||
          lower.includes("магнит") ||
          lower.includes("пятерочка") ||
          lower.includes("самокат") ||
          lower.includes("лента") ||
          lower.includes("супермаркет") ||
          lower.includes("продукты") ||
          lower.includes("перекресток")
        ) {
          cat = "groceries"
        } else if (
          lower.includes("ресторан") ||
          lower.includes("кафе") ||
          lower.includes("одежда") ||
          lower.includes("косметика") ||
          lower.includes("развлечения") ||
          lower.includes("кино") ||
          lower.includes("wildberries") ||
          lower.includes("ozon") ||
          lower.includes("яндекс еда")
        ) {
          cat = "wants"
        }

        results.push({
          id: `tbank-${i}-${Date.now()}`,
          name: name || "Покупка Т-Банк",
          amount,
          date: dateStr || new Date().toLocaleDateString("ru-RU"),
          category: cat,
          selected: true,
        })
      }
    }

    setParsedItems(results)
    if (results.length > 0) {
      setStep("preview")
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  async function handleConfirmImport() {
    const selected = parsedItems.filter((i) => i.selected)

    const newGroceries: GroceryItem[] = [
      ...selected
        .filter((i) => i.category === "groceries")
        .map((i) => ({
          id: Date.now() + Math.random(),
          name: i.name,
          amount: i.amount,
          date: i.date,
          done: true,
        })),
      ...(state.groceries || []),
    ]

    const newWants: WantItem[] = [
      ...selected
        .filter((i) => i.category === "wants")
        .map((i) => ({
          id: Date.now() + Math.random(),
          name: i.name,
          amount: i.amount,
          date: i.date,
          done: true,
          category: "Импорт",
          author: "timur",
        })),
      ...(state.wants || []),
    ]

    const newUnplanned: UnplannedItem[] = [
      ...selected
        .filter((i) => i.category === "unplanned")
        .map((i) => ({
          id: Date.now() + Math.random(),
          name: i.name,
          amount: i.amount,
          date: i.date,
          reason: "Импорт Т-Банк",
        })),
      ...(state.unplanned || []),
    ]

    const updatedState: MonthlyPlanState = {
      ...state,
      groceries: newGroceries,
      wants: newWants,
      unplanned: newUnplanned,
    }

    await onImport(updatedState)
    setStep("input")
    setCsvText("")
    setParsedItems([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="size-5 text-primary" />
            Импорт выписки Т-Банка (CSV)
          </DialogTitle>
          <DialogDescription>
            Загрузите файл выписки или вставьте текст для автоматического распределения по категориям
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer text-center relative">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="size-8 text-muted-foreground mb-2" />
              <div className="font-semibold text-sm">Выберите файл выписки (.csv)</div>
              <div className="text-xs text-muted-foreground mt-1">
                или перетащите его сюда с компьютера
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Либо вставьте скопированный текст выписки:
              </div>
              <textarea
                rows={5}
                placeholder="17.08.2026; -3450; Супермаркеты; ВкусВилл&#10;16.08.2026; -1200; Транспорт; Яндекс Заправки"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 rounded-lg border bg-background font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Найдено транзакций: {parsedItems.length}</span>
              <span>Выбрано к импорту: {parsedItems.filter((i) => i.selected).length}</span>
            </div>

            <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
              {parsedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/30 gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={(c) =>
                        setParsedItems((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, selected: Boolean(c) } : i))
                        )
                      }
                    />
                    <div className="truncate font-medium">{item.name}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={
                        item.category === "groceries"
                          ? "default"
                          : item.category === "wants"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {item.category === "groceries"
                        ? "Продукты"
                        : item.category === "wants"
                          ? "Хотелки"
                          : "Внеплановые"}
                    </Badge>
                    <span className="font-mono font-semibold">
                      {item.amount.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:justify-end">
          {step === "preview" && (
            <Button variant="outline" onClick={() => setStep("input")}>
              Назад
            </Button>
          )}
          {step === "input" ? (
            <Button
              onClick={() => parseCSV(csvText)}
              disabled={!csvText.trim()}
            >
              Распознать
            </Button>
          ) : (
            <AnimatedButton
              label={`Импортировать (${parsedItems.filter((i) => i.selected).length})`}
              loadingLabel="Импорт..."
              successLabel="Импортировано!"
              onAction={handleConfirmImport}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
