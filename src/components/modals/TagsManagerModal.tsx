import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, Trash2, Edit2, Check, X } from "lucide-react"

interface TagsManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  tags: string[]
  onSaveTags: (newTags: string[]) => Promise<void> | void
}

export function TagsManagerModal({
  open,
  onOpenChange,
  title,
  description = "Добавляйте, редактируйте и удаляйте быстрые теги",
  tags = [],
  onSaveTags,
}: TagsManagerModalProps) {
  const [tagList, setTagList] = useState<string[]>(tags)
  const [newTagInput, setNewTagInput] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")

  // Sync state when opened
  React.useEffect(() => {
    setTagList(tags)
  }, [tags, open])

  function handleAddTag(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = newTagInput.trim()
    if (!trimmed || tagList.includes(trimmed)) return
    const updated = [...tagList, trimmed]
    setTagList(updated)
    setNewTagInput("")
    onSaveTags(updated)
  }

  function handleRemoveTag(index: number) {
    const updated = tagList.filter((_, i) => i !== index)
    setTagList(updated)
    onSaveTags(updated)
  }

  function handleStartEdit(index: number) {
    setEditingIndex(index)
    setEditingValue(tagList[index])
  }

  function handleSaveEdit(index: number) {
    const trimmed = editingValue.trim()
    if (!trimmed) {
      handleRemoveTag(index)
    } else {
      const updated = [...tagList]
      updated[index] = trimmed
      setTagList(updated)
      onSaveTags(updated)
    }
    setEditingIndex(null)
    setEditingValue("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Tag className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="text-xs">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add New Tag Input */}
          <form onSubmit={handleAddTag} className="flex gap-2">
            <Input
              placeholder="Название нового тега..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="text-xs flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newTagInput.trim()}
              className="gap-1 text-xs shrink-0"
            >
              <Plus className="size-3.5" />
              Добавить
            </Button>
          </form>

          {/* Current Tags List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground flex justify-between">
              <span>Список тегов:</span>
              <span>Всего: {tagList.length}</span>
            </div>

            {tagList.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                Нет добавленных тегов. Добавьте первый тег выше.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {tagList.map((tag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                  >
                    {editingIndex === idx ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="h-7 text-xs flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(idx)
                            if (e.key === "Escape") setEditingIndex(null)
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveEdit(idx)}
                          className="size-7 text-emerald-600 hover:bg-emerald-500/10"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingIndex(null)}
                          className="size-7 text-muted-foreground"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{tag}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(idx)}
                            className="size-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveTag(idx)}
                            className="size-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
