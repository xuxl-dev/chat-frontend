<template>
  <div>
    <VirtualList dataPropName="stackedMessage"
                 :data="messageGroups"
                 :data-key="getKey"
                 :item="MessageStack"
                 :size="20"
                 class="scroll-smooth" />

  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue'
import { Message, StackedMessage, mergeAdjacentMessages } from './ChatMessage';
import VirtualList from './VirtualList/index.tsx';
import MessageStack from './MessageStack.vue';
import useChatStore from '@/store/modules/chatStore';
const getKey = (item: StackedMessage) => item.stack_id
const { onMessagesUpdated } = useChatStore()

const messageGroups = ref<StackedMessage[]>([]);

onMessagesUpdated((msgs) => {
  messageGroups.value = mergeAdjacentMessages(msgs)
  console.log(messageGroups.value)
})

const append = (message: Message) => {
  if (!lastStack()) {
    messageGroups.value.push(new StackedMessage([message]))
    return
  }
  lastStack()?.append(message)
}

const lastStack = () => {
  return messageGroups.value.at(-1)
}

</script>
<style lang="scss"></style>