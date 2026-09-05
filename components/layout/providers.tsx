"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { useUserStore } from "@/lib/store/user"
import { printConsoleBanner } from "@/lib/console-banner"
import { initMonitoring } from "@/lib/monitoring"

/** 应用启动时把 localStorage 中的登录态注入 zustand */
function StoreHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useUserStore((state) => state.hydrate)
  React.useEffect(() => {
    hydrate()
    printConsoleBanner()
    initMonitoring()
  }, [hydrate])
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <StoreHydrator>{children}</StoreHydrator>
        <Toaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  )
}
