"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsUpDownIcon, LogOutIcon, UserRoundIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NAV_ICONS } from "@/components/layout/nav-icons"
import { NAV_BY_ROLE, activeNavHref } from "@/lib/navigation"
import { ROLE_LABEL, useUserStore, type UserRole } from "@/lib/store/user"

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname()
  const role = useUserStore((state) => state.role)
  const profile = useUserStore((state) => state.profile)
  const inboxPoint = useUserStore((state) => state.inboxPoint)
  const { isMobile, setOpenMobile } = useSidebar()

  if (role === "offline") return null
  const items = NAV_BY_ROLE[role as Exclude<UserRole, "offline">]

  const activeHref = activeNavHref(role, pathname)

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex h-12 items-center gap-2.5 px-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
            S
          </div>
          <div className="grid flex-1 gap-0.5 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">比赛管理评审</span>
            <span className="text-muted-foreground truncate text-xs">NJUPT · SAST</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon] ?? UserRoundIcon
                const showDot = item.badge === "inbox" && inboxPoint === "on"
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.href === activeHref}
                      tooltip={item.label}
                      className="h-9 data-[active=true]:font-medium"
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {showDot ? (
                          <span className="bg-destructive size-2 shrink-0 rounded-full group-data-[collapsible=icon]:hidden" />
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={profile.name || "我的账号"}
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src="/assets/avatar-logo.png" alt={profile.name} />
                    <AvatarFallback className="rounded-lg">
                      {profile.name?.slice(0, 1) || <UserRoundIcon className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{profile.name || "未命名"}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {ROLE_LABEL[role]}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="text-muted-foreground ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-medium">{profile.name || "未命名"}</p>
                  <p className="text-muted-foreground font-mono text-xs">{profile.code || "—"}</p>
                  <Badge variant="secondary" className="mt-1">
                    {ROLE_LABEL[role]}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" onClick={() => isMobile && setOpenMobile(false)}>
                    <UserRoundIcon className="size-4" /> 我的账号
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onLogout}>
                  <LogOutIcon className="size-4" /> 退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
