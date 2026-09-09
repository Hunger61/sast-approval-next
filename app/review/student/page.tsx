"use client"

import { UserRoundIcon } from "lucide-react"
import { importAccountsFromExcel } from "@/lib/api/judge"
import AccountManager, type { AccountRecord } from "@/components/manage/account-manager"
import type { AccountManagerProps } from "@/components/manage/account-manager"

export default function ReviewStudentPage() {
  const managerProps: AccountManagerProps = {
    title: "学生管理",
    description: "审批人员管理学生账号，直接在网页上新增、编辑、删除，也可导入 Excel。",
    entity: "学生",
    emptyIcon: UserRoundIcon,
    listAccounts: (pageNum, pageSize) => Promise.resolve({ data: { success: true, data: { records: [], total: 0 } } }),
    createAccount: async () => Promise.resolve({ data: { success: true } }),
    editAccount: async () => Promise.resolve({ data: { success: true } }),
    deleteAccount: async () => Promise.resolve({ data: { success: true } }),
    importAccount: async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      return importAccountsFromExcel(formData)
    },
  }

  return <AccountManager {...managerProps} />
}