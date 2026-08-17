"use client"

import * as React from "react"
import { Check, Filter as FilterIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface FilterOption<T = string> {
  value: T
  label: string
  icon?: React.ReactNode
}

export interface FilterFieldConfig<T = string> {
  key: string
  label: string
  type?: "select" | "multiselect" | "text"
  icon?: React.ReactNode
  options?: FilterOption<T>[]
}

export type FilterFieldsConfig<T = string> = FilterFieldConfig<T>[]

export interface Filter<T = string> {
  id?: string
  field: string
  operator?: string
  values: T[]
}

export function Filters({
  filters,
  fields,
  onChange,
  trigger,
  className,
}: {
  filters: Filter<string>[]
  fields: FilterFieldsConfig<string>
  onChange: (filters: Filter<string>[]) => void
  size?: "sm" | "default" | "lg"
  radius?: "default" | "full"
  trigger?: React.ReactNode
  className?: string
}) {
  const activeFilterCount = filters.reduce(
    (count, f) => count + (f.values?.length || 0),
    0
  )

  function toggleValue(fieldKey: string, value: string) {
    const existing = filters.find((f) => f.field === fieldKey)
    let nextFilters: Filter<string>[]

    if (!existing) {
      nextFilters = [...filters, { field: fieldKey, values: [value] }]
    } else {
      const exists = existing.values.includes(value)
      const nextValues = exists
        ? existing.values.filter((v) => v !== value)
        : [...existing.values, value]

      if (nextValues.length === 0) {
        nextFilters = filters.filter((f) => f.field !== fieldKey)
      } else {
        nextFilters = filters.map((f) =>
          f.field === fieldKey ? { ...f, values: nextValues } : f
        )
      }
    }

    onChange(nextFilters)
  }

  function clearAll() {
    onChange([])
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-2">
              <FilterIcon className="size-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {fields.map((field, fieldIndex) => (
            <DropdownMenuGroup key={field.key}>
              <DropdownMenuLabel className="flex items-center gap-2">
                {field.icon}
                <span>{field.label}</span>
              </DropdownMenuLabel>
              {field.options?.map((option) => {
                const isChecked = Boolean(
                  filters
                    .find((f) => f.field === field.key)
                    ?.values.includes(option.value)
                )

                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={isChecked}
                    onCheckedChange={() =>
                      toggleValue(field.key, option.value)
                    }
                    className="gap-2"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </DropdownMenuCheckboxItem>
                )
              })}
              {fieldIndex < fields.length - 1 && <DropdownMenuSeparator />}
            </DropdownMenuGroup>
          ))}
          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="w-full justify-center text-xs text-muted-foreground"
                >
                  Clear all filters
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={clearAll}
          className="text-muted-foreground hover:text-foreground"
          title="Clear filters"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  )
}
