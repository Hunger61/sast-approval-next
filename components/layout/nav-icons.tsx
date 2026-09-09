import {
  ClipboardCheckIcon,
  FileUpIcon,
  GraduationCapIcon,
  InboxIcon,
  SettingsIcon,
  TrophyIcon,
  UserCogIcon,
  UserRoundIcon,
} from "lucide-react"

/** 导航图标名 → lucide 组件，侧边栏与手机底部导航共用 */
export const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: UserRoundIcon,
  inbox: InboxIcon,
  send: TrophyIcon,
  settings: SettingsIcon,
  clipboard: ClipboardCheckIcon,
  import: FileUpIcon,
  users: UserCogIcon,
  students: GraduationCapIcon,
}
