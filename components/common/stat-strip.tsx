"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type StatItem = {
  key: string
  label: string
  value: React.ReactNode
  /** 数值右侧的补充说明，例如 "/ 120" */
  suffix?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  /** 图标配色，例如 "text-primary" */
  tone?: string
  /** 数值下方的额外内容，例如进度条或标签 */
  extra?: React.ReactNode
}

/** 一行内联的统计条，不使用卡片，靠分割线区分各项 */
export function StatStrip({
  items,
  loading,
  className,
}: {
  items: StatItem[]
  loading?: boolean
  className?: string
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-5 sm:divide-x sm:[&>*]:ps-6 sm:[&>*:first-child]:ps-0",
        items.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
        items.length >= 4 && "lg:grid-cols-4",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.key} className="min-w-0 space-y-1.5">
            <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              {Icon ? <Icon className={cn("size-3.5", item.tone)} /> : null}
              {item.label}
            </dt>
            <dd className="min-w-0">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="truncate text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]">
                  {item.value}
                  {item.suffix ? (
                    <span className="text-muted-foreground ms-1 text-sm font-normal">
                      {item.suffix}
                    </span>
                  ) : null}
                </p>
              )}
              {item.extra ? <div className="pt-1.5">{item.extra}</div> : null}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
