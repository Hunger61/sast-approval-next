"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2Icon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageContainer, PageHeader, MobileActionBar } from "@/components/common/page-header"
import { EmptyState, LoadingState, ResultState } from "@/components/common/states"
import { SchemaForm, useSchemaForm } from "@/components/schema-form"
import { buildRegisterSchema } from "@/lib/constants/register-schema"
import { useLoadState } from "@/lib/hooks/use-load-state"
import { getCompetitionInfo, getCompetitionSignInfo, getTeamInfo, signUp } from "@/lib/api/user"
import { withQuery } from "@/lib/navigation"
import { STORAGE_KEYS, readStorage } from "@/lib/storage"
import { useUiStore } from "@/lib/store/ui"

type SignConfig = { minParti: number; maxParti: number; isTeam: boolean }

function RegisterContent() {
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get("id"))
  const form = useSchemaForm()
  const setPageLabel = useUiStore((state) => state.setPageLabel)

  const { requestKey, loading, markLoaded, reload } = useLoadState(String(id))
  const [submitting, setSubmitting] = React.useState(false)
  const [messageSent, setMessageSent] = React.useState(false)
  const [messageStatus, setMessageStatus] = React.useState<"success" | "error">("success")
  const [errCode, setErrCode] = React.useState(0)
  const [errMsg, setErrMsg] = React.useState("")
  const [competitionName, setCompetitionName] = React.useState("")

  const [config, setConfig] = React.useState<SignConfig>({
    minParti: 1,
    maxParti: 1,
    isTeam: true,
  })
  const [curParti, setCurParti] = React.useState(1)
  const [curTeacher, setCurTeacher] = React.useState(0)

  const schema = React.useMemo(
    () =>
      buildRegisterSchema({
        isTeam: config.isTeam,
        minParti: config.minParti,
        maxParti: config.maxParti,
        partiCount: curParti,
        teacherCount: curTeacher,
      }),
    [config, curParti, curTeacher]
  )

  /** 把队长（当前登录用户）信息写入表单 */
  const fillLeader = React.useCallback(
    (isTeam: boolean) => {
      const leader = {
        name: readStorage(STORAGE_KEYS.name),
        code: readStorage(STORAGE_KEYS.code),
        college: readStorage(STORAGE_KEYS.college),
        major: readStorage(STORAGE_KEYS.major),
        contact: readStorage(STORAGE_KEYS.contact),
      }
      form.setValueByPath(isTeam ? "listOfParti.leader" : "leader", leader)
    },
    [form]
  )

  /** 拉取报名配置 + 已保存的报名信息 */
  const loadAll = React.useCallback(
    async (key: string) => {
      toast.loading("🤔 正在获取已保存信息，请稍候", { id: "loading" })
      try {
        const signRes = await getCompetitionSignInfo(id)
        const signData = signRes.data.data
        const isTeam = Boolean(signData?.isTeam)
        const nextConfig: SignConfig = isTeam
          ? {
              isTeam: true,
              minParti: signData.minTeamMembers ?? 1,
              maxParti: signData.maxTeamMembers ?? 15,
            }
          : { isTeam: false, minParti: 1, maxParti: 1 }
        setConfig(nextConfig)
        setCurParti((prev) => Math.max(prev, nextConfig.minParti))
        fillLeader(isTeam)

        const teamRes = await getTeamInfo(id)
        if (teamRes.data.errCode !== 2003 && teamRes.data.data) {
          const data = teamRes.data.data
          const teamMember = data.teamMember ?? []
          const teacherMember = data.teacherMember ?? []

          setCurParti(teamMember.length || nextConfig.minParti)
          setCurTeacher(teacherMember.length)

          form.setValueByPath("input_teamName", data.teamName ?? "")
          form.setValueByPath("listOfParti.select_numOfParti", teamMember.length)
          form.setValueByPath("listOfTeacher.select_numOfTeacher", teacherMember.length)
          for (let i = 1; i <= teamMember.length - 1; i += 1) {
            form.setValueByPath(`listOfParti.parti${i}`, {
              name: teamMember[i]?.name,
              code: teamMember[i]?.code,
              college: teamMember[i]?.college,
              major: teamMember[i]?.major,
              contact: teamMember[i]?.contact,
            })
          }
          for (let i = 1; i <= teacherMember.length; i += 1) {
            form.setValueByPath(`listOfTeacher.teacher${i}`, {
              name: teacherMember[i - 1]?.name,
              code: teacherMember[i - 1]?.code,
            })
          }
          fillLeader(isTeam)
          toast.success("😸 信息加载成功", { id: "loading" })
        } else if (teamRes.data.errMsg === "您还未报名该比赛") {
          toast.info("💡 请填写比赛信息", { id: "loading" })
        } else {
          toast.error("🙀 信息加载错误，请联系管理员", { id: "loading" })
        }
      } catch {
        toast.error("🙀 信息加载错误，请联系管理员", { id: "loading" })
      } finally {
        markLoaded(key)
      }
    },
    [id, form, fillLeader, markLoaded]
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

  /** 监听人数滑块变化，动态增删成员表单 */
  const handleValuesChange = (changed: Record<string, unknown>) => {
    const partiValue = changed["listOfParti.select_numOfParti"]
    if (typeof partiValue === "number") setCurParti(partiValue)

    const teacherValue = changed["listOfTeacher.select_numOfTeacher"]
    if (typeof teacherValue === "number") setCurTeacher(teacherValue)
  }

  const onFinish = async (formData: Record<string, unknown>, errors: { name: string }[]) => {
    if (errors.length > 0) {
      toast.error("🤔 表单还有未填写或格式有误的字段", {
        description: "请检查标红的输入项后重新提交",
      })
      return
    }

    setSubmitting(true)
    toast.loading("🤔 信息提交中", { id: "loading" })
    try {
      const teamName = (formData.input_teamName as string) ?? null
      const listOfParti = (formData.listOfParti ?? {}) as Record<string, unknown>
      const listOfTeacher = (formData.listOfTeacher ?? {}) as Record<string, unknown>

      const teamMember: { name: string; code: string }[] = []
      const teacherMember: { name: string; code: string }[] = []

      const partiCount = Number(listOfParti.select_numOfParti ?? 1)
      for (let i = 1; i <= partiCount - 1; i += 1) {
        const member = listOfParti[`parti${i}`] as { name: string; code: string } | undefined
        if (member) teamMember.push(member)
      }
      const teacherCount = Number(listOfTeacher.select_numOfTeacher ?? 0)
      for (let i = 1; i <= teacherCount; i += 1) {
        const member = listOfTeacher[`teacher${i}`] as { name: string; code: string } | undefined
        if (member) teacherMember.push(member)
      }

      const res = await signUp(id, teamName, teamMember, teacherMember)
      setMessageSent(true)
      if (res.data.success === true) {
        setMessageStatus("success")
        toast.success("😸 信息提交成功", { id: "loading" })
      } else {
        setMessageStatus("error")
        setErrCode(res.data.errCode ?? 0)
        setErrMsg(res.data.errMsg ?? "")
        toast.error("🙀 信息好像有点问题哦，检查下吧", { id: "loading" })
      }
    } catch {
      setMessageSent(true)
      setMessageStatus("error")
      setErrMsg("网络异常")
      toast.error("🙀 提交失败，请稍后重试", { id: "loading" })
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
            title="报名信息提交成功"
            subTitle="你的报名信息已提交，祝你比赛顺利。"
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
            title="提交时发生错误"
            subTitle={`错误代码：${errCode}，错误信息：${errMsg}。请检查后重试，或联系管理员。`}
            className="min-h-[60vh]"
            extra={
              <>
                <Button
                  onClick={() => {
                    setMessageSent(false)
                    reload()
                  }}
                >
                  重新尝试提交
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
        )}
      </PageContainer>
    )
  }

  const submitButton = (
    <Button size="lg" onClick={form.submit} disabled={submitting || loading}>
      {submitting ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <SendIcon className="size-4" />
      )}
      提交报名
    </Button>
  )

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow={competitionName || undefined}
        title="比赛报名"
        description={
          <>
            {config.isTeam ? "填写队伍与成员信息完成报名。" : "确认个人信息完成报名。"}带{" "}
            <span className="text-destructive">*</span> 的为必填项；
            {config.isTeam ? "队长" : "参赛者"}信息由系统自动填写，如需修改请前往「我的账号」。
          </>
        }
      />

      <div className="mt-8">
        {loading ? (
          <LoadingState label="正在加载报名信息……" />
        ) : (
          <>
            <SchemaForm
              form={form}
              schema={schema}
              onFinish={onFinish}
              onValuesChange={handleValuesChange}
              disabled={submitting}
            />
            <div className="mt-8 hidden border-t pt-6 sm:flex sm:justify-end">{submitButton}</div>
          </>
        )}
      </div>

      {!loading ? <MobileActionBar>{submitButton}</MobileActionBar> : null}
    </PageContainer>
  )
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<LoadingState className="min-h-[60vh]" />}>
      <RegisterContent />
    </React.Suspense>
  )
}
