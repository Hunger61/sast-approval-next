"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DataPaginationProps = {
  current: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  className?: string
}

/** 计算需要展示的页码，超长时用省略号收拢 */
function buildPages(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) pages.push("…")
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < totalPages - 1) pages.push("…")
  pages.push(totalPages)
  return pages
}

export function DataPagination({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions,
  showSizeChanger = false,
  className,
}: DataPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  if (total <= 0) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4",
        className
      )}
    >
      <p className="text-muted-foreground order-2 text-xs sm:order-1">
        共 <span className="text-foreground font-medium tabular-nums">{total}</span> 条 · 第{" "}
        <span className="text-foreground font-medium tabular-nums">{current}</span> / {totalPages}{" "}
        页
      </p>

      <div className="order-1 flex items-center gap-1.5 sm:order-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="上一页"
          disabled={current <= 1}
          onClick={() => onChange(current - 1, pageSize)}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        {buildPages(current, totalPages).map((page, index) =>
          page === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="text-muted-foreground w-8 text-center text-sm"
            >
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === current ? "default" : "outline"}
              size="icon-sm"
              className="tabular-nums"
              onClick={() => onChange(page, pageSize)}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="下一页"
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1, pageSize)}
        >
          <ChevronRightIcon className="size-4" />
        </Button>

        {showSizeChanger && pageSizeOptions ? (
          <Select value={String(pageSize)} onValueChange={(value) => onChange(1, Number(value))}>
            <SelectTrigger size="sm" className="ms-1 w-26">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} 条/页
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  )
}
