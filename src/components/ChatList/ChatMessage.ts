import type { Ref } from 'vue'
import { getMessageStr} from './helpers/messageHelper'
import useChatStore, { debounceSyncMsg, getChatSession } from '@/store/modules/chatStore'
import type { ILocalMessage } from '@/utils/db'
import { Message, ACKMsgType, MessageFlag } from '../../modules/advancedChat/base';

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
    return warp
  }

  static fromDbMessage(message: ILocalMessage): MessageWarp {
    const warp = new MessageWarp()
    warp._msg = new Message(message)
    return warp
  }

  get senderId(): number {
    return this._msg.senderId
  }

  get sentAt(): Date {
    return new Date(this._msg.sentAt)
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
      } else {
        this._msg.hasReadCount = 1
      }
    } else { // DELIVERED
      if (this._msg.hasReadCount > 0) {
        throw new Error('this message has been read, cannot update to DELIVERED')
      }
      this._msg.hasReadCount = 0
    }
    debounceSyncMsg(this._msg.msgId, this._msg)
  }

  /**
   * send ack to this message
   * @param type 
   */
  ack(type: ACKMsgType = ACKMsgType.READ) {
    getChatSession(this.senderId).sendRawQuick(
      {
        ackMsgId: this.id,
        type: type
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

  insertAt(message: Ref<MessageWarp>, index: number) {
    this.messages.splice(index, 0, message)
  }

  public get sender(): User {
    if (this.messages.length === 0) {
      throw new Error('cannot get sender from empty message stack')
    }
    return User.fromId(+this.messages[0].value.senderId)
  }

  public get range(): [Date, Date] {
    return [
      this.messages.at(0).value.sentAt,
      this.messages.at(-1).value.sentAt
    ]
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
