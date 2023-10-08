import { MessageWarp, User, activeWarps } from '@/components/ChatList/ChatMessage'
import { BakaMessager, Conversation, Message } from '@/components/ChatList/helpers/messageHelper'
import { defineStore } from 'pinia'
import { ref, triggerRef } from 'vue'
import { BeginProcessorLayer, EndProcessorLayer, ProcessEndException, type ProcessorLayer } from './ChatProcessors/base'
import { ACKUpdateLayer } from './ChatProcessors/ACKUpdateLayer'
import instance from '../../apis/ajax';

const observationOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
}

const useChatStore = defineStore('chatStore', () => {
  const server = ref('http://localhost:3001')
  const token = ref('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTY2NjQzOTIsImV4cCI6MTY5OTI1NjM5Mn0.Vz5xa46oyYX5pbIphpNeuOyXvWTfBlLNH_fvv5IF6Mc')
  const bkm = new BakaMessager({
    server: server.value,
    port: 3001,
    token: token.value
  })
  const me = ref<User | null>(null)
  const conversations: Map<number, ChatSession> = new Map()

  const updateConversation = async (raw: Message) => {
    if (conversations.has(raw.senderId)) {
      conversations.get(raw.senderId).notify(raw)
    } else {
      const conversation = await new ChatSession(raw.senderId).notify(
        raw
      )
      conversations.set(raw.senderId, conversation)
    }
  }

  const getChatSession = (id: number) => {
    if (!conversations.has(id)) {
      conversations.set(id, new ChatSession(id))
    }
    return conversations.get(id)!
  }

  return {
    getChatSession,
    updateConversation,
    me,
    server,
    bkm
  }
})


export class ChatSession {
  bindingGroup: number
  private conversation: Conversation

  constructor(bindingGroup: number) {
    this.bindingGroup = bindingGroup
    this.conversation = useChatStore().bkm.getConversation(bindingGroup)
    this.setNexts()
  }

  chat = ref<MessageWarp[]>([])

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
      this.processors[i].next = this.processors[i + 1].process;
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
    this.chat.value.push(MessageWarp.fromMessage(msg))
    return this
  }

  refresh() {
    console.log('refresh', this.chat.value)
    triggerRef(this.chat)
  }

  async send(msg: Message) {
    const sentMsgAck = await this.conversation.send(msg)
    const warp = MessageWarp.fromMessage(msg)
    activeWarps.set((sentMsgAck as any).content.ackMsgId, warp)
    this.chat.value.push(warp)
    msg.msgId = (sentMsgAck as any).content.ackMsgId
    return msg
  }
}


export default useChatStore
