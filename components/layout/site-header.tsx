"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { breadcrumbNameMap, isTopLevelPath } from "@/lib/navigation"
import { useUserStore } from "@/lib/store/user"
import { useUiStore } from "@/lib/store/ui"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const role = useUserStore((state) => state.role)
  const pageLabel = useUiStore((state) => state.pageLabel)

  const crumbs = React.useMemo(() => {
    const map = breadcrumbNameMap(role)
    const segments = pathname.split("/").filter(Boolean)
    const list: { href: string; label: string }[] = []
    let acc = ""
    for (const segment of segments) {
      acc += `/${segment}`
      const label = map[acc]
      if (label) list.push({ href: acc, label })
    }
    if (pageLabel && list.length > 0) {
      list[list.length - 1] = { ...list[list.length - 1], label: pageLabel }
    }
    return list
  }, [pathname, role, pageLabel])

  const topLevel = isTopLevelPath(role, pathname)
  const current = crumbs[crumbs.length - 1]
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push(parent?.href ?? "/account")
  }

  return (
    <header className="bg-background/85 supports-backdrop-filter:bg-background/70 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-5">
      {/* 手机端：一级页面显示菜单按钮，子页面显示返回 */}
      {topLevel ? (
        <SidebarTrigger className="-ms-1" />
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="返回上一级"
            onClick={goBack}
            className="-ms-1 md:hidden"
          >
            <ChevronLeftIcon className="size-5" />
          </Button>
          <SidebarTrigger className="-ms-1 hidden md:inline-flex" />
        </>
      )}

      {/* 手机端标题 */}
      <p className="min-w-0 flex-1 truncate text-sm font-semibold md:hidden">
        {current?.label ?? "主页"}
      </p>

      {/* 桌面端面包屑 */}
      <Breadcrumb className="hidden min-w-0 flex-1 md:block">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/account">主页</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                {index === crumbs.length - 1 ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="truncate">
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className={cn("hidden", !topLevel && "md:inline-flex")}
        >
          <ChevronLeftIcon className="size-4" />
          返回
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
