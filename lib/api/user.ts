"use client"

import { apis } from "./client"

/**
 * 获取所有比赛列表
 * @param cur 当前页数
 * @param limit 每页数据条数
 * @return axios对象
 */
export const getAllCompetitionList = (cur: number, limit: number) => {
  return apis({
    method: "GET",
    url: "/user/com/list?cur=" + cur.toString() + "&limit=" + limit.toString(),
  })
}

/**
 * 搜索比赛
 * @param key 搜索关键词
 * @param cur 当前页数
 * @param limit 每页显示的数量
 * @returns axios对象
 */
export const searchCompetition = (key: string, cur: number, limit: number) => {
  return apis({
    method: "GET",
    url: "/user/com/search?cur=" + cur.toString() + "&limit=" + limit.toString() + "&key=" + key,
  })
}

/**
 * 获取已报名比赛列表
 * @param cur 页数
 * @param limit 每页数据量
 * @return axios对象
 */
export const getSignedCompetitionList = (cur: number, limit: number) => {
  return apis({
    method: "get",
    url: "/user/com/signList?cur=" + cur.toString() + "&limit=" + limit.toString(),
  })
}

/**
 * 获取比赛详情
 * @param competitionId 比赛 id
 * @returns axios对象
 */
export const getCompetitionInfo = (competitionId: number) => {
  return apis({
    method: "get",
    url: "/user/com/info/" + competitionId.toString(),
  })
}

/**
 * 获取比赛报名信息
 * @param competitionId 比赛 id
 * @returns axios对象
 */
export const getCompetitionSignInfo = (competitionId: number) => {
  return apis({
    method: "get",
    url: "/user/com/signInfo/" + competitionId.toString(),
  })
}

/**
 * 报名比赛
 * @param competitionId 比赛的Id
 * @param teamName 团队名称
 * @param teamMember 团队成员
 * @param teacherMember 指导老师
 * @returns axios对象
 */
export const signUp = (
  competitionId: number,
  teamName: string | null,
  teamMember: { name: string; code: string }[],
  teacherMember: { name: string; code: string }[]
) => {
  return apis({
    method: "POST",
    url: "/user/com/signUp",
    data: {
      comId: competitionId,
      teamName: teamName,
      teamMember: [...teamMember],
      teacherMember: [...teacherMember],
    },
  })
}

/**
 * 获取比赛团队信息
 * @param competitionId 比赛Id
 * @returns axios对象
 */
export const getTeamInfo = (competitionId: number) => {
  return apis({
    method: "get",
    url: "/user/com/teamInfo/" + competitionId.toString(),
  })
}

/**
 * 上传审批项目
 * @param competitionId 比赛 id
 * @param input 输入框名
 * @param file 评审项目
 * @param onProgress 上传进度回调
 * @returns axios对象
 */
export const uploadWork = (
  competitionId: number,
  input: string,
  file: File,
  onProgress?: (event: { percent: string }, file: File) => void
) => {
  const data = new FormData()
  data.append("id", competitionId.toString())
  data.append("input", input)
  data.append("file", file)
  return apis({
    method: "POST",
    url: "/user/com/upload",
    data: data,
    onUploadProgress: ({ total, loaded }) => {
      if (onProgress && total) {
        onProgress({ percent: ((loaded / total) * 100).toFixed(2) }, file)
      }
    },
  })
}

/**
 * 删除评审项目
 * @param competitionId 比赛Id
 * @returns axios对象
 */
export const deleteWork = (competitionId: number) => {
  const data = new FormData()
  data.append("id", competitionId.toString())
  return apis({
    method: "POST",
    url: "/user/com/delete",
    data: data,
  })
}

/**
 * 获取已提交项目信息
 * @param competitionId 比赛Id
 * @returns axios对象
 */
export const getWorkInfo = (competitionId: number) => {
  return apis({
    method: "get",
    url: "/user/com/getSchema/" + competitionId.toString(),
  })
}

/**
 * 获取项目资料表单
 * @param competitionId 比赛Id
 * @returns axios对象
 */
export const getWorkSchema = (competitionId: number) => {
  return apis({
    method: "get",
    url: "/user/com/schema/" + competitionId.toString(),
  })
}

/**
 * 提交项目资料表单
 * @param competitionId 比赛Id
 * @param data 表单数据
 * @returns axios对象
 */
export const uploadWorkSchema = (competitionId: number, data: unknown) => {
  return apis({
    method: "POST",
    url: "/user/com/uploadSchema/" + competitionId.toString(),
    data: {
      data: data,
    },
  })
}

/**
 * 获取当前用户信息
 * @returns axios对象
 */
export const getUserProfile = () => {
  return apis({
    method: "get",
    url: "/user/profile",
  })
}

/**
 * 获取对象存储直传凭证
 */
export const getLicense = (name: string, input: string, id: number) => {
  return apis({
    method: "get",
    url: `/user/com/uploadCertificate?id=${id}&input=${input}&filename=${name}`,
  })
}
