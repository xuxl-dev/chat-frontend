import { Socket, io } from 'socket.io-client';
import { CryptoHelper } from './cipher';
import EventEmitter from 'eventemitter3';
import useChatStore from '@/store/modules/chatStore';
import { MessageWarp } from '../ChatMessage';
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

export enum ACKMsgType {
  'DELIVERED',
  'RECEIVED',
  'READ',
}

export type MsgId = string

export class Message {
  msgId: MsgId

  senderId: number

  receiverId: number

  content: string | object

  sentAt: Date = new Date()

  hasReadCount: number = 0

  flag: number = MessageFlag.NONE

  constructor() { }

  static ACK(toMessage: Message, type: ACKMsgType) {
    const msg = new Message()
    msg.flag = MessageFlag.ACK
    msg.content = {
      ackMsgId: toMessage.msgId.toString(),
      type,
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
        authorization: this.token,
      },
      auth: {
        token: this.token
      },
      autoConnect: true,
    });
    this._socket.connect()
    this._socket.once('connected', (o) => {
      this.user = o
    })
    return new Promise<void>((resolve, reject) => {
      this._socket?.once('connect', () => {
        console.log('successfully connected to server!');
        this._socket?.off('connect_error')
        resolve()
      });
      this._socket?.once('connect_error', (error) => {
        console.error('Connection error:', error.message);
        this._socket?.off('connect')
        reject(error)
      });
    })
  }

  async send(evt: string, msg: object) {
    this._socket?.emit(evt, msg)
  }

  async message(msg: Message) {
    this._socket?.emit('message', msg)
  }

  async quickMessage(content: object, msgFlag :number, to) {
    const msg = new Message()
    msg.receiverId = to
    msg.content = JSON.stringify(content)
    msg.flag = msgFlag
    msg.senderId = this.user?.id
    this._socket?.emit('message', msg)
  }

  subscribe(channel: string, callback: (msg: object) => void | PromiseLike<void>) {
    if (!this.onMsgCallbacks.has(channel)) {
      this.onMsgCallbacks.set(channel, [])
      this._socket?.on(channel, (msg: object) => {
        this.onMsgCallbacks.get(channel)?.forEach(cb => cb(msg))
      })
    }
    this.onMsgCallbacks.get(channel).push(callback)
  }

  subscribeOnce(channel: string, callback: (msg: object) => void | PromiseLike<void>) {
    this._socket?.once(channel, callback)
  }

  unsubscribe(channel: string, callback: (msg: object) => void | PromiseLike<void>) {
    this.onMsgCallbacks.set(channel, this.onMsgCallbacks.get(channel)?.filter(cb => cb !== callback))
  }

  onPredicate(channel: string, predicate: (msg: object) => boolean, callback: (msg: object) => void | PromiseLike<void>) {
    this.subscribe(channel, (msg) => {
      if (predicate(msg)) {
        callback(msg)
      }
    })
  }

  onPredicateOnce(channel: string, predicate: (msg: object) => boolean, callback: (msg: object) => void | PromiseLike<void>) {
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
  cryptoHelper = new CryptoHelper();
  rsaPublicKey = this.cryptoHelper.getPublicKey()
  isPassive = true
}

interface MessageHandler {
  pattern: (msg: Message) => boolean
  handler: (msg: Message) => any | Promise<any>
  ctx: ConversationCtx
  passthrough?: boolean // default false
}

export function formatMessage(msg: Message) {
  if (typeof msg.content === 'string') {
    // may be a json string or just a plain text
    let newContent: any
    try {
      newContent = JSON.parse(msg.content)
    }
    catch (e) {
      newContent = msg.content
    }
    msg.content = newContent
  }
}

type ConversationCtx = {
  [key: string]: any,
  messageHelper: IMessageHelper,
  sendMessage: (msg: object, flag: MessageFlag) => any | Promise<any>,
  unregisterPipeline: (handler: MessageHandler) => void,
  registerPipeline: (handler: MessageHandler, type: 'receive' | 'send') => void,
  conversation: Conversation,
}

interface IMessageHelper {
  quickMessage(content: object, msgFlag: MessageFlag, to: number): any | Promise<any>
  message(msg: Message): any | Promise<any>
  cryptoHelper: CryptoHelper
}

class Conversation extends EventEmitter {
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
      conversation: this,
    }
  }

  private receiverFallback?: (msg: Message) => any | Promise<any>
  public shallAcceptPredicate: (msg: Message) => boolean = (msg) => true

  public async notify(message: Message) {
    if (this.shallAcceptPredicate(message)) {
      for (const handler of this.receive_pipeline) {
        if (handler.pattern(message)) {
          await handler.handler(message)
          if (!handler.passthrough) {
            break
          }
        }
      }
      // no handler matched or last handler.passthrough
      if (this.receiverFallback) {
        await this.receiverFallback(message)
      }
    }
  }

  public async send(message: Message) {
    for (const handler of this.send_pipeline) {
      if (handler.pattern(message)) {
        await handler.handler(message)
        if (!handler.passthrough) {
          break
        }
      }
    }
    this.ctx.messageHelper.message(message)
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
    this.receive_pipeline = this.receive_pipeline.filter(h => h !== handler)
    this.send_pipeline = this.send_pipeline.filter(h => h !== handler)
  }

  async unableE2EE() {
      this.ctx['isE2eePassive'] = false
      const pubkey = this.ctx.messageHelper.cryptoHelper.getPublicKey()
      await this.send(Message.new({
        receiverId: this.group,
        content: {
          rsaPublicKey: pubkey, //TODO clean this
          type: 'rsa-public-key'
        },
        flag: MessageFlag.KEY_EXCHANGE,
      }))
  }
}

enum E2EEStatus {
  'LISTEN_PUB_KEY',
  'LISTEN_AES_KEY',
  'READY',
}

const isE2eePassiveToken = 'isE2eePassive';
class E2EEMessageReceiver implements MessageHandler {
  status = E2EEStatus.LISTEN_PUB_KEY
  passthrough = true

  handlerMap = new Map<E2EEStatus, (msg: Message) => any | Promise<any>>([
    [E2EEStatus.LISTEN_PUB_KEY, (msg) => {
      const content = msg.content as unknown as { rsaPublicKey: string, type: "rsa-public-key" }
      this.handlePubKeyPhase(content);
    }],
    [E2EEStatus.LISTEN_AES_KEY, (msg) => {
      const content = msg.content as unknown as { encryptedAESKey: string, type: "encrypted-aes-key" }
      this.handleAESKeyPhase(content);
    }]
  ])

  ctx: ConversationCtx
  pattern = (msg: Message) => {
    return !!(msg.flag & MessageFlag.KEY_EXCHANGE)
  }
  handler = async (msg: Message) => {
    await this.handlerMap.get(this.status)?.(msg)
  }


  private handleAESKeyPhase(content: { encryptedAESKey: string; type: "encrypted-aes-key"; }) {
    if (content) {
      this.cipher.decryptAndSaveAESKey(content.encryptedAESKey);
      this.status = E2EEStatus.READY;
      this.ctx.unregisterPipeline(this)
      // register e2ee sender
      this.ctx.registerPipeline(new E2EEMessageSender(), 'send')
      this.ctx.conversation.emit('e2ee-ready')
    } else {
      throw new Error('unexpected message');
    }
  }

  private handlePubKeyPhase(content: { rsaPublicKey: string; type: "rsa-public-key"; }) {
    if (content) {
      this.ctx.rsaPublicKey = content.rsaPublicKey;
      // send my rsa public key, and encrypted my aes key with the other side's rsa public key

      if (this.ctx[isE2eePassiveToken] ?? true){
        this.ctx.sendMessage({
          rsaPublicKey: this.ctx.messageHelper.cryptoHelper.getPublicKey(),
          type: 'rsa-public-key'
        }, MessageFlag.KEY_EXCHANGE);
      }

      this.cipher.setBobPublicKey(content.rsaPublicKey);

      this.ctx.sendMessage({
        encryptedAESKey: this.cipher.getEncryptedAESKey(),
        type: 'encrypted-aes-key'
      }, MessageFlag.KEY_EXCHANGE);

      this.status = E2EEStatus.LISTEN_AES_KEY;
    } else {
      throw new Error('unexpected message');
    }
  }

  public get cipher(): CryptoHelper {
    return this.ctx.messageHelper.cryptoHelper
  }
}

class E2EEMessageSender implements MessageHandler {
  pattern: (msg: Message) => boolean = (msg) => !!(msg.flag & MessageFlag.E2EE)
  handler: (msg: Message) => any = async (msg) => {
    if (!this.ctx.messageHelper.cryptoHelper.bob_aes) {
      throw new Error('bob_aes is not ready')
    }
    //TODO check string or object
    msg.content = this.ctx.messageHelper.cryptoHelper.encryptMessage(msg.content as string)
  }
  ctx: ConversationCtx;
  passthrough?: boolean = true
}

/**
 * this handler will send ACK for non-ACK message
 */
class MessageReceiver implements MessageHandler {
  pattern: (msg: Message) => boolean = (msg) => {
    return !(msg.flag & MessageFlag.ACK)
  }
  handler: (msg: Message) => any = async (msg) => {
    await this.ctx.sendMessage({
      ackMsgId: msg.msgId,
      type: ACKMsgType.RECEIVED
    }, MessageFlag.ACK)

    // pretent to wait for 1 second
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 1000)
    // })

    await this.ctx.sendMessage({
      ackMsgId: msg.msgId,
      type: ACKMsgType.READ
    }, MessageFlag.ACK)
  }
  ctx: ConversationCtx;
  passthrough?: boolean = true
}


const defaultPipeline = {
  send: [],
  receive: [MessageReceiver, E2EEMessageReceiver],
}

function InjectDefaultPipeline(conversation: Conversation) {
  defaultPipeline.receive.forEach(handler => {
    conversation.registerPipeline(new handler(), 'receive')
  })
  defaultPipeline.send.forEach(handler => {
    conversation.registerPipeline(new handler(), 'send')
  })
}

type BakaMessagerConfig = {
  server: string,
  port: number,
  token: string,
}


export class BakaMessager extends EventEmitter implements IMessageHelper  {
  conversationMap = new Map<number, Conversation>()
  socket: Socket
  user: { [key: string]: any } | undefined;
  private config : BakaMessagerConfig 

  constructor(config: BakaMessagerConfig) {
    super()
    this.config = config
    this.switchUser(config.token) // this is ugly
  }

  switchUser(token :string) {
    if(this.socket?.connected) {
      this.socket.disconnect()
    }
    this.socket = io(this.config.server, {
      port: this.config.port,
      autoConnect: true,
      auth: {
        token
      },
      extraHeaders: {
        authorization: token,
      },
      transports: ['websocket'],
    });
  }

  quickMessage(content: object, flag: MessageFlag, to: number) {
    this.socket.emit('message', Message.new({
      receiverId: to,
      content: content,
      flag: flag,
    }))
  }

  message(msg: Message) {
    console.log('sent message: ', msg);
    this.socket.emit('message', msg)
    this.emit('message', msg)
  }

  cryptoHelper: CryptoHelper = new CryptoHelper()

  public async init() {
    return new Promise<void>((resolve, reject) => {
      this.socket.connect()
      this.socket.on('connected', (o) => {
        this.user = o
        console.log('connected: ', o);
        this.appendMessage = useChatStore().appendMessage //TODO: this is for test only, delete this

        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        reject(error)
      });

      this.socket.on('disconnect', (reason) => {
        console.log('disconnected', reason);
      })

      this.socket.on('message', (msg: Message) => {
        this.handleMessage(msg);
      })
    })

  }
  appendMessage: (message: MessageWarp) => void
  private handleMessage(msg: Message) {
    if (!this.conversationMap.has(msg.senderId)) {
      this.newConversation(msg.senderId);
    }
    this.conversationMap.get(msg.senderId).notify(msg);
    this.appendMessage(MessageWarp.fromMessage(msg)) //TODO: this is for test only, delete this
  }

  private newConversation(senderId: number) {
    console.log(`new conversation with ${senderId}`)
    const newConversation = new Conversation(senderId, this);
    InjectDefaultPipeline(newConversation);
    this.conversationMap.set(senderId, newConversation);
  }

  async establishE2EE(to:number) {
    if (!this.conversationMap.get(to)) {
      this.newConversation(to)
    }
    const conversation = this.conversationMap.get(to)
    await conversation.unableE2EE()
  }

  
  public getConversation(id: number) : Conversation | undefined {
    return this.conversationMap.get(id)
  }
  
}