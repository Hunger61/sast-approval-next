"use client"

import * as React from "react"
import { zhCN } from "react-day-picker/locale"
import { CalendarIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDateTime, parseDateTime } from "@/lib/datetime"
import { cn } from "@/lib/utils"

type DateTimePickerProps = {
  /** "YYYY-MM-DD HH:mm:ss" 或 "YYYY-MM-DD HH:mm" */
  value?: string
  onChange: (value: string) => void
  withSeconds?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

/**
 * 日期 + 时间选择器。输出格式与后端约定一致，替代旧版 antd DatePicker showTime。
 */
export function DateTimePicker({
  value,
  onChange,
  withSeconds = true,
  placeholder = "选择时间",
  disabled,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const parsed = parseDateTime(value)

  const timeValue = parsed
    ? formatDateTime(parsed, withSeconds).slice(11)
    : withSeconds
      ? "00:00:00"
      : "00:00"

  const commit = (date: Date) => onChange(formatDateTime(date, withSeconds))

  const handleDateSelect = (date?: Date) => {
    if (!date) return
    const base = parsed ?? new Date()
    const next = new Date(date)
    next.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), 0)
    commit(next)
  }

  const handleTimeChange = (time: string) => {
    const [hours = "0", minutes = "0", seconds = "0"] = time.split(":")
    const next = parsed ? new Date(parsed) : new Date()
    next.setHours(Number(hours), Number(minutes), Number(seconds), 0)
    commit(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start pe-9 font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="size-4" />
            <span className="truncate font-mono">{value || placeholder}</span>
          </Button>
        </PopoverTrigger>
        {value && !disabled ? (
          <button
            type="button"
            aria-label="清空时间"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-foreground absolute end-3 top-1/2 -translate-y-1/2"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={zhCN}
          selected={parsed}
          defaultMonth={parsed}
          onSelect={handleDateSelect}
          captionLayout="dropdown"
          autoFocus
        />
        <div className="space-y-2 border-t p-3">
          <Label htmlFor={`${id ?? "dt"}-time`} className="text-xs">
            时间
          </Label>
          <Input
            id={`${id ?? "dt"}-time`}
            type="time"
            step={withSeconds ? 1 : 60}
            value={timeValue}
            onChange={(event) => handleTimeChange(event.target.value)}
            className="font-mono"
          />
          <Button size="sm" className="w-full" onClick={() => setOpen(false)}>
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
