"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_BY_ROLE, isTopLevelPath } from "@/lib/navigation"
import { NAV_ICONS } from "@/components/layout/nav-icons"
import { useUserStore, type UserRole } from "@/lib/store/user"
import { cn } from "@/lib/utils"

/**
 * 手机端底部导航。只在一级页面显示，进入详情页后隐藏，
 * 由页头的返回按钮与页面底部操作栏接管。
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const role = useUserStore((state) => state.role)
  const inboxPoint = useUserStore((state) => state.inboxPoint)

  if (role === "offline" || !isTopLevelPath(role, pathname)) return null
  const items = NAV_BY_ROLE[role as Exclude<UserRole, "offline">]

  return (
    <nav
      aria-label="主导航"
      className="bg-background/92 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-14" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon]
          const active =
            item.href === "/account"
              ? pathname === "/" || pathname === "/account"
              : pathname === item.href
          const showDot = item.badge === "inbox" && inboxPoint === "on"
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] leading-none font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground active:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {showDot ? (
                    <span className="bg-destructive ring-background absolute -top-0.5 -end-0.5 size-2 rounded-full ring-2" />
                  ) : null}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
