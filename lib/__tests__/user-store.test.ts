import { ROLE_LABEL, roleNumberToState, roleStateToNumber, useUserStore } from "@/lib/store/user"
import { STORAGE_KEYS } from "@/lib/storage"

describe("用户状态", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useUserStore.setState({
      hydrated: false,
      role: "offline",
      profile: { code: "", name: "", major: "", college: "", contact: "" },
      inboxPoint: "on",
    })
  })

  it("后端 role 与前端角色的映射与旧版一致", () => {
    expect(roleNumberToState(0)).toBe("user")
    expect(roleNumberToState(1)).toBe("judge")
    expect(roleNumberToState(2)).toBe("approver")
    expect(roleNumberToState(3)).toBe("admin")
    expect(roleNumberToState(99)).toBe("offline")

    expect(roleStateToNumber("user")).toBe(0)
    expect(roleStateToNumber("judge")).toBe(1)
    expect(roleStateToNumber("approver")).toBe(2)
    expect(roleStateToNumber("admin")).toBe(3)
  })

  it("角色中文名可用于界面展示", () => {
    expect(ROLE_LABEL.admin).toBe("系统管理员")
    expect(ROLE_LABEL.user).toBe("参赛选手")
  })

  it("从 localStorage 水合登录态，键名与旧版兼容", () => {
    window.localStorage.setItem(STORAGE_KEYS.userState, "admin")
    window.localStorage.setItem(STORAGE_KEYS.name, "王小明")
    window.localStorage.setItem(STORAGE_KEYS.code, "B21021021")
    window.localStorage.setItem(STORAGE_KEYS.inboxPoint, "off")

    useUserStore.getState().hydrate()

    const state = useUserStore.getState()
    expect(state.hydrated).toBe(true)
    expect(state.role).toBe("admin")
    expect(state.profile.name).toBe("王小明")
    expect(state.inboxPoint).toBe("off")
  })

  it("设置资料时同步写回 localStorage", () => {
    useUserStore.getState().setProfile({ code: "B2101", name: "李四" })
    expect(window.localStorage.getItem(STORAGE_KEYS.code)).toBe("B2101")
    expect(window.localStorage.getItem(STORAGE_KEYS.name)).toBe("李四")
  })

  it("退出登录会清空存储并把角色重置为 offline", () => {
    window.localStorage.setItem(STORAGE_KEYS.token, "t")
    useUserStore.getState().setRole("admin")
    useUserStore.getState().logout()

    expect(useUserStore.getState().role).toBe("offline")
    expect(window.localStorage.getItem(STORAGE_KEYS.token)).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEYS.userState)).toBe("offline")
  })
})
