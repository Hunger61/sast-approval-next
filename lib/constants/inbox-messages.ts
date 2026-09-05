import type { InboxMessageType } from "@/lib/types/inbox"

/**
 * 站内信内容。与旧版一致：目前仅有一条系统欢迎信息，
 * 后端暂未提供站内信接口，保留数据结构以便后续接入。
 */
export const INBOX_MESSAGES: InboxMessageType[] = [
  {
    id: "WelcomeMessage",
    title: "欢迎使用评审系统",
    post: "校大学生科协",
    time: "2022-08-29 18:00",
    content: "欢迎使用评审系统，如果您在使用过程中遇到问题，请联系校大学生科协。",
    haveRead: false,
    isfold: true,
  },
]
