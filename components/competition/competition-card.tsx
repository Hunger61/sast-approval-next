"use client"

import Link from "next/link"
import { CalendarDaysIcon, ImageOffIcon } from "lucide-react"
import { withQuery } from "@/lib/navigation"
import { cn } from "@/lib/utils"

type CompetitionCardProps = {
  competitionId: number
  coverUrl?: string
  title: string
  description?: string
  time?: string
  className?: string
}

/**
 * 比赛条目：封面 + 文字，不带卡片边框，靠封面圆角与留白区分。
 * 手机上退化为左图右文的横向条目，单列下更紧凑。
 */
export function CompetitionCard({
  competitionId,
  coverUrl,
  title,
  description,
  time,
  className,
}: CompetitionCardProps) {
  return (
    <Link
      href={withQuery("/activity/detail", { id: competitionId })}
      className={cn(
        "group focus-visible:ring-ring flex gap-4 rounded-2xl outline-none focus-visible:ring-2 sm:flex-col sm:gap-3",
        className
      )}
    >
      <div className="bg-muted relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-xl sm:aspect-16/10 sm:w-full">
        {coverUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverUrl}
            alt={`${title} 封面`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <ImageOffIcon className="size-7" />
          </div>
        )}
        <div className="ring-foreground/8 pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5 sm:gap-1.5">
        <h3
          className="group-hover:text-primary line-clamp-2 text-[15px] leading-snug font-semibold transition-colors sm:line-clamp-1 sm:text-base"
          title={title}
        >
          {title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {description || "暂无比赛简介"}
        </p>
        {time ? (
          <p className="text-muted-foreground mt-auto flex items-center gap-1.5 pt-1 text-xs">
            <CalendarDaysIcon className="size-3.5" />
            <span className="truncate">{time}</span>
          </p>
        ) : null}
      </div>
    </Link>
  )
}

/** 列表加载中的占位 */
export function CompetitionCardSkeleton() {
  return (
    <div className="flex gap-4 sm:flex-col sm:gap-3">
      <div className="bg-muted aspect-4/3 w-28 shrink-0 animate-pulse rounded-xl sm:aspect-16/10 sm:w-full" />
      <div className="flex-1 space-y-2 py-1">
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-3.5 w-full animate-pulse rounded" />
        <div className="bg-muted h-3.5 w-2/3 animate-pulse rounded" />
      </div>
    </div>
  )
}
