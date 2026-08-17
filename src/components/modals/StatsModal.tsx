import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { getStats } from "@/lib/api"
import { calculateFinance } from "@/lib/calculations"
import type { MonthRecord } from "@/types/finance"
import { BarChart3 } from "lucide-react"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend
)

interface StatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StatsModal({ open, onOpenChange }: StatsModalProps) {
  const [records, setRecords] = useState<MonthRecord[]>([])

  useEffect(() => {
    if (open) {
      getStats().then((data) => {
        setRecords(data)
      })
    }
  }, [open])

  const labels = records.map((r) => r.month)

  const incomeData = records.map((r) => {
    const c = calculateFinance(r.state)
    return c.totalInc
  })

  const fixedAndGoalsData = records.map((r) => {
    const c = calculateFinance(r.state)
    return c.totalFixedAndGoals
  })

  const freeData = records.map((r) => {
    const c = calculateFinance(r.state)
    return c.totalFree
  })

  const chartData = {
    labels: labels.length > 0 ? labels : ["Текущий период"],
    datasets: [
      {
        label: "Общий доход (₽)",
        data: incomeData.length > 0 ? incomeData : [205000],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
      },
      {
        label: "Обязательные + Цели (₽)",
        data: fixedAndGoalsData.length > 0 ? fixedAndGoalsData : [102500],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
      },
      {
        label: "Свободный фонд жизни (₽)",
        data: freeData.length > 0 ? freeData : [102500],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
      },
    ],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="size-5 text-primary" />
            Историческая аналитика & Динамика
          </DialogTitle>
          <DialogDescription>
            Динамика доходов, обязательств и свободного фонда жизни по месяцам
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="p-4 rounded-xl border bg-card shadow-xs h-80">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `${Number(value) / 1000}k ₽`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
