"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { InfoIcon, Loader2Icon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageContainer, PageHeader, MobileActionBar } from "@/components/common/page-header"
import { EmptyState, LoadingState, ResultState } from "@/components/common/states"
import { SchemaForm, useSchemaForm } from "@/components/schema-form"
import { createSchemaUploader } from "@/components/schema-form/uploader"
import type { SchemaNode } from "@/components/schema-form/types"
import { getCompetitionInfo, getWorkInfo, getWorkSchema, uploadWorkSchema } from "@/lib/api/user"
import { withQuery } from "@/lib/navigation"
import { useLoadState } from "@/lib/hooks/use-load-state"
import { useUiStore } from "@/lib/store/ui"

function WorkDetailContent() {
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get("id"))
  const form = useSchemaForm()
  const setPageLabel = useUiStore((state) => state.setPageLabel)

  const [schema, setSchema] = React.useState<SchemaNode | null>(null)
  const { requestKey, loading, markLoaded, reload } = useLoadState(String(id))
  const [submitting, setSubmitting] = React.useState(false)
  const [messageSent, setMessageSent] = React.useState(false)
  const [messageStatus, setMessageStatus] = React.useState<"success" | "error">("success")
  const [errCode, setErrCode] = React.useState(0)
  const [errMsg, setErrMsg] = React.useState("unknown")
  const [competitionName, setCompetitionName] = React.useState("")

  const widgets = React.useMemo(() => ({ customUpload: createSchemaUploader(id) }), [id])

  /** 拉取表单 schema 与已填写数据 */
  const loadAll = React.useCallback(
    async (key: string) => {
      toast.loading("🤔 正在加载已填写的数据", { id: "loading" })
      // 与旧版一致：10 秒给出「仍在加载」提示，20 秒判定为加载失败
      const stillLoading = window.setTimeout(() => {
        toast.loading("🤔 我还在努力加载中，请耐心等待", { id: "loading" })
      }, 10_000)
      const loadingError = window.setTimeout(() => {
        setErrCode(0)
        setErrMsg("unknown")
        setMessageStatus("error")
        setMessageSent(true)
        markLoaded(key)
        toast.error("😩 加载错误，请联系管理员", { id: "loading" })
      }, 20_000)
      const clearTimers = () => {
        window.clearTimeout(stillLoading)
        window.clearTimeout(loadingError)
      }
      try {
        const schemaRes = await getWorkSchema(id)
        const schemaData = schemaRes.data.data
        if (!schemaData || JSON.stringify(schemaData) === "{}") {
          toast.error("😩 服务器返回了空数据", { id: "loading" })
          setErrCode(3)
          setErrMsg("该比赛没有项目提交表单")
          setMessageStatus("error")
          setMessageSent(true)
          return
        }
        setSchema(schemaData as SchemaNode)

        const infoRes = await getWorkInfo(id)
        const workData = infoRes.data.data
        if (workData === null || workData === undefined) {
          if (infoRes.data.errMsg === "您还未上传作品") {
            toast.info("💡 请填写你的项目信息", { id: "loading" })
          } else {
            toast.dismiss("loading")
          }
          return
        }

        if (Array.isArray(workData)) {
          for (const item of workData as { input: string; content: string; isFile: boolean }[]) {
            form.setValueByPath(item.input, item.content)
          }
          toast.success("😸 信息加载成功", { id: "loading" })
        } else {
          toast.dismiss("loading")
        }
      } catch {
        setErrCode(0)
        setErrMsg("unknown")
        setMessageStatus("error")
        setMessageSent(true)
        toast.error("😩 加载错误，请联系管理员", { id: "loading" })
      } finally {
        clearTimers()
        markLoaded(key)
      }
    },
    [id, form, markLoaded]
  )

  React.useEffect(() => {
    if (!id) return
    let cancelled = false

    const run = async () => {
      const detail = await getCompetitionInfo(id).catch(() => null)
      if (cancelled) return
      if (detail?.data?.data) {
        setCompetitionName(detail.data.data.name)
        setPageLabel(detail.data.data.name)
      }
      await loadAll(requestKey)
    }
    run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const submitData = async (formData: Record<string, unknown>, errors: { name: string }[]) => {
    if (errors.length > 0) {
      toast.error("🤔 似乎表单有位置忘了写或者文件尚未上传？")
      return
    }

    const submitReadyData = Object.entries(formData).map(([key, value]) => ({
      input: key,
      content: String(value ?? "").split("?")[0],
    }))

    setSubmitting(true)
    try {
      const res = await uploadWorkSchema(id, submitReadyData)
      setMessageSent(true)
      if (res.data.errCode === null) {
        setMessageStatus("success")
      } else {
        setMessageStatus("error")
        setErrCode(res.data.errCode)
        setErrMsg(res.data.errMsg ?? "unknown")
      }
    } catch {
      setMessageSent(true)
      setMessageStatus("error")
      setErrMsg("网络异常")
    } finally {
      setSubmitting(false)
    }
  }

  if (!id) {
    return (
      <PageContainer>
        <EmptyState title="缺少比赛 ID" description="请从比赛入口重新进入。" />
      </PageContainer>
    )
  }

  if (messageSent) {
    return (
      <PageContainer size="narrow">
        {messageStatus === "success" ? (
          <ResultState
            status="success"
            title="项目信息提交成功"
            subTitle="你的项目信息已提交，截止前仍可回来修改。祝你比赛顺利！"
            className="min-h-[60vh]"
            extra={
              <>
                <Button onClick={() => router.push(withQuery("/activity/register-detail", { id }))}>
                  查看报名详情
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(withQuery("/activity/detail", { id }))}
                >
                  返回比赛详情
                </Button>
              </>
            }
          />
        ) : (
          <ResultState
            status="error"
            title="发生错误"
            subTitle={`错误代码：${errCode}，错误信息：${errMsg}。请检查后重试，或联系管理员。`}
            className="min-h-[60vh]"
            extra={
              <>
                {errCode !== 3 ? (
                  <Button
                    onClick={() => {
                      setMessageSent(false)
                      reload()
                    }}
                  >
                    重新尝试提交
                  </Button>
                ) : null}
                <Button
                  variant={errCode !== 3 ? "outline" : "default"}
                  onClick={() => router.push(withQuery("/activity/detail", { id }))}
                >
                  返回比赛详情
                </Button>
              </>
            }
          />
        )}
      </PageContainer>
    )
  }

  const ready = !loading && Boolean(schema)

  const submitButton = (
    <Button size="lg" onClick={form.submit} disabled={submitting || !ready}>
      {submitting ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <SendIcon className="size-4" />
      )}
      提交项目材料
    </Button>
  )

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow={competitionName || undefined}
        title="项目提交"
        description="按照比赛要求填写并上传项目材料，提交后可在截止时间前反复修改。"
      />

      <p className="text-muted-foreground mt-5 flex items-start gap-2 text-sm">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          带 <span className="text-destructive">*</span>{" "}
          的为必填项。为了保证顺利参赛，请按照比赛举办方的要求仔细填写本表单。
        </span>
      </p>

      <div className="mt-8">
        {!ready ? (
          <LoadingState label="正在加载项目表单……" />
        ) : (
          <>
            <SchemaForm
              form={form}
              schema={schema!}
              widgets={widgets}
              onFinish={submitData}
              disabled={submitting}
            />
            <div className="mt-8 hidden border-t pt-6 sm:flex sm:justify-end">{submitButton}</div>
          </>
        )}
      </div>

      {ready ? <MobileActionBar>{submitButton}</MobileActionBar> : null}
    </PageContainer>
  )
}

export default function WorkDetailPage() {
  return (
    <React.Suspense fallback={<LoadingState className="min-h-[60vh]" />}>
      <WorkDetailContent />
    </React.Suspense>
  )
}
