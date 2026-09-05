"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarClockIcon, ClipboardListIcon, GaugeIcon } from "lucide-react"
import { toast } from "sonner"
import { notifyRequestError } from "@/lib/api/errors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { StatStrip } from "@/components/common/stat-strip"
import { EmptyState, LoadingState } from "@/components/common/states"
import { useLoadState } from "@/lib/hooks/use-load-state"
import { getJudgeWorkList, getScoreWorkList } from "@/lib/api/judge"
import { getCompetitionInfo } from "@/lib/api/user"
import { withQuery } from "@/lib/navigation"
import { STORAGE_KEYS, writeStorage } from "@/lib/storage"
import { useUiStore } from "@/lib/store/ui"
import { useUserStore } from "@/lib/store/user"
import { isPast } from "@/lib/datetime"
import type { ProgramListItem } from "@/lib/types/judge"

function ReviewListContent() {
  const router = useRouter()
  const params = useSearchParams()
  const comId = Number(params.get("comId"))
  const page = Number(params.get("page") ?? 1) || 1
  const role = useUserStore((state) => state.role)
  const isApprover = role === "approver"
  const actionLabel = isApprover ? "评审" : "审核"
  const setPageLabel = useUiStore((state) => state.setPageLabel)

  const { requestKey, loading, markLoaded } = useLoadState(`${comId}|${page}|${isApprover}`)
  const [programList, setProgramList] = React.useState<ProgramListItem[]>([])
  const [meta, setMeta] = React.useState({ total: 0, pageSize: 10 })
  const [competitionName, setCompetitionName] = React.useState("")
  const [isEnd, setIsEnd] = React.useState(false)
  const [reviewEnd, setReviewEnd] = React.useState("")
  const [doneCount, setDoneCount] = React.useState(0)

  React.useEffect(() => {
    if (!comId) return
    let cancelled = false

    getCompetitionInfo(comId)
      .then(async (res) => {
        if (cancelled) return
        const comDetail = res.data.data
        if (comDetail) {
          setCompetitionName(comDetail.name)
          setPageLabel(comDetail.name)
          setReviewEnd(comDetail.reviewEnd ?? "")
          writeStorage(STORAGE_KEYS.reviewEnd, comDetail.reviewEnd ?? "")
          setIsEnd(isPast(comDetail.reviewEnd))
        }

        const listRes = isApprover
          ? await getScoreWorkList(comId, page)
          : await getJudgeWorkList(comId, page)
        if (cancelled) return

        const result = listRes.data.data
        if (result === null || result === undefined) {
          toast.info("该页面没有数据，返回上一页")
          router.push("/review")
          return
        }

        const list: ProgramListItem[] = result.list ?? []
        let completed = 0

        if (isApprover) {
          for (const item of list) {
            const scored = Boolean(item.score)
            item.isApprove = scored
            if (scored) completed += 1
          }
        } else {
          for (const item of list) {
            if (item.isPass === true) {
              completed += 1
              item.isJudge = true
              item.isPass = "通过"
            } else if (item.isPass === false) {
              completed += 1
              item.isJudge = true
              item.isPass = "未通过"
            } else {
              item.isJudge = false
              item.isPass = ""
            }
          }
        }

        setDoneCount(completed)
        setProgramList(list)
        setMeta({ total: result.total ?? 0, pageSize: result.pageSize ?? 10 })
        writeStorage(STORAGE_KEYS.listTotal, String(result.total ?? 0))
      })
      .catch((error) => {
        if (!cancelled) notifyRequestError(error, "😭 数据加载失败，请稍后重试")
      })
      .finally(() => {
        if (!cancelled) markLoaded(requestKey)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const goToPage = (nextPage: number) => {
    router.push(withQuery("/review/list", { comId, page: nextPage }))
  }

  const openDetail = (recordId: number) =>
    router.push(withQuery("/review/detail", { id: recordId }))

  if (!comId) {
    return (
      <PageContainer>
        <EmptyState title="缺少比赛 ID" description={`请从${actionLabel}列表重新进入。`} />
      </PageContainer>
    )
  }

  const progress = meta.total > 0 ? Math.round((doneCount / meta.total) * 100) : 0

  const resultCell = (record: ProgramListItem) =>
    isApprover ? (record.score ?? "—") : (record.isPass as string) || "—"

  const statusBadge = (record: ProgramListItem) => {
    const done = isApprover ? record.isApprove : record.isJudge
    return (
      <Badge variant={done ? "secondary" : "default"}>
        {isApprover ? (done ? "已评分" : "待评分") : done ? "已审核" : "待审核"}
      </Badge>
    )
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow={competitionName || undefined}
        title="项目列表"
        description={`点击任意项目进入详情并完成${actionLabel}。`}
      />

      <StatStrip
        className="mt-8"
        loading={loading && meta.total === 0}
        items={[
          {
            key: "progress",
            label: `${actionLabel}进度`,
            icon: GaugeIcon,
            tone: "text-primary",
            value: doneCount,
            suffix: `/ ${meta.total}`,
            extra: <Progress value={progress} className="h-1.5 max-w-60" />,
          },
          {
            key: "deadline",
            label: `${actionLabel}截止`,
            icon: CalendarClockIcon,
            tone: "text-chart-4",
            value: (
              <span className="font-mono text-base font-semibold sm:text-lg">
                {reviewEnd || "—"}
              </span>
            ),
            extra: isEnd ? (
              <Badge variant="destructive" className="mt-0.5">
                已结束
              </Badge>
            ) : null,
          },
        ]}
      />

      <div className="mt-8">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : programList.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title="暂无项目"
            description={`该比赛下还没有需要${actionLabel}的项目。`}
          />
        ) : (
          <>
            <TableSurface className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14">#</TableHead>
                    <TableHead className="min-w-56">项目名称</TableHead>
                    <TableHead className="w-24">{isApprover ? "评分" : "结论"}</TableHead>
                    <TableHead className="min-w-48">{isApprover ? "评语" : "意见"}</TableHead>
                    <TableHead className="w-24">状态</TableHead>
                    <TableHead className="w-28 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programList.map((record) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(record.id)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {record.id}
                      </TableCell>
                      <TableCell className="max-w-96 whitespace-normal font-medium">
                        <span className="line-clamp-2">{record.title}</span>
                      </TableCell>
                      <TableCell className="font-mono tabular-nums">{resultCell(record)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-72 truncate text-sm">
                        <span title={record.opinion}>{record.opinion || "—"}</span>
                      </TableCell>
                      <TableCell>{statusBadge(record)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isEnd}
                          onClick={(event) => {
                            event.stopPropagation()
                            openDetail(record.id)
                          }}
                        >
                          {isEnd ? "已结束" : isApprover ? "查看" : "审核"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableSurface>

            <MobileList className="md:hidden">
              {programList.map((record) => (
                <MobileListItem
                  key={record.id}
                  onClick={() => openDetail(record.id)}
                  title={record.title}
                  meta={
                    <>
                      <span>
                        {isApprover ? "评分" : "结论"}：
                        <span className="text-foreground font-mono">{resultCell(record)}</span>
                      </span>
                      {record.opinion ? (
                        <span className="line-clamp-1 w-full">{record.opinion}</span>
                      ) : null}
                    </>
                  }
                  trailing={statusBadge(record)}
                />
              ))}
            </MobileList>
          </>
        )}
      </div>

      <DataPagination
        className="mt-6"
        current={page}
        pageSize={meta.pageSize}
        total={meta.total}
        onChange={(nextPage) => goToPage(nextPage)}
      />
    </PageContainer>
  )
}

export default function ReviewListPage() {
  return (
    <React.Suspense fallback={<LoadingState className="min-h-[60vh]" />}>
      <ReviewListContent />
    </React.Suspense>
  )
}
