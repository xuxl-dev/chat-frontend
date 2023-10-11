import type { Ref } from 'vue'
import { ACKMsgType, getMessageStr, MessageFlag, type Message } from './helpers/messageHelper'
import useChatStore, { getChatSession } from '@/store/modules/chatStore'

export class MessageWarp {
  static _id = 0
  tid: number = MessageWarp._id++
  group: boolean
  showAvatar: boolean

  _msg: Message

  private constructor() { }

  static fromMessage(message: Message): MessageWarp {
    const warp = new MessageWarp()
    warp._msg = message
    if (message.msgId) {
      console.log('set', message.msgId, warp)
    }
    // these messages sent by me has no msgId,
    // they are processed when sent is done, server will send back a msgId

    return warp
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

  get status(): 'SENT' | 'DELIVERED' | 'READ' {
    if (this._msg.hasReadCount > 0) {
      return 'READ'
    } else if (this._msg.hasReadCount === 0) {
      return 'DELIVERED'
    } else {
      return 'SENT'
    }
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


  /**
   * when receive a ack message, update this message
   * @param type 
   */
  updateAck(type: ACKMsgType) {
    if (type === ACKMsgType.READ) {
      if (this._msg.hasReadCount > 0) {
        this._msg.hasReadCount += 1
      }
      this._msg.hasReadCount = 1
    } else { // DELIVERED
      this._msg.hasReadCount = 0
    }
  }

  /**
   * send ack to this message
   * @param type 
   */
  ack(type: ACKMsgType) {
    getChatSession(this.senderId).sendRawQuick(
      {
        ackMsgId: this.id,
        type: ACKMsgType.READ
      },
      MessageFlag.ACK
    )
  }

}



export class StackedMessage {
  static _stack_id = 0
  stack_id: number = StackedMessage._stack_id++
  messages: Ref<MessageWarp>[] = []

  constructor(arr: (Ref<MessageWarp>)[] = []) {
    this.messages = arr
  }

  append(message: Ref<MessageWarp>) {
    this.messages.push(message)
  }

  public get sender(): User {
    return User.fromId(+this.messages[0].value.senderId)
  }
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
