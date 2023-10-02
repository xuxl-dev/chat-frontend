
export interface IMessage {
  id: number
  senderName: string
  senderAvatar: string
  receiverName?: string
  text: string
  read: boolean
  group: boolean
  readCount: number
}

export class Message implements IMessage {
  id: number
  senderName: string
  senderAvatar: string
  text: string
  read: boolean
  group: boolean
  readCount: number

  showAvatar: boolean;
  [key: string]: any

  constructor(
    id: number,
    senderName: string,
    senderAvatar: string,
    text: string | string,
    read: boolean = false,
    group: boolean = false,
    readCount: number = 0
  ) {
    this.id = id // 消息ID
    this.senderName = senderName // 发送者姓名
    this.senderAvatar = senderAvatar // 发送者头像
    this.text = text // 聊天文本内容
    this.read = read // 是否已读
    this.group = group // 是否为群组聊天
    this.readCount = readCount // 已读计数（仅在群组聊天中使用）
    this.showAvatar = true // 是否显示头像
  }
}

export class StackedMessage {
  static _stack_id = 0
  stack_id: number = StackedMessage._stack_id++
  messages: Message[] = []

  constructor(arr: Message[] = []) {
    this.messages = arr
  }

  append(message: Message) {
    this.messages.push(message)
  }

  public get sender(): string {
    return this.messages?.[0].senderName ?? ''
  }
}

export function mergeAdjacentMessages(messages: Message[]): StackedMessage[] {
  const ret: StackedMessage[] = []
  let lastSenderName = ''

  messages.forEach((message) => {
    if (message.senderName === lastSenderName) {
      ret[ret.length - 1].append(message)
    } else {
      ret.push(new StackedMessage([message]))
    }
    lastSenderName = message.senderName
  })

  return ret
}

export class User {
  id: number
  name: string
  avatar: string

  constructor(id: number, name: string, avatar: string) {
    this.id = id
    this.name = name
    this.avatar = avatar
  }
}
