import type { Message } from './helpers/messageHelper'

export interface IMessage {
  id: number
  senderId: number
  senderAvatar: string
  receiverName?: string
  text: string
  read: boolean
  group: boolean
  readCount: number
}

export class MessageWarp implements IMessage {
  static _id = 0
  id: number = MessageWarp._id++
  senderId: number
  senderAvatar: string
  text: string
  read: boolean
  group: boolean
  readCount: number

  showAvatar: boolean;
  [key: string]: any

  constructor(
    senderId: number,
    senderAvatar: string,
    text: string | string,
    read: boolean = false,
    group: boolean = false,
    readCount: number = 0
  ) {
    this.senderId = senderId // 发送者姓名
    this.senderAvatar = senderAvatar // 发送者头像
    this.text = text // 聊天文本内容
    this.read = read // 是否已读
    this.group = group // 是否为群组聊天
    this.readCount = readCount // 已读计数（仅在群组聊天中使用）
    this.showAvatar = true // 是否显示头像
  }

  static fromMessage(message: Message): MessageWarp {
    // if sender not exists, new a user
    if (message.senderId && !User.has(message.senderId)) {
      User.fromId(message.senderId) //TODO: implement this
    }
    return new MessageWarp(
      message.senderId,
      message.receiverId + '',
      message.content.toString(),
      message.hasReadCount > 0,
      message.flag === 1, //TODO: implement this
      message.hasReadCount
    )
  }

  get sender(): User {
    return User.fromId(+this.senderId)
  }
}

export class StackedMessage {
  static _stack_id = 0
  stack_id: number = StackedMessage._stack_id++
  messages: MessageWarp[] = []

  constructor(arr: MessageWarp[] = []) {
    this.messages = arr
  }

  append(message: MessageWarp) {
    this.messages.push(message)
  }

  public get sender(): User {
    return User.fromId(+this.messages[0].senderId)
  }
}

export function mergeAdjacentMessages(
  messages: MessageWarp[]
): StackedMessage[] {
  const ret: StackedMessage[] = []
  let lastSenderId = -1

  messages.forEach((message) => {
    if (message.senderId === lastSenderId) {
      ret[ret.length - 1].append(message)
    } else {
      ret.push(new StackedMessage([message]))
    }
    lastSenderId = message.senderId
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

  static _cache: Map<number, User> = new Map()

  static fromId(id: number): User {
    if (User._cache.has(id)) {
      return User._cache.get(id)
    } else {
      const user = new User(id, 'uid' + id, '') // TODO: implement this
      User._cache.set(id, user)
      return user
    }
  }

  static has(id: number): boolean {
    return User._cache.has(id)
  }
}
