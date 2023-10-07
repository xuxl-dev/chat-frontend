import { MessageWarp, User } from '@/components/ChatList/ChatMessage'
import { Message } from '@/components/ChatList/helpers/messageHelper'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

const observationOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
}

export class Conversation {
  constructor() { }

  chat = ref<MessageWarp[]>([])
  callback = (entries: any, observer: any) => {
    entries.forEach((entry: any) => {
      if (entry.isIntersecting) {
        // console.log(`id:`, entry.target.getAttribute('msgid'), '进入可视区域')
        this.map.get(+entry.target.getAttribute('msgid'))(true)
      } else {
        // console.log(`id:`, entry.target.getAttribute('msgid'), '离开可视区域')
        this.map.get(+entry.target.getAttribute('msgid'))(false)
      }
    })
  }

  observer = new IntersectionObserver(this.callback, observationOptions)
  map = new Map()

  notify(msg: MessageWarp | Readonly<MessageWarp>) {
    this.chat.value.push(msg)
    return this
  }
}

const useChatStore = defineStore('chatStore', () => {
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
    me
  }
})

export default useChatStore
