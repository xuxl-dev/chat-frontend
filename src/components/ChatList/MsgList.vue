<template>
  <div>
    <VirtualList :data="messageGroups" :data-key="getKey" :item="MessageStack" :size="20" class="scroll-smooth"
      ref="virtualListRef" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, triggerRef } from 'vue';
import { MessageWarp, StackedMessage, User } from './ChatMessage';
import VirtualList from './VirtualList/index.tsx';
import MessageStack, { type Source } from './MessageStack.vue';
import useChatStore, { Conversation } from '@/store/modules/chatStore';

const props = defineProps({
  channel: {
    type: Number,
    required: true
  }
})

const getKey = (item: Source) => item.stack.stack_id
const { getConversation } = useChatStore()

const messageGroups = ref<Source[]>([]);
const virtualListRef = ref<any | null>(null)
let conv: Conversation
let curWatch: Function | null = null
onMounted(() => {
  conv = getConversation(props.channel)

  curWatch = watch(conv.chat, (newVal, oldVal) => {
    const newMsg = newVal.at(-1)
    append(newMsg)
  }, { immediate: false, deep: true })
  scrollToBottom()
})

// on prop channel change
watch(() => props.channel, (newVal, oldVal) => {
  curWatch?.()
  messageGroups.value = []
  conv = getConversation(newVal)
  curWatch = watch(conv.chat, (newVal, oldVal) => {
    const newMsg = newVal.at(-1)
    append(newMsg)
  }, { immediate: false, deep: true })
  scrollToBottom()
})

const append = (message: MessageWarp | Readonly<MessageWarp>) => {
  if (!lastStack()) {
    messageGroups.value.push({
      stack: new StackedMessage([message]),
      sender: new User(
        message.sender.id,
        message.sender.name,
        message.sender.avatar
      ),
      conversation: conv as any // Im sure this is a bug that typescript wrongly infer the type of conversation
    })
  } else {
    const last = lastStack()!
    if (last.stack.sender.id === message.sender.id) {
      last.stack.messages.push(message)
    } else {
      messageGroups.value.push({
        stack: new StackedMessage([message]),
        sender: message.sender,
        conversation: conv as any // Im sure this is a bug that typescript wrongly infer the type of conversation
      })
    }
  }

}

const lastStack = () => {
  return messageGroups.value.at(-1)
}

const scrollToBottom = () => {
  virtualListRef.value?.scrollToBottom()
}

defineExpose({
  append,
  lastStack,
  messageGroups,
  getKey,
  virtualListRef,
  scrollToBottom
})

</script>
<style lang="scss"></style>