export class CreateMessageDto {
  receiverId!: number
  content!: string | object
  flag!: MessageFlag
}

export enum MessageFlag {
  NONE = 0,
  DO_NOT_STORE = 1 << 0, // do not store this message in database, may fail to deliver
  ACK = 1 << 1, // this message is an ACK message
  BROADCAST = 1 << 2, // this message is a broadcast message
  E2EE = 1 << 3, // this message is encrypted //TODO this is redundant
  KEY_EXCHANGE = 1 << 4, // this message is a key exchange message
  WITHDRAW = 1 << 5, // this message is a withdraw message
  COMPLEX = 1 << 6, // this message is a complex message, the content is a nested message
  PRESAVED_RSA = 1 << 7, //use presaved RSA key to encrypt (the target user must have a presaved RSA key)
  HEARTBEAT = 1 << 8 // this message is a heartbeat message
}

export function isFlagSet(flag: number, message: Message) {
  return !!(message.flag & flag)
}

export enum ACKMsgType {
  'DELIVERED',
  'RECEIVED',
  'READ'
}

export type MsgId = string

export interface IMessage {
  msgId?: MsgId
  senderId: number
  receiverId: number
  content: string | { [key: string]: any }
  sentAt: Date
  hasReadCount?: number
  flag: number
}

export class Message implements IMessage {
  msgId?: MsgId

  senderId: number

  receiverId: number

  content: string | { [key: string]: any }

  sentAt: Date = new Date()

  hasReadCount?: number

  flag: number = MessageFlag.NONE

  constructor(config?: {
    msgId?: MsgId
    senderId?: number
    receiverId?: number
    content?: string | object
    sentAt?: Date
    hasReadCount?: number
    flag?: number
  }) {
    if (config) {
      this.msgId = config.msgId
      this.senderId = config.senderId
      this.receiverId = config.receiverId
      this.content = config.content
      this.sentAt =
        typeof config.sentAt === 'string'
          ? new Date(config.sentAt)
          : config.sentAt
      this.hasReadCount = config.hasReadCount
      this.flag = config.flag
    }
  }

  static ACK(toMessage: Message, type: ACKMsgType) {
    const msg = new Message()
    msg.flag = MessageFlag.ACK
    msg.content = {
      ackMsgId: toMessage.msgId.toString(),
      type
    }
    msg.receiverId = toMessage.senderId
    msg.senderId = toMessage.receiverId
    return msg
  }

  static new(createMessageDto: CreateMessageDto) {
    const msg = new Message()
    msg.receiverId = createMessageDto.receiverId
    msg.content = createMessageDto.content
    msg.flag = createMessageDto.flag
    return msg
  }

  static parse(object) {
    const msg = new Message()
    msg.receiverId = object.receiverId
    msg.content = object.content
    msg.flag = object.flag
    msg.senderId = object.senderId
    return msg
  }

  text(str: string) {
    this.content = str
    return this
  }

  to(receiverId: number) {
    this.receiverId = receiverId
    return this
  }

  from(senderId: number) {
    this.senderId = senderId
    return this
  }

  withFlag(flag: number) {
    this.flag = flag
    return this
  }

  clone() {
    return new Message({
      msgId: this.msgId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      sentAt: this.sentAt,
      hasReadCount: this.hasReadCount,
      flag: this.flag
    })
  }
}