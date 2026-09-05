"use client"

import { create } from "zustand"
import { STORAGE_KEYS, clearStorage, readStorage, writeStorage } from "@/lib/storage"
import type { UserProfile } from "@/lib/types/api"

/** 用户角色：未登录 / 学生 / 审核(judge) / 评委(approver) / 管理员 */
export type UserRole = "offline" | "user" | "judge" | "approver" | "admin"

const EMPTY_PROFILE: UserProfile = {
  code: "",
  name: "",
  major: "",
  college: "",
  contact: "",
}

/** 后端 role 数字 -> 前端角色字符串（与旧版一致） */
export function roleNumberToState(role: number): UserRole {
  switch (role) {
    case 0:
      return "user"
    case 1:
      return "judge"
    case 2:
      return "approver"
    case 3:
      return "admin"
    default:
      return "offline"
  }
}

/** 角色字符串 -> 后端 role 数字 */
export function roleStateToNumber(role: UserRole): number {
  switch (role) {
    case "admin":
      return 3
    case "user":
      return 0
    case "judge":
      return 1
    case "approver":
      return 2
    default:
      return 0
  }
}

export const ROLE_LABEL: Record<UserRole, string> = {
  offline: "未登录",
  user: "参赛选手",
  judge: "审核人员",
  approver: "评审专家",
  admin: "系统管理员",
}

type UserStore = {
  /** 是否已从 localStorage 完成水合 */
  hydrated: boolean
  role: UserRole
  profile: UserProfile
  /** 收件箱红点：'on' 有红点，其它无 */
  inboxPoint: string
  hydrate: () => void
  setRole: (role: UserRole) => void
  setProfile: (profile: Partial<UserProfile>) => void
  setInboxPoint: (point: string) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  hydrated: false,
  role: "offline",
  profile: EMPTY_PROFILE,
  inboxPoint: "on",

  hydrate: () => {
    const role = (readStorage(STORAGE_KEYS.userState) as UserRole | null) ?? "offline"
    set({
      hydrated: true,
      role,
      inboxPoint: readStorage(STORAGE_KEYS.inboxPoint) ?? "on",
      profile: {
        code: readStorage(STORAGE_KEYS.code) ?? "",
        name: readStorage(STORAGE_KEYS.name) ?? "",
        major: readStorage(STORAGE_KEYS.major) ?? "",
        college: readStorage(STORAGE_KEYS.college) ?? "",
        contact: readStorage(STORAGE_KEYS.contact) ?? "",
      },
    })
  },

  setRole: (role) => {
    writeStorage(STORAGE_KEYS.userState, role)
    set({ role })
  },

  setProfile: (profile) =>
    set((state) => {
      const next = { ...state.profile, ...profile }
      writeStorage(STORAGE_KEYS.code, next.code)
      writeStorage(STORAGE_KEYS.name, next.name)
      writeStorage(STORAGE_KEYS.major, next.major)
      writeStorage(STORAGE_KEYS.college, next.college)
      writeStorage(STORAGE_KEYS.contact, next.contact)
      return { profile: next }
    }),

  setInboxPoint: (point) => {
    writeStorage(STORAGE_KEYS.inboxPoint, point)
    set({ inboxPoint: point })
  },

  logout: () => {
    clearStorage()
    writeStorage(STORAGE_KEYS.userState, "offline")
    set({ role: "offline", profile: EMPTY_PROFILE })
  },
}))
