"use client"

import { create } from "zustand"

type UiStore = {
  /** 面包屑中用于替代动态 id 的可读名称，如比赛名 */
  pageLabel: string | null
  setPageLabel: (label: string | null) => void
}

export const useUiStore = create<UiStore>((set) => ({
  pageLabel: null,
  setPageLabel: (pageLabel) => set({ pageLabel }),
}))
