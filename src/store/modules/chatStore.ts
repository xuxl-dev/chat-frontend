import { MessageWarp, User } from '@/components/ChatList/ChatMessage'
import {
  BakaMessager,
  Conversation
} from '@/components/ChatList/helpers/messageHelper'
import { defineStore } from 'pinia'
import { ref, shallowReactive, type Ref } from 'vue'
import {
  BeginProcessorLayer,
  EndProcessorLayer,
  ProcessEndException,
  type ProcessorLayer
} from './ChatProcessors/base'
import { ACKUpdateLayer } from './ChatProcessors/ACKUpdateLayer'
import EventEmitter from 'eventemitter3'
import { Db, LocalMessage } from '@/utils/db'
import { advancedDebounce } from '@/utils/debounce'
import { Message } from '../../modules/advancedChat/base'
import {
  FunctionalLayer,
  registerFunctionalCb
} from './ChatProcessors/FunctionalLayer'
import { HeartBeatMsg } from '@/modules/advancedChat/decls/heartbeat'
import { token0 } from '@/modules/auth/keys'


const useChatStore = defineStore('chatStore', () => {
  const server = ref('http://localhost:3001')

  const bkm = new BakaMessager({
    server: server.value,
    port: 3001,
  })
  const me = ref<User | null>(null)

  return {
    me,
    server,
    bkm
  }
})

const sesses: Map<number, ChatSession> = new Map()

export async function updateConversation(raw: Message) {
  if (sesses.has(raw.senderId)) {
    sesses.get(raw.senderId).notify(raw)
  } else {
    const conversation = await new ChatSession(raw.senderId).notify(raw)
    sesses.set(raw.senderId, conversation)
  }
}

const db = Db.instance()

const SyncMsg = async (msg: Message) => {
  try {
    return await db.upsertMessage(new LocalMessage(msg))
  } catch (e) {
    console.error(e)
  }
}

export const debounceSyncMsg = advancedDebounce(SyncMsg, 500, 1000)

export function getChatSession(id: number) {
  if (!sesses.has(id)) {
    sesses.set(id, new ChatSession(id))
  }
  return sesses.get(id)!
}

export class ChatSession extends EventEmitter {
  /**
   * the receiver id
   */
  readonly bindingGroup: number
  private conversation: Conversation

  constructor(bindingGroup: number) {
    super()
    this.bindingGroup = bindingGroup
    this.conversation = useChatStore().bkm.getConversation(bindingGroup)
    this.setNexts()
  }

  /**
   * Do not use this directly, use `getChatSession(id).chat.get(id)` instead
   *
   * this will not trigger update when new message comes
   */
  private chat = shallowReactive<Map<string, Ref<MessageWarp>>>(new Map())
  // mostEarlyMsgId: Ref<string | null> = ref(null)
  // mostLateMsgId: Ref<string | null> = ref(null)

  earliestMsg: Ref<MessageWarp | null> = ref(null)
  latestMsg: Ref<MessageWarp | null> = ref(null)
  isLoading = ref(false)

  processors: ProcessorLayer[] = [
    BeginProcessorLayer.instance,
    FunctionalLayer.instance,
    ACKUpdateLayer.instance,
    EndProcessorLayer.instance
  ]

  private setNexts() {
    for (let i = 0; i < this.processors.length - 1; i++) {
      this.processors[i].next = this.processors[i + 1].process
    }
  }

  /**
   * new incoming message
   * @param msg
   * @returns
   */
  async notify(msg: Message | Readonly<Message>) {
    try {
      await this.processors[0].process(msg)
    } catch (e) {
      if (e instanceof ProcessEndException) {
        return // this is normal
      } else {
        throw e
      }
    }
    // this is a processed message, and shall display
    // this.chat.value.push(MessageWarp.fromMessage(msg))
    this.setMsg(MessageWarp.fromMessage(msg))
    return this
  }

  setMsg(messageWarp: MessageWarp) {
    if (!messageWarp.id) {
      console.log(messageWarp, `messageWarp.id is not set`)
      return
    }

    console.log('setMsg', messageWarp)

    if (this.chat.has(messageWarp.id)) {
      const old = this.chat.get(messageWarp.id)
      old.value = messageWarp
      this.emit('update-message', old)
      return
    }

    const msgRef = ref(messageWarp)
    this.emit('new-message', msgRef)
    this.chat.set(messageWarp.id, msgRef)

    // update most early message, most late message
    if (!this.earliestMsg.value || messageWarp._msg.sentAt < this.earliestMsg.value._msg.sentAt) {
      this.earliestMsg.value = messageWarp
      this.emit('update-earliest', this.earliestMsg)
    }
    if (!this.latestMsg.value || messageWarp._msg.sentAt > this.latestMsg.value._msg.sentAt) {
      this.latestMsg.value = messageWarp
      this.emit('update-latest', this.latestMsg)
    }

    // the message here are these which owns a bubble, both sent and received
    // SyncMsg(messageWarp._msg)
    debounceSyncMsg(messageWarp._msg.msgId, messageWarp._msg)
  }

  getMsgRef(id: string) {
    return this.chat.get(id)
  }

  async send(msg: Message, transform?: (warp: MessageWarp)=> MessageWarp) {
    const msg_copy = msg.clone()
    const sentMsgAck = await this.conversation.send(msg)

    // why do we need to clone the message?
    // in the conversation.send, the message will be modified, encrypted, and sent to server
    // but we need to keep the original message, so we clone it
    msg_copy.msgId = (sentMsgAck as any).content.ackMsgId
    const warp = MessageWarp.fromMessage(msg_copy)
    transform?.(warp)
    this.setMsg(warp)
    return msg
  }

  async sendRawQuick(content: object, flag: number) {
    return this.conversation.send(
      new Message({
        content,
        flag,
        receiverId: this.bindingGroup
      })
    )
  }

  async sendRaw(msg: Message) {
    return this.conversation.send(msg)
  }

  async loadMore() {
    this.isLoading.value = true

    const msgs = await Db.instance().getMessageBetween(
      this.bindingGroup,
      useChatStore().me?.id ?? -1,
      new Date(0), // no lower bound
      this.earliestMsg?.value._msg.sentAt ?? new Date(), //TODO test this
      5
    )
    //TODO, if the loading time is too short, 
    //the loading animation will not be shown, or it will be flashing
    this.isLoading.value = false 
    
    msgs.forEach((msg) => {
      this.setMsg(MessageWarp.fromDbMessage(msg))
    })
    
    console.log('loadMore', msgs)
    return msgs
  }

  async heartBeat() {
    const evt_uuid = 'HEARTBEAT'
    const msg = new Message(
      HeartBeatMsg.new({
        receiverId: this.bindingGroup,
        content: {
          message: 'Genshin Impact?',
          type: 'PING'
        },
        evt_uuid
      })
    )
    this.send(msg, (o)=> o.noTrack())
    console.log(`sent heart beat`, msg)
    const ret = await registerFunctionalCb(evt_uuid, async (msg) => {
      const content = HeartBeatMsg.peel(msg)
      return content
    })
    console.log('heartBeat', ret)
    return ret
  }

  /**
   * @deprecated
   * Do not use this in production
   *  */
  getRawChat() {
    return this.chat
  }

  /**
   * @deprecated
   * @returns Conversation object
   */
  getConversation() {
    return this.conversation
  }
}

export default useChatStore
