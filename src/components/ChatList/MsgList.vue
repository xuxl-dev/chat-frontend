<template>
  <VirtualList dataPropName="stackedMessage"
               :data="messageGroups"
               :data-key="getKey"
               :item="MessageStack"
               :size="20"
               class="scroll-smooth"
               ref="virtualListRef" />
</template>
<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue'
import { Message, StackedMessage } from './ChatMessage';
import VirtualList from './VirtualList/index.tsx';
import MessageStack from './MessageStack.vue';
import useChatStore from '@/store/modules/chatStore';
const getKey = (item: StackedMessage) => item.stack_id
const { onMessagesUpdated } = useChatStore()

const messageGroups = ref<StackedMessage[]>([]);
const virtualListRef = ref<any | null>(null)

onMessagesUpdated((msg) => {
  append(msg)
})

const append = (message: Message) => {
  if (!lastStack()) {
    messageGroups.value.push(new StackedMessage([message]))
    return
  } else {
    const last = lastStack()!
    if (last.sender === message.senderName) {
      last.messages.push(message)
    } else {
      messageGroups.value.push(new StackedMessage([message]))
    }
  }

  // document.getElementById('vli')?.scrollTo(0, 999999)

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
<style lang="scss">

</style>