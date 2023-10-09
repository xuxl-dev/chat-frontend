import { triggerRef } from 'vue'
import { getMessageStr, type Message } from './helpers/messageHelper'
import useChatStore, { ChatSession, getChatSession } from '@/store/modules/chatStore'

export const activeWarps: Map<string, MessageWarp> = new Map()

export class MessageWarp {
  static _id = 0
  tid: number = MessageWarp._id++
  group: boolean
  showAvatar: boolean

  private _msg: Message

  private constructor() {}

  static fromMessage(message: Message): MessageWarp {
    const warp = new MessageWarp()
    warp._msg = message
    if (message.msgId) {
      console.log('set', message.msgId, warp)
      activeWarps.set(message.msgId, warp)
    }
    // these messages sent by me has no msgId,
    // they are processed when sent is done, server will send back a msgId

    return warp
  }

  static get(msgId: string) {
    const activeWarp = activeWarps.get(msgId)
    if (activeWarp) {
      return activeWarp
    }
    // if not, try retrieve from local indexedDB, then server
    throw new Error('Message not found')
  }

  get senderId(): number {
    return this._msg.senderId
  }

  get text(): string {
    if (typeof this._msg.content === 'object') {
      return `[DEBUG] \n ${getMessageStr(this._msg)}`
    }
    return this._msg.content
  }

  get readCount(): number {
    return this._msg.hasReadCount
  }

  get status(): 'DELIVERED' | 'READ' {
    if (!this._msg.hasReadCount) {
      return 'DELIVERED'
    }
    return this._msg.hasReadCount > 0 ? 'READ' : 'DELIVERED'
  }

  get senderAvatar(): string {
    // get from db
    return '' //TODO: implement this
  }

  get sender(): User {
    return User.fromId(+this.senderId)
  }

  get id(): string {
    return this._msg.msgId
  }

  
  ack(type: 'read' | 'delivered' = 'read') {
    console.log('@@ack', this._msg.msgId)
    if (type === 'read') {
      if (this._msg.hasReadCount > 0) { //TODO: implement this
        this._msg.hasReadCount += 1
      }
      this._msg.hasReadCount = 1
    } else {
      this._msg.hasReadCount = 0
    }
    getChatSession(this._msg.receiverId).chat.value.set(this._msg.msgId, this)
  }

  /**@deprecated */
  triggerUpdate() {
    //TODO: this has effencicy problem
    useChatStore().getChatSession(this._msg.receiverId).refresh()
  }
}

export class StackedMessage {
  static _stack_id = 0
  stack_id: number = StackedMessage._stack_id++
  messages: (MessageWarp | Readonly<MessageWarp>)[] = []

  constructor(arr: (MessageWarp | Readonly<MessageWarp>)[] = []) {
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
  avatar: string;
  [key: string]: any
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
