import type { Message } from '@/components/ChatList/ChatMessage'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useChatStore = defineStore('storeId', () => {
  const messages = ref<Message[]>([] as any)

  const initMessages = (_messages: Message[]) => {
    messages.value = _messages

    callbacks['onMessageInit']?.forEach((callback) => {
      callback(messages.value)
    })
  }

  const appendMessage = (message: Message) => {
    messages.value.push(message)

    callbacks['onMessagesUpdated']?.forEach((callback) => {
      callback(message)
    })
  }

  const callbacks: { [key: string]: ((...args: any) => any)[] } = {}
  const onMessageInit = (callback: (messages: Message[]) => void) => {
    callbacks['onMessageInit'] = callbacks['onMessageInit'] || []
    callbacks['onMessageInit'].push(callback)
  }
  const onMessagesUpdated = (callback: (message: Message) => void) => {
    callbacks['onMessagesUpdated'] = callbacks['onMessagesUpdated'] || []
    callbacks['onMessagesUpdated'].push(callback)
  }

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  }

  const callback = (entries: any, observer: any) => {
    entries.forEach((entry: any) => {
      if (entry.isIntersecting) {
        // console.log(`id:`, entry.target.getAttribute('msgid'), '进入可视区域')
        map.get(+entry.target.getAttribute('msgid'))(true)
      } else {
        // console.log(`id:`, entry.target.getAttribute('msgid'), '离开可视区域')
        map.get(+entry.target.getAttribute('msgid'))(false)
      }
    })
  }

  const observer = new IntersectionObserver(callback, options)
  const map = new Map()

  return {
    messages,
    initMessages,
    appendMessage,
    onMessagesUpdated,
    observer,
    map
  }
})

export default useChatStore