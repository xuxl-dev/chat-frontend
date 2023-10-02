import type { Message } from '@/components/ChatList/ChatMessage'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useChatStore = defineStore('storeId', () => {
  const messages = ref<Message[] >([] as any)

  const initMessages = (_messages: Message[]) => {
    messages.value = _messages
    callbacks.forEach(callback => callback(messages.value))
  }

  const addMessage = (message: Message) => {
    messages.value.push(message)
    callbacks.forEach(callback => callback(messages.value))
  }

  const callbacks :((messages: Message[]) => void )[] = []
  const onMessagesUpdated = (callback: (messages: Message[]) => void) => {
    callbacks.push(callback)
  }
  
  return {
    messages,
    initMessages,
    addMessage,
    onMessagesUpdated
  }
})

export default useChatStore
