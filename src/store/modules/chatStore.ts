import type { Message } from '@/components/ChatList/ChatMessage'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useChatStore = defineStore('storeId', () => {
  const messages = ref<Message[]>([] as any)

  const initMessages = (_messages: Message[]) => {
    messages.value = _messages

    callbacks['onMessageInit']?.forEach(callback => {
      callback(messages.value)
    })
  }

  const appendMessage = (message: Message) => {
    messages.value.push(message)
    
    callbacks['onMessagesUpdated']?.forEach(callback => {
      callback(message)
    })
  }

  const callbacks : {[key: string]: ((...args: any)=> any)[]} = {}
  const onMessageInit = (callback: (messages: Message[]) => void) => {
    callbacks['onMessageInit'] = callbacks['onMessageInit'] || []
    callbacks['onMessageInit'].push(callback)
  }
  const onMessagesUpdated = (callback: (message: Message) => void) => {
    callbacks['onMessagesUpdated'] = callbacks['onMessagesUpdated'] || []
    callbacks['onMessagesUpdated'].push(callback)
  }
  
  return {
    messages,
    initMessages,
    appendMessage,
    onMessagesUpdated
  }
})

export default useChatStore
