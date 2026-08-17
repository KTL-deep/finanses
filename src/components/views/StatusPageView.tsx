import React from "react"
import { StatusPage, type StatusPageService, type StatusPageIncident } from "@/components/corr/status-page"

export function StatusPageView() {
  const services: StatusPageService[] = [
    {
      id: "api",
      name: "Express API Gateway",
      description: "Обработка REST API запросов, планов месяцев и синхронизации",
      group: "Backend",
      status: "operational",
      uptime: 99.98,
      latency: "12ms",
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `День ${i + 1}`,
        status: "operational",
        uptime: 100,
      })),
    },
    {
      id: "sqlite",
      name: "SQLite Database Store",
      description: "Хранилище финансовых планов, пользователей и сессий (finance.db)",
      group: "Database",
      status: "operational",
      uptime: 100,
      latency: "1.2ms",
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `День ${i + 1}`,
        status: "operational",
        uptime: 100,
      })),
    },
    {
      id: "tbank-webhook",
      name: "Т-Банк Webhook & Парсер",
      description: "Прием и автоматический разбор уведомлений о транзакциях",
      group: "Integrations",
      status: "operational",
      uptime: 99.95,
      latency: "45ms",
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `День ${i + 1}`,
        status: i === 22 ? "degraded" : "operational",
        uptime: i === 22 ? 98.4 : 100,
      })),
    },
    {
      id: "auth",
      name: "PBKDF2 Auth & Sessions",
      description: "Криптографическая авторизация и безопасные сессии",
      group: "Security",
      status: "operational",
      uptime: 100,
      days: Array.from({ length: 30 }, (_, i) => ({
        date: `День ${i + 1}`,
        status: "operational",
        uptime: 100,
      })),
    },
  ]

  const incidents: StatusPageIncident[] = [
    {
      id: "inc-1",
      title: "Плановое обновление до React 18 & ui.corr.sh",
      status: "degraded",
      startedAt: "17.08.2026 13:50",
      resolvedAt: "17.08.2026 14:00",
      description: "Успешная миграция архитектуры интерфейса на Vite + shadcn/ui + ui.corr.sh.",
      services: ["Express API Gateway", "Frontend Assets"],
    },
  ]

  return (
    <div className="space-y-6">
      <StatusPage
        title="Мониторинг и статус системы (ui.corr.sh StatusPage)"
        description="Текущая доступность сервера, базы данных SQLite и вебхуков банка."
        updatedAt="Только что обновлено"
        services={services}
        incidents={incidents}
        showFilters
      />
    </div>
  )
}
