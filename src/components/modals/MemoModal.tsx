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
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { AnimatedButton } from "@/components/corr/animated-buttons"
import type { MonthlyPlanState } from "@/types/finance"

interface MemoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: MonthlyPlanState
  onSave: (newState: MonthlyPlanState) => Promise<void>
}

export function MemoModal({ open, onOpenChange, state, onSave }: MemoModalProps) {
  const [text, setText] = useState(state.memos || "")

  useEffect(() => {
    setText(state.memos || "")
  }, [state.memos, open])

  async function handleSave() {
    await onSave({ ...state, memos: text })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-primary" />
            Заметки и договоренности месяца
          </DialogTitle>
          <DialogDescription>
            Планы, важные напоминания или цели на текущий финансовый период
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <textarea
            rows={8}
            placeholder="Введите любые заметки или комментарии к бюджету этого месяца..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-border bg-background text-base sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-sans"
          />
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <AnimatedButton
            label="Сохранить заметку"
            loadingLabel="Сохранение..."
            successLabel="Сохранено!"
            onAction={handleSave}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
