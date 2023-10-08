import { MessageWarp, User } from '@/components/ChatList/ChatMessage'
import { BakaMessager, Message } from '@/components/ChatList/helpers/messageHelper'
import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  const conversations: Map<number, Conversation> = new Map()

  const updateConversation = (raw: Message) => {
    if (conversations.has(raw.senderId)) {
      conversations.get(raw.senderId).notify(MessageWarp.fromMessage(raw))
    } else {
      const conversation = new Conversation().notify(
        MessageWarp.fromMessage(raw)
      )
      conversations.set(raw.senderId, conversation)
    }
  }

  const getConversation = (id: number) => {
    if (!conversations.has(id)) {
      conversations.set(id, new Conversation())
    }
    return conversations.get(id)!
  }

  return {
    getConversation,
    updateConversation,
    me,
    server,
    bkm
  }
})

const { bkm } = useChatStore()

export class Conversation {
  constructor() {}

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

  notify(msg: MessageWarp | Readonly<MessageWarp>) {
    this.chat.value.push(msg)
    return this
  }

  send(msg: Message) {
    this.chat.value.push(MessageWarp.fromMessage(msg))
    bkm.sendMessage(msg)
    return this
  }
}


export default useChatStore
