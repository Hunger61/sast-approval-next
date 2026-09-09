"use client"

import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MAX_VISIBLE_ISSUES } from "@/lib/excel-accounts"
import { formatIssue, type ImportCheckResult } from "@/lib/import-accounts"
import { cn } from "@/lib/utils"

/**
 * 账号表格本地校验结果的提示块，一键导入与评委导入共用。
 * `check` 为 null 表示还没有校验结果，不渲染任何内容。
 */
export function ImportCheckAlerts({
  check,
  listClassName,
}: {
  check: ImportCheckResult | null
  listClassName?: string
}) {
  if (check === null) return null

  if (check.issues.length === 0) {
    return (
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>校验通过，可以导入</AlertTitle>
        <AlertDescription>
          共 {check.rows.length} 条记录
          {check.blankRows > 0 ? `，已跳过 ${check.blankRows} 行空白` : ""}。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>表格有 {check.issues.length} 处问题，修正后重新上传</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>
            共检查 {check.total} 行，其中 {check.rows.length} 行没有问题
            {check.blankRows > 0 ? `，另跳过 ${check.blankRows} 行空白` : ""}。
          </p>
          <ul
            className={cn("list-disc space-y-1 overflow-y-auto pl-4", listClassName ?? "max-h-64")}
          >
            {check.issues.slice(0, MAX_VISIBLE_ISSUES).map((issue, index) => (
              <li key={`${issue.row ?? "file"}-${issue.column ?? ""}-${index}`}>
                {formatIssue(issue)}
              </li>
            ))}
          </ul>
          {check.issues.length > MAX_VISIBLE_ISSUES ? (
            <p>还有 {check.issues.length - MAX_VISIBLE_ISSUES} 处问题未列出。</p>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  )
}
