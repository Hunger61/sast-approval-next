"use client"

import { UserCogIcon } from "lucide-react"
import AccountManager from "@/components/manage/account-manager"
import type { AccountManagerProps } from "@/components/manage/account-manager"
import {
  assignJudge,
  createJudgeAccount,
  deleteJudgeAccount,
  editJudgeAccount,
  getJudgeAccountList,
} from "@/lib/api/admin"

export default function ManageJudgePage() {
  const managerProps: AccountManagerProps = {
    title: "评委管理",
    description: "管理评委账号，直接在网页上新增、编辑、删除，无需导入 Excel。",
    entity: "评委",
    emptyIcon: UserCogIcon,
    listAccounts: getJudgeAccountList,
    createAccount: createJudgeAccount,
    editAccount: editJudgeAccount,
    deleteAccount: deleteJudgeAccount,
    importAccount: (file) => {
      const formData = new FormData()
      formData.append("file", file)
      return assignJudge(formData)
    },
  }

  return <AccountManager {...managerProps} />
}
