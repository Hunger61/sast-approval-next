"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import { notifyRequestError } from "@/lib/api/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { getValidateCode, login } from "@/lib/api/public"
import { getUserProfile } from "@/lib/api/user"
import { STORAGE_KEYS, writeStorage } from "@/lib/storage"
import { roleNumberToState, useUserStore } from "@/lib/store/user"
import { identifyUser } from "@/lib/monitoring"

/** 拉取验证码图片，返回 objectURL 与 captcha uuid */
function useValidateCode() {
  const [imageUrl, setImageUrl] = React.useState<string>()
  const [captchaId, setCaptchaId] = React.useState("")
  const [nonce, setNonce] = React.useState(0)
  const [loadedNonce, setLoadedNonce] = React.useState(-1)
  const loading = loadedNonce !== nonce

  React.useEffect(() => {
    let revoked: string | undefined
    let cancelled = false
    getValidateCode()
      .then((res) => {
        if (cancelled) return
        const url = window.URL.createObjectURL(res.data as Blob)
        revoked = url
        setImageUrl(url)
        setCaptchaId(String(res.headers["captcha"] ?? ""))
      })
      .catch((error) => {
        if (!cancelled) notifyRequestError(error, "验证码加载失败，请点击图片重试")
      })
      .finally(() => {
        if (!cancelled) setLoadedNonce(nonce)
      })
    return () => {
      cancelled = true
      if (revoked) window.URL.revokeObjectURL(revoked)
    }
  }, [nonce])

  return {
    imageUrl,
    captchaId,
    loading,
    refresh: () => setNonce((value) => value + 1),
  }
}

const HIGHLIGHTS = [
  { icon: SparklesIcon, title: "一站式赛事管理", desc: "创建、报名、提交、评审全流程闭环" },
  { icon: ShieldCheckIcon, title: "分角色权限", desc: "选手 / 审核 / 评委 / 管理员各司其职" },
  { icon: KeyRoundIcon, title: "统一身份认证", desc: "使用学号与密码即可登录系统" },
]

export function LoginView() {
  const router = useRouter()
  const { imageUrl, captchaId, loading: captchaLoading, refresh } = useValidateCode()
  const setRole = useUserStore((state) => state.setRole)
  const setProfile = useUserStore((state) => state.setProfile)

  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [validate, setValidate] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!username.trim()) nextErrors.username = "请输入学号"
    if (!password) nextErrors.password = "请输入密码"
    if (!validate.trim()) nextErrors.validate = "请输入验证码"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const res = await login(captchaId, validate, username.trim(), password)
      if (!res.data.success) {
        toast.error("😭 登录失败", { description: res.data.errMsg ?? "请检查账号、密码与验证码" })
        setValidate("")
        refresh()
        return
      }

      writeStorage(STORAGE_KEYS.token, res.data.data.token)
      setRole(roleNumberToState(res.data.data.role))

      const profileRes = await getUserProfile()
      if (profileRes.data.success) {
        const data = profileRes.data.data
        setProfile({
          code: data.code ?? "",
          name: data.name ?? "",
          college: data.college ?? "",
          major: data.major ?? "未知",
          contact: data.contact ?? "未知",
        })
        identifyUser(data.code ?? "", data.name ?? "")
        toast.success("😸 登录成功", {
          description: `${data.code ?? ""} ${data.name ?? ""} 欢迎回来`,
        })
      } else {
        toast.error("😭 用户信息获取失败", { description: profileRes.data.errMsg ?? "" })
      }

      router.replace("/account")
    } catch {
      toast.error("😭 登录失败", { description: "网络异常，请稍后重试" })
      refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-svh flex-col lg:flex-row">
      <div className="absolute end-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* 品牌展示区 */}
      <aside className="auth-aurora relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url(/assets/login-bg.webp)" }}
          aria-hidden
        />
        <Image
          src="/assets/light-logo.svg"
          alt="SAST"
          width={220}
          height={72}
          className="h-16 w-auto dark:brightness-0 dark:invert"
          priority
        />
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight xl:text-5xl">
              通用比赛
              <br />
              管理评审系统
            </h1>
            <p className="text-muted-foreground text-balance-pretty text-base">
              南京邮电大学大学生科学技术协会出品，服务于校内各类学科竞赛的报名、材料提交与评审工作。
            </p>
          </div>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="bg-primary/12 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <item.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-foreground text-sm font-semibold">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground text-xs">
          1992 - 2025 Students&apos; Association for Science and Technology ·{" "}
          <a
            className="hover:text-primary underline underline-offset-4"
            href="https://github.com/NJUPT-SAST"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </p>
      </aside>

      {/* 表单区 */}
      <main className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="auth-aurora absolute inset-0 opacity-70 lg:hidden" aria-hidden />
        <div className="glass-panel relative z-10 w-full max-w-105 rounded-2xl border p-7 shadow-xl sm:p-9 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-filter-none">
          <div className="mb-8 space-y-2 text-center lg:text-left">
            <Image
              src="/assets/light-logo.svg"
              alt="SAST"
              width={180}
              height={60}
              className="mx-auto mb-6 h-12 w-auto lg:hidden dark:brightness-0 dark:invert"
              priority
            />
            <h2 className="text-2xl font-bold tracking-tight">欢迎回来</h2>
            <p className="text-muted-foreground text-sm">请使用学号与密码登录系统</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-username">学号</Label>
              <div className="relative">
                <UserIcon className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="login-username"
                  className="h-11 ps-9"
                  autoComplete="username"
                  placeholder="请输入学号"
                  value={username}
                  aria-invalid={Boolean(errors.username)}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              {errors.username ? (
                <p className="text-destructive text-xs">{errors.username}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">密码</Label>
              <div className="relative">
                <LockIcon className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="login-password"
                  type="password"
                  className="h-11 ps-9"
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {errors.password ? (
                <p className="text-destructive text-xs">{errors.password}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-validate">验证码</Label>
              <div className="flex items-stretch gap-3">
                <div className="relative flex-1">
                  <ShieldCheckIcon className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="login-validate"
                    className="h-11 ps-9"
                    placeholder="请输入验证码"
                    autoComplete="off"
                    value={validate}
                    aria-invalid={Boolean(errors.validate)}
                    onChange={(event) => setValidate(event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  title="点击刷新验证码"
                  className="bg-muted hover:border-primary/60 relative h-11 w-30 shrink-0 overflow-hidden rounded-md border transition-colors"
                >
                  {captchaLoading ? (
                    <span className="text-muted-foreground flex h-full items-center justify-center">
                      <Loader2Icon className="size-4 animate-spin" />
                    </span>
                  ) : imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl}
                      alt="验证码"
                      className="h-full w-full bg-white object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground flex h-full items-center justify-center gap-1 text-xs">
                      <RefreshCwIcon className="size-3" />
                      重试
                    </span>
                  )}
                </button>
              </div>
              {errors.validate ? (
                <p className="text-destructive text-xs">{errors.validate}</p>
              ) : null}
            </div>

            <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
              {submitting ? <Loader2Icon className="size-4 animate-spin" /> : null}登 录
            </Button>
          </form>

          <p className="text-muted-foreground mt-8 text-center text-xs lg:hidden">
            1992 - 2025 SAST ·{" "}
            <a
              className="hover:text-primary underline underline-offset-4"
              href="https://github.com/NJUPT-SAST"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
