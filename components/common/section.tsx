"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SectionProps = {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  /** 标题行右侧的操作 */
  actions?: React.ReactNode
  /**
   * stack：标题在上、内容在下（默认）
   * split：大屏时标题占左栏、内容占右栏，适合长表单
   */
  layout?: "stack" | "split"
  children: React.ReactNode
  className?: string
  contentClassName?: string
  id?: string
}

/**
 * 页面内容分区。用标题 + 分割线代替卡片，让页面更轻、层级更清楚。
 * 多个 Section 放进 SectionList 后会自动加上分割线与间距。
 */
export function Section({
  title,
  description,
  icon: Icon,
  actions,
  layout = "stack",
  children,
  className,
  contentClassName,
  id,
}: SectionProps) {
  const heading = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          {Icon ? <Icon className="text-primary size-4 shrink-0" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {description ? (
          <p className="text-muted-foreground text-balance-pretty text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )

  if (layout === "split") {
    return (
      <section
        id={id}
        className={cn(
          "scroll-mt-20 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12",
          className
        )}
      >
        <div className="mb-6 lg:mb-0">{heading}</div>
        <div className={cn("min-w-0", contentClassName)}>{children}</div>
      </section>
    )
  }

  return (
    <section id={id} className={cn("scroll-mt-20 space-y-4", className)}>
      {heading}
      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </section>
  )
}

/** 多个 Section 的容器：用细分割线分隔，替代一摞卡片 */
export function SectionList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "divide-y [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 sm:[&>*]:py-10",
        className
      )}
    >
      {children}
    </div>
  )
}

/** 键值信息行，配合 <dl className="divide-y"> 使用 */
export function InfoRow({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6", className)}>
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground min-w-0 text-sm break-words">{children}</dd>
    </div>
  )
}
