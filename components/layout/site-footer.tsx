"use client"

import Image from "next/image"

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground mt-auto hidden items-center justify-between gap-3 border-t px-6 py-5 text-xs md:flex lg:px-8">
      <div className="flex items-center gap-3">
        <Image
          src="/assets/sastlogo.png"
          alt="SAST logo"
          width={96}
          height={32}
          className="h-6 w-auto object-contain opacity-70 dark:opacity-80"
        />
        <span>通用比赛管理评审系统 v3.0</span>
      </div>
      <p className="text-center">
        1992 – 2026 SAST ·{" "}
        <a
          className="hover:text-primary underline underline-offset-4"
          href="https://github.com/NJUPT-SAST"
          target="_blank"
          rel="noreferrer"
          aria-label="sast github"
        >
          GitHub
        </a>
      </p>
    </footer>
  )
}
