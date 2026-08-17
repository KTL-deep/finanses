import React, { useState } from "react"
import { FileManager, type FileManagerItem } from "@/components/corr/file-manager"
import type { FileUploadDropzoneFile } from "@/components/corr/file-upload-dropzone"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FolderTree } from "lucide-react"

export function DocumentsFileManagerView() {
  const [files, setFiles] = useState<FileManagerItem[]>([
    {
      id: "f-1",
      name: "Выписка_ТБанк_Август_2026.csv",
      path: "/Выписки_ТБанк",
      size: "24.5 KB",
      modified: "17.08.2026",
      kind: "file",
      content: "Дата,Сумма,Категория,Описание\n17.08.2026,-3450,Супермаркеты,ВкусВилл\n16.08.2026,-1200,Транспорт,Яндекс Заправки\n15.08.2026,-4890,Супермаркеты,Азбука Вкуса",
    },
    {
      id: "f-2",
      name: "Финансовый_План_2026.json",
      path: "/Отчеты",
      size: "8.2 KB",
      modified: "01.08.2026",
      kind: "file",
      content: JSON.stringify({ title: "Annual Target", year: 2026 }, null, 2),
    },
    {
      id: "f-3",
      name: "Чек_Аренда_Квартиры_Август.pdf",
      path: "/Чеки",
      size: "142 KB",
      modified: "10.08.2026",
      kind: "file",
    },
    {
      id: "f-4",
      name: "Договор_Аренды.pdf",
      path: "/Документы",
      size: "2.4 MB",
      modified: "15.01.2026",
      kind: "file",
    },
  ])

  function handleUpload(targetPath: string, uploaded: FileUploadDropzoneFile[]) {
    const newFiles: FileManagerItem[] = uploaded.map((u) => ({
      id: `up-${Date.now()}-${Math.random()}`,
      name: u.file.name,
      path: targetPath,
      size: `${(u.file.size / 1024).toFixed(1)} KB`,
      modified: new Date().toLocaleDateString("ru-RU"),
      kind: "file",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  function handleDelete(item: FileManagerItem) {
    setFiles((prev) => prev.filter((f) => f.id !== item.id))
  }

  function handleMove(item: FileManagerItem, targetPath: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, path: targetPath } : f))
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderTree className="size-5 text-primary" />
                Файловый менеджер & Чеки (ui.corr.sh FileManager)
              </CardTitle>
              <CardDescription className="text-xs">
                Хранение выписок банка, чеков, отчетов и договоров с поддержкой папок и Drag & Drop
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FileManager
            files={files}
            defaultPath="/"
            defaultView="details"
            onUpload={handleUpload}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </CardContent>
      </Card>
    </div>
  )
}
