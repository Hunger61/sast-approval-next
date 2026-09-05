/** 表格数据类型 */
export interface DataType {
  total: number // 总的数据条数
  list: [] // 获取的数据列表
  pageNum: number // 当前页码
  pageSize: number // 一页的数据条数
  pages: number // 总页数
  isFirstPage: boolean // 第一页
  isLastPage: boolean // 最后一页
}

export interface DataListType {
  id: number // id
  title: string // 比赛名称
  totalNum: number // 比赛总数
  completedNum: number // 已经完成的数目
  startDate: string // 比赛开始时间
  endDate: string // 比赛结束时间
}

/** 评审 / 审核 项目列表条目 */
export interface ProgramListItem {
  id: number
  title: string
  score?: number | null
  opinion?: string
  isPass?: boolean | string
  isApprove?: boolean
  isJudge?: boolean
}

/** 项目详情（评审 / 审核） */
export interface ProgramInfo {
  title: string
  teamName?: string
  introduce: string
  teacher?: string
  memberNum?: number
  score?: number
  opinion?: string
  captain?: { name: string; code: string }
  memberList: { name: string; code: string; isCaptain?: string }[]
  accessories: { file: string; url: string }[]
  texts: { input: string; content: string }[]
}
