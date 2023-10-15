import { MessageWarp, User } from '@/components/ChatList/ChatMessage'
import {
  BakaMessager,
  Conversation,
  Message
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

const useChatStore = defineStore('chatStore', () => {
  const server = ref('http://localhost:3001')
  const token = ref(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTcwMzYwMDgsImV4cCI6MTY5OTYyODAwOH0.HVSRijOgxKTESZaTNeBYiLxC-CMqqrCHeMSe6uCjDuY'
  )
  const bkm = new BakaMessager({
    server: server.value,
    port: 3001,
    token: token.value
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

const SyncMsg = async (msg: Message) => {
  try {
    return await Db.instance().upsertMessage(new LocalMessage(msg))
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
  mostEarlyMsgId: Ref<string | null> = ref(null)
  mostLateMsgId: Ref<string | null> = ref(null)
  isLoading = ref(false)

  processors: ProcessorLayer[] = [
    BeginProcessorLayer.instance,
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

    // the message here are these which owns a bubble, both sent and received
    // SyncMsg(messageWarp._msg)
    debounceSyncMsg(messageWarp._msg.msgId, messageWarp._msg)
  }

  getMsgRef(id: string) {
    return this.chat.get(id)
  }

  async send(msg: Message) {
    const sentMsgAck = await this.conversation.send(msg)
    msg.msgId = (sentMsgAck as any).content.ackMsgId
    const warp = MessageWarp.fromMessage(msg)
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

  async loadMore2() {
    console.log('loading more2')
    this.isLoading.value = true

    const msgs = await Db.instance().getMessageBetween2(
      this.bindingGroup,
      useChatStore().me?.id ?? -1,
      new Date(0), // no lower bound
      this.getMsgRef(this.mostEarlyMsgId.value ?? '')?.value._msg.sentAt ?? new Date(), //TODO test this
      5
    )
    console.log('loadMore', msgs)

    msgs.forEach((msg) => {
      this.setMsg(MessageWarp.fromDbMessage(msg))
    })


    setTimeout(() => {
      this.isLoading.value = false
    }, 1000);

    return msgs
  }

  /**
   * @deprecated
   * Do not use this in production
   *  */
  getRawChat() {
    return this.chat
  }
}

export default useChatStore
