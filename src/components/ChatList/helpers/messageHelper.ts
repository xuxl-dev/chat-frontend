import { Socket, io } from 'socket.io-client'
import EventEmitter from 'eventemitter3'
import useChatStore, { updateConversation } from '@/store/modules/chatStore'
import { randBetween, timeout } from '@/utils/utils'
import { Cipher2 } from './cipher2'
import PQueue from 'p-queue'

export class CreateMessageDto {
  receiverId!: number
  content!: string | object
  flag!: MessageFlag
}

export enum MessageFlag {
  'NONE' = 0,
  'DO_NOT_STORE' = 1 << 0, // do not store this message in database, may fail to deliver
  'ACK' = 1 << 1, // this message is an ACK message
  'BROADCAST' = 1 << 2, // this message is a broadcast message
  'E2EE' = 1 << 3, // this message is encrypted
  'KEY_EXCHANGE' = 1 << 4, // this message is a key exchange message
  'WITHDRAW' = 1 << 5, // this message is a withdraw message
  'COMPLEX' = 1 << 6, // this message is a complex message, the content is a nested message
  'PRESAVED_RSA' = 1 << 7 //use presaved RSA key to encrypt (the target user must have a presaved RSA key)
  //...
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
}
export function getMessageStr(msg: Message) {
  //this is dirty
  return `${findFlagsByValue(msg.flag).join('|')}\n ${msg.senderId} -> ${
    msg.receiverId
  } ${
    typeof msg.content === 'object' ? JSON.stringify(msg.content) : msg.content
  }`
}

function findFlagsByValue(value: number): string[] {
  const flags: string[] = []

  for (const [key, val] of Object.entries(MessageFlag)) {
    if (typeof val === 'number' && (value & val) === val) {
      if (key === 'NONE') {
        continue
      }
      flags.push(key)
    }
  }
  if (flags.length === 0) {
    flags.push('NONE')
  }

  return flags
}

export class MessageHelper {
  server_addr: string
  port: number
  token: string
  onMsgCallbacks: Map<string, ((msg: object) => void)[]> = new Map()
  user?: { [key: string]: any }

  constructor(server: string) {
    this.server_addr = server
  }

  _socket?: Socket

  async connect() {
    this._socket = io(this.server_addr, {
      port: this.port,
      extraHeaders: {
        authorization: this.token
      },
      auth: {
        token: this.token
      },
      autoConnect: true
    })
    this._socket.connect()
    this._socket.once('connected', (o) => {
      this.user = o
    })
    return new Promise<void>((resolve, reject) => {
      this._socket?.once('connect', () => {
        console.log('successfully connected to server!')
        this._socket?.off('connect_error')
        resolve()
      })
      this._socket?.once('connect_error', (error) => {
        console.error('Connection error:', error.message)
        this._socket?.off('connect')
        reject(error)
      })
    })
  }

  async send(evt: string, msg: object) {
    this._socket?.emit(evt, msg)
  }

  async message(msg: Message) {
    this._socket?.emit('message', msg)
  }

  async quickMessage(content: object, msgFlag: number, to) {
    const msg = new Message()
    msg.receiverId = to
    msg.content = JSON.stringify(content)
    msg.flag = msgFlag
    msg.senderId = this.user?.id
    this._socket?.emit('message', msg)
  }

  subscribe(
    channel: string,
    callback: (msg: object) => void | PromiseLike<void>
  ) {
    if (!this.onMsgCallbacks.has(channel)) {
      this.onMsgCallbacks.set(channel, [])
      this._socket?.on(channel, (msg: object) => {
        this.onMsgCallbacks.get(channel)?.forEach((cb) => cb(msg))
      })
    }
    this.onMsgCallbacks.get(channel).push(callback)
  }

  subscribeOnce(
    channel: string,
    callback: (msg: object) => void | PromiseLike<void>
  ) {
    this._socket?.once(channel, callback)
  }

  unsubscribe(
    channel: string,
    callback: (msg: object) => void | PromiseLike<void>
  ) {
    this.onMsgCallbacks.set(
      channel,
      this.onMsgCallbacks.get(channel)?.filter((cb) => cb !== callback)
    )
  }

  onPredicate(
    channel: string,
    predicate: (msg: object) => boolean,
    callback: (msg: object) => void | PromiseLike<void>
  ) {
    this.subscribe(channel, (msg) => {
      if (predicate(msg)) {
        callback(msg)
      }
    })
  }

  onPredicateOnce(
    channel: string,
    predicate: (msg: object) => boolean,
    callback: (msg: object) => void | PromiseLike<void>
  ) {
    this.subscribeOnce(channel, (msg) => {
      if (predicate(msg)) {
        callback(msg)
      }
    })
  }

  onPredicateOncePromise(channel: string, predicate: (msg: object) => boolean) {
    return new Promise<Message>((resolve, reject) => {
      const cb = async (msg) => {
        if (predicate(msg)) {
          this.unsubscribe(channel, cb)
          resolve(msg as Message)
        }
      }
      this.subscribe(channel, cb)
    })
  }

  public get socket(): Socket {
    return this._socket
  }
  isPassive = true
}

interface MessageHandler {
  pattern: (msg: Message) => boolean
  handler: (msg: Message) => any | Promise<any>
  ctx: ConversationCtx
  passthrough?: boolean // default false
  parallel?: boolean // default false
}

export function formatMessage(msg: Message) {
  if (typeof msg.content === 'string') {
    // may be a json string or just a plain text
    let newContent: any
    try {
      newContent = JSON.parse(msg.content)
    } catch (e) {
      newContent = msg.content
    }
    msg.content = newContent
  }
}

type ConversationCtx = {
  [key: string]: any
  messageHelper: IMessageHelper
  sendMessage: (msg: object, flag: MessageFlag) => any | Promise<any>
  unregisterPipeline: (handler: MessageHandler) => void
  registerPipeline: (handler: MessageHandler, type: 'receive' | 'send') => void
  conversation: Conversation
}

interface IMessageHelper {
  quickMessage(
    content: object,
    msgFlag: MessageFlag,
    to: number
  ): any | Promise<any>
  sendMessage(msg: Message): Message | Promise<Message>
  // cryptoHelper: CryptoHelper
  cipher: Cipher2
}

export class Conversation extends EventEmitter {
  public group: number
  private receive_pipeline: MessageHandler[] = []
  private send_pipeline: MessageHandler[] = []
  private ctx: ConversationCtx

  constructor(group: number, messageHelper: IMessageHelper) {
    super()
    this.group = group
    this.ctx = {
      messageHelper,
      sendMessage: async (msg, type) => {
        await messageHelper.quickMessage(msg, type, group)
      },
      unregisterPipeline: (handler) => {
        this.unregisterPipeline(handler)
      },
      registerPipeline: (handler, type) => {
        this.registerPipeline(handler, type)
      },
      isE2eePassive: true,
      conversation: this
    }
  }

  private receiverFallback?: (msg: Message) => any | Promise<any>
  public shallAcceptPredicate: (msg: Message) => boolean = (msg) => true

  public async notify(message: Message) {
    if (this.shallAcceptPredicate(message)) {
      for (const pipe of this.receive_pipeline) {
        if (pipe.pattern(message)) {
          try {
            if (pipe.parallel) {
              pipe.handler(message)
            } else {
              await pipe.handler(message)
            }
            if (!pipe.passthrough) {
              break
            }
          } catch (e) {
            if (e instanceof StopPropagationException) {
              break
            }
            if (e instanceof StopProcessingException) {
              return
            } else {
              console.error(e)
            }
          }
        }
      }
      // no handler matched or last handler.passthrough
      if (this.receiverFallback) {
        await this.receiverFallback(message)
      }
    }
    await updateConversation(message) //TODO: this is for test only, delete this
  }

  /**
   * @param message  in message, `receiverId` is overwritten by conversation's group
   */
  public async send(message: Message) {
    message.receiverId = this.group
    for (const handler of this.send_pipeline) {
      console.log('conv send pipeline: ', handler)
      if (handler.pattern(message)) {
        await handler.handler(message)
        if (!handler.passthrough) {
          break
        }
      }
    }
    console.log('conv sending message: ', message)
    return this.ctx.messageHelper.sendMessage(message)
  }

  public registerPipeline(handler: MessageHandler, type: 'receive' | 'send') {
    // bind context
    handler.ctx = this.ctx
    if (type === 'receive') {
      this.receive_pipeline.unshift(handler) // add to the head
    } else {
      this.send_pipeline.unshift(handler)
    }
  }

  public unregisterPipeline(handler: MessageHandler) {
    this.receive_pipeline = this.receive_pipeline.filter((h) => h !== handler)
    this.send_pipeline = this.send_pipeline.filter((h) => h !== handler)
  }

  async enableE2EE() {
    this.ctx['isE2eePassive'] = false
    if (!this.cipher.hasInit) {
      await this.cipher.init(this.ctx['isE2eePassive'])
    }
    const pubkey = await this.cipher.getMyPublicKey()
    await this.send(
      Message.new({
        receiverId: this.group,
        content: {
          rsaPublicKey: pubkey, //TODO clean this
          type: 'rsa-public-key'
        },
        flag: MessageFlag.KEY_EXCHANGE
      })
    )
  }

  public get cipher(): Cipher2 {
    return this.ctx.messageHelper.cipher
  }
}

/**
 * only stop propagation of message
 * if willing to not to display this message, throw StopProcessingException
 */
export class StopPropagationException extends Error {
  constructor() {
    super()
  }
}

/**
 * stop processing message and prevent it from displaying
 */
export class StopProcessingException extends Error {
  constructor() {
    super()
  }
}

enum E2EEStatus {
  'LISTEN_PUB_KEY',
  'LISTEN_AES_KEY',
  'READY'
}

const isE2eePassiveToken = 'isE2eePassive'
class E2EEMessageReceiver implements MessageHandler {
  status = E2EEStatus.LISTEN_PUB_KEY
  // this layer will stop propagation of message
  // no further handler will be executed
  passthrough = false
  parallel?: boolean = false
  queue = new PQueue({ concurrency: 1 })

  handlerMap = new Map<E2EEStatus, (msg: Message) => any | Promise<any>>([
    [
      E2EEStatus.LISTEN_PUB_KEY,
      async (msg) => {
        const content = msg.content as unknown as {
          rsaPublicKey: {
            data: Array<number>
            type: 'Buffer'
          }
          type: 'rsa-public-key'
        }
        await this.handlePubKeyPhase(content)
      }
    ],
    [
      E2EEStatus.LISTEN_AES_KEY,
      async (msg) => {
        const content = msg.content as unknown as {
          encryptedAESKey: {
            data: Uint8Array
            type: 'Buffer'
          }
          type: 'encrypted-aes-key'
        }
        await this.handleAESKeyPhase(content)
      }
    ],
    [
      E2EEStatus.READY,
      async (msg) => {
        const content = msg.content as {
          secret: {
            data: Uint8Array
            type: 'Buffer'
          }
          iv: {
            data: Uint8Array
            type: 'Buffer'
          }
        }
        await this.handleMessagePhase(content, msg)
      }
    ]
  ])

  ctx: ConversationCtx
  pattern = (msg: Message) => {
    return (
      !!(msg.flag & MessageFlag.KEY_EXCHANGE) || !!(msg.flag & MessageFlag.E2EE)
    )
  }
  handler = async (msg: Message) => {
    await this.queue.add(async () => {
      // make sure the handler is executed in order
      await this.handlerMap.get(this.status)?.(msg)
    })
  }

  private async handlePubKeyPhase(content: {
    rsaPublicKey: {
      data: Array<number>
      type: 'Buffer'
    }
    type: 'rsa-public-key'
  }) {
    // console.log('handlePubKeyPhase: ', content)
    if (content) {
      this.ctx.rsaPublicKey = content.rsaPublicKey
      // send my rsa public key, and encrypted my aes key with the other side's rsa public key
      if (!this.cipher.hasInit) {
        await this.cipher.init(this.ctx[isE2eePassiveToken])
      }
      // console.log(`@content`, content)
      await this.cipher.setPeerPublicKey(
        Uint8Array.from(content.rsaPublicKey.data).buffer
      )
      if (this.ctx[isE2eePassiveToken] ?? true) {
        this.ctx.sendMessage(
          {
            rsaPublicKey: await this.cipher.getMyPublicKey(),
            type: 'rsa-public-key'
          },
          MessageFlag.KEY_EXCHANGE
        )
      }

      // console.log('bob public key received: ', content.rsaPublicKey)
      this.ctx.sendMessage(
        {
          encryptedAESKey: await this.cipher.getEncryptedAESKey(),
          type: 'encrypted-aes-key'
        },
        MessageFlag.KEY_EXCHANGE
      )
      // console.warn(`handle pubkey phase done!`)
      this.status = E2EEStatus.LISTEN_AES_KEY

      // stop propagation
      throw new StopProcessingException()
    } else {
      throw new Error('unexpected message')
    }
  }

  private async handleAESKeyPhase(content: {
    encryptedAESKey: {
      data: Uint8Array
      type: 'Buffer'
    }
    type: 'encrypted-aes-key'
  }) {
    if (content) {
      await this.cipher.decryptAndSaveAESKey(
        Uint8Array.from(content.encryptedAESKey.data).buffer
      )
      this.status = E2EEStatus.READY
      // register e2ee sender
      this.ctx.conversation.emit('e2ee-ready')
      console.log('e2ee ready!')
      this.ctx.registerPipeline(new E2EEMessageSender(), 'send')
      // this.ctx.unregisterPipeline(this)
      // stop propagation
      throw new StopProcessingException()
    } else {
      throw new Error('unexpected message')
    }
  }

  private async handleMessagePhase(content: {
    secret: {
      data: Uint8Array
      type: 'Buffer'
    }
    iv: {
      data: Uint8Array
      type: 'Buffer'
    }
  }, o: Message) {
    if (content) {
      const decrypted = await this.cipher.decryptMessage(
        Uint8Array.from(content.secret.data).buffer,
        Uint8Array.from(content.iv.data)
      )
      // convert to string
      const decryptedStr = new TextDecoder().decode(decrypted)
      // rewrite message content
      o.content = decryptedStr
    }
  }

  public get cipher(): Cipher2 {
    return this.ctx.messageHelper.cipher
  }
}

class E2EEMessageSender implements MessageHandler {
  pattern: (msg: Message) => boolean = (msg) => {
    console.log('e2ee message sender: ', msg)
    return !!(msg.flag & MessageFlag.E2EE)
  }
  handler: (msg: Message) => any = async (msg) => {
    if (!this.cipher.AESKeyReady()) {
      throw new Error('bob_aes is not ready')
    }
    //TODO check string or object
    if (typeof msg.content === 'object') {
      msg.content = JSON.stringify(msg.content)
    }
    const iv = self.crypto.getRandomValues(new Uint8Array(12))
    msg.content = {
      secret: await this.cipher.encryptMessage(msg.content as string, iv),
      iv
    }
  }
  ctx: ConversationCtx
  passthrough?: boolean = true

  public get cipher(): Cipher2 {
    return this.ctx.messageHelper.cipher
  }
}

/**
 * this handler will send ACK for non-ACK message
 */
class MessageReceiver implements MessageHandler {
  pattern: (msg: Message) => boolean = (msg) => {
    return !(msg.flag & MessageFlag.ACK)
  }
  handler: (msg: Message) => any = async (msg) => {
    await this.ctx.sendMessage(
      {
        ackMsgId: msg.msgId,
        type: ACKMsgType.RECEIVED
      },
      MessageFlag.ACK
    )
  }
  ctx: ConversationCtx
  passthrough?: boolean = true
  parallel?: boolean = true // this handler can be parallel
}

const defaultPipeline = {
  send: [],
  receive: [MessageReceiver, E2EEMessageReceiver]
}

function InjectDefaultPipeline(conversation: Conversation) {
  defaultPipeline.receive.forEach((handler) => {
    conversation.registerPipeline(new handler(), 'receive')
  })
  defaultPipeline.send.forEach((handler) => {
    conversation.registerPipeline(new handler(), 'send')
  })
}

type BakaMessagerConfig = {
  server: string
  port: number
  token: string
}

export class BakaMessager extends EventEmitter implements IMessageHelper {
  conversationMap = new Map<number, Conversation>()
  socket: Socket
  user: { [key: string]: any } | undefined
  private config: BakaMessagerConfig

  constructor(config: BakaMessagerConfig) {
    super()
    this.config = config
    this.switchUser(config.token)
  }

  switchUser(token: string) {
    if (this.socket?.connected) {
      this.socket.disconnect()
    }
    this.socket = io(this.config.server, {
      port: this.config.port,
      autoConnect: true,
      auth: {
        token
      },
      extraHeaders: {
        authorization: token
      },
      transports: ['websocket']
    })
  }

  quickMessage(content: object, flag: MessageFlag, to: number) {
    this.socket.emit(
      'message',
      Message.new({
        receiverId: to,
        content: content,
        flag: flag
      })
    )
  }

  async sendMessage(msg: Message) {
    return timeout(() => {
      return () => {
        console.log('sending message: ', msg, ' to ', msg.receiverId)
        return new Promise<Message>((resolve, reject) => {
          this.socket.emit('message', msg, (ret: Message) => {
            console.log('message ret: ', ret)
            resolve(ret as Message)
          })
        })
      }
    }, 1000)
  }

  // cryptoHelper: CryptoHelper = new CryptoHelper()
  cipher: Cipher2 = new Cipher2()

  public async init() {
    return new Promise<void>((resolve, reject) => {
      this.socket.connect()
      this.socket.on('connected', (o) => {
        this.user = o
        console.log('connected: ', o)
        // this.notifyNewMessage = useChatStore().updateConversation //TODO: this is for test only, delete this
        useChatStore().me = o
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message)
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('disconnected', reason)
      })

      this.socket.on('message', (msg: Message) => {
        this.handleMessage(msg)
      })
    })
  }
  // notifyNewMessage: (message: Message) => void
  private handleMessage(msg: Message) {
    if (!this.conversationMap.has(msg.senderId)) {
      this.newConversation(msg.senderId)
    }
    // console.log('stack trace: ', new Error().stack)
    this.conversationMap.get(msg.senderId).notify(msg)
    // this.notifyNewMessage(msg) //TODO: this is for test only, delete this
  }

  private newConversation(senderId: number) {
    console.log(`new conversation with ${senderId}`)
    const newConversation = new Conversation(senderId, this)
    InjectDefaultPipeline(newConversation)
    this.conversationMap.set(senderId, newConversation)
  }

  async establishE2EE(to: number) {
    if (!this.conversationMap.get(to)) {
      this.newConversation(to)
    }
    const conversation = this.conversationMap.get(to)
    await this.cipher.init(false)
    await conversation.enableE2EE()
  }

  public getConversation(id: number): Conversation {
    if (!this.conversationMap.has(id)) {
      this.newConversation(id)
    }
    return this.conversationMap.get(id)
  }
}
