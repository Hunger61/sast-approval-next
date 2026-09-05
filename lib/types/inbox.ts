export type InboxMessagePropsType = {
  localIndex: number
  index: number
  readState: boolean
  foldState: boolean
  allChildState: { read: boolean; fold: boolean }[]
  controlAllReadState: (messageReadState: boolean) => void
  controlAllFoldState: (messageFoldState: boolean) => void
  controlChildState: (localindex: number, newReadState: boolean, newFoldState: boolean) => void
}

export type InboxMessageType = {
  id: string
  title: string
  content: string
  post: string
  time: string
  haveRead: boolean
  isfold: boolean
}
