import { Socket, io } from 'socket.io-client'
import EventEmitter from 'eventemitter3'
import useChatStore, { updateConversation } from '@/store/modules/chatStore'
import { delay, timeout } from '@/utils/utils'
import { Cipher2 } from './cipher2'
import PQueue from 'p-queue'

import {
  ACKMsgType,
  Message,
  MessageFlag,
  isFlagSet
} from '../../../modules/advancedChat/base'
import { getToken } from '@/modules/auth/auth'
import { formatChannelName } from '../ChatListHelper'

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

const messageToken = 'msg'
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
    this._socket?.emit(messageToken, msg)
  }

  async quickMessage(content: object, msgFlag: number, to) {
    const msg = new Message()
    msg.receiverId = to
    msg.content = JSON.stringify(content)
    msg.flag = msgFlag
    msg.senderId = this.user?.id
    this._socket?.emit(messageToken, msg)
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
      if (handler.pattern(message)) {
        await handler.handler(message)
        if (!handler.passthrough) {
          break
        }
      }
    }
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
      await this.cipher.init()
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
        await this.cipher.init()
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

  private async handleMessagePhase(
    content: {
      secret: {
        data: Uint8Array
        type: 'Buffer'
      }
      iv: {
        data: Uint8Array
        type: 'Buffer'
      }
    },
    o: Message
  ) {
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
    // console.log('e2ee message sender: ', msg)
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
class ACKEchoBackReceiver implements MessageHandler {
  pattern: (msg: Message) => boolean = (msg) => {
    return !(msg.flag & MessageFlag.ACK)
  }
  handler: (msg: Message) => any = async (msg) => {
    if (
      isFlagSet(MessageFlag.ACK, msg) ||
      isFlagSet(MessageFlag.DO_NOT_ACK, msg)
    ) {
      // this is an ACK message, do nothing
      return
    }
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
  receive: [ACKEchoBackReceiver, E2EEMessageReceiver]
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
}

const pq = new PQueue({ concurrency: 1 }) //FIXME dont know why this should be outside of class

export class BakaMessager extends EventEmitter implements IMessageHelper {
  conversationMap = new Map<string, Conversation>()
  socket: Socket
  user: { [key: string]: any } | undefined
  maxRetry = 1
  attempts = 0

  private config: BakaMessagerConfig

  constructor(config: BakaMessagerConfig) {
    super()
    this.config = config
    // this.switchUser(config.token)
  }

  switchUser(token: string) {
    if (this.socket?.connected) {
      this.socket.disconnect()
    }
    this.socket = io(this.config.server, {
      port: this.config.port,
      autoConnect: false,
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
      messageToken,
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
          this.socket.emit(messageToken, msg, (ret: Message) => {
            console.log('message ret: ', ret)
            resolve(ret as Message)
          })
        })
      }
    }, 1000)
  }

  async tryReconnect() {
    if (
      this.socket.disconnected &&
      this.attempts <= this.maxRetry &&
      pq.size === 0
    ) {
      console.log('try reconnecting...')
      await this.init(getToken())
      // random sleep

      const delayTime = Math.random() * 1000
      // console.log(`delay ${delayTime}ms`)
      await delay(delayTime)
      // console.log('delay done')
      // pq.clear()
      ++this.attempts
    }
  }

  // cryptoHelper: CryptoHelper = new CryptoHelper()
  cipher: Cipher2 = new Cipher2()

  public async init(token: string) {
    this.switchUser(token)
    return timeout(
      new Promise<void>((resolve, reject) => {
        this.socket.connect()
        this.socket.on('connected', (o) => {
          this.user = o
          console.log('connected: ', o)
          useChatStore().me = o
          this.status = 'connected'
          // this.attempts = 0
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error.message)
          this.status = 'disconnected'
          pq.add(async () => await this.tryReconnect())
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('disconnected', reason)
          this.status = 'disconnected'
          if (reason === 'io client disconnect') {
            // user manually disconnected
            // don't try to reconnect
            return
          }
          pq.add(async () => await this.tryReconnect())
        })

        this.socket.on('msg', (msg: object) => {
          const parsed = Message.parse(msg)
          this.handleMessage(parsed)
        })
      }),
      1000
    )
  }

  private handleMessage(msg: Message) {
    const isGroup = isFlagSet(MessageFlag.BROADCAST, msg)
    const fmt = formatChannelName(msg.senderId, isFlagSet(MessageFlag.BROADCAST, msg))
    console.log(`received message: ${fmt}`)
    if (!this.conversationMap.has(fmt)) {
      this.newConversation(msg.senderId, isGroup)
    }
    this.conversationMap.get(fmt).notify(msg)
  }

  private newConversation(senderId: number, isGroup: boolean) {
    const newConversation = new Conversation(senderId, this)
    InjectDefaultPipeline(newConversation)
    const fmt = formatChannelName(senderId, isGroup)
    console.log(`new conversation with ${fmt}`)
    this.conversationMap.set(fmt, newConversation)
  }

  /**
   * Can only establish E2EE to a single user
   * @param to 
   */
  async establishE2EE(to: number) {
    const conversation = this.getConversation(to, false)
    await this.cipher.init()
    await conversation.enableE2EE()
  }

  public getConversation(id: number, isGroup: boolean): Conversation {
    const fmt = formatChannelName(id, isGroup)
    if (!this.conversationMap.has(fmt)) {
      this.newConversation(id, isGroup)
    }
    return this.conversationMap.get(fmt)
  }

  _status: 'connected' | 'disconnected' | 'connecting' = 'disconnected'

  public get status(): 'connected' | 'disconnected' | 'connecting' {
    return this._status
  }

  public set status(v: 'connected' | 'disconnected' | 'connecting') {
    this._status = v
    this.emit('status', v)
  }
}
