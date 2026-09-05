"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COLLEGES } from "@/lib/constants/colleges"

type ReviewerSetProps = {
  value: { key: number; value: string }
  index: number
  setKey: (index: number, key: number) => void
  setValue: (index: number, value: string) => void
  disabled?: boolean
}

/** 单条「审核者学号 + 负责学院」配置，等价于旧版 ReviewSet */
export function ReviewerSet({ value, index, setKey, setValue, disabled }: ReviewerSetProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`reviewer-code-${index}`} className="text-muted-foreground text-xs">
          审核者学号
        </Label>
        <Input
          id={`reviewer-code-${index}`}
          placeholder="审核者学号"
          value={value.value}
          disabled={disabled}
          onChange={(event) => setValue(index, event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`reviewer-college-${index}`} className="text-muted-foreground text-xs">
          负责学院
        </Label>
        <Select
          value={value.key === -1 ? undefined : String(value.key)}
          onValueChange={(next) => setKey(index, Number(next))}
          disabled={disabled}
        >
          <SelectTrigger id={`reviewer-college-${index}`} className="w-full">
            <SelectValue placeholder="选择学院" />
          </SelectTrigger>
          <SelectContent>
            {COLLEGES.map((college, collegeIndex) => (
              <SelectItem key={college} value={String(collegeIndex + 1)}>
                {college}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
