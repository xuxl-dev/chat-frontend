import {
  MessageWarp,
  User,
  activeWarps
} from '@/components/ChatList/ChatMessage'
import {
  BakaMessager,
  Conversation,
  Message
} from '@/components/ChatList/helpers/messageHelper'
import { defineStore } from 'pinia'
import { reactive, ref, type Ref } from 'vue'
import {
  BeginProcessorLayer,
  EndProcessorLayer,
  ProcessEndException,
  type ProcessorLayer,
} from './ChatProcessors/base'
import { ACKUpdateLayer } from './ChatProcessors/ACKUpdateLayer'

const observationOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
}

const useChatStore = defineStore('chatStore', () => {
  const server = ref('http://localhost:3001')
  const token = ref(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTY2NjQzOTIsImV4cCI6MTY5OTI1NjM5Mn0.Vz5xa46oyYX5pbIphpNeuOyXvWTfBlLNH_fvv5IF6Mc'
  )
  const bkm = new BakaMessager({
    server: server.value,
    port: 3001,
    token: token.value
  })
  const me = ref<User | null>(null)

  return {
    getChatSession,
    updateConversation,
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

export function getChatSession(id: number) {
  if (!sesses.has(id)) {
    sesses.set(id, new ChatSession(id))
  }
  return sesses.get(id)!
}

export class ChatSession {
  bindingGroup: number
  private conversation: Conversation

  constructor(bindingGroup: number) {
    this.bindingGroup = bindingGroup
    this.conversation = useChatStore().bkm.getConversation(bindingGroup)
    this.setNexts()
  }

  // chat = ref<MessageWarp[]>([])
  chat = reactive<Map<string, Ref<MessageWarp>>>(new Map())

  callback = (entries: any, observer: any) => {
    entries.forEach((entry: any) => {
      if (entry.isIntersecting) {
        // console.log(`id:`, entry.target.getAttribute('msgid'), '进入可视区域')
        this.map.get(+entry.target.getAttribute('msgid'))?.(true)
      } else {
        // console.log(`id:`, entry.target.getAttribute('msgid'), '离开可视区域')
        this.map.get(+entry.target.getAttribute('msgid'))?.(false)
      }
    })
  }

  observer = new IntersectionObserver(this.callback, observationOptions)
  map = new Map()

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
    console.log('notify and pushed', msg)
    // this is a processed message, and shall display
    // this.chat.value.push(MessageWarp.fromMessage(msg))
    this.setMsg(MessageWarp.fromMessage(msg))
    return this
  }

  setMsg(messageWarp: MessageWarp) {
    console.log('setMsg', messageWarp)
    messageWarp
    
    this.chat.set(messageWarp.id, ref(messageWarp))
  }

  refresh() {
    console.log('refresh', this.chat)
    // triggerRef(this.chat)
  }

  async send(msg: Message) {
    const sentMsgAck = await this.conversation.send(msg)
    const warp = MessageWarp.fromMessage(msg)
    const msgId = (sentMsgAck as any).content.ackMsgId
    activeWarps.set(msgId, warp)
    // this.chat.value.push(warp)
    this.chat.set(msgId, ref(warp))
    msg.msgId = msgId
    return msg
  }
}

export default useChatStore
