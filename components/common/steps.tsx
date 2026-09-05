"use client"

import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step = { title: string; description?: string }

/** 轻量步骤条，替代旧版 antd Steps */
export function Steps({
  steps,
  current,
  className,
}: {
  steps: Step[]
  current: number
  className?: string
}) {
  return (
    <ol className={cn("flex gap-3 sm:gap-4", className)}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li
            key={step.title}
            className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-8 sm:text-sm",
                done && "bg-primary border-primary text-primary-foreground",
                active && "border-primary text-primary bg-primary/10",
                !done && !active && "border-border text-muted-foreground"
              )}
            >
              {done ? <CheckIcon className="size-4" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1 sm:pt-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  active || done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
              {step.description ? (
                <p className="text-muted-foreground hidden text-xs sm:block">{step.description}</p>
              ) : null}
            </div>
            {index < steps.length - 1 ? (
              <span className="bg-border hidden h-px flex-1 sm:mt-4 sm:block" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
