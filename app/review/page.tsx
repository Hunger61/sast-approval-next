"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightIcon, ClipboardCheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageContainer, PageHeader } from "@/components/common/page-header"
import { DataPagination } from "@/components/common/data-pagination"
import { MobileList, MobileListItem, TableSurface } from "@/components/common/data-list"
import { EmptyState } from "@/components/common/states"
import { useLoadState } from "@/lib/hooks/use-load-state"
import { getJudgeCompetitionList, getScoreCompetitionList } from "@/lib/api/judge"
import { withQuery } from "@/lib/navigation"
import { useUserStore } from "@/lib/store/user"
import { toDateString } from "@/lib/datetime"
import type { DataListType } from "@/lib/types/judge"

function PendingBadge({ pending }: { pending: number }) {
  return pending > 0 ? (
    <Badge variant="destructive" className="tabular-nums">
      待处理 {pending}
    </Badge>
  ) : (
    <Badge variant="secondary">已完成</Badge>
  )
}

export default function ReviewPage() {
  const role = useUserStore((state) => state.role)
  const isJudge = role === "judge"
  const actionLabel = isJudge ? "审核" : "评审"

  const [pageNum, setPageNum] = React.useState(1)
  const [dataList, setDataList] = React.useState<{
    list: DataListType[]
    total: number
    pageSize: number
  } | null>(null)
  const { requestKey, loading, markLoaded } = useLoadState(`${isJudge}|${pageNum}`)

  React.useEffect(() => {
    let cancelled = false
    const request = isJudge ? getJudgeCompetitionList(pageNum) : getScoreCompetitionList(pageNum)
    request
      .then((res) => {
        if (cancelled) return
        setDataList(res.data.data ?? null)
      })
      .catch(() => {
        if (!cancelled) setDataList(null)
      })
      .finally(() => {
        if (!cancelled) markLoaded(requestKey)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const rows = dataList?.list ?? []
  const listHref = (record: DataListType) =>
    withQuery("/review/list", { comId: record.id, page: 1 })

  return (
    <PageContainer size="wide">
      <PageHeader
        title={`比赛${actionLabel}`}
        description={`查看分配给你的比赛，进入后可逐个${actionLabel}参赛项目。`}
      />

      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : dataList === null || rows.length === 0 ? (
          <EmptyState
            icon={ClipboardCheckIcon}
            title={`暂时不需要${actionLabel}哦`}
            description="当前没有分配给你的比赛，请稍后再来查看。"
          />
        ) : (
          <>
            <TableSurface className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14">#</TableHead>
                    <TableHead className="min-w-56">比赛名称</TableHead>
                    <TableHead className="w-32">进度</TableHead>
                    <TableHead className="min-w-44">{actionLabel}时间</TableHead>
                    <TableHead className="w-28">状态</TableHead>
                    <TableHead className="w-28 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((record) => {
                    const total = record.totalNum ?? 0
                    const completed = record.completedNum ?? 0
                    const pending = total - completed
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {record.id}
                        </TableCell>
                        <TableCell className="max-w-96 whitespace-normal font-medium">
                          <Link
                            href={listHref(record)}
                            className="hover:text-primary line-clamp-2 underline-offset-4 hover:underline"
                          >
                            {record.title}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">
                          {completed}
                          <span className="text-muted-foreground"> / {total}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {toDateString(record.startDate)}
                          <span className="mx-1">–</span>
                          {toDateString(record.endDate)}
                        </TableCell>
                        <TableCell>
                          <PendingBadge pending={pending} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={pending > 0 ? "default" : "outline"} asChild>
                            <Link href={listHref(record)}>
                              {actionLabel}
                              <ArrowRightIcon className="size-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableSurface>

            <MobileList className="md:hidden">
              {rows.map((record) => {
                const total = record.totalNum ?? 0
                const completed = record.completedNum ?? 0
                return (
                  <MobileListItem
                    key={record.id}
                    href={listHref(record)}
                    title={record.title}
                    meta={
                      <>
                        <span className="font-mono tabular-nums">
                          已{actionLabel} {completed} / {total}
                        </span>
                        <span className="font-mono">
                          {toDateString(record.startDate)} – {toDateString(record.endDate)}
                        </span>
                      </>
                    }
                    trailing={<PendingBadge pending={total - completed} />}
                  />
                )
              })}
            </MobileList>
          </>
        )}
      </div>

      {dataList ? (
        <DataPagination
          className="mt-6"
          current={pageNum}
          pageSize={dataList.pageSize || 10}
          total={dataList.total}
          onChange={(page) => setPageNum(page)}
        />
      ) : null}
    </PageContainer>
  )
}
