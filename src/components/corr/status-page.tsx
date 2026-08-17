"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  Server,
  ShieldCheck,
  WifiOff,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { AnimatedNumber } from "./animated-number"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Filters,
  type Filter,
  type FilterFieldsConfig,
} from "./filters"
import { cn } from "@/lib/utils"

export type StatusPageState =
  | "operational"
  | "degraded"
  | "incident"
  | "down"
  | "maintenance"

export interface StatusPageDay {
  date: string
  status: StatusPageState
  uptime?: number
  label?: string
}

export interface StatusPageService {
  id: string
  name: string
  description?: string
  group?: string
  status: StatusPageState
  uptime: number
  latency?: string
  days: StatusPageDay[]
}

export interface StatusPageIncident {
  id: string
  title: string
  status: Exclude<StatusPageState, "operational">
  startedAt: string
  resolvedAt?: string
  description?: string
  services?: string[]
}

export interface StatusPageProps {
  title?: string
  description?: string
  updatedAt?: string
  services: StatusPageService[]
  incidents?: StatusPageIncident[]
  showFilters?: boolean
  className?: string
}

const statusConfig: Record<
  StatusPageState,
  {
    label: string
    summary: string
    icon: React.ElementType
    badgeClassName: string
    barClassName: string
    panelClassName: string
  }
> = {
  operational: {
    label: "Operational",
    summary: "All systems operational",
    icon: CheckCircle2,
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    barClassName: "bg-emerald-500",
    panelClassName:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  },
  degraded: {
    label: "Degraded",
    summary: "Degraded performance",
    icon: Activity,
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    barClassName: "bg-amber-500",
    panelClassName:
      "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  },
  incident: {
    label: "Incident",
    summary: "Incident active",
    icon: AlertTriangle,
    badgeClassName:
      "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    barClassName: "bg-orange-500",
    panelClassName:
      "border-orange-500/20 bg-orange-500/5 text-orange-700 dark:text-orange-300",
  },
  down: {
    label: "Down",
    summary: "Service disruption",
    icon: WifiOff,
    badgeClassName:
      "border-destructive/20 bg-destructive/10 text-destructive",
    barClassName: "bg-destructive",
    panelClassName: "border-destructive/20 bg-destructive/5 text-destructive",
  },
  maintenance: {
    label: "Maintenance",
    summary: "Maintenance window",
    icon: Clock3,
    badgeClassName:
      "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    barClassName: "bg-sky-500",
    panelClassName:
      "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  },
}

const statusPriority: StatusPageState[] = [
  "down",
  "incident",
  "degraded",
  "maintenance",
  "operational",
]

function getWorstStatus(services: StatusPageService[]): StatusPageState {
  return (
    statusPriority.find((status) =>
      services.some((service) => service.status === status)
    ) ?? "operational"
  )
}

function getFilterValues(
  filters: Filter<string>[],
  field: string
): string[] {
  return filters
    .filter((filter) => filter.field === field)
    .flatMap((filter) => filter.values)
    .filter(Boolean)
}

export function StatusPage({
  title = "Status",
  description = "Live availability across core services.",
  updatedAt = "Updated just now",
  services,
  incidents = [],
  showFilters = true,
  className,
}: StatusPageProps) {
  const groups = React.useMemo(
    () =>
      Array.from(
        new Set(services.flatMap((service) => (service.group ? [service.group] : [])))
      ),
    [services]
  )
  const [filters, setFilters] = React.useState<Filter<string>[]>([])
  const activeStatuses = getFilterValues(filters, "status")
  const activeGroups = getFilterValues(filters, "group")
  const filteredServices = services.filter((service) => {
    const matchesStatus =
      activeStatuses.length === 0 || activeStatuses.includes(service.status)
    const matchesGroup =
      activeGroups.length === 0 ||
      (service.group ? activeGroups.includes(service.group) : false)

    return matchesStatus && matchesGroup
  })
  const visibleServices = showFilters ? filteredServices : services
  const overallStatus = getWorstStatus(services)
  const overallConfig = statusConfig[overallStatus]
  const OverallIcon = overallConfig.icon
  const overallUptime =
    services.reduce((total, service) => total + service.uptime, 0) /
    Math.max(services.length, 1)
  const activeIncidentCount = incidents.filter(
    (incident) => incident.status !== "maintenance"
  ).length
  const fields = React.useMemo<FilterFieldsConfig<string>>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "multiselect",
        icon: <Activity className="size-4" />,
        options: Object.entries(statusConfig).map(([value, config]) => ({
          value,
          label: config.label,
        })),
      },
      {
        key: "group",
        label: "Service group",
        type: "multiselect",
        icon: <Server className="size-4" />,
        options: groups.map((group) => ({
          value: group,
          label: group,
        })),
      },
    ],
    [groups]
  )

  return (
    <section className={cn("w-full space-y-4", className)}>
      <Card className="bg-background">
        <CardHeader className="gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              {description}
            </CardDescription>
          </div>
          <CardAction className="static col-auto row-auto justify-self-start sm:justify-self-end">
            <Badge
              variant="outline"
              className={cn("h-7 gap-1.5 px-3", overallConfig.badgeClassName)}
            >
              <OverallIcon className="size-3.5" />
              {overallConfig.summary}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <StatusMetric
              icon={<ShieldCheck className="size-4" />}
              label="30 day uptime"
              value={overallUptime}
              suffix="%"
            />
            <StatusMetric
              icon={<Server className="size-4" />}
              label="Services tracked"
              value={services.length}
            />
            <StatusMetric
              icon={<AlertTriangle className="size-4" />}
              label="Open notices"
              value={activeIncidentCount}
            />
          </div>
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />
              {updatedAt}
            </div>
            {showFilters ? (
              <Filters
                filters={filters}
                fields={fields}
                onChange={setFilters}
                size="sm"
                radius="full"
                trigger={
                  <Button variant="outline" size="sm">
                    <Activity className="size-4" />
                    Filter status
                  </Button>
                }
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {visibleServices.map((service, index) => (
          <ServiceStatusCard
            key={service.id}
            service={service}
            index={index}
          />
        ))}
      </div>

      {visibleServices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <Info className="size-5 text-muted-foreground" />
            <div className="font-medium">No services match these filters</div>
            <p className="text-sm text-muted-foreground">
              Clear or adjust the status filters to bring services back into
              view.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {incidents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident history</CardTitle>
            <CardDescription>
              Recent notices and service-impacting changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidents.map((incident) => (
              <IncidentItem key={incident.id} incident={incident} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}

function StatusMetric({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline text-3xl font-semibold tracking-tight">
        <AnimatedNumber
          value={value}
        />
        {suffix ? <span>{suffix}</span> : null}
      </div>
    </div>
  )
}

function ServiceStatusCard({
  service,
  index,
}: {
  service: StatusPageService
  index: number
}) {
  const reducedMotion = useReducedMotion()
  const config = statusConfig[service.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
    >
      <Card>
        <CardHeader className="gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CardTitle className="text-base">{service.name}</CardTitle>
              <Badge
                variant="outline"
                className={cn("gap-1.5", config.badgeClassName)}
              >
                <StatusIcon className="size-3" />
                {config.label}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {service.description}
            </CardDescription>
          </div>
          <CardAction className="static col-auto row-auto justify-self-start md:justify-self-end">
            <div className="text-left md:text-right">
              <div className="text-2xl font-semibold">
                <AnimatedNumber
                  value={service.uptime}
                />
                %
              </div>
              <div className="text-xs text-muted-foreground">
                {service.latency ?? "30 day uptime"}
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusBars days={service.days} />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatusBars({ days }: { days: StatusPageDay[] }) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-12 items-end gap-1 overflow-hidden rounded-lg bg-muted/20 p-2">
        {days.map((day) => {
          const config = statusConfig[day.status]

          return (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-full min-w-1 flex-1 rounded-[2px] transition-opacity hover:opacity-80",
                    config.barClassName
                  )}
                  aria-label={`${day.date}: ${config.label}`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div className="font-medium">{day.label ?? day.date}</div>
                  <div className="text-xs text-muted-foreground">
                    {config.label}
                    {typeof day.uptime === "number"
                      ? ` · ${day.uptime.toFixed(2)}% uptime`
                      : null}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

function IncidentItem({ incident }: { incident: StatusPageIncident }) {
  const config = statusConfig[incident.status]
  const Icon = config.icon

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            <div className="font-medium">{incident.title}</div>
            <Badge
              variant="outline"
              className={cn("gap-1.5", config.badgeClassName)}
            >
              {config.label}
            </Badge>
          </div>
          {incident.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {incident.description}
            </p>
          ) : null}
          {incident.services?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {incident.services.map((service) => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          <div>{incident.startedAt}</div>
          {incident.resolvedAt ? (
            <>
              <Separator className="my-2" />
              <div>Resolved {incident.resolvedAt}</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
