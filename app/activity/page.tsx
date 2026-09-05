"use client"

import * as React from "react"
import { SearchIcon, SearchXIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageContainer, PageHeader } from "@/components/common/page-header"
import { DataPagination } from "@/components/common/data-pagination"
import { EmptyState } from "@/components/common/states"
import { useLoadState } from "@/lib/hooks/use-load-state"
import { CompetitionCard, CompetitionCardSkeleton } from "@/components/competition/competition-card"
import { getAllCompetitionList, searchCompetition } from "@/lib/api/user"
import type { CompetitionListItem } from "@/lib/types/api"

const PAGE_SIZE_OPTIONS = [8, 12, 24, 48, 96]

export default function ActivityPage() {
  const [activities, setActivities] = React.useState<{
    records: CompetitionListItem[]
    total: number
  }>({ records: [], total: 0 })
  const [keyword, setKeyword] = React.useState("")
  const [submitted, setSubmitted] = React.useState("")
  const [pageOpt, setPageOpt] = React.useState({ page: 1, pageSize: 8 })
  const {
    requestKey,
    loading: isLoading,
    markLoaded,
  } = useLoadState(`${submitted}|${pageOpt.page}|${pageOpt.pageSize}`)

  React.useEffect(() => {
    let cancelled = false
    const request = submitted
      ? searchCompetition(submitted, pageOpt.page, pageOpt.pageSize)
      : getAllCompetitionList(pageOpt.page, pageOpt.pageSize)

    request
      .then((res) => {
        if (cancelled) return
        if (res.data.success && res.data.data) {
          setActivities({
            records: res.data.data.records ?? [],
            total: res.data.data.total ?? 0,
          })
        } else {
          setActivities({ records: [], total: 0 })
        }
      })
      .catch(() => {
        if (!cancelled) setActivities({ records: [], total: 0 })
      })
      .finally(() => {
        if (!cancelled) markLoaded(requestKey)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const runSearch = (value: string) => {
    setSubmitted(value.trim())
    setPageOpt((prev) => ({ page: 1, pageSize: prev.pageSize }))
  }

  const clearSearch = () => {
    setKeyword("")
    runSearch("")
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        title="比赛入口"
        description="浏览全部已发布的比赛活动，点击进入查看详情、公告与时间安排。"
        actions={
          <form
            role="search"
            className="flex w-full items-center gap-2 sm:w-80"
            onSubmit={(event) => {
              event.preventDefault()
              runSearch(keyword)
            }}
          >
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="search"
                enterKeyHint="search"
                className="h-10 ps-9 pe-9 sm:h-9"
                placeholder="搜索比赛名称或关键词"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              {keyword ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="清空搜索"
                  className="text-muted-foreground hover:text-foreground absolute end-2.5 top-1/2 -translate-y-1/2 p-1"
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
            </div>
            <Button type="submit" className="h-10 sm:h-9">
              搜索
            </Button>
          </form>
        }
      />

      {submitted && !isLoading ? (
        <p className="text-muted-foreground mt-4 text-sm">
          「{submitted}」的搜索结果，共 {activities.total} 个
          <button
            type="button"
            onClick={clearSearch}
            className="text-primary ms-2 underline-offset-4 hover:underline"
          >
            清除
          </button>
        </p>
      ) : null}

      <div className="mt-6 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: Math.min(pageOpt.pageSize, 8) }).map((_, index) => (
              <CompetitionCardSkeleton key={index} />
            ))}
          </div>
        ) : activities.records.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title="找不到相关比赛"
            description={
              submitted
                ? "似乎找不到你想要的比赛，换个关键词再试一次吧！"
                : "当前还没有已发布的比赛活动。"
            }
            action={
              submitted ? (
                <Button variant="outline" onClick={clearSearch}>
                  查看全部比赛
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
            {activities.records.map((item) => (
              <CompetitionCard
                key={item.id}
                competitionId={item.id}
                coverUrl={item.cover}
                title={item.name}
                description={item.intro}
                time={item.date}
              />
            ))}
          </div>
        )}

        <DataPagination
          current={pageOpt.page}
          pageSize={pageOpt.pageSize}
          total={activities.total ?? 0}
          showSizeChanger
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onChange={(page, pageSize) => setPageOpt({ page, pageSize })}
        />
      </div>
    </PageContainer>
  )
}
