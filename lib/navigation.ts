import type { UserRole } from "@/lib/store/user"

export type NavItem = {
  href: string
  label: string
  icon: string
  /** 是否显示未读红点 */
  badge?: "inbox"
}

/** 侧边栏导航，逐条对应旧版 AdminMenu / ApproveMenu / JudgeMenu / UserMenu */
export const NAV_BY_ROLE: Record<Exclude<UserRole, "offline">, NavItem[]> = {
  admin: [
    { href: "/account", label: "我的账号", icon: "dashboard" },
    { href: "/inbox", label: "收件箱", icon: "inbox", badge: "inbox" },
    { href: "/activity", label: "比赛入口", icon: "send" },
    { href: "/manage", label: "比赛管理", icon: "settings" },
    { href: "/manage/judge", label: "评委管理", icon: "users" },
  ],
  approver: [
    { href: "/account", label: "我的账号", icon: "dashboard" },
    { href: "/inbox", label: "收件箱", icon: "inbox", badge: "inbox" },
    { href: "/activity", label: "比赛入口", icon: "send" },
    { href: "/review", label: "比赛评审", icon: "clipboard" },
  ],
  judge: [
    { href: "/account", label: "我的账号", icon: "dashboard" },
    { href: "/inbox", label: "收件箱", icon: "inbox", badge: "inbox" },
    { href: "/activity", label: "比赛入口", icon: "send" },
    { href: "/review", label: "比赛审核", icon: "clipboard" },
    { href: "/import", label: "一键导入", icon: "import" },
  ],
  user: [
    { href: "/account", label: "我的账号", icon: "dashboard" },
    { href: "/inbox", label: "收件箱", icon: "inbox", badge: "inbox" },
    { href: "/activity", label: "比赛入口", icon: "send" },
  ],
}

/** 每个角色可访问的路由白名单，未命中渲染 404，行为等价于旧版按角色注册路由表 */
const ROUTES_BY_ROLE: Record<Exclude<UserRole, "offline">, string[]> = {
  admin: [
    "/",
    "/account",
    "/inbox",
    "/activity",
    "/activity/detail",
    "/activity/manage",
    "/activity/manage/edit",
    "/activity/manage/white-list",
    "/activity/notice",
    "/manage",
    "/manage/create",
    "/manage/judge",
  ],
  approver: [
    "/",
    "/account",
    "/inbox",
    "/activity",
    "/activity/detail",
    "/review",
    "/review/list",
    "/review/detail",
  ],
  judge: [
    "/",
    "/account",
    "/inbox",
    "/activity",
    "/activity/detail",
    "/review",
    "/review/list",
    "/review/detail",
    "/import",
  ],
  user: [
    "/",
    "/account",
    "/inbox",
    "/activity",
    "/activity/detail",
    "/activity/register",
    "/activity/register-detail",
    "/activity/work-detail",
  ],
}

/** 是否为一级页面（侧边栏 / 底部导航直达的页面） */
export function isTopLevelPath(role: UserRole, pathname: string) {
  if (role === "offline") return false
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname
  if (normalized === "/") return true
  return NAV_BY_ROLE[role].some((item) => item.href === normalized)
}

/**
 * 当前应该高亮的菜单项 href，没有匹配时返回 null。
 *
 * 菜单项之间可能存在前缀关系（`/manage` 与 `/manage/judge`），
 * 只认匹配得最长的那一项，否则父子两项会同时高亮。
 */
export function activeNavHref(role: UserRole, pathname: string) {
  if (role === "offline") return null
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname
  // 登录后的落地页重定向到 /account，根路径按「我的账号」高亮
  if (normalized === "/") return "/account"
  return NAV_BY_ROLE[role].reduce<string | null>((best, item) => {
    const matched = normalized === item.href || normalized.startsWith(`${item.href}/`)
    if (!matched) return best
    return best === null || item.href.length > best.length ? item.href : best
  }, null)
}

export function canAccess(role: UserRole, pathname: string) {
  if (role === "offline") return false
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname
  return ROUTES_BY_ROLE[role].includes(normalized)
}

/** 面包屑名称映射，沿用旧版 TopBar 的文案 */
export function breadcrumbNameMap(role: UserRole): Record<string, string> {
  const reviewValue = role === "judge" ? "比赛审核" : "比赛评审"
  return {
    "/activity": "比赛入口",
    "/inbox": "收件箱",
    "/manage": "比赛管理",
    "/manage/create": "创建比赛",
    "/manage/judge": "评委管理",
    "/account": "我的账号",
    "/review": reviewValue,
    "/review/list": "项目列表",
    "/review/detail": role === "judge" ? "项目审核" : "项目评审",
    "/activity/detail": "比赛详情",
    "/activity/register": "比赛报名",
    "/activity/register-detail": "报名参加详情",
    "/activity/work-detail": "项目提交信息",
    "/activity/manage": "管理比赛",
    "/activity/manage/edit": "编辑比赛",
    "/activity/manage/white-list": "编辑白名单",
    "/activity/notice": "发布公告",
    "/import": "一键导入",
  }
}

/** 生成带查询参数的路径 */
export function withQuery(path: string, query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}
